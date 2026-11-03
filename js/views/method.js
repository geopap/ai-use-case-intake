import { esc, section, pageHead, tier, path } from '../ui.js';
import { PROHIBITED, ANNEX_III, DEROGATIONS, TRANSPARENCY, DPIA_CRITERIA, SCORING, PATHS, FRAMEWORK_VERSION } from '../framework.js';
import { CONTROLS } from '../controls.js';

export function render() {
  const flow = [
    ['1', 'Prohibited practice?', 'Any of the eight Art. 5(1) practices', `${tier('prohibited')} → ${path('stop', 'Do not proceed')}`],
    ['2', 'Safety component of a regulated product?', 'Annex I product legislation (Art. 6(1))', `${tier('high')}`],
    ['3', 'Used in an Annex III area?', `${ANNEX_III.length} areas — employment, credit, insurance, education, biometrics…`, `${tier('high')} unless an Art. 6(3) exception applies — and never when the system profiles people`],
    ['4', 'Transparency trigger?', 'Interaction, synthetic content, emotion recognition, deep fakes (Art. 50)', `${tier('limited')} (adds duties on top of high-risk, never downgrades it)`],
    ['5', 'None of the above', '—', `${tier('minimal')} — baseline controls only`],
  ].map(([n, q, d, out]) => `<li class="flow-step"><div class="step-n">${n}</div><div><b>${esc(q)}</b><div class="small muted">${esc(d)}</div></div><div class="flow-out">${out}</div></li>`).join('');

  const groups = [...new Set(CONTROLS.map((c) => c.group))];
  const lib = groups.map((g) => CONTROLS.filter((c) => c.group === g).map((c, i) => `<tr>${i === 0 ? `<td rowspan="${CONTROLS.filter((x) => x.group === g).length}"><b>${esc(g)}</b></td>` : ''}<td><code>${esc(c.id)}</code></td><td>${esc(c.name)}</td><td>${esc(c.aiact)}</td><td>${esc(c.iso)}</td><td>${esc(c.other)}</td></tr>`).join('')).join('');

  const v = SCORING.value, f = SCORING.feasibility;
  return `
    ${pageHead('How triage works', 'Method & control library', `Every classification, score and control comes from one versioned rules file (framework v${esc(FRAMEWORK_VERSION)}), so each result can be traced to the rule that produced it. The mapping is indicative and for illustration, not legal advice.`)}
    <div class="grid-2 wide-left">
      ${section('EU AI Act decision flow', `<ol class="flow">${flow}</ol>
        <p class="small">The flow stops at the first match. GDPR runs alongside it: personal data adds a lawful basis and a record of processing; two or more of the nine EDPB criteria make a DPIA required.</p>`)}
      ${section('Review routes', Object.entries(PATHS).map(([k, p]) => `<div class="route">${path(k, p.label)}<div class="small"><b>${esc(p.who)}</b><br><span class="muted">Target: ${esc(p.sla)}</span></div></div>`).join('') + `
        <h3>Who is the provider?</h3>
        <p class="small">Building or substantially modifying the system makes you the <b>provider</b>: for high-risk systems that means a risk management system, technical documentation, a quality management system and a conformity assessment. Buying and using it as intended makes you a <b>deployer</b>, with lighter but real duties: human oversight, logs, informing people, and a fundamental rights impact assessment for credit and insurance.</p>`)}
    </div>
    <div class="grid-2">
      ${section('Value score (0–100)', `<dl class="kv">
          <dt>Annual benefit</dt><dd>${v.benefit * 100}% — banded: ${SCORING.benefitBands.map(([k, p]) => `≥€${k}k → ${p}`).join(', ')} (of 40)</dd>
          <dt>Strategic alignment</dt><dd>${v.alignment * 100}% — 1–5</dd>
          <dt>Confidence</dt><dd>${v.confidence * 100}% — 1–5, guess → evidence</dd>
          <dt>Speed to value</dt><dd>${v.speed * 100}% — ≤3 months full marks, &gt;18 months none</dd></dl>`)}
      ${section('Feasibility score (0–100)', `<dl class="kv">
          <dt>Data readiness</dt><dd>${f.data * 100}%</dd>
          <dt>Technology maturity</dt><dd>${f.tech * 100}%</dd>
          <dt>Skills available</dt><dd>${f.skills * 100}%</dd>
          <dt>Integration complexity</dt><dd>${f.integration * 100}% — inverted</dd>
          <dt>Change impact</dt><dd>${f.change * 100}% — inverted</dd></dl>
        <p class="small">Quadrants split at ${SCORING.threshold}: <b>Pursue now</b> · <b>Invest to enable</b> (valuable but not ready) · <b>Quick experiment</b> · <b>Park</b>. Priority = 60% value + 40% feasibility.</p>`)}
    </div>
    ${section(`Control library — ${CONTROLS.length} controls`, `<div class="table-wrap"><table class="table controls"><thead><tr><th>Group</th><th>ID</th><th>Control</th><th>EU AI Act</th><th>ISO/IEC 42001</th><th>Other</th></tr></thead><tbody>${lib}</tbody></table></div>`)}
    <div class="grid-2">
      ${section('Screening questions', `<h3>Prohibited practices — Art. 5(1)</h3><ul class="reasons small">${PROHIBITED.map((p) => `<li>${esc(p.label)} <code>${esc(p.ref)}</code></li>`).join('')}</ul>
        <h3>Art. 6(3) exceptions</h3><ul class="reasons small">${DEROGATIONS.map((p) => `<li>${esc(p.label)} <code>${esc(p.ref)}</code></li>`).join('')}</ul>
        <h3>Transparency — Art. 50</h3><ul class="reasons small">${TRANSPARENCY.map((p) => `<li>${esc(p.label)} <code>${esc(p.ref)}</code></li>`).join('')}</ul>`)}
      ${section('High-risk areas & DPIA criteria', `<h3>Annex III</h3><ul class="reasons small">${ANNEX_III.map((p) => `<li><b>${esc(p.area)}:</b> ${esc(p.label)} <code>${esc(p.ref)}</code></li>`).join('')}</ul>
        <h3>EDPB DPIA criteria</h3><ul class="reasons small">${DPIA_CRITERIA.map((p) => `<li>${esc(p.label)}</li>`).join('')}</ul>
        <div class="banner">Timing: the prohibitions apply since 2 February 2025 and the general-purpose AI rules since 2 August 2025. Check the current application dates for the high-risk obligations, which have been subject to legislative change.</div>`)}
    </div>`;
}
