# Decision Log: ScamShield BD

## 2026-11-22: Project Architecture & Pipeline Design
- **Decision:** Use Next.js 15+ App Router with TypeScript on Vercel for both the responsive Bangla UI and the API endpoints (`/api/v1/analyze`, `/api/v1/extract`, `/api/v1/reports`, `/api/v1/lookup`, `/api/v1/stats`, `/healthz`, `/readyz`).
- **Reason:** Simplifies deployment, minimizes cold-start delays compared to spinning up separate idle containers, meets hackathon time constraints while maintaining full TypeScript strictness and modularity.
- **Alternatives considered:** Standalone Express server on Render (dropped due to free-tier sleep/spin-up latency during live judging).

## 2026-11-22: Real AI & Data Provenance Policy
- **Decision:** Zero synthetic data in database seeds or metrics. Redacted real samples used for templates and evaluation sets.
- **Reason:** Strict compliance with Hackathon rules Section 1.3 & Section 8.2.

## 2026-11-22: Privacy & Security Guardrails
- **Decision:** Sensitive digits (OTP, PIN, transaction IDs) masked locally *before* any request touches an external LLM or vector service.
- **Decision:** Strict SSRF ban: the server will never fetch or resolve suspicious URLs provided by users. Only static syntactic analysis and official Safe Browsing lookups are performed.
