'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnalysisResponse } from '@/src/pipeline/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'message' | 'url' | 'screenshot'>('message');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Screenshot Upload (P0.5 OCR Flow)
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/v1/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message_bn || 'স্ক্রিনশট থেকে লেখা পড়তে ব্যর্থ হয়েছে');
      }
      setExtractedOcrText(data.text);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'ত্রুটি ঘটেছে');
    } finally {
      setOcrLoading(false);
    }
  };

  // Run Scam Analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setErrorMsg(null);
    setResult(null);

    let textToSend = '';
    let urlToSend = '';

    if (activeTab === 'message') textToSend = inputText;
    if (activeTab === 'url') urlToSend = inputUrl;
    if (activeTab === 'screenshot') textToSend = extractedOcrText;

    if (!textToSend.trim() && !urlToSend.trim()) {
      setErrorMsg('অনুগ্রহ করে যাচাইয়ের জন্য কোনো বার্তা বা লিঙ্ক প্রদান করুন।');
      setAnalyzing(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend.trim() || undefined,
          url: urlToSend.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message_bn || 'বিশ্লেষণে ত্রুটি দেখা দিয়েছে');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'নেটওয়ার্ক বা সার্ভার ত্রুটি');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          বিকাশ • নগদ • রকেট • উপায় এবং ব্যাংক গ্রাহকদের জন্য
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          সন্দেহজনক মেসেজ বা লিংক <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            মুহূর্তেই যাচাই করুন
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-slate-300">
          প্রতারক চক্রের ফাঁদ থেকে বাঁচতে কোনো লিংকে ক্লিক করার বা টাকা পাঠানোর আগে যাচাই করে নিন।
        </p>
      </div>

      {/* Main Checker Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-3.5 px-4 text-center font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'message'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-900/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💬</span> বার্তা বা এসএমএস
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3.5 px-4 text-center font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'url'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-900/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔗</span> ওয়েবসাইট লিঙ্ক
          </button>
          <button
            onClick={() => setActiveTab('screenshot')}
            className={`flex-1 py-3.5 px-4 text-center font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'screenshot'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-900/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📷</span> স্ক্রিনশট আপলোড
          </button>
        </div>

        {/* Tab Inputs */}
        <div className="p-5 md:p-6 space-y-4">
          {activeTab === 'message' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                সন্দেহজনক মেসেজ বা চ্যাট এখানে পেস্ট করুন:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="উদাহরণ: প্রিয় গ্রাহক, আপনার বিকাশ একাউন্টটি বন্ধ হয়ে যাচ্ছে। চালু রাখতে এই নম্বরে কল দিন..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                সন্দেহজনক ওয়েব লিঙ্ক (URL) দিন:
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://bkash-bonus.xyz/claim অথবা suspicious-site.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {activeTab === 'screenshot' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                মেসেজ বা চ্যাটের স্ক্রিনশট আপলোড করুন (JPEG, PNG, WebP):
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-6 text-center bg-slate-950/50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleScreenshotUpload}
                  disabled={ocrLoading}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-500 file:text-slate-950 hover:file:bg-teal-400 cursor-pointer"
                />
                {ocrLoading && (
                  <p className="text-teal-400 text-sm mt-3 animate-pulse">
                    ছবি থেকে লেখা পড়া হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
                  </p>
                )}
              </div>

              {extractedOcrText && (
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-teal-400">
                      আমরা এটুকু পড়তে পেরেছি। ভুল থাকলে ঠিক করে নিন:
                    </span>
                  </div>
                  <textarea
                    value={extractedOcrText}
                    onChange={(e) => setExtractedOcrText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Privacy Warning Notice (Spec 10.8) */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs">
            <span className="text-base shrink-0">⚠️</span>
            <p>
              <strong>সতর্কতা:</strong> আপনার ব্যক্তিগত পিন (PIN), ওটিপি (OTP) বা পাসওয়ার্ড কখনো এখানে লিখবেন না। বিশ্লেষণকালে নম্বর ও কোড স্বয়ংক্রিয়ভাবে স্থানীয়ভাবে মাস্ক করা হয়।
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>পড়া হচ্ছে ও এআই মডেল যাচাই করছে...</span>
              </>
            ) : (
              <span>🔍 যাচাই করুন</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-900 rounded-lg text-rose-300 text-sm">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Result Section */}
      {result && (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Risk Level Banner */}
          <div
            className={`p-6 rounded-2xl border ${
              result.risk.level === 'high'
                ? 'bg-rose-950/40 border-rose-800 text-rose-100'
                : result.risk.level === 'medium'
                ? 'bg-amber-950/40 border-amber-800 text-amber-100'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {result.risk.level === 'high' ? '🚨' : result.risk.level === 'medium' ? '⚠️' : '✅'}
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    ঝুঁকির মাত্রা (Risk Level)
                  </div>
                  <h3 className="text-2xl font-bold">{result.summary_bn}</h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">ঝুঁকি সূচক</div>
                <div className="text-3xl font-black">{result.risk.score}/১০০</div>
              </div>
            </div>
          </div>

          {/* Degraded mode indicator if any */}
          {(result.degraded.llm || result.degraded.safe_browsing) && (
            <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>
                {result.degraded.llm
                  ? 'AI ব্যাখ্যা এখন পাওয়া যাচ্ছে না, সীমিত নিয়ম-ভিত্তিক যাচাই দেখানো হচ্ছে।'
                  : 'কিছু বাহ্যিক যাচাই পরিষেবা অনুপলব্ধ রয়েছে।'}
              </span>
            </div>
          )}

          {/* Detailed Evidence & Reasons */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Why Suspicious? */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>🔎</span> কেন সন্দেহজনক?
              </h4>
              {result.reasons_bn.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-300">
                  {result.reasons_bn.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-400 mt-1 shrink-0">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">কোনো সন্দেহজনক সংকেত পাওয়া যায়নি।</p>
              )}
            </div>

            {/* What to do next */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>🛡️</span> এখন কী করবেন? (পরামর্শ)
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {result.advice_bn.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-teal-400 mt-1 shrink-0">✓</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safe Browsing Attribution if applicable */}
          {result.attribution.google_safe_browsing && (
            <div className="text-xs text-slate-400 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <p>
                Advisory provided by Google. Google Safe Browsing-এর ডেটা দ্বারা পরিচালিত।
                সুরক্ষা ব্যবস্থা শতভাগ ত্রুটিহীন নয়, ফলস পজিটিভ বা নেগেটিভ হতে পারে।
              </p>
            </div>
          )}

          {/* Actions & Helplines Shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setResult(null);
                setInputText('');
                setInputUrl('');
                setExtractedOcrText('');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              অন্য মেসেজ যাচাই করুন
            </button>

            <Link
              href="/report"
              className="px-4 py-2 text-sm font-semibold text-rose-300 bg-rose-950/60 border border-rose-800 hover:bg-rose-900/60 rounded-lg transition-colors"
            >
              প্রতারক নম্বর বা লিঙ্ক রিপোর্ট করুন 📢
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
