// Screening framework as code: every question, threshold and legal reference the
// triage engine uses. References are indicative and for illustration — not legal advice.

export const FRAMEWORK_VERSION = '2.1.0';

// The legal text this framework encodes, and when it was last checked against the Official Journal.
export const LEGAL_BASIS = {
  act: 'Regulation (EU) 2024/1689 (AI Act)',
  amendedBy: 'Regulation (EU) 2026/1744 (Digital Omnibus on AI), OJ L of 24 July 2026',
  checked: '2026-11-27',
};

// Application dates (Art. 113 as amended by Regulation (EU) 2026/1744).
export const TIMELINE = [
  { date: '2025-02-02', what: 'Prohibited practices (Art. 5) and AI literacy (Art. 4)' },
  { date: '2025-08-02', what: 'General-purpose AI model rules (Chapter V)' },
  { date: '2026-07-27', what: 'Amended AI literacy duty: take measures to support AI literacy; no specific level must be guaranteed (Art. 4)' },
  { date: '2026-08-02', what: 'General application, including transparency duties (Art. 50); national authorities start supervising and enforcing' },
  { date: '2026-12-02', what: 'New prohibitions on non-consensual intimate imagery and child sexual abuse material (Art. 5(1)(ba), (bb)); Art. 50(2) marking for generative systems already on the market' },
  { date: '2027-12-02', what: 'High-risk obligations for Annex III systems (Art. 6(2))' },
  { date: '2028-08-02', what: 'High-risk obligations for Annex I product systems (Art. 6(1))' },
];
export const HIGH_RISK_FROM = { annexIII: '2 December 2027', annexI: '2 August 2028' };

// EU AI Act, Article 5(1) — prohibited practices (points (a)–(h) since 2 February 2025;
// points (ba) and (bb), added by Regulation (EU) 2026/1744, from 2 December 2026).
export const PROHIBITED = [
  { key: 'manipulation', ref: 'Art. 5(1)(a)', label: 'Uses subliminal, manipulative or deceptive techniques that materially distort behaviour and are likely to cause significant harm' },
  { key: 'vulnerability', ref: 'Art. 5(1)(b)', label: 'Exploits vulnerabilities due to age, disability or a specific social or economic situation' },
  { key: 'intimate-imagery', ref: 'Art. 5(1)(ba)', from: '2 December 2026', label: 'Generates or manipulates realistic intimate or sexually explicit images, video or audio of an identifiable person without their explicit consent' },
  { key: 'csam', ref: 'Art. 5(1)(bb)', from: '2 December 2026', label: 'Generates or manipulates child sexual abuse material' },
  { key: 'social-scoring', ref: 'Art. 5(1)(c)', label: 'Scores people on social behaviour or personal traits, leading to detrimental or unjustified treatment' },
  { key: 'crime-prediction', ref: 'Art. 5(1)(d)', label: 'Predicts the risk of a person committing a crime based solely on profiling or personality traits' },
  { key: 'face-scraping', ref: 'Art. 5(1)(e)', label: 'Builds facial-recognition databases by untargeted scraping of images from the internet or CCTV' },
  { key: 'emotion-workplace', ref: 'Art. 5(1)(f)', label: 'Infers emotions of people in the workplace or in education (except for medical or safety reasons)' },
  { key: 'biometric-categorisation', ref: 'Art. 5(1)(g)', label: 'Categorises people by biometric data to infer race, political opinions, union membership, religion, sex life or orientation' },
  { key: 'realtime-rbi', ref: 'Art. 5(1)(h)', label: 'Real-time remote biometric identification in publicly accessible spaces for law enforcement' },
];

// EU AI Act, Annex III — high-risk areas (Art. 6(2)).
export const ANNEX_III = [
  { key: 'biometric', ref: 'Annex III(1)', area: 'Biometrics', label: 'Remote biometric identification, biometric categorisation or emotion recognition' },
  { key: 'critical-infra', ref: 'Annex III(2)', area: 'Critical infrastructure', label: 'Safety component in managing critical digital infrastructure, road traffic, or the supply of water, gas, heating or electricity' },
  { key: 'education', ref: 'Annex III(3)', area: 'Education', label: 'Admission, evaluating learning outcomes, steering learning, or monitoring students during tests' },
  { key: 'recruitment', ref: 'Annex III(4)(a)', area: 'Employment', label: 'Recruitment or selection — targeted job ads, filtering applications, evaluating candidates' },
  { key: 'workforce', ref: 'Annex III(4)(b)', area: 'Employment', label: 'Decisions on promotion or termination, task allocation based on behaviour or traits, or monitoring and evaluating performance' },
  { key: 'public-benefits', ref: 'Annex III(5)(a)', area: 'Essential services', label: 'Eligibility for public assistance benefits and services' },
  { key: 'credit', ref: 'Annex III(5)(b)', area: 'Essential services', label: 'Creditworthiness assessment or credit scoring of natural persons (fraud detection excluded)' },
  { key: 'insurance', ref: 'Annex III(5)(c)', area: 'Essential services', label: 'Risk assessment and pricing for life or health insurance' },
  { key: 'emergency', ref: 'Annex III(5)(d)', area: 'Essential services', label: 'Evaluating or triaging emergency calls and dispatching emergency services' },
  { key: 'law-enforcement', ref: 'Annex III(6)', area: 'Law enforcement', label: 'Uses by or on behalf of law-enforcement authorities' },
  { key: 'migration', ref: 'Annex III(7)', area: 'Migration & border control', label: 'Uses in migration, asylum or border-control management' },
  { key: 'justice', ref: 'Annex III(8)', area: 'Justice & democracy', label: 'Assisting judicial decisions, or influencing elections or voting behaviour' },
];

// Article 6(3): an Annex III system is not high-risk if it does not pose a significant risk
// and meets one of these conditions — never when it profiles natural persons.
export const DEROGATIONS = [
  { key: 'a', ref: 'Art. 6(3)(a)', label: 'Performs a narrow procedural task' },
  { key: 'b', ref: 'Art. 6(3)(b)', label: 'Improves the result of a previously completed human activity' },
  { key: 'c', ref: 'Art. 6(3)(c)', label: 'Detects decision patterns or deviations, without replacing or influencing the human assessment without proper review' },
  { key: 'd', ref: 'Art. 6(3)(d)', label: 'Performs a preparatory task to an assessment' },
];

// Article 50 — transparency obligations.
export const TRANSPARENCY = [
  { key: 'interaction', ref: 'Art. 50(1)', label: 'People interact with it directly (chatbot, voice assistant, agent)' },
  { key: 'synthetic', ref: 'Art. 50(2)', label: 'Generates synthetic audio, image, video or text' },
  { key: 'emotion', ref: 'Art. 50(3)', label: 'Recognises emotions or categorises people biometrically (where not prohibited)' },
  { key: 'deepfake', ref: 'Art. 50(4)', label: 'Produces deep fakes, or text published to inform the public on matters of public interest' },
];

// EDPB criteria for when a GDPR DPIA is likely required (WP248 rev.01).
// Two or more criteria: DPIA required. One: recommended.
export const DPIA_CRITERIA = [
  { key: 'scoring', label: 'Evaluation or scoring of people, including profiling' },
  { key: 'automated', label: 'Automated decisions with legal or similarly significant effect' },
  { key: 'monitoring', label: 'Systematic monitoring of people' },
  { key: 'sensitive', label: 'Special-category or highly personal data (health, finance, location…)' },
  { key: 'large-scale', label: 'Processing at large scale' },
  { key: 'matching', label: 'Matching or combining datasets' },
  { key: 'vulnerable', label: 'Vulnerable data subjects (employees, children, patients…)' },
  { key: 'innovative', label: 'Innovative use or new technology (AI usually counts)' },
  { key: 'blocking', label: 'Prevents people from exercising a right or using a service' },
];

export const OPTIONS = {
  users: [
    { key: 'customers', label: 'Customers or the public' },
    { key: 'employees', label: 'Employees' },
    { key: 'none', label: 'No direct users (back-office automation)' },
  ],
  aiType: [
    { key: 'genai', label: 'Generative AI (text, image, code)' },
    { key: 'predictive', label: 'Prediction, scoring or classification' },
    { key: 'optimisation', label: 'Optimisation or planning' },
    { key: 'vision', label: 'Computer vision or sensor analytics' },
    { key: 'document', label: 'Document processing / extraction' },
  ],
  sourcing: [
    { key: 'buy', label: 'Buy — vendor product or API, used as-is', role: 'Deployer' },
    { key: 'build', label: 'Build — developed or substantially modified in-house', role: 'Provider' },
  ],
  decision: [
    { key: 'none', label: 'No decisions about individuals' },
    { key: 'assist', label: 'Supports a human who decides about individuals' },
    { key: 'automated', label: 'Decides about individuals automatically, with legal or similarly significant effect' },
  ],
  driver: ['Revenue growth', 'Cost reduction', 'Risk & compliance', 'Customer experience', 'Employee productivity'],
  functions: ['Customer service', 'Sales & marketing', 'Operations', 'Field service', 'Finance', 'HR', 'Product', 'IT'],
};

// Scoring model — value and feasibility on 0–100.
export const SCORING = {
  // Annual benefit bands (EUR k) → points out of 40.
  benefitBands: [[0, 5], [100, 15], [250, 25], [500, 32], [1000, 37], [2500, 40]],
  value: { benefit: 0.40, alignment: 0.25, confidence: 0.20, speed: 0.15 },
  feasibility: { data: 0.30, tech: 0.20, skills: 0.15, integration: 0.20, change: 0.15 },
  threshold: 55, // quadrant split on both axes
};

export const TIERS = {
  prohibited: { label: 'Prohibited', short: 'Prohibited', order: 0 },
  high: { label: 'High-risk', short: 'High', order: 1 },
  limited: { label: 'Limited risk — transparency', short: 'Limited', order: 2 },
  minimal: { label: 'Minimal risk', short: 'Minimal', order: 3 },
};

export const PATHS = {
  stop: { label: 'Do not proceed', who: 'Rejected at intake — prohibited practice', sla: '—' },
  enhanced: { label: 'Enhanced review', who: 'AI governance board + Legal + DPO + CISO', sla: '20 working days' },
  standard: { label: 'Standard review', who: 'AI lead + DPO, business sponsor approves', sla: '10 working days' },
  fast: { label: 'Fast track', who: 'AI lead + business owner', sla: '3 working days' },
};
