'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sharedText, setSharedText] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Spec F4a: Extract text, url, or title
    const rawText =
      searchParams.get('text') ||
      searchParams.get('url') ||
      searchParams.get('title') ||
      '';

    // Sanitize: cap at 4,000 chars, strip control characters except newlines/tabs
    const clean = rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .slice(0, 4000)
      .trim();

    if (clean) {
      setSharedText(clean);
      setReady(true);
    } else {
      // If empty, cleanly redirect to home
      router.replace('/');
    }
  }, [searchParams, router]);

  const handleProceedToVerify = (forShopkeeper = false) => {
    if (!sharedText) return;
    // Route to home with prefill parameter; user must review and explicitly click submit
    const url = forShopkeeper
      ? `/?prefill=${encodeURIComponent(sharedText)}&shopkeeper=true`
      : `/?prefill=${encodeURIComponent(sharedText)}`;
    router.push(url);
  };

  if (!ready) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-sm">শেয়ারকৃত তথ্য প্রস্তুত হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <span className="text-3xl">📤</span>
        <h1 className="text-2xl font-bold text-white">শেয়ারকৃত মেসেজ পর্যালোচনা</h1>
        <p className="text-xs text-slate-400">
          আপনার ব্রাউজার বা অন্য অ্যাপ থেকে পাঠানো মেসেজটি নিচে দেখানো হলো। স্বয়ংক্রিয়ভাবে যাচাই করা হয়নি—অনুগ্রহ করে নিশ্চিত হয়ে বোতামে ক্লিক করুন।
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <label className="text-xs font-semibold text-slate-300">মেসেজের মূল পাঠ্য:</label>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {sharedText}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => handleProceedToVerify(false)}
            className="flex-1 py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer text-sm text-center shadow-md shadow-teal-500/20"
          >
            🛡️ সাধারণ যাচাই করুন
          </button>
          <button
            onClick={() => handleProceedToVerify(true)}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer text-sm text-center shadow-md shadow-amber-500/20"
          >
            🏪 দোকানদার মোডে যাচাই
          </button>
          <Link
            href="/"
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all text-sm text-center"
          >
            বাতিল
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400">
          <p className="text-sm">লোড হচ্ছে...</p>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
