// Deterministic triage engine: risk classification, value and feasibility scoring,
// review path and required controls. Pure functions — no DOM, no network.

import { PROHIBITED, ANNEX_III, DEROGATIONS, TRANSPARENCY, DPIA_CRITERIA, OPTIONS, SCORING, PATHS } from './framework.js';
import { controlsFor } from './controls.js';

const find = (list, key) => list.find((x) => x.key === key);

export function classify(uc) {
  const reasons = [];
  const notes = [];
  const role = uc.sourcing === 'build' ? 'Provider' : 'Deployer';
  const prohibited = (uc.prohibited || []).map((k) => find(PROHIBITED, k)).filter(Boolean);
  const annex = (uc.annexIII || []).map((k) => find(ANNEX_III, k)).filter(Boolean);
  const transparency = (uc.transparency || []).filter((k) => find(TRANSPARENCY, k));
  let tier = 'minimal';
  let derogationApplied = false;

  if (prohibited.length) {
    tier = 'prohibited';
    prohibited.forEach((p) => reasons.push({ text: `Prohibited practice: ${lower(p.label)}.`, ref: p.ref }));
  } else if (uc.safetyComponent) {
    tier = 'high';
    reasons.push({ text: 'Safety component of a product covered by EU harmonisation legislation (Annex I).', ref: 'Art. 6(1)' });
  } else if (annex.length) {
    const derogation = find(DEROGATIONS, uc.derogation);
    if (derogation && uc.profiling) {
      tier = 'high';
      annex.forEach((a) => reasons.push({ text: `High-risk area: ${lower(a.label)}.`, ref: a.ref }));
      reasons.push({ text: 'The Art. 6(3) exception cannot apply because the system profiles natural persons.', ref: 'Art. 6(3), last subparagraph' });
    } else if (derogation) {
      derogationApplied = true;
      reasons.push({ text: `Listed in ${annex.map((a) => a.ref).join(', ')}, but not high-risk because it ${lower(derogation.label)}. The assessment must be documented and the system registered.`, ref: `${derogation.ref}, 6(4)` });
    } else {
      tier = 'high';
      annex.forEach((a) => reasons.push({ text: `High-risk area: ${lower(a.label)}.`, ref: a.ref }));
    }
  }

  if (tier !== 'prohibited' && transparency.length) {
    if (tier === 'minimal') tier = 'limited';
    transparency.forEach((k) => {
      const t = find(TRANSPARENCY, k);
      reasons.push({ text: `Transparency duty: ${lower(t.label)}.`, ref: t.ref });
    });
  }
  if (tier === 'minimal' && !derogationApplied) reasons.push({ text: 'No prohibited practice, no high-risk area and no transparency trigger.', ref: 'Art. 5, 6, 50' });

  if (tier === 'high') notes.push(role === 'Provider'
    ? 'As provider you carry the full high-risk obligations (Art. 16) — plan for conformity assessment before go-live.'
    : 'As deployer (Art. 26) you rely on the provider’s conformity. A substantial modification or new intended purpose would make you the provider (Art. 25(1)).');
  if (uc.annexIII?.includes('critical-infra')) notes.push('Critical infrastructure is high-risk only for safety components. Pure commercial forecasting usually is not — confirm with Legal.');
  if (uc.aiType === 'genai' && uc.sourcing === 'build') notes.push('Fine-tuning a general-purpose model and placing it on the market can trigger GPAI provider duties (Art. 53).');
  if (uc.decision === 'automated' && tier !== 'high') notes.push('Automated decisions about people: check GDPR Art. 22 even though the AI Act tier is not high.');

  return { tier, reasons, notes, role, derogationApplied, transparency, annexIII: uc.annexIII || [] };
}

export function dpiaAssessment(uc) {
  if (!uc.personalData) return { level: 'not required', count: 0, criteria: [] };
  const criteria = (uc.dpia || []).map((k) => find(DPIA_CRITERIA, k)).filter(Boolean);
  const n = criteria.length;
  return { level: n >= 2 ? 'required' : n === 1 ? 'recommended' : 'not required', count: n, criteria };
}

const unit = (v) => (Math.min(5, Math.max(1, Number(v) || 1)) - 1) / 4;

export function benefitPoints(k) {
  let pts = 0;
  for (const [min, p] of SCORING.benefitBands) if ((Number(k) || 0) >= min) pts = p;
  return pts;
}

export function valueScore(v = {}) {
  const w = SCORING.value;
  const m = Number(v.monthsToValue) || 24;
  const speed = m <= 3 ? 1 : m <= 6 ? 0.75 : m <= 12 ? 0.5 : m <= 18 ? 0.25 : 0;
  const score = w.benefit * (benefitPoints(v.benefitK) / 40) + w.alignment * unit(v.alignment) + w.confidence * unit(v.confidence) + w.speed * speed;
  return Math.round(score * 100);
}

export function feasibilityScore(f = {}) {
  const w = SCORING.feasibility;
  const score = w.data * unit(f.data) + w.tech * unit(f.tech) + w.skills * unit(f.skills)
    + w.integration * (1 - unit(f.integration)) + w.change * (1 - unit(f.change));
  return Math.round(score * 100);
}

export function quadrant(value, feasibility) {
  const t = SCORING.threshold;
  if (value >= t && feasibility >= t) return 'Pursue now';
  if (value >= t) return 'Invest to enable';
  if (feasibility >= t) return 'Quick experiment';
  return 'Park';
}

export function reviewPath(uc, cls, dpia) {
  if (cls.tier === 'prohibited') return 'stop';
  if (cls.tier === 'high') return 'enhanced';
  if (cls.tier === 'limited' || cls.derogationApplied || dpia.level === 'required' || uc.decision === 'automated' || uc.users === 'customers') return 'standard';
  return 'fast';
}

export const REQUIRED_FIELDS = [
  ['name', 'Name'], ['owner', 'Business owner'], ['function', 'Function'], ['description', 'Description'],
  ['users', 'Who uses it'], ['aiType', 'AI type'], ['sourcing', 'Build or buy'], ['decision', 'Decisions about people'],
  ['value.benefitK', 'Annual benefit'], ['value.kpi', 'Value KPI'],
];

export function missingFields(uc) {
  return REQUIRED_FIELDS.filter(([path]) => {
    const v = path.split('.').reduce((o, k) => o?.[k], uc);
    if (path === 'description') return !v || String(v).trim().length < 20;
    return v === undefined || v === null || String(v).trim() === '';
  }).map(([, label]) => label);
}

export function assess(uc) {
  const cls = classify(uc);
  const dpia = dpiaAssessment(uc);
  const value = valueScore(uc.value);
  const feasibility = feasibilityScore(uc.feas);
  const path = reviewPath(uc, cls, dpia);
  const result = {
    ...cls,
    dpia: dpia.level, dpiaCriteria: dpia.criteria,
    personalData: !!uc.personalData,
    decision: uc.decision, sourcing: uc.sourcing, aiType: uc.aiType, users: uc.users,
    value, feasibility,
    quadrant: cls.tier === 'prohibited' ? 'Do not proceed' : quadrant(value, feasibility),
    priority: cls.tier === 'prohibited' ? 0 : Math.round(0.6 * value + 0.4 * feasibility),
    path, pathInfo: PATHS[path],
    missing: missingFields(uc),
  };
  result.controls = controlsFor(result);
  return result;
}

export function readiness(uc, controls) {
  if (!controls.length) return 0;
  const done = controls.filter((c) => uc.controlStatus?.[c.id] === 'done').length;
  return done / controls.length;
}

export function registerStats(cases) {
  const assessed = cases.map((uc) => ({ uc, r: assess(uc) }));
  const byTier = { prohibited: 0, high: 0, limited: 0, minimal: 0 };
  assessed.forEach(({ r }) => byTier[r.tier]++);
  const approved = assessed.filter(({ uc }) => ['Approved', 'Approved with conditions'].includes(uc.triage?.outcome));
  return {
    total: cases.length,
    byTier,
    pending: cases.filter((uc) => !uc.triage).length,
    approved: approved.length,
    approvedValueK: approved.reduce((s, { uc }) => s + (Number(uc.value?.benefitK) || 0), 0),
    pipelineValueK: assessed.filter(({ r }) => r.tier !== 'prohibited').reduce((s, { uc }) => s + (Number(uc.value?.benefitK) || 0), 0),
    dpiaRequired: assessed.filter(({ r }) => r.dpia === 'required').length,
    assessed,
  };
}

export const labelOf = (group, key) => OPTIONS[group]?.find((o) => o.key === key)?.label || key || '–';
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
