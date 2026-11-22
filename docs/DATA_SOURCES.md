# Data Sources & Provenance: ScamShield BD

All data used in ScamShield BD adheres to Section 8 of the Specification: zero fake data, no made-up numbers or links, and full provenance records.

## 1. Official Advisories & Helplines
| Entity | Source URL | Verified Date | Data Used |
|---|---|---|---|
| bKash Anti-Fraud | https://www.bkash.com/en/customer-service/avoid-fraud | 2026-11-22 | Helpline 16247, PIN/OTP warning rules, lottery warning |
| Nagad Security | https://nagad.com.bd | 2026-11-22 | Helpline 16167, account verification rules |
| Rocket (DBBL) | https://www.dutchbanglabank.com/rocket/rocket.html | 2026-11-22 | Helpline 16216, official domain validation |
| Upay (UCB) | https://www.upaybd.com | 2026-11-22 | Helpline 16268, official domain validation |
| National Helpline | https://bangladesh.gov.bd | 2026-11-22 | Helpline 999 |

## 2. Sample Datasets
- `data/templates/scam_templates.csv`: Real scam SMS, WhatsApp, and call scripts collected from user inboxes and official advisory warnings, with personal data (real phone numbers, amounts, transaction IDs) redacted into tokens `<PHONE>`, `<AMOUNT>`, `<TXN_ID>`, `<CODE>`.
- `data/eval/eval_set.csv`: Real held-out evaluation dataset consisting of legitimate transaction confirmations and actual scam messages to rigorously benchmark accuracy and false positive rates.
