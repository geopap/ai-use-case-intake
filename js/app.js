import { load, save, log } from './store.js';
import * as register from './views/register.js';
import * as intake from './views/intake.js';
import * as caseView from './views/case.js';
import * as method from './views/method.js';
import * as audit from './views/audit.js';
import * as about from './views/about.js';

const ROUTES = { register, intake, case: caseView, method, audit, about };

let state = load();
const root = document.getElementById('view');

function parseHash() {
  const [p, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { name: ROUTES[p] ? p : 'register', params: Object.fromEntries(new URLSearchParams(query)) };
}

function render({ keepFocus } = {}) {
  const { name, params } = parseHash();
  const view = ROUTES[name];
  const ctx = {
    state, params, root,
    refresh: (o) => render(o),
    go: (h) => { location.hash = h; },
    replaceState: (s) => { state = s; render(); },
  };
  const y = window.scrollY;
  root.innerHTML = view.render(ctx);
  view.bind?.(ctx);
  const active = name === 'case' ? 'register' : name;
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${active}`));
  document.body.classList.remove('nav-open');
  const pending = state.cases.filter((c) => !c.triage).length;
  const badge = document.getElementById('pending');
  badge.textContent = pending ? `${pending} to triage` : '';
  badge.hidden = !pending;
  if (keepFocus) {
    const el = root.querySelector(`[data-filter="${keepFocus}"]`);
    if (el) { el.focus(); if (el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); }
  }
  window.scrollTo(0, y);
  save(state);
}

let lastRoute = '';
window.addEventListener('hashchange', () => {
  const { name, params } = parseHash();
  const key = name + (params.id || '');
  render();
  if (key !== lastRoute) window.scrollTo(0, 0);
  lastRoute = key;
});
document.getElementById('menu').addEventListener('click', () => document.body.classList.toggle('nav-open'));

const applyTheme = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
try { applyTheme(localStorage.getItem('aiuci.theme')); } catch { /* ignore */ }
document.getElementById('theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const next = dark ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('aiuci.theme', next); } catch { /* ignore */ }
});

(async () => {
  if (!state.audit.length) await log(state, 'system', 'REGISTER_LOADED', `${state.cases.length} use cases`);
  const { name, params } = parseHash();
  lastRoute = name + (params.id || '');
  render();
})();
