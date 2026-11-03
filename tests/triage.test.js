import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess, classify, dpiaAssessment, valueScore, feasibilityScore, quadrant, missingFields, registerStats, benefitPoints } from '../js/triage.js';
import { USE_CASES } from '../js/data.js';
import { CONTROLS } from '../js/controls.js';

const byId = (id) => USE_CASES.find((u) => u.id === id);
const base = {
  name: 'Test', owner: 'Owner', function: 'IT', description: 'A sufficiently long description of the use case.',
  users: 'employees', aiType: 'predictive', sourcing: 'buy', decision: 'none',
  value: { benefitK: 300, alignment: 3, confidence: 3, monthsToValue: 6, kpi: 'KPI' },
  feas: { data: 3, tech: 3, skills: 3, integration: 3, change: 3 },
  prohibited: [], annexIII: [], transparency: [], dpia: [], personalData: false,
};
const v = (patch) => ({ ...structuredClone(base), ...patch });
const ids = (r) => r.controls.map((c) => c.id);

test('a prohibited practice overrides everything and stops the use case', () => {
  const r = assess(byId('UC-07'));
  assert.equal(r.tier, 'prohibited');
  assert.equal(r.path, 'stop');
  assert.equal(r.quadrant, 'Do not proceed');
  assert.equal(r.controls.length, 0);
  assert.equal(r.reasons[0].ref, 'Art. 5(1)(f)');
  assert.equal(classify(v({ prohibited: ['social-scoring'], annexIII: ['credit'], transparency: ['interaction'] })).tier, 'prohibited');
});

test('Annex III use is high-risk and goes to enhanced review', () => {
  const r = assess(byId('UC-05'));
  assert.equal(r.tier, 'high');
  assert.equal(r.path, 'enhanced');
  assert.equal(r.reasons[0].ref, 'Annex III(5)(b)');
});

test('provider and deployer of a high-risk system get different obligations', () => {
  const provider = assess(v({ annexIII: ['recruitment'], sourcing: 'build' }));
  const deployer = assess(v({ annexIII: ['recruitment'], sourcing: 'buy' }));
  assert.ok(ids(provider).includes('C-CA') && ids(provider).includes('C-QMS'));
  assert.ok(!ids(deployer).includes('C-CA') && ids(deployer).includes('C-USE'));
  assert.ok(ids(deployer).includes('C-WRK'), 'workplace use needs worker information');
});

test('credit scoring requires a fundamental rights impact assessment and Art. 22 safeguards', () => {
  const r = ids(assess(byId('UC-05')));
  assert.ok(r.includes('C-FRIA'));
  assert.ok(r.includes('C-A22'));
  assert.ok(!ids(assess(byId('UC-04'))).includes('C-FRIA'), 'recruitment does not trigger the FRIA');
});

test('the Art. 6(3) exception applies only without profiling', () => {
  const ok = classify(v({ annexIII: ['recruitment'], derogation: 'a' }));
  assert.equal(ok.tier, 'minimal');
  assert.equal(ok.derogationApplied, true);
  const blocked = classify(v({ annexIII: ['recruitment'], derogation: 'a', profiling: true }));
  assert.equal(blocked.tier, 'high');
  assert.ok(blocked.reasons.some((x) => x.ref.startsWith('Art. 6(3)')));
  const r = assess(byId('UC-13'));
  assert.ok(ids(r).includes('C-DER'));
  assert.equal(r.path, 'standard');
});

test('transparency triggers make a use case limited risk with matching controls', () => {
  const r = assess(byId('UC-01'));
  assert.equal(r.tier, 'limited');
  assert.ok(ids(r).includes('C-T1') && ids(r).includes('C-T2'));
  assert.equal(classify(v({ annexIII: ['credit'], transparency: ['interaction'] })).tier, 'high', 'high-risk is not downgraded');
});

test('minimal risk internal use without personal data is fast-tracked', () => {
  const r = assess(byId('UC-08'));
  assert.equal(r.tier, 'minimal');
  assert.equal(r.path, 'fast');
  assert.ok(!ids(r).includes('C-DPIA'));
});

test('DPIA: two EDPB criteria require it, one recommends it, no personal data needs none', () => {
  assert.equal(dpiaAssessment(v({ personalData: true, dpia: ['scoring', 'innovative'] })).level, 'required');
  assert.equal(dpiaAssessment(v({ personalData: true, dpia: ['innovative'] })).level, 'recommended');
  assert.equal(dpiaAssessment(v({ personalData: false, dpia: ['scoring', 'innovative'] })).level, 'not required');
});

test('scores are bounded and move in the right direction', () => {
  assert.equal(valueScore({ benefitK: 5000, alignment: 5, confidence: 5, monthsToValue: 1 }), 100);
  assert.equal(valueScore({ benefitK: 0, alignment: 1, confidence: 1, monthsToValue: 36 }), 5);
  assert.equal(feasibilityScore({ data: 5, tech: 5, skills: 5, integration: 1, change: 1 }), 100);
  assert.equal(feasibilityScore({ data: 1, tech: 1, skills: 1, integration: 5, change: 5 }), 0);
  assert.ok(benefitPoints(1200) > benefitPoints(300));
  assert.equal(quadrant(80, 80), 'Pursue now');
  assert.equal(quadrant(80, 20), 'Invest to enable');
  assert.equal(quadrant(20, 80), 'Quick experiment');
  assert.equal(quadrant(20, 20), 'Park');
});

test('missing required fields are reported', () => {
  assert.deepEqual(missingFields(base), []);
  const m = missingFields(v({ name: '', description: 'too short', value: { benefitK: '' } }));
  assert.ok(m.includes('Name') && m.includes('Description') && m.includes('Annual benefit') && m.includes('Value KPI'));
});

test('every control has a unique id and every sample use case is complete', () => {
  assert.equal(new Set(CONTROLS.map((c) => c.id)).size, CONTROLS.length);
  for (const u of USE_CASES) assert.deepEqual(assess(u).missing, [], u.id);
});

test('register stats add up', () => {
  const s = registerStats(USE_CASES);
  assert.equal(Object.values(s.byTier).reduce((a, b) => a + b, 0), USE_CASES.length);
  assert.ok(s.approvedValueK <= s.pipelineValueK);
});
