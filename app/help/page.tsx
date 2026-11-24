'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import playbooksData from '@/config/emergency-playbooks.json';
import helplinesData from '@/config/helplines.json';

const brandDisplayNames: Record<string, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  upay: 'Upay',
  national_emergency: 'National Emergency Service',
};

export default function EmergencyHelpPage() {
  const [selectedSituation, setSelectedSituation] = useState<string>('otp_pin_shared');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // Client-side incident notes state (Never transmitted to any server)
  const [noteTime, setNoteTime] = useState('');
  const [noteAmount, setNoteAmount] = useState('');
  const [noteRecipient, setNoteRecipient] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const situation = playbooksData.situations.find((s) => s.id === selectedSituation) || playbooksData.situations[0];

  const handleToggleStep = (stepId: string) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleCopyNotes = () => {
    const text = `[ScamShield BD ঘটনার নোট]\nঘটনার সময়: ${noteTime || 'দেওয়া হয়নি'}\nটাকার পরিমাণ: ${noteAmount || 'দেওয়া হয়নি'}\nপ্রাপকের নম্বর/তথ্য: ${noteRecipient || 'দেওয়া হয়নি'}\nসংক্ষিপ্ত বিবরণ: ${noteDescription || 'দেওয়া হয়নি'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getHelplineNumber = (helplineId?: string) => {
    if (!helplineId) return null;
    const h = helplinesData.find((item) => item.id === helplineId);
    return h ? h.number : null;
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold">
          <span>🚨</span> জরুরি সহায়তা কেন্দ্র (Emergency Help)
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          আমি ইতিমধ্যে প্রতারিত হয়েছি
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          আতঙ্কিত হবেন না। ক্ষতি কমাতে এবং আপনার একাউন্ট সুরক্ষিত করতে নিচের অফিশিয়াল পদক্ষেপগুলো অবিলম্বে অনুসরণ করুন।
        </p>
      </div>

      {/* Mandatory Spoofing Warning Notice (Spec 6.2.4 & Appendix A) */}
      <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-5 space-y-2 text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-300">
          <span>⚠️</span> কলার আইডি স্পুফিং সতর্কতা
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-amber-200/90">
          ফোনে দেখানো নম্বর নকল হতে পারে। যে নম্বর থেকে কল এসেছে সেখানে ভুলেও পুনরায় কল করবেন না। অফিশিয়াল অ্যাপ, কার্ড বা ওয়েবসাইটে দেওয়া হেল্পলাইনে নিজে ডায়াল করে যোগাযোগ করুন।
        </p>
      </div>

      {/* Official Helplines (Matching User Screenshot Exactly, No 'যাচাইকৃত সোর্স') */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span className="text-pink-500">📞</span> অফিসিয়াল হেল্পলাইন নম্বরসমূহ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {helplinesData.map((item) => {
            const displayName = brandDisplayNames[item.id] || item.name_bn;

            return (
              <div
                key={item.number}
                className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-semibold text-white text-base">
                    {displayName}
                  </div>
                </div>
                <a
                  href={`tel:${item.number}`}
                  className="px-4 py-2 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 font-mono font-bold text-base hover:bg-teal-900/80 hover:text-teal-300 transition-colors shadow-sm cursor-pointer active:scale-95"
                  title={`${displayName} এ সরাসরি কল করুন (${item.number})`}
                >
                  {item.number}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Situation Selector Buttons (Spec 6.2.2: Min 44px height) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {playbooksData.situations.map((sit) => {
          const active = sit.id === selectedSituation;
          return (
            <button
              key={sit.id}
              onClick={() => setSelectedSituation(sit.id)}
              className={`min-h-[48px] p-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center text-center cursor-pointer ${
                active
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border-2 border-rose-500'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {sit.title_bn}
            </button>
          );
        })}
      </div>

      {/* Step by Step Ordered Checklist (Spec 6.2.3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span>📋</span> করণীয় চেকলিস্ট (যেগুলো করেছেন টিক দিন):
        </h2>

        <div className="space-y-3">
          {situation.steps.map((step, idx) => {
            const isDone = Boolean(checkedSteps[step.id]);
            const helplineNum = getHelplineNumber((step as any).helpline_id);

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-emerald-950/30 border-emerald-800/60 opacity-80'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    id={step.id}
                    checked={isDone}
                    onChange={() => handleToggleStep(step.id)}
                    className="mt-1 h-5 w-5 rounded border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor={step.id} className="cursor-pointer">
                    <span className="font-bold text-teal-400 mr-2">{idx + 1}.</span>
                    <span className={`text-sm text-slate-200 leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {step.text_bn}
                    </span>
                  </label>
                </div>

                {helplineNum && (
                  <a
                    href={`tel:${helplineNum}`}
                    className="self-start sm:self-center px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    <span>📞</span> কল করুন {helplineNum}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Client-side Incident Notes Box (Spec 6.2.5 & Appendix A) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>📝</span> ঘটনার নোট
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            (এটি শুধু আপনার ডিভাইসে থাকে, কোথাও পাঠানো হয় না। হেল্পলাইন বা থানায় বলার সুবিধার্থে লিখে রাখতে পারেন)
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">ঘটনার সময়:</label>
            <input
              type="text"
              value={noteTime}
              onChange={(e) => setNoteTime(e.target.value)}
              placeholder="যেমন: আজ দুপুর ২:১৫"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">কত টাকা:</label>
            <input
              type="text"
              value={noteAmount}
              onChange={(e) => setNoteAmount(e.target.value)}
              placeholder="যেমন: ৫,০০০ টাকা"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">যে নম্বরে পাঠানো হয়েছে:</label>
            <input
              type="text"
              value={noteRecipient}
              onChange={(e) => setNoteRecipient(e.target.value)}
              placeholder="যেমন: 017XXXXXXXX"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">কী ঘটেছিল (সংক্ষেপে):</label>
          <textarea
            value={noteDescription}
            onChange={(e) => setNoteDescription(e.target.value)}
            rows={2}
            placeholder="প্রতারক কী কথা বলে প্রতারণা করেছে..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
          />
        </div>

        <button
          onClick={handleCopyNotes}
          className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>📋</span> {copied ? 'নোট কপি হয়েছে!' : 'নোট কপি করুন'}
        </button>
      </div>

      {/* Footer Actions (Spec 6.2.6) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <Link
          href="/"
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          ← আবার যাচাই করুন
        </Link>
        <Link
          href="/report"
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-rose-300 bg-rose-950 border border-rose-800 hover:bg-rose-900 rounded-lg transition-colors"
        >
          প্রতারক নম্বরটি রিপোর্ট করুন 📢
        </Link>
      </div>
    </div>
  );
}
