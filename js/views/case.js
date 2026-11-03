import { esc, section, pageHead, tier, path, outcome, meter, download, toast, eur } from '../ui.js';
import { assess, readiness, labelOf } from '../triage.js';
import { TIERS } from '../framework.js';
import { toMarkdown, toInitiative, isApproved, paybackMonths } from '../export.js';
import { log, save } from '../store.js';

const NEXT = { undefined: 'in progress', todo: 'in progress', 'in progress': 'done', done: 'todo' };

export function render({ state, params }) {
  const uc = state.cases.find((c) => c.id === params.id);
  if (!uc) return `${pageHead('Not found', 'Use case not found', '')}<a href="#/register">← Back to the register</a>`;
  const r = assess(uc);
  const ready = readiness(uc, r.controls);
  const groups = [...new Set(r.controls.map((c) => c.group))];

  const controls = groups.map((g) => `<h3>${esc(g)}</h3><ul class="controls">${r.controls.filter((c) => c.group === g).map((c) => {
    const st = uc.controlStatus?.[c.id] || 'todo';
    return `<li class="ctl ctl-${st.replace(' ', '-')}"><button class="ctl-status" data-ctl="${c.id}" title="Click to change status">${st === 'done' ? '✓' : st === 'in progress' ? '◐' : '○'}</button>
      <div><b>${esc(c.name)}</b> <code>${esc(c.id)}</code><div class="small muted">${[c.aiact !== '—' && `EU AI Act ${c.aiact}`, c.iso !== '—' && `ISO 42001 ${c.iso}`, c.other !== '—' && c.other].filter(Boolean).map(esc).join(' · ')}</div></div>
      <span class="small muted">${esc(st)}</span></li>`;
  }).join('')}</ul>`).join('');

  const t = uc.triage;
  const prohibited = r.tier === 'prohibited';
  const decisionForm = `
    <form id="decide" class="signoff">
      ${t ? `<div class="banner ${{ Approved: 'ok', 'Approved with conditions': 'ok', Rejected: 'bad' }[t.outcome] || ''}"><b>${esc(t.outcome)}</b> by ${esc(t.by)} on ${esc(t.at)} — ${esc(t.rationale)}${t.conditions ? `<br><b>Conditions:</b> ${esc(t.conditions)}` : ''}</div><p class="small muted">Record a new decision below to change it — the history stays in the audit trail.</p>` : ''}
      <label>Decision<select name="outcome">
        ${['Approved', 'Approved with conditions', 'Returned', 'Rejected'].map((o) => `<option ${prohibited && o !== 'Rejected' ? 'disabled' : ''} ${prohibited && o === 'Rejected' ? 'selected' : ''}>${o}</option>`).join('')}
      </select></label>
      <label>Decided by<input name="by" required placeholder="${esc(r.pathInfo.who)}"></label>
      <label>Rationale<textarea name="rationale" required minlength="10" rows="2" placeholder="Why — this is logged and shown on the use-case card"></textarea></label>
      <label>Conditions <span class="small muted">(required for conditional approval)</span><textarea name="conditions" rows="2" placeholder="e.g. Launch in one market until the DPIA is signed off"></textarea></label>
      ${r.path === 'enhanced' ? '<label class="check"><input type="checkbox" name="board" required> Legal, the DPO and the CISO have reviewed this high-risk use case.</label>' : ''}
      <div class="row"><button class="btn primary">Record decision</button></div>
      <p class="small muted">Unconditional approval needs every required control in place (${Math.round(ready * 100)}% now). Otherwise, approve with conditions.</p>
    </form>`;

  return `
    <div class="row"><a href="#/register">← Register</a></div>
    ${pageHead(`${uc.id} · ${uc.function} · submitted ${uc.submitted}`, uc.name, esc(uc.description))}
    <div class="case-head">${tier(r.tier)} ${path(r.path, r.pathInfo.label)} ${outcome(uc)} ${uc.aiAssisted ? '<span class="ai-badge" title="Intake pre-filled by AI, every answer confirmed by the submitter">AI-assisted intake</span>' : ''}</div>
    <div class="grid-2">
      ${section('Risk classification', `
        <p><b>${esc(TIERS[r.tier].label)}</b> · EU AI Act role: <b>${esc(r.role)}</b></p>
        <ul class="reasons">${r.reasons.map((x) => `<li>${esc(x.text)} <code>${esc(x.ref)}</code></li>`).join('')}</ul>
        ${r.notes.map((n) => `<div class="banner">${esc(n)}</div>`).join('')}
        <h3>Data protection</h3>
        <p>Personal data: <b>${r.personalData ? 'yes' : 'no'}</b> · DPIA: <b>${esc(r.dpia)}</b></p>
        ${r.dpiaCriteria.length ? `<ul class="reasons small">${r.dpiaCriteria.map((c) => `<li>${esc(c.label)}</li>`).join('')}</ul>` : ''}
        <h3>Review</h3><p>${path(r.path, r.pathInfo.label)} ${esc(r.pathInfo.who)} · target ${esc(r.pathInfo.sla)}</p>`)}
      ${section('Value case', `
        <div class="mini-kpis">
          <div><b>${eur(uc.value.benefitK)}</b><span>annual benefit</span></div>
          <div><b>${uc.value.costK ? eur(uc.value.costK) : '–'}</b><span>one-off + first-year cost</span></div>
          <div><b>${paybackMonths(uc.value) ? paybackMonths(uc.value) + ' months' : '–'}</b><span>payback</span></div>
          <div><b>${esc(r.quadrant)}</b><span>priority ${r.priority}/100</span></div>
        </div>
        <dl class="kv wide">
          <dt>Value</dt><dd>${meter(r.value)} <b>${r.value}</b>/100</dd>
          <dt>Feasibility</dt><dd>${meter(r.feasibility)} <b>${r.feasibility}</b>/100</dd>
          <dt>Driver · KPI</dt><dd>${esc(uc.value.driver)} · ${esc(uc.value.kpi)}</dd>
          <dt>Users</dt><dd>${esc(labelOf('users', uc.users))}</dd>
          <dt>AI type</dt><dd>${esc(labelOf('aiType', uc.aiType))}</dd>
          <dt>Sourcing</dt><dd>${esc(labelOf('sourcing', uc.sourcing))}</dd>
          <dt>Decisions</dt><dd>${esc(labelOf('decision', uc.decision))}</dd>
          <dt>Owner</dt><dd>${esc(uc.owner)}</dd>
        </dl>`)}
    </div>
    <div class="grid-2 wide-left">
      ${section(`Required controls — ${r.controls.length}`, r.controls.length ? `<div class="readiness">${meter(ready * 100)} <b>${Math.round(ready * 100)}%</b> in place</div>${controls}` : '<p class="muted">No controls: a prohibited practice cannot be made compliant. It must not be built or bought.</p>', '<a class="small" href="#/method">Control library →</a>')}
      <div>
        ${section('Triage decision', decisionForm)}
        ${section('Export', `<div class="row">
          <button class="btn ghost" id="md">Use-case card (Markdown)</button>
          <button class="btn ghost" id="json">Assessment (JSON)</button>
          <button class="btn ${isApproved(uc) ? '' : 'ghost'}" id="to-po" ${isApproved(uc) ? '' : 'disabled'}>Send to AI Portfolio Office</button></div>
          <p class="small muted">${isApproved(uc) ? 'Downloads an initiative file. Import it in <a href="https://geopap.github.io/ai-portfolio-office/#/audit" target="_blank" rel="noopener">AI Portfolio Office → Audit trail &amp; data → Add to portfolio</a>.' : 'Available once the use case is approved.'}</p>`)}
      </div>
    </div>`;
}

export function bind({ root, state, params, refresh }) {
  const uc = state.cases.find((c) => c.id === params.id);
  if (!uc) return;
  const r = assess(uc);

  root.querySelectorAll('[data-ctl]').forEach((b) => b.addEventListener('click', async () => {
    uc.controlStatus ||= {};
    const next = NEXT[uc.controlStatus[b.dataset.ctl]];
    uc.controlStatus[b.dataset.ctl] = next;
    await log(state, uc.owner, 'CONTROL_STATUS', `${uc.id} ${b.dataset.ctl} → ${next}`);
    refresh();
  }));

  root.querySelector('#decide')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const o = String(f.get('outcome'));
    const conditions = String(f.get('conditions') || '').trim();
    if (r.tier === 'prohibited' && o !== 'Rejected') return toast('A prohibited practice can only be rejected.');
    if (o === 'Approved with conditions' && conditions.length < 5) return toast('State the conditions for a conditional approval.');
    if (o === 'Approved' && readiness(uc, r.controls) < 1) return toast('Not all required controls are in place — approve with conditions instead.');
    uc.triage = {
      outcome: o, by: String(f.get('by')).trim().slice(0, 80), at: new Date().toISOString().slice(0, 10),
      rationale: String(f.get('rationale')).trim().slice(0, 500), conditions: conditions.slice(0, 500),
    };
    await log(state, uc.triage.by, 'TRIAGE_DECISION', `${uc.id}: ${o} — ${uc.triage.rationale}${conditions ? ' | Conditions: ' + conditions : ''}`);
    toast(`Decision recorded: ${o}`);
    refresh();
  });

  root.querySelector('#md').addEventListener('click', () => download(`${uc.id}-use-case-card.md`, toMarkdown(uc, r), 'text/markdown'));
  root.querySelector('#json').addEventListener('click', () => download(`${uc.id}-assessment.json`, JSON.stringify({ useCase: uc, assessment: { ...r, controls: r.controls.map(({ when, ...c }) => c) } }, null, 2), 'application/json'));
  root.querySelector('#to-po').addEventListener('click', async () => {
    download(`${uc.id}-portfolio-initiative.json`, JSON.stringify([toInitiative(uc, r)], null, 2), 'application/json');
    await log(state, 'user', 'SENT_TO_PORTFOLIO', `${uc.id} exported as initiative ${uc.id.replace(/^UC/, 'AI')}`);
    save(state);
  });
}
