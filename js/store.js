// App state, persisted per browser. Every storage access is guarded so the app
// works in private mode or with storage blocked.

import { USE_CASES } from './data.js';
import { appendEntry } from './audit.js';

const KEY = 'aiuci.state.v1';

export function freshState() {
  return { cases: structuredClone(USE_CASES), draft: null, audit: [] };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshState(), ...JSON.parse(raw) };
  } catch { /* storage unavailable or corrupt — start fresh */ }
  return freshState();
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export async function log(state, actor, action, detail) {
  state.audit = await appendEntry(state.audit, { actor, action, detail });
  save(state);
}

export function nextId(cases) {
  const n = Math.max(0, ...cases.map((c) => Number(c.id.replace(/\D/g, '')) || 0)) + 1;
  return `UC-${String(n).padStart(2, '0')}`;
}

export const session = {
  get(k) { try { return sessionStorage.getItem(k) || ''; } catch { return ''; } },
  set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch { /* ignore */ } },
};
