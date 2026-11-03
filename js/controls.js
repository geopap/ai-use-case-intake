// Control library. Each control states when it applies (a predicate over the
// assessment) and where it comes from. The triage engine attaches the matching set.

const high = (r) => r.tier === 'high';
const provider = (r) => r.role === 'Provider';

export const CONTROLS = [
  // Baseline — every use case
  { id: 'C-OWN', group: 'Baseline', name: 'Named business owner and technical owner', when: () => true, aiact: '—', iso: 'A.3 Internal organisation', other: 'NIST GOVERN' },
  { id: 'C-INV', group: 'Baseline', name: 'Entry in the AI inventory with purpose, data and owners', when: () => true, aiact: '—', iso: 'A.6 AI system life cycle', other: 'NIST MAP' },
  { id: 'C-LIT', group: 'Baseline', name: 'AI literacy training for users and operators', when: () => true, aiact: 'Art. 4', iso: 'A.4 Resources · cl. 7.2', other: 'NIST GOVERN' },
  { id: 'C-KPI', group: 'Value', name: 'Baseline and target for the value KPI before launch — no KPI, no go', when: () => true, aiact: '—', iso: 'cl. 6.2 Objectives', other: 'Benefits realisation' },

  // Transparency
  { id: 'C-T1', group: 'Transparency', name: 'Tell people they are interacting with AI', when: (r) => r.transparency.includes('interaction'), aiact: 'Art. 50(1)', iso: 'A.8 Information for interested parties', other: 'NIST GOVERN' },
  { id: 'C-T2', group: 'Transparency', name: 'Mark generated content as AI-generated (machine-readable where possible)', when: (r) => r.transparency.includes('synthetic'), aiact: 'Art. 50(2)', iso: 'A.8', other: 'C2PA / watermarking' },
  { id: 'C-T3', group: 'Transparency', name: 'Inform people exposed to emotion recognition or biometric categorisation', when: (r) => r.transparency.includes('emotion'), aiact: 'Art. 50(3)', iso: 'A.8', other: 'GDPR Art. 13–14' },
  { id: 'C-T4', group: 'Transparency', name: 'Disclose deep fakes and AI-generated public-interest text', when: (r) => r.transparency.includes('deepfake'), aiact: 'Art. 50(4)', iso: 'A.8', other: '—' },

  // High-risk — provider obligations
  { id: 'C-RMS', group: 'High-risk', name: 'Risk management system across the life cycle', when: (r) => high(r) && provider(r), aiact: 'Art. 9', iso: 'cl. 6.1 · A.5', other: 'NIST MAP / MANAGE' },
  { id: 'C-DATA', group: 'High-risk', name: 'Data governance: relevance, representativeness and bias examination', when: high, aiact: 'Art. 10', iso: 'A.7 Data for AI systems', other: 'NIST MEASURE' },
  { id: 'C-DOC', group: 'High-risk', name: 'Technical documentation (Annex IV)', when: (r) => high(r) && provider(r), aiact: 'Art. 11', iso: 'A.6 · A.8', other: '—' },
  { id: 'C-LOG', group: 'High-risk', name: 'Automatic logging; deployers keep logs for at least six months', when: high, aiact: 'Art. 12, 26(6)', iso: 'A.6.2.8 Event logs', other: 'NIST MANAGE' },
  { id: 'C-HO', group: 'High-risk', name: 'Human oversight designed in, with competent and authorised overseers', when: (r) => high(r) || r.decision === 'automated', aiact: 'Art. 14, 26(2)', iso: 'A.9 Use of AI systems', other: 'NIST MANAGE' },
  { id: 'C-ACC', group: 'High-risk', name: 'Accuracy, robustness and cybersecurity testing', when: high, aiact: 'Art. 15', iso: 'A.6 (verification & validation)', other: 'NIST MEASURE' },
  { id: 'C-QMS', group: 'High-risk', name: 'Quality management system', when: (r) => high(r) && provider(r), aiact: 'Art. 17', iso: 'ISO/IEC 42001 AIMS', other: '—' },
  { id: 'C-CA', group: 'High-risk', name: 'Conformity assessment, EU declaration, CE marking and EU database registration', when: (r) => high(r) && provider(r), aiact: 'Art. 43, 47–49', iso: '—', other: '—' },
  { id: 'C-PMM', group: 'High-risk', name: 'Post-market monitoring and serious-incident reporting', when: high, aiact: 'Art. 72–73, 26(5)', iso: 'A.6 (operation & monitoring)', other: 'NIST MANAGE' },

  // High-risk — deployer obligations
  { id: 'C-USE', group: 'High-risk', name: 'Use according to the provider’s instructions; monitor operation', when: (r) => high(r) && !provider(r), aiact: 'Art. 26(1), 26(5)', iso: 'A.9 · A.10', other: '—' },
  { id: 'C-FRIA', group: 'High-risk', name: 'Fundamental rights impact assessment before first use', when: (r) => high(r) && r.annexIII.some((k) => ['credit', 'insurance', 'public-benefits'].includes(k)), aiact: 'Art. 27', iso: 'A.5 Impact assessment', other: '—' },
  { id: 'C-WRK', group: 'High-risk', name: 'Inform workers’ representatives and affected workers before workplace use', when: (r) => high(r) && r.annexIII.some((k) => ['recruitment', 'workforce'].includes(k)), aiact: 'Art. 26(7)', iso: 'A.8', other: 'Works council' },
  { id: 'C-AFF', group: 'High-risk', name: 'Inform people that high-risk AI is used in decisions about them', when: high, aiact: 'Art. 26(11)', iso: 'A.8', other: 'GDPR Art. 13–14' },
  { id: 'C-DER', group: 'High-risk', name: 'Document why the Annex III system is not high-risk, and register it', when: (r) => r.derogationApplied, aiact: 'Art. 6(4), 49(2)', iso: 'A.5', other: '—' },

  // Data protection
  { id: 'C-ROPA', group: 'Data protection', name: 'Lawful basis and record of processing', when: (r) => r.personalData, aiact: '—', iso: 'A.7', other: 'GDPR Art. 6, 30' },
  { id: 'C-DPIA', group: 'Data protection', name: 'Data protection impact assessment', when: (r) => r.dpia === 'required', aiact: 'Art. 26(9)', iso: 'A.5', other: 'GDPR Art. 35' },
  { id: 'C-A22', group: 'Data protection', name: 'Right to human intervention and to contest automated decisions', when: (r) => r.decision === 'automated' && r.personalData, aiact: '—', iso: 'A.9', other: 'GDPR Art. 22' },
  { id: 'C-MIN', group: 'Data protection', name: 'Data minimisation and pseudonymisation before model use', when: (r) => r.personalData, aiact: 'Art. 10(5)', iso: 'A.7', other: 'GDPR Art. 5(1)(c), 25' },

  // Technology & supply chain
  { id: 'C-VEN', group: 'Supply chain', name: 'Vendor due diligence and AI contract clauses (data use, retention, model changes, exit)', when: (r) => r.sourcing === 'buy', aiact: 'Art. 25', iso: 'A.10 Third-party relationships', other: 'NIST GOVERN' },
  { id: 'C-EVAL', group: 'Technology', name: 'Pre-launch evaluation and red-teaming: hallucination, prompt injection, data leakage', when: (r) => r.aiType === 'genai', aiact: 'Art. 15', iso: 'A.6 (verification & validation)', other: 'NIST MEASURE · OWASP LLM Top 10' },
  { id: 'C-SEC', group: 'Technology', name: 'Security review of integrations, access rights and secrets', when: (r) => r.tier !== 'minimal' || r.personalData || r.users === 'customers', aiact: 'Art. 15(5)', iso: 'A.6 · ISO/IEC 27001', other: 'NIST MANAGE' },
  { id: 'C-MON', group: 'Technology', name: 'Production monitoring of quality, drift and incidents', when: (r) => r.tier !== 'minimal' || r.users === 'customers', aiact: '—', iso: 'A.6 (operation & monitoring)', other: 'NIST MANAGE' },
];

export function controlsFor(result) {
  if (result.tier === 'prohibited') return [];
  return CONTROLS.filter((c) => c.when(result));
}
