# Method: how an AI use case is triaged

> Indicative and for illustration, not legal advice. Before relying on a classification, confirm it with your legal and data-protection functions. Application dates for the EU AI Act's high-risk obligations have been subject to legislative change, so check the current position.

## 1. Principles

1. **Proportionate.** Review effort follows risk. Most AI ideas are minimal risk and should move fast.
2. **Explainable.** Every classification cites the article that produced it, and every rule lives in one versioned file (`js/framework.js`).
3. **Value first.** No KPI, no go. Every approved use case has a baseline and a target.
4. **People decide.** The engine prepares the decision, and a named person records it with a rationale.
5. **Built to hand over.** Approved use cases flow into the portfolio, where delivery and value are tracked.

## 2. EU AI Act screening

The flow stops at the first match:

| Step | Question | Outcome |
|---|---|---|
| 1 | Does it use one of the eight **prohibited practices** in Art. 5(1)? | **Prohibited** → do not proceed |
| 2 | Is it a **safety component** of a product under EU harmonisation legislation (Annex I)? | **High-risk** (Art. 6(1)) |
| 3 | Is it used in an **Annex III area**: biometrics, critical infrastructure, education, employment, essential services (credit, insurance, benefits, emergency calls), law enforcement, migration, or justice and democracy? | **High-risk** (Art. 6(2)), unless an Art. 6(3) exception applies, which is never possible when the system profiles natural persons |
| 4 | Does it trigger a **transparency duty**: interaction with people, synthetic content, emotion recognition or biometric categorisation, deep fakes? | **Limited risk** (Art. 50). These duties also apply on top of high-risk, never instead of it. |
| 5 | None of the above | **Minimal risk**: baseline controls only |

**Provider or deployer?** Building or substantially modifying the system makes the organisation the *provider* (Art. 16: risk management, documentation, quality management system, conformity assessment). Buying and using it as intended makes it the *deployer* (Art. 26: use as instructed, human oversight, logs, informing people). A deployer becomes a provider if it substantially modifies the system or changes its intended purpose (Art. 25(1)). Deployers using credit or insurance scoring also need a fundamental rights impact assessment (Art. 27).

## 3. GDPR screening

- Personal data → lawful basis and record of processing (Art. 6, 30), data minimisation (Art. 5(1)(c), 25).
- Nine **EDPB criteria** (scoring or profiling, automated decisions, systematic monitoring, sensitive data, large scale, matching datasets, vulnerable people, innovative technology, blocking a right or service). **Two or more → DPIA required**, one → recommended.
- Solely automated decisions with legal or similarly significant effect → **Art. 22** safeguards: human intervention and the right to contest.

## 4. Value and feasibility

| Value (0–100) | Weight | | Feasibility (0–100) | Weight |
|---|---|---|---|---|
| Annual benefit (banded) | 40% | | Data readiness | 30% |
| Strategic alignment | 25% | | Technology maturity | 20% |
| Confidence in the benefit | 20% | | Skills available | 15% |
| Speed to value | 15% | | Integration complexity (inverted) | 20% |
| | | | Change impact (inverted) | 15% |

Both axes split at 55, giving four quadrants: **pursue now · invest to enable · quick experiment · park**. Priority is 60% value and 40% feasibility. Payback is cost divided by annual benefit.

## 5. Review routes

| Route | When | Who | Target |
|---|---|---|---|
| Fast track | Minimal risk, internal, no DPIA, no automated decisions | AI lead + business owner | 3 working days |
| Standard review | Transparency duty, DPIA required, customer-facing, automated decisions, or an Art. 6(3) exception | AI lead + DPO; business sponsor approves | 10 working days |
| Enhanced review | High-risk | AI governance board + Legal + DPO + CISO | 20 working days |
| Do not proceed | Prohibited practice | — | — |

## 6. Decision rules

- **Approve** only when every required control is in place.
- **Approve with conditions** when controls are still open. The conditions are recorded and travel with the use case.
- **Return** for missing information. **Reject** with a rationale.
- A prohibited practice can only be rejected. Enhanced review requires confirmation that Legal, the DPO and the CISO have reviewed the case.

## 7. Control library

Thirty controls in seven groups: baseline, value, transparency, high-risk (provider and deployer), data protection, supply chain and technology. Each has a condition under which it applies and references to the EU AI Act, ISO/IEC 42001 and, where relevant, GDPR, NIST AI RMF or OWASP. The full table is in the app under **Method & controls** and in `js/controls.js`.

## 8. Where this sits in the AI life cycle

```
Idea ─► AI USE-CASE INTAKE ─► approved with controls ─► AI PORTFOLIO OFFICE ─► value tracked, stage gates
         decide what to do                               govern delivery and prove the value
```
