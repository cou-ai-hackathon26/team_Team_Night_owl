'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReportDetail {
  category: string;
  short_message: string;
  reported_at: string;
}

interface SearchResult {
  found: boolean;
  value: string;
  kind: string;
  total_reports: number;
  status: string;
  reports: ReportDetail[];
  disclaimer_bn: string;
}

interface RecentReport {
  value: string;
  kind: string;
  category: string;
  short_message: string;
  report_count: number;
  reported_at: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  fake_reversal: 'ভুল টাকা পাঠানোর ভান',
  otp_phishing: 'ওটিপি বা পিন চাওয়া',
  account_suspension: 'একাউন্ট বন্ধের হুমকি',
  fake_bonus: 'ভুয়া বোনাস বা লটারি',
  general: 'সাধারণ প্রতারণা',
  other: 'অন্যান্য প্রতারণা',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch recent reports on initial load
  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const res = await fetch('/api/v1/lookup');
      const data = await res.json();
      if (data.recent_reports) {
        setRecentReports(data.recent_reports);
      }
    } catch (err) {
      console.error('Failed to load recent reports:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery !== undefined ? targetQuery : query;
    if (!q.trim()) return;

    setSearching(true);
    setSearched(true);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/v1/lookup?kind=phone&value=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-800 text-teal-400 text-xs font-semibold">
          <span>🔍</span> কমিউনিটি ডাটাবেজ অনুসন্ধান
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          প্রতারক নম্বর বা লিংক খুঁজুন
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          সাধারণ মানুষের দেওয়া রিপোর্ট থেকে জানুন কোনো নম্বর পূর্বে প্রতারণার কাজে ব্যবহৃত হয়েছে কি না এবং প্রতারকরা কী বার্তা পাঠাত।
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
              📱
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="বাংলা বা ইংরেজিতে নম্বর লিখুন (যেমন: ০১৭... বা 017...)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="py-3.5 px-8 rounded-xl font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {searching ? (
              <span>অনুসন্ধান হচ্ছে...</span>
            ) : (
              <span>খুঁজুন</span>
            )}
          </button>
        </form>
        <p className="text-[11px] text-slate-400">
          💡 বাংলা (০১৭...) বা ইংরেজি (017...) যেকোনোভাবে সার্চ করুন, সিস্টেম একই নম্বর হিসেবে খুঁজে বের করবে।
        </p>
      </div>

      {/* Search Results Display */}
      {searched && searchResult && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          {searchResult.found ? (
            <div className="bg-rose-950/30 border border-rose-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-900/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚨</span>
                    <h3 className="text-xl font-bold text-rose-300 font-mono flex items-center flex-wrap gap-2">
                      <span>{searchResult.value}</span>
                      {(searchResult as any).bangla_value && (searchResult as any).bangla_value !== searchResult.value && (
                        <span className="text-sm font-sans text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800">
                          বাংলা: {(searchResult as any).bangla_value}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-xs text-rose-400 mt-1">
                    এই নম্বরটি কমিউনিটি ডাটাবেজে প্রতারণামূলক হিসেবে রিপোর্ট করা হয়েছে।
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-700 text-rose-200 text-sm font-bold text-center">
                  মোট রিপোর্ট: {searchResult.total_reports} বার
                </div>
              </div>

              {/* Short messages and what scammers say */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  প্রতারক কী ধরণের কথা বা মেসেজ দিত (সংক্ষিপ্ত বিবরণ):
                </h4>
                <div className="grid gap-3">
                  {searchResult.reports.map((rep, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-medium">
                          {CATEGORY_NAMES[rep.category] || rep.category}
                        </span>
                        <span className="text-slate-500">
                          {new Date(rep.reported_at).toLocaleDateString('bn-BD')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 italic leading-relaxed">
                        "{rep.short_message}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <span className="text-3xl">🛡️</span>
              <h3 className="text-lg font-bold text-white">
                এখনো এই নম্বরের বিরুদ্ধে কোনো রিপোর্ট পাওয়া যায়নি
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                ডাটাবেজে না থাকার অর্থ এই নয় যে এটি শতভাগ নিরাপদ। কোনো সন্দেহজনক অনুরোধ পেলে সর্বদা অফিসিয়াল হেল্পলাইনে যাচাই করুন।
              </p>
              <div className="pt-2">
                <Link
                  href="/report"
                  className="inline-block px-4 py-2 text-xs font-semibold text-rose-400 border border-rose-900 rounded-lg bg-rose-950/40 hover:bg-rose-900/40"
                >
                  এই নম্বরটি প্রথম রিপোর্ট করুন 📢
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Reported Numbers Feed */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📢</span> সাম্প্রতিক রিপোর্টকৃত নম্বর ও মেসেজের ধরন
          </h2>
          <button
            onClick={fetchRecentReports}
            className="text-xs text-teal-400 hover:underline cursor-pointer"
          >
            রিফ্রেশ করুন ⟳
          </button>
        </div>

        {loadingRecent ? (
          <div className="text-center py-8 text-slate-500 text-sm animate-pulse">
            সাম্প্রতিক রিপোর্ট লোড হচ্ছে...
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {recentReports.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-rose-400 text-base">
                      {item.value}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
                      {item.report_count} বার রিপোর্ট
                    </span>
                  </div>

                  <div className="text-xs text-amber-400 font-medium">
                    ধরন: {CATEGORY_NAMES[item.category] || item.category}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                    "{item.short_message}"
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{new Date(item.reported_at).toLocaleDateString('bn-BD')}</span>
                  <button
                    onClick={() => {
                      setQuery(item.value);
                      handleSearch(item.value);
                    }}
                    className="text-teal-400 hover:underline font-medium cursor-pointer"
                  >
                    বিস্তারিত দেখুন →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
            এখনো কোনো পাবলিক রিপোর্ট জমা পড়েনি। নতুন রিপোর্ট জমা পড়লে এখানে সাথে সাথে প্রদর্শিত হবে।
          </div>
        )}
      </div>
    </div>
  );
}
