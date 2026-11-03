// Tests for the governance controls around the engine: AI-assist guardrails,
// exports and the audit chain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact, sanitise, suggestIntake } from '../js/llm.js';
import { toInitiative, toMarkdown, paybackMonths, isApproved } from '../js/export.js';
import { assess } from '../js/triage.js';
import { appendEntry, verifyChain } from '../js/audit.js';
import { applySuggestion, blankDraft } from '../js/views/intake.js';
import { USE_CASES } from '../js/data.js';

const byId = (id) => USE_CASES.find((u) => u.id === id);
const reply = (body, status = 200) => ({ ok: status < 300, status, json: async () => body });

test('personal data is redacted before anything is sent', () => {
  const { text, redactions } = redact('Contact anna.schmidt@example.com or +49 170 1234567, IBAN DE89 3704 0044 0532 0130 00.');
  assert.ok(!text.includes('anna.schmidt') && !text.includes('1234567') && !text.includes('DE89'));
  assert.equal(redactions, 3);
});

test('model output is re-validated: unknown values are dropped', () => {
  const s = sanitise({ name: 'X', users: 'robots', aiType: 'genai', annexIII: ['credit', 'made-up'], prohibited: 'all', profiling: 'yes', openQuestions: ['Q?', 3] });
  assert.equal(s.users, undefined);
  assert.equal(s.aiType, 'genai');
  assert.deepEqual(s.annexIII, ['credit']);
  assert.deepEqual(s.prohibited, []);
  assert.equal(s.profiling, false);
  assert.deepEqual(s.openQuestions, ['Q?']);
});

test('AI suggestions are marked and never include money', () => {
  const d = applySuggestion(blankDraft(), sanitise({ name: 'CV ranker', function: 'HR', summary: 'Ranks CVs.', users: 'employees', aiType: 'predictive', sourcing: 'buy', decision: 'assist', driver: 'Employee productivity', kpi: 'Time to hire', prohibited: [], annexIII: ['recruitment'], profiling: true, transparency: [], personalData: true, dpia: ['scoring'], openQuestions: [] }));
  assert.ok(d.aiSuggested.includes('annexIII') && d.aiSuggested.includes('name'));
  assert.equal(d.value.benefitK, '');
  assert.equal(d.value.costK, '');
  assert.ok(!d.aiSuggested.some((p) => /benefit|cost|feas/.test(p)));
});

test('suggestIntake sends a structured-output request with redacted text', async () => {
  let sent;
  const fetchImpl = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return reply({ model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ name: 'Chatbot', function: 'Customer service', summary: 'Answers questions.', users: 'customers', aiType: 'genai', sourcing: 'buy', decision: 'none', driver: 'Cost reduction', kpi: 'Deflection', prohibited: [], annexIII: [], profiling: false, transparency: ['interaction'], personalData: true, dpia: ['innovative'], openQuestions: [] }) }] });
  };
  const r = await suggestIntake({ apiKey: 'k', model: 'claude-opus-5-5', idea: 'A chatbot for customers. Escalations go to jan@example.com for review by the team.', fetchImpl });
  assert.equal(sent.output_config.format.type, 'json_schema');
  assert.equal(sent.fallbacks, 'default');
  assert.ok(!sent.messages[0].content.includes('jan@example.com'));
  assert.equal(r.suggestion.users, 'customers');
  assert.equal(r.redactions, 1);
});

test('suggestIntake surfaces refusals and retries without fallbacks on 400', async () => {
  let n = 0;
  const fetchImpl = async (url, opts) => {
    n++;
    if (JSON.parse(opts.body).fallbacks) return reply({ error: { message: 'unsupported' } }, 400);
    return reply({ stop_reason: 'refusal', content: [] });
  };
  await assert.rejects(suggestIntake({ apiKey: 'k', model: 'claude-sonnet-5-5', idea: 'A long enough description of an AI idea for testing.', fetchImpl }), /declined/);
  assert.equal(n, 2);
});

test('approved use cases convert to valid AI Portfolio Office initiatives', () => {
  const uc = byId('UC-01');
  assert.ok(isApproved(uc));
  const i = toInitiative(uc, assess(uc), '2026-11-03');
  // Mirrors the import validation in AI Portfolio Office (js/views/audit.js).
  const RAG = ['G', 'A', 'R'];
  assert.ok(typeof i.id === 'string' && typeof i.name === 'string');
  assert.ok(RAG.includes(i.rag.timing) && RAG.includes(i.rag.cost) && RAG.includes(i.rag.scope));
  assert.ok(typeof i.phase === 'string' && i.scores && typeof i.budget === 'number' && typeof i.actuals === 'number' && i.bc && Array.isArray(i.dependsOn));
  assert.equal(i.id, 'AI-01');
  assert.equal(i.aiSystem, true);
  for (const k of ['fit', 'value', 'effort', 'risk']) assert.ok(i.scores[k] >= 1 && i.scores[k] <= 5);
});

test('use-case card contains the classification, references and controls', () => {
  const uc = byId('UC-05');
  const md = toMarkdown(uc, assess(uc));
  assert.ok(md.includes('High-risk') && md.includes('Annex III(5)(b)') && md.includes('C-FRIA'));
  assert.equal(paybackMonths({ benefitK: 1200, costK: 300 }), 3);
  assert.equal(paybackMonths({ benefitK: 0, costK: 300 }), null);
});

test('audit chain detects tampering', async () => {
  let log = [];
  for (const a of ['SUBMITTED', 'DECIDED']) log = await appendEntry(log, { actor: 'x', action: a, detail: a });
  assert.equal((await verifyChain(log)).ok, true);
  log[0].detail = 'changed';
  assert.equal((await verifyChain(log)).ok, false);
});
