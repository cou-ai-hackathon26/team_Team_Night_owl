# CoU AI Hackathon 2026 — Final Submission Details

## Project Title
ScamShield BD: A Bangla-First, AI-Powered Scam and Phishing Detector

## Short Description (Under 150 Words)
ScamShield BD empowers Bangladeshi mobile banking (bKash, Nagad, Rocket, Upay) and digital finance users to defend against financial fraud. When users paste a suspicious SMS, web link, or screenshot, the platform delivers instantaneous, clear Bangla risk ratings and actionable advice. Built as a defense-in-depth architecture rather than a simple prompt wrapper, it integrates 8 specialized layers: local Unicode normalization, entity extraction, privacy-first OTP/PIN masking, deterministic heuristic rules, SSRF-safe static lookalike URL analysis, Google Safe Browsing API, and Google Gemini AI reasoning with strict evidence-quote validation. A mathematically bounded fusion algorithm guarantees that LLM decisions can never override deterministic security triggers, eliminating prompt injection risks. Designed mobile-first for 3G/low-bandwidth devices, ScamShield BD protects vulnerable users with zero fake data and privacy by default.

## Links
- **GitHub Repository (Public):** https://github.com/rafsanul247/scamshield_bd
- **Live Deployment:** Deployed on Vercel
- **Author:** Rafsanul Rifat (Dhaka International University)
- **Team:** Team Night Owl

## AI Tools & Models Disclosure
- **Coding Assistants:** Antigravity (Google DeepMind)
- **LLM Reasoning & Vision OCR:** Google Gemini (Gemini 2.5 Flash / Flash Lite)
- **Embeddings:** Gemini Multilingual Embeddings (`gemini-embedding-001`)
- **Threat Intelligence:** Google Safe Browsing Lookup API (v4)
