import { esc, section, pageHead, download, toast } from '../ui.js';
import { verifyChain } from '../audit.js';
import { freshState, save, log } from '../store.js';
import { assess } from '../triage.js';
import { toInitiative, isApproved } from '../export.js';

let verdict = null;

export function render({ state }) {
  const rows = state.audit.slice().reverse().map((e) => `<tr>
    <td class="r muted">${e.seq}</td><td class="small">${esc(new Date(e.ts).toLocaleString('en-GB'))}</td>
    <td><span class="actor ${e.actor === 'ai-assistant' ? 'agent' : 'human'}">${esc(e.actor)}</span></td>
    <td><code>${esc(e.action)}</code></td><td>${esc(e.detail)}</td><td class="hash" title="${esc(e.hash)}">${esc(e.hash.slice(0, 10))}…</td></tr>`).join('');
  const approved = state.cases.filter(isApproved).length;

  return `
    ${pageHead('Every step is logged', 'Audit trail & data', 'A tamper-evident record of every submission, AI suggestion, control update and decision. Each entry includes the hash of the one before it, so any edit breaks the chain.')}
    ${section(`Audit log — ${state.audit.length} entries`, `
      <div class="row"><button class="btn" id="verify">Verify chain integrity</button><button class="btn ghost" id="export-log">Export log (JSON)</button>
      ${verdict ? `<span class="pill ${verdict.ok ? 'ok' : 'bad'}">${verdict.ok ? `✓ Chain intact — ${verdict.entries} entries` : `✕ Broken at entry ${verdict.brokenAt}: ${esc(verdict.reason)}`}</span>` : ''}</div>
      <div class="table-wrap"><table class="table audit"><thead><tr><th class="r">#</th><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th><th>Hash</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="muted">No entries yet.</td></tr>'}</tbody></table></div>`)}
    <div class="grid-2">
      ${section('Register data', `<p class="small">Export the register as JSON, or send every approved use case to the AI Portfolio Office in one file.</p>
        <div class="row"><button class="btn ghost" id="export-json">Export register (JSON)</button>
        <label class="btn ghost file">Import register (JSON)<input type="file" id="import-json" accept=".json,application/json" hidden></label>
        <button class="btn ghost" id="export-po" ${approved ? '' : 'disabled'}>Send ${approved} approved to Portfolio Office</button></div>`)}
      ${section('Reset the demo', `<p class="small">Restore the synthetic Varnholt Group register and clear the draft and audit log stored in this browser.</p>
        <button class="btn danger" id="reset">Reset demo data</button>`)}
    </div>`;
}

const validCase = (c) => c && typeof c.id === 'string' && typeof c.name === 'string' && c.value && typeof c.value === 'object'
  && Array.isArray(c.annexIII ?? []) && Array.isArray(c.prohibited ?? []) && Array.isArray(c.transparency ?? []);

export function bind({ root, state, refresh, replaceState }) {
  const $ = (s) => root.querySelector(s);
  $('#verify').addEventListener('click', async () => { verdict = await verifyChain(state.audit); refresh(); });
  $('#export-log').addEventListener('click', () => download('audit-log.json', JSON.stringify(state.audit, null, 2), 'application/json'));
  $('#export-json').addEventListener('click', () => download('ai-use-case-register.json', JSON.stringify(state.cases, null, 2), 'application/json'));
  $('#export-po').addEventListener('click', async () => {
    const list = state.cases.filter(isApproved).map((uc) => toInitiative(uc, assess(uc)));
    download('approved-ai-initiatives.json', JSON.stringify(list, null, 2), 'application/json');
    await log(state, 'user', 'SENT_TO_PORTFOLIO', `${list.length} approved use cases exported: ${list.map((i) => i.id).join(', ')}`);
    toast(`${list.length} initiatives exported — import them in AI Portfolio Office.`);
  });
  $('#import-json').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 2_000_000) throw new Error('file too large');
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data) || !data.every(validCase)) throw new Error('not a valid use-case list');
      state.cases = data;
      await log(state, 'user', 'REGISTER_IMPORTED', `${data.length} use cases imported from ${f.name.slice(0, 80)}`);
      toast(`${data.length} use cases imported.`);
      refresh();
    } catch (err) { toast('Import failed: ' + err.message); }
  });
  $('#reset').addEventListener('click', async () => {
    if (!confirm('Reset all demo data in this browser?')) return;
    const s = freshState();
    verdict = null;
    await log(s, 'user', 'DEMO_RESET', 'Synthetic register restored');
    save(s);
    replaceState(s);
  });
}
