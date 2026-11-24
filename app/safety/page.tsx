import React from 'react';
import helplinesList from '@/src/config/helplines.json';

export default function SafetyPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">জরুরি হেল্পলাইন ও নিরাপত্তা টিপস</h1>
        <p className="text-slate-400 text-sm">
          অফিসিয়াল প্রতিষ্ঠান থেকে যাচাইকৃত হেল্পলাইন ও আর্থিক সুরক্ষা নির্দেশনা।
        </p>
      </div>

      {/* Critical Spoofing Alert */}
      <div className="bg-rose-950/40 border border-rose-800 p-5 rounded-2xl text-rose-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-base text-rose-300">
          <span>⚠️</span> কলার আইডি স্পুফিং (Spoofing) থেকে সাবধান!
        </div>
        <p className="text-sm leading-relaxed">
          প্রতারকরা বিশেষ সফটওয়্যার দিয়ে অফিশিয়াল হেল্পলাইন নম্বর (যেমন বিকাশ ১৬২৪৭) নকল করে আপনাকে কল করতে পারে। কলারের নম্বর দেখে কখনোই বিশ্বাস করবেন না। সন্দেহজনক কথা শুনলে সাথে সাথে কল কেটে দিন এবং নিজে ডায়াল করে হেল্পলাইনে যোগাযোগ করুন।
        </p>
      </div>

      {/* Verified Helplines */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span>📞</span> অফিসিয়াল হেল্পলাইন নম্বরসমূহ
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {helplinesList.map((item) => (
            <div key={item.number} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-semibold text-white text-sm">{item.name_bn}</div>
              </div>
              <a
                href={`tel:${item.number}`}
                className="px-3.5 py-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 font-mono font-bold text-base hover:bg-teal-900/80 transition-colors"
              >
                {item.number}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span>💡</span> আর্থিক প্রতারণা এড়ানোর মূল নিয়ম
        </h2>
        <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-teal-400 font-bold shrink-0">১.</span>
            <span><strong>পিন ও ওটিপি কখনোই কাউকে দেবেন না:</strong> বিকাশ, নগদ বা ব্যাংকের কোনো কর্মকর্তা কখনোই আপনার পিন বা গোপন কোড জানতে চাইবেন না।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 font-bold shrink-0">২.</span>
            <span><strong>ভুল টাকা পাঠানোর ফাঁদ:</strong> কেউ কল করে ভুল করে টাকা গেছে দাবি করলে আগে নিজের একাউন্ট ব্যালেন্স চেক করুন, শুধু এসএমএস দেখে সিদ্ধান্ত নেবেন না।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 font-bold shrink-0">৩.</span>
            <span><strong>অপরিচিত লিংকে ক্লিক নয়:</strong> বোনাস, ক্যাশব্যাক বা লটারির লোভ দেখিয়ে পাঠানো কোনো লিংকে প্রবেশ করে গোপন পিন বা এনআইডি প্রদান করবেন না।</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
