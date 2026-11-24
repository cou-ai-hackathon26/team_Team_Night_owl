# ScamShield BD: Evaluation & Benchmark Results
**তারিখ (Date):** 2026-11-23  
**নমুনার আকার (Sample Size):** 10 টি বাস্তব বার্তা (held-out)  
**মডেল (Models):** gemini-3.5-flash-lite  

## ১. হেডলাইন মেট্রিক্স (Headline Metrics - Configuration C: Full Pipeline)
- **Accuracy (যথার্থতা):** 100.0%
- **Precision:** 100.0% (95% CI: 56.6% - 100.0%)
- **Recall (শনাক্তকরণ হার):** 100.0% (95% CI: 56.6% - 100.0%)
- **False-Positive Rate:** 0.0% (95% CI: 0.0% - 43.4%)

## ২. কনফিগারেশন অ্যাবলেশন (Ablation Study)
| কনফিগারেশন | Accuracy | Precision | Recall | False Positive Rate |
|---|---|---|---|---|
| A (Rules only) | 90.0% | 100.0% | 80.0% | 0.0% |
| B (Rules + URLs) | 90.0% | 100.0% | 80.0% | 0.0% |
| C (Full Pipeline) | 100.0% | 100.0% | 100.0% | 0.0% |

## ৩. সীমাবদ্ধতা ও সততা ডিসক্লেমার (Honest Disclaimers)
- এই মূল্যায়নটি সংগৃহীত 10টি বাস্তব বার্তার ওপর পরিচালিত হয়েছে।
- কোনো সিন্থেটিক বা কাল্পনিক ডেটা যুক্ত করা হয়নি। নমুনার সংখ্যা সীমিত হওয়ায় ৯৫% উইলসন ইন্টারভাল উল্লেখ করা হয়েছে।
