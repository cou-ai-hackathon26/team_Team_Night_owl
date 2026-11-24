# ScamShield BD 🛡️
> **বাংলা-ফার্স্ট, এআই-চালিত আর্থিক প্রতারণা ও ফিশিং শনাক্তকরণ প্ল্যাটফর্ম**  
> CoU AI Hackathon 2026 | Team Night Owl | Author: Rafsanul Rifat (Dhaka International University)

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=flat-square&logo=google)](https://ai.google.dev)

---

## ১. সমস্যা ও সমাধান
বাংলাদেশে বিকাশ, নগদ, রকেট এবং বিভিন্ন ব্যাংকের সাধারণ গ্রাহকদের টার্গেট করে প্রতিনিয়ত ওটিপি ফিশিং, একাউন্ট বন্ধের ভয় দেখিয়ে টাকা হাতিয়ে নেওয়া, এবং ভুল টাকা পাঠানোর ফাঁদ পাতা হচ্ছে। 

**ScamShield BD** সাধারণ মানুষকে একটি সহজ ইন্টারফেস প্রদান করে যেখানে যেকোনো সন্দেহজনক বার্তা, লিঙ্ক বা চ্যাটের স্ক্রিনশট দিলেই মুহূর্তের মধ্যে সহজ বাংলায় ঝুঁকির মাত্রা, কেন সন্দেহজনক তার বাস্তব প্রমাণ এবং করণীয় দিকনির্দেশনা জানিয়ে দেওয়া হয়।

---

## ২. এআই পাইপলাইন আর্কিটেকচার (৮টি স্তর)
ScamShield BD কোনো সাধারণ এলএলএম প্রম্পট র‍্যাপার নয়। এটি একটি সুনির্দিষ্ট মাল্টি-লেয়ার ডিফেন্স পাইপলাইন:
1. **Normalization:** বাংলা ডিজিট থেকে আসকি রূপান্তর, জিরো-উইডথ ফিল্টারিং।
2. **Local Entity Extraction:** `libphonenumber-js` ও `tldts` দিয়ে ফোন ও লিঙ্ক আলাদা করা।
3. **Privacy Masking:** কোনো এক্সটার্নাল এপিআইতে যাওয়ার আগেই ওটিপি, পিন ও ফোন নম্বর `<PHONE>` ও `<CODE>` দিয়ে লোকাল মেমোরিতে মাস্ক করা হয়।
4. **Deterministic Rule Engine:** R01 থেকে R13 পর্যন্ত প্রমাণিত প্রতারণা প্যাটার্ন শনাক্তকরণ।
5. **Static URL & Safe Browsing:** SSRF প্রতিরোধে সার্ভার নিজে লিঙ্ক ব্রাউজ করে না; স্ট্যাটিক লুকঅ্যালাইক ডোমেন ডিটেকশন ও Google Safe Browsing Lookup API দিয়ে সাইবার থ্রেট যাচাই হয়।
6. **Community Reputation:** পূর্বে রিপোর্ট করা প্রতারক নম্বরের তালিকা যাচাই।
7. **Gemini LLM Reasoning & Evidence Validator:** এআই-এর যৌক্তিক বিশ্লেষণ। এআই উদ্ধৃত প্রতিটি প্রমাণ মূল টেক্সটে আছে কি না তা কঠোরভাবে যাচাই করা হয়।
8. **Decision Fusion:** রুল ইঞ্জিন ও এআই-এর সিদ্ধান্ত সমন্বয় করে চূড়ান্ত রিস্ক লেভেল নির্ধারণ।

---

## ৩. প্রযুক্তি ও ব্যবহৃত এআই মডেল
- **Frontend & Backend API:** Next.js (App Router), TypeScript, Tailwind CSS
- **AI Models:** Google Gemini 3.5 Flash Lite (Reasoning & Vision OCR), Gemini Embedding
- **APIs & Tools:** Google Safe Browsing API v4, Zod, libphonenumber-js, tldts, Canvas API, Web SpeechSynthesis API
- **AI Coding Assistants Used:** Antigravity (Google DeepMind)
- **Database:** Neon PostgreSQL with pgvector

---

## ৪. নতুন সংযোজিত ফিচারসমূহ (Addendum Features F0–F6)
- **F0: ক্লায়েন্ট-সাইড রেড্যাকশন টুল ও ক্লেইমস গার্ড:** স্ক্রিনশট আপলোডের পূর্বে ব্যালেন্স, নাম বা গোপন পিন কালো কালি দিয়ে ক্লায়েন্টেই ঢেকে দেওয়ার ক্যানভাস ড্রয়িং টুল। কোনো সংবেদনশীল ডেটা সার্ভারে যায় না।
- **F1: জরুরি সহায়তা ও প্লেবুক (`/help`):** প্রতারিত হওয়ার পর তাৎক্ষণিক করণীয় (বিকাশ ১৬২৪৭, নগদ ১৬১৬৭, পুলিশ ৯৯৯ সরাসরি ডায়াল), কলার স্পুফিং সতর্কতা এবং ১-ক্লিকে জিডি (GD) নোট কপি।
- **F2: স্বচ্ছ ইভ্যালুয়েশন বেঞ্চমার্ক (`/how-it-works`):** ১০টি হেল্ড-আউট বার্তার ওপর Ablation Study (Rules vs Rules+URLs vs Full AI) এবং ৯৫% উইলসন কনফিডেন্স ইন্টারভালসহ সততামূলক ডিসক্লেমার।
- **F3: প্রমাণিত স্ক্যাম ক্যাটাগরি ট্যাক্সোনমি:** বিকাশ ও বাংলাদেশ ব্যাংকের অফিশিয়াল সতর্কবার্তার ভিত্তিতে সুনির্দিষ্ট শ্রেণিবিভাগ (`credential_theft`, `prize_bait`, `wrong_transfer_refund`, `impersonation`, ইত্যাদি)।
- **F4: পিডব্লিউএ শেয়ার টার্গেট ও বাংলা অডিও পাঠ:** যেকোনো মেসেঞ্জার বা ব্রাউজার থেকে সরাসরি ScamShield-এ শেয়ার (`/share`) এবং ফলাফলের সারসংক্ষেপ বাংলা অডিওতে শোনার সুবিধা।
- **F5: শেয়ারযোগ্য সতর্কবার্তা কার্ড:** সোশ্যাল মিডিয়া ও মেসেঞ্জারের জন্য ১০৮০x১০৮০ সাইজের তথ্যবহুল সতর্কতা ইমেজ কার্ড ডাউনলোড (কোনো ব্যক্তিগত বা সংবেদনশীল টেক্সট ছাড়া)।
- **F6: অ্যানোনিমাস ট্রেন্ডস ড্যাশবোর্ড (`/trends`):** কোনো ব্যক্তিগত বার্তা সংরক্ষণ ছাড়া কেবল সামগ্রিক স্ক্যাম ক্যাটাগরি ও ব্র্যান্ডের প্রবণতা প্রদর্শন।

---

## ৫. নিরাপত্তা ও আইনগত ডিসক্লেমার
- **Safe Browsing Attribution:** Advisory provided by Google.
- **সুরক্ষা নিশ্চয়তা:** এটি একটি সহায়তামূলক এআই টুল। এর ফলাফল শতভাগ নিখুঁত নিশ্চয়তা নয়। টাকা পাঠানো বা সংবেদনশীল তথ্য দেওয়ার পূর্বে অফিসিয়াল হেল্পলাইনে যোগাযোগ করুন।

---

## ৫. লোকাল সেটআপ
```bash
# ডিপেন্ডেন্সি ইনস্টল
npm install

# এনভায়রনমেন্ট কনফিগারেশন (.env.example দেখে .env তৈরি করুন)
cp .env.example .env

# ডেভেলপমেন্ট সার্ভার রান
npm run dev
```
ব্রাউজারে খুলুন: `http://localhost:3000`

## Live Host : `https://scamshield-bd.vercel.app/`
