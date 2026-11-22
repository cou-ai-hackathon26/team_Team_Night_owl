import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">গোপনীয়তা ও ডেটা পলিসি</h1>
        <p className="text-slate-400 text-sm">
          ScamShield BD ব্যবহারকারীর গোপনীয়তা রক্ষায় সর্বোচ্চ প্রতিশ্রুতিবদ্ধ।
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-white text-base">১. কোনো ব্যক্তিগত তথ্য সংরক্ষণ নয়</h2>
          <p>
            সাধারণভাবে যাচাইয়ের সময় আপনার দেওয়া কোনো বার্তা, এসএমএস, ফোন নম্বর, লিঙ্ক বা আপলোড করা ছবি আমাদের ডাটাবেজে বা সার্ভারের ডিস্কে স্থায়ীভাবে সংরক্ষণ করা হয় না।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-white text-base">২. লোকাল মাস্কিং ও এআই প্রসেসিং</h2>
          <p>
            যেকোনো বহিরাগত এআই সেবায় পাঠানোর পূর্বে স্বয়ংক্রিয়ভাবে লোকাল সার্ভারেই ফোন নম্বর ও ওটিপি/পিন জাতীয় সংখ্যাসমূহ মাস্ক করা হয়।
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-white text-base">৩. কমিউনিটি রিপোর্ট ও অপসারণ (Takedown) অনুরোধ</h2>
          <p>
            ব্যবহারকারীরা কেবল স্পষ্ট সম্মতি প্রদান করলেই প্রতারক নম্বর বা লিঙ্কের রেকর্ড সংরক্ষিত হয়। কোনো তথ্যে আপত্তি বা ভুল রিপোর্ট বাতিলের অনুরোধের জন্য সরাসরি ইমেইল করতে পারেন:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-teal-400 font-mono text-sm inline-block">
            rafsan.cse.47@gmail.com
          </div>
        </section>
      </div>
    </div>
  );
}
