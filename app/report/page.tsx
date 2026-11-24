'use client';

import React, { useState } from 'react';

export default function ReportPage() {
  const [kind, setKind] = useState<'phone' | 'url'>('phone');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('fake_reversal');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setStatusMsg({ type: 'error', text: 'সম্মতি চেকবক্সে টিক দেওয়া বাধ্যতামূলক।' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          value: value.trim(),
          category,
          note: note.trim() || undefined,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message_bn || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে');
      }

      setStatusMsg({
        type: 'success',
        text: 'আপনার রিপোর্টটি সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ!',
      });
      setValue('');
      setNote('');
      setConsent(false);
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'ত্রুটি ঘটেছে',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">প্রতারক নম্বর বা লিঙ্ক রিপোর্ট করুন</h1>
        <p className="text-slate-400 text-sm">
          আপনার সচেতন রিপোর্ট অন্যদের প্রতারণার শিকার হওয়া থেকে রক্ষা করতে সাহায্য করবে।
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            রিপোর্টের ধরণ:
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="kind"
                checked={kind === 'phone'}
                onChange={() => setKind('phone')}
                className="text-teal-500 focus:ring-teal-500"
              />
              <span>ফোন নম্বর</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="kind"
                checked={kind === 'url'}
                onChange={() => setKind('url')}
                className="text-teal-500 focus:ring-teal-500"
              />
              <span>ওয়েব লিঙ্ক (URL)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {kind === 'phone' ? 'প্রতারক ফোন নম্বর:' : 'সন্দেহজনক লিঙ্ক:'}
          </label>
          <input
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === 'phone' ? '০১৭... বা 01XXXXXXXXX' : 'https://suspicious-site.com'}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {kind === 'phone' && (
            <p className="text-[11px] text-teal-400/90 mt-1.5 flex items-center gap-1">
              <span>💡</span> বাংলা (০১৭...) বা ইংরেজি (017...) যেকোনো হরফেই নম্বর লিখতে পারেন।
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            প্রতারণার ধরণ:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="fake_reversal">ভুল টাকা পাঠানোর ভান করা</option>
            <option value="otp_phishing">ওটিপি বা পিন চাওয়া</option>
            <option value="account_suspension">একাউন্ট বন্ধের হুমকি</option>
            <option value="fake_bonus">ভুয়া বোনাস বা লটারির ফাঁদ</option>
            <option value="other">অন্যান্য</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            সংক্ষিপ্ত বিবরণ (ঐচ্ছিক):
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="প্রতারক কী বলেছিল বা কিভাবে ফাঁদে ফেলার চেষ্টা করেছিল..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Mandatory Consent Checkbox (Spec 4.1 rule 5 & 10) */}
        <div className="flex items-start gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
          />
          <label htmlFor="consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
            আমি নিশ্চিত করছি যে এই তথ্যটি সত্যি এবং জনস্বার্থে প্রতারণা প্রতিরোধের উদ্দেশ্যে জমা দেওয়া হচ্ছে। কোনো ব্যক্তিগত সংবেদনশীল তথ্য নেই।
          </label>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-sm ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-800 text-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'জমা দেওয়া হচ্ছে...' : 'রিপোর্ট জমা দিন'}
        </button>
      </form>
    </div>
  );
}
