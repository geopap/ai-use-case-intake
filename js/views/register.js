import { esc, tile, section, pageHead, tier, path, outcome, eur, meter } from '../ui.js';
import { registerStats } from '../triage.js';
import { SCORING, TIERS } from '../framework.js';
import { paybackMonths } from '../export.js';

const filters = { tier: '', status: '', q: '' };

export function render({ state }) {
  const s = registerStats(state.cases);
  const rows = s.assessed
    .filter(({ uc, r }) => (!filters.tier || r.tier === filters.tier)
      && (!filters.status || (filters.status === 'pending' ? !uc.triage : uc.triage?.outcome === filters.status))
      && (!filters.q || `${uc.id} ${uc.name} ${uc.owner} ${uc.function}`.toLowerCase().includes(filters.q.toLowerCase())))
    .sort((a, b) => TIERS[a.r.tier].order - TIERS[b.r.tier].order || b.r.priority - a.r.priority);

  const table = rows.map(({ uc, r }) => `
    <tr data-open="${esc(uc.id)}" tabindex="0">
      <td><b>${esc(uc.name)}</b><div class="muted small">${esc(uc.id)} · ${esc(uc.function)} · ${esc(uc.owner)}</div></td>
      <td>${tier(r.tier)}</td>
      <td class="r">${eur(uc.value.benefitK)}<div class="muted small">${paybackMonths(uc.value) ? `payback ${paybackMonths(uc.value)} mo` : ''}</div></td>
      <td>${meter(r.value, 'Value')} <span class="small">${r.value}</span></td>
      <td>${meter(r.feasibility, 'Feasibility')} <span class="small">${r.feasibility}</span></td>
      <td>${esc(r.quadrant)}</td>
      <td>${path(r.path, r.pathInfo.label)}</td>
      <td>${outcome(uc)}</td>
    </tr>`).join('');

  const sel = (key, label, opts) => `<label>${label}<select data-filter="${key}"><option value="">All</option>${opts.map(([v, l]) => `<option value="${esc(v)}" ${filters[key] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;

  return `
    ${pageHead('Varnholt Group · AI governance office', 'AI use-case register', 'Every AI idea in one place: what it is worth, how hard it is, what the EU AI Act and GDPR require, and who must approve it — before anyone builds or buys.')}
    <div class="row head-actions"><a class="btn primary" href="#/intake">+ New AI use case</a><span class="muted small">Classification is rule-based and explainable — see <a href="#/method">Method</a>.</span></div>
    <div class="tiles">
      ${tile('use cases', s.total, `${s.pending} awaiting triage`)}
      ${tile('approved', s.approved, `${eur(s.approvedValueK)} annual benefit`, 'good')}
      ${tile('pipeline value', eur(s.pipelineValueK), 'annual, excluding prohibited')}
      ${tile('high-risk', s.byTier.high, 'enhanced review', 'warn')}
      ${tile('prohibited', s.byTier.prohibited, 'stopped at intake', 'bad')}
      ${tile('DPIA required', s.dpiaRequired, 'GDPR Art. 35')}
    </div>
    <div class="grid-2 wide-left">
      ${section('Value vs feasibility', matrix(s.assessed), '<span class="small muted">Click a bubble to open</span>')}
      ${section('Risk profile of the pipeline', tierBars(s) + `
        <h3>Review routes</h3>
        <dl class="kv">
          <dt>${path('fast', 'Fast track')}</dt><dd>minimal risk, internal, no DPIA</dd>
          <dt>${path('standard', 'Standard review')}</dt><dd>transparency duties, DPIA, customer-facing or Art. 6(3) exception</dd>
          <dt>${path('enhanced', 'Enhanced review')}</dt><dd>high-risk under the EU AI Act</dd>
          <dt>${path('stop', 'Do not proceed')}</dt><dd>prohibited practice</dd>
        </dl>`)}
    </div>
    <div class="filters">
      <label class="grow">Search<input type="search" data-filter="q" value="${esc(filters.q)}" placeholder="Name, ID, owner or function"></label>
      ${sel('tier', 'Risk tier', Object.entries(TIERS).map(([k, v]) => [k, v.label]))}
      ${sel('status', 'Decision', [['pending', 'Awaiting triage'], ['Approved', 'Approved'], ['Approved with conditions', 'Approved with conditions'], ['Returned', 'Returned'], ['Rejected', 'Rejected']])}
    </div>
    <div class="card"><div class="table-wrap"><table class="table table-click">
      <thead><tr><th>Use case</th><th>Risk tier</th><th class="r">Benefit / yr</th><th>Value</th><th>Feasibility</th><th>Quadrant</th><th>Review path</th><th>Decision</th></tr></thead>
      <tbody>${table || '<tr><td colspan="8" class="muted">No use cases match the filters.</td></tr>'}</tbody>
    </table></div><p class="muted small pad">${rows.length} of ${s.total} use cases</p></div>`;
}

function tierBars(s) {
  return ['prohibited', 'high', 'limited', 'minimal'].map((t) => `
    <div class="obj-row"><div class="obj-name">${tier(t)}</div>
      <div class="stack"><span class="bar-tier bar-${t}" style="flex:${s.byTier[t] / s.total || 0}">${s.byTier[t] || ''}</span><span style="flex:${1 - (s.byTier[t] / s.total || 0)}"></span></div></div>`).join('');
}

function matrix(assessed) {
  const W = 560, H = 420, P = 44, MIN = 20;
  const scale = (n) => (Math.max(MIN, n) - MIN) / (100 - MIN);
  const x = (f) => P + scale(f) * (W - 2 * P);
  const y = (v) => H - P - scale(v) * (H - 2 * P);
  const t = SCORING.threshold;
  const seen = {};
  const dots = assessed.filter(({ r }) => r.tier !== 'prohibited').map(({ uc, r }) => {
    const rad = 6 + Math.sqrt(Number(uc.value.benefitK) || 0) / 6;
    // Spread bubbles that share a position so none is hidden.
    const key = `${Math.round(r.feasibility / 3)}|${Math.round(r.value / 3)}`;
    const n = (seen[key] = (seen[key] || 0) + 1) - 1;
    const cx = x(r.feasibility) + (n ? Math.cos(n * 2.4) * (rad + 10) : 0);
    const cy = y(r.value) + (n ? Math.sin(n * 2.4) * (rad + 10) : 0);
    return `<a href="#/case?id=${esc(uc.id)}"><g class="dot tierdot-${r.tier}"><title>${esc(uc.name)} — value ${r.value}, feasibility ${r.feasibility}</title>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}"/>
      <text x="${cx.toFixed(1)}" y="${(cy - rad - 4).toFixed(1)}" text-anchor="middle">${esc(uc.id)}</text></g></a>`;
  }).join('');
  return `<svg class="matrix" viewBox="0 0 ${W} ${H}" role="img" aria-label="Value versus feasibility matrix">
    <rect class="q q-quick" x="${x(t)}" y="${P}" width="${W - P - x(t)}" height="${y(t) - P}"/>
    <rect class="q q-big" x="${P}" y="${P}" width="${x(t) - P}" height="${y(t) - P}"/>
    <rect class="q q-fill" x="${x(t)}" y="${y(t)}" width="${W - P - x(t)}" height="${H - P - y(t)}"/>
    <rect class="q q-question" x="${P}" y="${y(t)}" width="${x(t) - P}" height="${H - P - y(t)}"/>
    <text class="q-label" x="${W - P - 8}" y="${P + 18}" text-anchor="end">PURSUE NOW</text>
    <text class="q-label" x="${P + 8}" y="${P + 18}">INVEST TO ENABLE</text>
    <text class="q-label" x="${W - P - 8}" y="${H - P - 10}" text-anchor="end">QUICK EXPERIMENT</text>
    <text class="q-label" x="${P + 8}" y="${H - P - 10}">PARK</text>
    <line class="axis" x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}"/><line class="axis" x1="${P}" y1="${P}" x2="${P}" y2="${H - P}"/>
    <text class="axis-label" x="${W / 2}" y="${H - 12}" text-anchor="middle">Feasibility →</text>
    <text class="axis-label" x="14" y="${H / 2}" text-anchor="middle" transform="rotate(-90 14 ${H / 2})">Value →</text>
    ${dots}</svg>
    <div class="legend"><span><i class="sw tierdot-high-sw"></i>High-risk</span><span><i class="sw tierdot-limited-sw"></i>Limited</span><span><i class="sw tierdot-minimal-sw"></i>Minimal</span><span class="muted">Bubble size = annual benefit · axes from ${MIN} to 100 · prohibited cases not plotted</span></div>`;
}

export function bind({ root, refresh, go }) {
  root.querySelectorAll('[data-filter]').forEach((el) => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
    filters[el.dataset.filter] = el.value;
    refresh({ keepFocus: el.dataset.filter });
  }));
  root.querySelectorAll('[data-open]').forEach((tr) => {
    const open = () => go(`#/case?id=${tr.dataset.open}`);
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}
