'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname() || '/';

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname.startsWith('/search');
  const isTrendsActive = pathname.startsWith('/trends');
  const isHelpActive = pathname.startsWith('/help');
  const isHowItWorksActive = pathname.startsWith('/how-it-works');
  const isReportActive = pathname.startsWith('/report');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-teal-500/20">
            🛡️
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              ScamShield <span className="text-teal-400 text-sm font-semibold px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800/50">BD</span>
            </span>
            <span className="text-[11px] text-slate-400 -mt-1">প্রতারণা প্রতিরোধী এআই ঢাল</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium">
          {/* যাচাই (Home) */}
          <Link
            href="/"
            className={`transition-all px-2.5 py-1 rounded-lg ${
              isHomeActive
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/50 shadow-sm'
                : 'text-slate-300 hover:text-teal-300 hover:bg-slate-900/60'
            }`}
          >
            যাচাই
          </Link>

          {/* নম্বর সার্চ */}
          <Link
            href="/search"
            className={`transition-all px-2.5 py-1 rounded-lg flex items-center gap-1 ${
              isSearchActive
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/50 shadow-sm'
                : 'text-slate-300 hover:text-teal-300 hover:bg-slate-900/60'
            }`}
          >
            <span>নম্বর সার্চ</span>
          </Link>

          {/* পরিসংখ্যান */}
          <Link
            href="/trends"
            className={`hidden sm:inline transition-all px-2.5 py-1 rounded-lg ${
              isTrendsActive
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/50 shadow-sm'
                : 'text-slate-300 hover:text-teal-300 hover:bg-slate-900/60'
            }`}
          >
            পরিসংখ্যান
          </Link>

          {/* জরুরি সহায়তা */}
          <Link
            href="/help"
            className={`font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
              isHelpActive
                ? 'bg-rose-900/80 text-rose-100 border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
                : 'text-rose-400 hover:text-rose-300 bg-rose-950/40 border-rose-900/50 hover:bg-rose-950/70'
            }`}
          >
            <span>🚨</span>
            <span className="hidden sm:inline">জরুরি সহায়তা</span>
            <span className="sm:hidden">সহায়তা</span>
          </Link>

          {/* কিভাবে কাজ করে */}
          <Link
            href="/how-it-works"
            className={`hidden md:inline transition-all px-2.5 py-1 rounded-lg ${
              isHowItWorksActive
                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/50 shadow-sm'
                : 'text-slate-300 hover:text-teal-300 hover:bg-slate-900/60'
            }`}
          >
            কিভাবে কাজ করে
          </Link>

          {/* রিপোর্ট */}
          <Link
            href="/report"
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
              isReportActive
                ? 'bg-teal-400 text-slate-950 ring-2 ring-teal-300 shadow-md'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
            }`}
          >
            রিপোর্ট
          </Link>
        </nav>
      </div>
    </header>
  );
}
