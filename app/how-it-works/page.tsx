import React from 'react';
import Link from 'next/link';
import evalResults from '../../docs/eval_results.json';

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

  const full = evalResults.configurations.C_full_pipeline;
  const rules = evalResults.configurations.A_rules_only;
  const urls = evalResults.configurations.B_rules_and_urls;

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-12">
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

      {/* Spec F2: Transparent Evaluation & Benchmark Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📊</span> সিস্টেম কতটা নির্ভরযোগ্য? (বাস্তব মূল্যায়ন বেঞ্চমার্ক)
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              মূল্যায়ন তারিখ: {evalResults.date}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            টেমপ্লেট বহির্ভূত {evalResults.sample_size}টি সম্পূর্ণ স্বতন্ত্র বাস্তব বাংলা বার্তার (held-out set) ওপর পরিচালিত বস্তুনিষ্ঠ মূল্যায়ন।
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Accuracy (যথার্থতা)</div>
            <div className="text-2xl font-black text-teal-400 mt-1">{(full.accuracy * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Precision</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{(full.precision * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              95% CI: {(full.precision_wilson_95[0] * 100).toFixed(0)}%–{(full.precision_wilson_95[1] * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400">Recall (শনাক্তকরণ)</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{(full.recall * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              95% CI: {(full.recall_wilson_95[0] * 100).toFixed(0)}%–{(full.recall_wilson_95[1] * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400">False Positive</div>
            <div className="text-2xl font-black text-slate-300 mt-1">{(full.fpr * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              95% CI: {(full.fpr_wilson_95[0] * 100).toFixed(0)}%–{(full.fpr_wilson_95[1] * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Ablation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3">পাইপলাইন কনফিগারেশন</th>
                <th className="py-2 px-2 text-center">Accuracy</th>
                <th className="py-2 px-2 text-center">Precision</th>
                <th className="py-2 px-2 text-center">Recall</th>
                <th className="py-2 pl-2 text-center">FPR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2.5 pr-3 font-medium text-slate-200">A: শুধুমাত্র রুল ইঞ্জিন (Rules Only)</td>
                <td className="py-2.5 px-2 text-center">{(rules.accuracy * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(rules.precision * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(rules.recall * 100).toFixed(0)}%</td>
                <td className="py-2.5 pl-2 text-center">{(rules.fpr * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-slate-200">B: রুল ইঞ্জিন + সেইফ ব্রাউজিং (Rules + URLs)</td>
                <td className="py-2.5 px-2 text-center">{(urls.accuracy * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(urls.precision * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(urls.recall * 100).toFixed(0)}%</td>
                <td className="py-2.5 pl-2 text-center">{(urls.fpr * 100).toFixed(0)}%</td>
              </tr>
              <tr className="bg-teal-950/20 text-teal-300 font-semibold">
                <td className="py-2.5 pr-3">C: পূর্ণ পাইপলাইন (Rules + URLs + Gemini AI)</td>
                <td className="py-2.5 px-2 text-center">{(full.accuracy * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(full.precision * 100).toFixed(0)}%</td>
                <td className="py-2.5 px-2 text-center">{(full.recall * 100).toFixed(0)}%</td>
                <td className="py-2.5 pl-2 text-center">{(full.fpr * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Honest Disclaimers */}
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 text-xs text-amber-200/90 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <span>ℹ️</span> সততা ও সীমাবদ্ধতা ডিসক্লেমার (Honesty Statement):
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
            <li>এই মূল্যায়নটি সংগৃহীত {evalResults.sample_size}টি বাস্তব বার্তার ওপর পরিচালিত হয়েছে; কোনো সিন্থেটিক বা কাল্পনিক ডেটা যোগ করা হয়নি।</li>
            <li>নমুনার আকার সীমিত হওয়ায় ৯৫% উইলসন কনফিডেন্স ইন্টারভাল (Wilson CI) স্পষ্ট উল্লেখ করা হয়েছে।</li>
            <li>নতুন ও অপ্রচলিত প্রতারণা পদ্ধতির ক্ষেত্রে ফলাফল ভিন্ন হতে পারে। ব্যবহারকারীর চূড়ান্ত সতর্কতা কাম্য।</li>
          </ul>
        </div>
      </section>

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
