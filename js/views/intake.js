import { esc, section, pageHead, tier, path, toast, meter } from '../ui.js';
import { assess } from '../triage.js';
import { OPTIONS, PROHIBITED, ANNEX_III, DEROGATIONS, TRANSPARENCY, DPIA_CRITERIA, TIERS } from '../framework.js';
import { suggestIntake, MODELS } from '../llm.js';
import { log, save, nextId, session } from '../store.js';
import { paybackMonths } from '../export.js';

const STEPS = ['Describe', 'Basics', 'Value & feasibility', 'EU AI Act screening', 'Data protection', 'Review & submit'];
const STEP_FIELDS = {
  1: ['name', 'function', 'description', 'users', 'aiType', 'sourcing', 'decision'],
  2: ['value.driver', 'value.kpi'],
  3: ['prohibited', 'annexIII', 'profiling', 'transparency'],
  4: ['personalData', 'dpia'],
};

let step = 0;
let aiBusy = false;

export function blankDraft() {
  return {
    idea: '', name: '', owner: '', function: '', description: '',
    users: '', aiType: '', sourcing: '', decision: '',
    value: { driver: '', benefitK: '', costK: '', alignment: 3, confidence: 3, monthsToValue: 6, kpi: '' },
    feas: { data: 3, tech: 3, skills: 3, integration: 3, change: 3 },
    prohibited: [], annexIII: [], profiling: false, derogation: '', safetyComponent: false,
    transparency: [], personalData: false, dpia: [], aiSuggested: [], openQuestions: [],
  };
}

const get = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
function set(o, p, v) {
  const ks = p.split('.');
  const last = ks.pop();
  ks.reduce((x, k) => (x[k] ||= {}), o)[last] = v;
}
const ai = (d, p) => (d.aiSuggested.includes(p) ? `<span class="ai-badge" title="Suggested by AI — confirm or change">AI</span>` : '');

export function render({ state }) {
  state.draft ||= blankDraft();
  const d = state.draft;
  const nav = STEPS.map((s, i) => `<button class="stepper-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}" data-go="${i}"><span>${i + 1}</span>${esc(s)}</button>`).join('');
  return `
    ${pageHead('New AI use case', 'AI use-case intake', 'Six short steps. The classification on the right updates as you answer, and shows exactly which rule produced it.')}
    <nav class="stepper" aria-label="Intake steps">${nav}</nav>
    <div class="grid-2 wide-left intake">
      <div>${section(STEPS[step], stepBody(step, d) + navButtons(d))}</div>
      <aside id="live">${live(d)}</aside>
    </div>`;
}

function navButtons(d) {
  return `<div class="row step-nav">
    ${step > 0 ? '<button class="btn ghost" data-go="prev">← Back</button>' : ''}
    ${step < STEPS.length - 1 ? '<button class="btn primary" data-go="next">Continue →</button>' : '<button class="btn primary" id="submit">Submit for triage</button>'}
    ${STEP_FIELDS[step]?.some((p) => d.aiSuggested.includes(p)) ? '<button class="btn ghost" id="confirm-step">✓ Confirm AI suggestions on this step</button>' : ''}
    <button class="link" id="discard">Discard draft</button></div>`;
}

function radios(d, p, opts) {
  return `<div class="choice-grid">${opts.map((o) => `<label class="choice ${get(d, p) === o.key ? 'on' : ''}"><input type="radio" name="${p}" data-f="${p}" value="${esc(o.key)}" ${get(d, p) === o.key ? 'checked' : ''}><span>${esc(o.label)}${o.role ? `<small>AI Act role: ${esc(o.role)}</small>` : ''}</span></label>`).join('')}</div>`;
}
function checks(d, p, opts, withRef = true) {
  const vals = get(d, p) || [];
  return `<div class="check-list">${opts.map((o) => `<label class="check ${vals.includes(o.key) ? 'on' : ''}"><input type="checkbox" data-arr="${p}" value="${esc(o.key)}" ${vals.includes(o.key) ? 'checked' : ''}><span>${esc(o.label)}${withRef && o.ref ? ` <code>${esc(o.ref)}</code>` : ''}</span></label>`).join('')}</div>`;
}
function toggle(d, p, label) {
  return `<label class="check switch ${get(d, p) ? 'on' : ''}"><input type="checkbox" data-bool="${p}" ${get(d, p) ? 'checked' : ''}><span>${label}</span></label>`;
}
function slider(d, p, label, lo, hi) {
  return `<label class="slider">${esc(label)} <b data-out="${p}">${get(d, p)}</b>
    <input type="range" min="1" max="5" step="1" data-f="${p}" data-num value="${get(d, p)}"><span class="slider-ends"><span>${esc(lo)}</span><span>${esc(hi)}</span></span></label>`;
}
const text = (d, p, label, ph = '', type = 'text') => `<label class="field">${esc(label)} ${ai(d, p)}<input type="${type}" data-f="${p}" ${type === 'number' ? 'data-num min="0"' : ''} value="${esc(get(d, p))}" placeholder="${esc(ph)}"></label>`;

function stepBody(n, d) {
  switch (n) {
    case 0: {
      const key = session.get('aiuci.key');
      return `<p>Describe the idea in your own words: what the AI would do, for whom, with which data, and what would change.</p>
        <label class="field"><textarea data-f="idea" rows="6" placeholder="Example: We want a tool that reads installer applications and ranks candidates by experience and certifications, so recruiters only call the top 20%...">${esc(d.idea)}</textarea></label>
        <p class="small muted">Do not include personal data. Emails, phone numbers and IBANs are removed automatically before anything is sent.</p>
        <details class="ai-panel" ${d.idea ? 'open' : ''}>
          <summary>Pre-fill the form with Claude (optional, bring your own API key)</summary>
          <div class="ai-form">
            <label>Anthropic API key<input type="password" id="ai-key" autocomplete="off" placeholder="sk-ant-…" value="${esc(key)}"></label>
            <label>Model<select id="ai-model">${MODELS.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></label>
            <label class="check"><input type="checkbox" id="ai-consent"> I understand the redacted description is sent to the Anthropic API. The key stays in this browser tab only.</label>
            <div class="row"><button class="btn" id="ai-run" ${aiBusy ? 'disabled' : ''}>${aiBusy ? 'Analysing…' : 'Suggest answers'}</button>${key ? '<button class="btn ghost" id="ai-forget">Forget key</button>' : ''}</div>
            <p class="small muted">Claude only <b>suggests</b> answers; each is marked <span class="ai-badge">AI</span> until you confirm it. The risk tier is always computed by the rules, and Claude never estimates benefits or costs.</p>
          </div>
        </details>
        ${d.openQuestions?.length ? `<div class="banner warn"><b>Open questions from the AI review:</b><ul>${d.openQuestions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>` : ''}
        <p class="small muted">No API key? Just continue — every field can be filled in by hand.</p>`;
    }
    case 1:
      return `<div class="form-grid">
          ${text(d, 'name', 'Use-case name', 'e.g. Installer route optimisation')}
          ${text(d, 'owner', 'Business owner', 'Name')}
          <label class="field">Function ${ai(d, 'function')}<select data-f="function"><option value="">Select…</option>${OPTIONS.functions.map((f) => `<option ${d.function === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
        </div>
        <label class="field">Description ${ai(d, 'description')}<textarea data-f="description" rows="3" placeholder="What does the AI do, and what changes for the business?">${esc(d.description)}</textarea></label>
        <h3>Who uses or is exposed to it? ${ai(d, 'users')}</h3>${radios(d, 'users', OPTIONS.users)}
        <h3>Type of AI ${ai(d, 'aiType')}</h3>${radios(d, 'aiType', OPTIONS.aiType)}
        <h3>Build or buy? ${ai(d, 'sourcing')}</h3>${radios(d, 'sourcing', OPTIONS.sourcing)}
        <h3>Does it make or support decisions about individuals? ${ai(d, 'decision')}</h3>${radios(d, 'decision', OPTIONS.decision)}`;
    case 2: {
      const pb = paybackMonths(d.value);
      return `<div class="form-grid">
          <label class="field">Value driver ${ai(d, 'value.driver')}<select data-f="value.driver"><option value="">Select…</option>${OPTIONS.driver.map((x) => `<option ${d.value.driver === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
          ${text(d, 'value.kpi', 'Value KPI', 'e.g. Ticket deflection rate')}
          ${text(d, 'value.benefitK', 'Annual benefit (EUR k)', 'e.g. 500', 'number')}
          ${text(d, 'value.costK', 'One-off + first-year cost (EUR k)', 'e.g. 200', 'number')}
          <label class="field">Months to first value<input type="number" min="1" max="36" data-f="value.monthsToValue" data-num value="${esc(d.value.monthsToValue)}"></label>
          <div class="field"><span>Payback</span><b class="payback" id="payback">${pb ? `${pb} months` : '–'}</b></div>
        </div>
        <div class="slider-grid">
          ${slider(d, 'value.alignment', 'Strategic alignment', 'weak', 'core to strategy')}
          ${slider(d, 'value.confidence', 'Confidence in the benefit', 'guess', 'evidence-based')}
        </div>
        <h3>Feasibility</h3>
        <div class="slider-grid">
          ${slider(d, 'feas.data', 'Data availability & quality', 'missing', 'ready')}
          ${slider(d, 'feas.tech', 'Technology maturity', 'experimental', 'proven')}
          ${slider(d, 'feas.skills', 'Skills available', 'none', 'in-house')}
          ${slider(d, 'feas.integration', 'Integration complexity', 'simple', 'many systems')}
          ${slider(d, 'feas.change', 'Change impact on people & process', 'small', 'large')}
        </div>`;
    }
    case 3:
      return `<p class="small muted">Answer as the system would actually be used. When unsure, tick it — Legal can clear it in review; a miss is costlier than a false alarm.</p>
        <h3>1 · Prohibited practices (Art. 5) ${ai(d, 'prohibited')}</h3>${checks(d, 'prohibited', PROHIBITED)}
        <h3>2 · Product safety (Art. 6(1))</h3>${toggle(d, 'safetyComponent', 'It is a safety component of a product covered by EU product legislation (machinery, medical devices, lifts, toys…)')}
        <h3>3 · High-risk areas (Annex III) ${ai(d, 'annexIII')}</h3>${checks(d, 'annexIII', ANNEX_III)}
        ${d.annexIII.length ? `<div class="sub">
          ${toggle(d, 'profiling', `It profiles natural persons — evaluates personal aspects such as performance, reliability or behaviour ${ai(d, 'profiling')}`)}
          <h3>Does an Art. 6(3) exception apply?</h3>
          <div class="choice-grid one">${[{ key: '', label: 'No — none of these applies' }, ...DEROGATIONS].map((o) => `<label class="choice ${d.derogation === o.key ? 'on' : ''}"><input type="radio" name="derogation" data-f="derogation" value="${esc(o.key)}" ${d.derogation === o.key ? 'checked' : ''}><span>${esc(o.label)}${o.ref ? ` <code>${esc(o.ref)}</code>` : ''}</span></label>`).join('')}</div>
          ${d.derogation && d.profiling ? '<div class="banner warn">An exception cannot apply while the system profiles people (Art. 6(3), last subparagraph).</div>' : ''}
        </div>` : ''}
        <h3>4 · Transparency (Art. 50) ${ai(d, 'transparency')}</h3>${checks(d, 'transparency', TRANSPARENCY)}`;
    case 4:
      return `${toggle(d, 'personalData', `It processes personal data (customers, employees, applicants…) ${ai(d, 'personalData')}`)}
        ${d.personalData ? `<h3>Which of these apply? ${ai(d, 'dpia')}</h3><p class="small muted">EDPB criteria: two or more usually mean a DPIA is required (GDPR Art. 35).</p>${checks(d, 'dpia', DPIA_CRITERIA, false)}` : '<p class="muted small">No GDPR controls beyond the baseline.</p>'}`;
    case 5:
      return review(d);
    default: return '';
  }
}

function review(d) {
  const r = assess(d);
  const pending = d.aiSuggested.length;
  return `
    ${r.missing.length ? `<div class="banner warn">Still missing: <b>${esc(r.missing.join(', '))}</b></div>` : ''}
    ${pending ? `<div class="banner warn">${pending} AI-suggested answer(s) not yet confirmed: ${esc(d.aiSuggested.join(', '))}. Go back and confirm or change them.</div>` : ''}
    <dl class="kv wide">
      <dt>Use case</dt><dd><b>${esc(d.name || '–')}</b> · ${esc(d.owner || '–')} · ${esc(d.function || '–')}</dd>
      <dt>Risk tier</dt><dd>${tier(r.tier)} · AI Act role: <b>${esc(r.role)}</b></dd>
      <dt>Why</dt><dd><ul class="reasons">${r.reasons.map((x) => `<li>${esc(x.text)} <code>${esc(x.ref)}</code></li>`).join('')}</ul></dd>
      ${r.notes.length ? `<dt>Notes</dt><dd><ul class="reasons">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></dd>` : ''}
      <dt>GDPR</dt><dd>Personal data: ${r.personalData ? 'yes' : 'no'} · DPIA <b>${esc(r.dpia)}</b></dd>
      <dt>Value / feasibility</dt><dd>${r.value} / ${r.feasibility} · ${esc(r.quadrant)}</dd>
      <dt>Review path</dt><dd>${path(r.path, r.pathInfo.label)} ${esc(r.pathInfo.who)} · target ${esc(r.pathInfo.sla)}</dd>
      <dt>Controls</dt><dd>${r.controls.length} required — listed on the use-case page after submission</dd>
    </dl>
    ${r.tier === 'prohibited' ? '<div class="banner bad">This use case describes a prohibited practice. It can be submitted for the record but will be rejected.</div>' : ''}`;
}

function live(d) {
  const r = assess(d);
  return `<div class="card live">
    <div class="kicker">Live classification</div>
    <div class="live-tier">${tier(r.tier)}</div>
    <p class="small">${esc(TIERS[r.tier].label)} · role <b>${esc(r.role)}</b></p>
    <ul class="reasons small">${r.reasons.slice(0, 4).map((x) => `<li>${esc(x.text)} <code>${esc(x.ref)}</code></li>`).join('')}</ul>
    <div class="live-row"><span>Review path</span>${path(r.path, r.pathInfo.label)}</div>
    <div class="live-row"><span>DPIA</span><b>${esc(r.dpia)}</b></div>
    <div class="live-row"><span>Value</span>${meter(r.value)} <b>${r.value}</b></div>
    <div class="live-row"><span>Feasibility</span>${meter(r.feasibility)} <b>${r.feasibility}</b></div>
    <div class="live-row"><span>Controls</span><b>${r.controls.length}</b></div>
    <div class="live-row"><span>Completeness</span><b>${10 - r.missing.length}/10</b></div>
    ${d.aiSuggested.length ? `<p class="small"><span class="ai-badge">AI</span> ${d.aiSuggested.length} suggestion(s) awaiting your confirmation</p>` : ''}
  </div>`;
}

export function bind(ctx) {
  const { root, state, refresh, go } = ctx;
  const d = state.draft;
  const $ = (s) => root.querySelector(s);
  const confirmField = (p) => { d.aiSuggested = d.aiSuggested.filter((x) => x !== p); };
  const updateLive = () => {
    save(state);
    root.querySelector('#live').innerHTML = live(d);
    const pb = root.querySelector('#payback');
    if (pb) pb.textContent = paybackMonths(d.value) ? `${paybackMonths(d.value)} months` : '–';
  };

  root.querySelectorAll('[data-f]').forEach((el) => {
    const p = el.dataset.f;
    const read = () => (el.dataset.num !== undefined ? (el.value === '' ? '' : Number(el.value)) : el.value);
    if (el.type === 'radio' || el.tagName === 'SELECT') {
      el.addEventListener('change', () => { set(d, p, read()); confirmField(p); save(state); refresh(); });
    } else {
      el.addEventListener('input', () => {
        set(d, p, read());
        confirmField(p);
        const out = root.querySelector(`[data-out="${p}"]`);
        if (out) out.textContent = el.value;
        updateLive();
      });
    }
  });
  root.querySelectorAll('[data-arr]').forEach((el) => el.addEventListener('change', () => {
    const p = el.dataset.arr;
    const vals = new Set(get(d, p));
    el.checked ? vals.add(el.value) : vals.delete(el.value);
    set(d, p, [...vals]);
    if (p === 'annexIII' && !vals.size) { d.derogation = ''; d.profiling = false; }
    confirmField(p);
    save(state);
    refresh();
  }));
  root.querySelectorAll('[data-bool]').forEach((el) => el.addEventListener('change', () => {
    set(d, el.dataset.bool, el.checked);
    if (el.dataset.bool === 'personalData' && !el.checked) d.dpia = [];
    confirmField(el.dataset.bool);
    save(state);
    refresh();
  }));

  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.go;
    step = g === 'next' ? step + 1 : g === 'prev' ? step - 1 : Number(g);
    step = Math.max(0, Math.min(STEPS.length - 1, step));
    refresh();
    window.scrollTo(0, 0);
  }));

  $('#confirm-step')?.addEventListener('click', async () => {
    const fields = STEP_FIELDS[step].filter((p) => d.aiSuggested.includes(p));
    d.aiSuggested = d.aiSuggested.filter((p) => !fields.includes(p));
    await log(state, d.owner || 'submitter', 'AI_SUGGESTIONS_CONFIRMED', `${STEPS[step]}: ${fields.join(', ')}`);
    refresh();
  });

  $('#discard').addEventListener('click', () => {
    if (!confirm('Discard this draft?')) return;
    state.draft = blankDraft();
    step = 0;
    save(state);
    refresh();
  });

  $('#submit')?.addEventListener('click', async () => {
    const r = assess(d);
    if (r.missing.length) return toast(`Complete: ${r.missing.join(', ')}`);
    if (d.aiSuggested.length) return toast('Confirm or change the AI-suggested answers first.');
    const id = nextId(state.cases);
    const { idea, aiSuggested, openQuestions, ...rest } = d;
    const uc = { ...structuredClone(rest), id, submitted: new Date().toISOString().slice(0, 10), triage: null, controlStatus: {}, aiAssisted: !!d.aiAssisted };
    state.cases.push(uc);
    await log(state, d.owner, 'USE_CASE_SUBMITTED', `${id} ${d.name}: ${TIERS[r.tier].label}, ${r.pathInfo.label}, ${r.controls.length} controls${d.aiAssisted ? ' (AI-assisted intake, all suggestions confirmed)' : ''}`);
    state.draft = blankDraft();
    step = 0;
    save(state);
    go(`#/case?id=${id}`);
  });

  $('#ai-forget')?.addEventListener('click', () => { session.set('aiuci.key', ''); refresh(); });
  $('#ai-run')?.addEventListener('click', async () => {
    const apiKey = $('#ai-key').value.trim();
    if (!apiKey) return toast('Enter an Anthropic API key.');
    if (!$('#ai-consent').checked) return toast('Please confirm the data-sharing notice first.');
    session.set('aiuci.key', apiKey);
    aiBusy = true;
    refresh();
    try {
      const res = await suggestIntake({ apiKey, model: $('#ai-model')?.value || MODELS[0].id, idea: d.idea });
      applySuggestion(d, res.suggestion);
      await log(state, 'ai-assistant', 'AI_SUGGESTIONS_CREATED', `Model ${res.model}; ${d.aiSuggested.length} fields suggested; ${res.redactions} item(s) redacted before sending`);
      toast(`${d.aiSuggested.length} answers suggested — review and confirm each step.`);
      step = 1;
    } catch (err) {
      toast('Claude request failed: ' + err.message);
      await log(state, 'ai-assistant', 'AI_SUGGESTIONS_FAILED', err.message.slice(0, 200));
    } finally {
      aiBusy = false;
      save(state);
      refresh();
    }
  });
}

// Merge suggestions into the draft, marking every field that the AI filled.
export function applySuggestion(d, s) {
  const marks = [];
  const put = (p, v) => {
    const empty = Array.isArray(v) ? false : v === undefined || v === '';
    if (empty) return;
    set(d, p, v);
    marks.push(p);
  };
  put('name', s.name); put('function', s.function); put('description', s.description);
  put('users', s.users); put('aiType', s.aiType); put('sourcing', s.sourcing); put('decision', s.decision);
  put('value.driver', s.driver); put('value.kpi', s.kpi);
  put('prohibited', s.prohibited); put('annexIII', s.annexIII); put('profiling', s.profiling);
  put('transparency', s.transparency); put('personalData', s.personalData); put('dpia', s.personalData ? s.dpia : []);
  d.aiSuggested = [...new Set([...d.aiSuggested, ...marks])];
  d.openQuestions = s.openQuestions;
  d.aiAssisted = true;
  return d;
}
