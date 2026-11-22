# Architecture: ScamShield BD

## 1. System Overview
ScamShield BD is a Bangla-first, AI-powered scam and phishing detector designed for Bangladesh mobile financial services (bKash, Nagad, Rocket, Upay) and banking users.

```
User (Browser / Mobile UI - Next.js)
   │  HTTPS POST JSON / Form-Data
   ▼
Analysis Pipeline Engine (Server-side Next.js App Router / Node.js)
   │
   ├── 1. Normalization & Entity Extraction (Bangla digits to ASCII, URLs, Bangladesh phone numbers)
   ├── 2. Sensitive Data Masking (Local OTP / PIN / TrxID / Phone masking before any external API)
   ├── 3. Deterministic Rule Engine (Rules R01-R13, exact substrings, hard safety rules)
   ├── 4. Static URL Analysis & Google Safe Browsing Lookup (No SSRF, server never fetches target URL)
   ├── 5. Community Reputation Lookup (PostgreSQL reports count by distinct reporter hashes)
   ├── 6. Embedding Similarity (Gemini Embedding + pgvector cosine similarity)
   ├── 7. LLM Reasoning (Google Gemini with strict JSON schema & evidence quote validation)
   └── 8. Decision Fusion (Multi-layer risk level: low / medium / high, confidence score, Bengali advice)
   ▼
Neon PostgreSQL (pgvector)
```

## 2. Modules & Responsibilities
- `src/pipeline/normalize.ts`: Unicode NFC normalization, whitespace collapsing, Bangla digit conversion.
- `src/pipeline/entities.ts`: Phone extraction (+880 standard with libphonenumber-js) and WHATWG/tldts URL extraction.
- `src/pipeline/mask.ts`: Replaces phone numbers and 4-8 digit potential OTP/PIN codes with `<PHONE>` and `<CODE>`.
- `src/pipeline/rules.ts`: Deterministic heuristic rules with evidence quotes and hard triggers.
- `src/pipeline/urlAnalysis.ts`: Lookalike domain detection, homograph checks, brand misuse detection without external network fetch.
- `src/pipeline/safeBrowsing.ts`: Google Safe Browsing API v4 client with qualified wording and attribution.
- `src/pipeline/llm.ts`: Gemini structured output generator with strict prompt injection guardrails.
- `src/pipeline/fuse.ts`: Multi-layer signal fusion enforcing rule safety guarantees (LLM cannot override hard rule warnings).
