import React from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '১',
      title: 'ইউজার ইনপুট ও নরমালাইজেশন',
      desc: 'বাংলা ও ইংরেজি ডিজিট রূপান্তর (০-৯ থেকে 0-9), জিরো-উইডথ স্পেস দূরীকরণ এবং ইউনিকোড এনএফসি (NFC) ফরম্যাট তৈরি।',
    },
    {
      num: '২',
      title: 'এনটিটি এক্সট্রাকশন (লোকাল ও অফলাইন)',
      desc: 'বার্তা থেকে ফোন নম্বর (libphonenumber-js দিয়ে +880 ফরম্যাট) এবং সমস্ত ওয়েব লিঙ্ক (URL) আলাদা করা।',
    },
    {
      num: '৩',
      title: 'সংবেদনশীল ডেটা মাস্কিং (Privacy Guard)',
      desc: 'কোনো এআই বা ক্লাউড সার্ভিসে পাঠানোর পূর্বেই ফোন নম্বর ও ওটিপি/পিন কোড স্বয়ংক্রিয়ভাবে <PHONE> এবং <CODE> দ্বারা প্রতিস্থাপন।',
    },
    {
      num: '৪',
      title: 'ডিটারমিনিস্টিক রুল ইঞ্জিন (Rules R01 - R13)',
      desc: 'বিকাশ ও বাংলাদেশ ব্যাংকের অফিশিয়াল নির্দেশনার ভিত্তিতে পিন/ওটিপি চাওয়া, জরুরি ভয় দেখানো, লটারি বা ভুল টাকা পাঠানোর মতো প্রমাণিত স্ক্যাম প্যাটার্ন যাচাই।',
    },
    {
      num: '৫',
      title: 'স্ট্যাটিক লিঙ্ক ও Google Safe Browsing যাচাই',
      desc: 'সার্ভার কখনো অপরিচিত লিংকে ব্রাউজ বা ফেচ করে না (SSRF প্রতিরোধ)। লিঙ্কগুলোর লুকঅ্যালাইক ডোমেইন এবং গুগলের সেফ ব্রাউজিং ডেটাবেজে অনুসন্ধান চালানো হয়।',
    },
    {
      num: '৬',
      title: 'কমিউনিটি রিপোর্ট ও সিমিলারিটি লুকআপ',
      desc: 'সংগৃহীত প্রতারণার ডেটাবেজ ও ব্যবহারকারীদের পূর্বে দেওয়া রিপোর্ট সমূহের সাথে মিল দেখা।',
    },
    {
      num: '৭',
      title: 'Google Gemini এআই রিজনিং ও এভিডেন্স চেক',
      desc: 'প্রম্পট ইনজেকশন প্রতিরোধসহ মাস্কড বার্তার উপর এআই যৌক্তিক বিশ্লেষণ। এআই এর তৈরি প্রতিটি প্রমাণ মূল বার্তার মধ্যে হুবহু আছে কি না তা অ্যালগরিদম দ্বারা নিশ্চিত করা হয়।',
    },
    {
      num: '৮',
      title: 'ডিসিশন ফিউশন ও বাংলায় পরামর্শ',
      desc: 'রুল ইঞ্জিনের হার্ড সিকিউরিটি এবং এআই সিদ্ধান্তের সমন্বয়ে চূড়ান্ত ঝুঁকির মাত্রা (Low / Medium / High) এবং করণীয় পদক্ষেপ নির্ধারণ।',
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">কিভাবে কাজ করে ScamShield BD</h1>
        <p className="text-slate-400 text-sm">
          একটিমাত্র এআই প্রম্পট নয়, বরং ৮টি স্তরের মাল্টি-লেয়ার সিকিউরিটি পাইপলাইনের মাধ্যমে প্রতারণা চিহ্নিত হয়।
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.num} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-4 items-start">
            <span className="w-8 h-8 rounded-full bg-teal-950 border border-teal-700 text-teal-400 font-bold flex items-center justify-center shrink-0">
              {s.num}
            </span>
            <div>
              <h3 className="font-bold text-white text-base">{s.title}</h3>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl text-center space-y-3">
        <p className="text-sm text-slate-300">
          প্রতারণা থেকে আপনার পরিবার ও স্বজনদের নিরাপদ রাখতে সহায়তা করুন।
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
          মেসেজ যাচাই করতে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
