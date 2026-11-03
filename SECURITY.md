# Security

## Design

- **Static site, no backend.** The register and app state live only in the viewer's browser (`localStorage`). Nothing is sent anywhere unless the viewer chooses to use the optional AI pre-fill.
- **Content-Security-Policy.** Scripts load only from this site. The only allowed network destination is `api.anthropic.com`.
- **Output encoding.** All dynamic text is HTML-escaped before rendering.
- **Input validation.** Imports are size-limited and validated. Model output is constrained by a strict JSON schema and re-validated against the allowed values before use.
- **Data minimisation.** Emails, phone numbers and IBANs are redacted from the idea text before any model call, and the owner's name is never sent.
- **API key handling.** The viewer's Anthropic key is kept in `sessionStorage` for the current tab only. It is never logged or persisted.
- **Prompt injection.** The idea text is treated as untrusted data. The model has no tools and cannot set the risk tier, which is always computed by the rules engine.

## Reporting a vulnerability

Please open a private security advisory on this repository (Security → Advisories → Report a vulnerability) rather than a public issue.
