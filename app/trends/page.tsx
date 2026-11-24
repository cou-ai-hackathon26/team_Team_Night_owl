'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TrendData {
  window_days: number;
  total_analyses: number;
  risk_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  scam_types: Array<{
    id: string;
    label_bn: string;
    count: number;
    percentage: number;
  }>;
  brands: Array<{
    brand: string;
    count: number;
    percentage: number;
  }>;
  community_reports: number;
  caveat: string;
}

export default function TrendsPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/v1/stats/trends?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে');
        return res.json();
      })
      .then((json: TrendData) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'সার্ভার সংযোগে ত্রুটি');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [days]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>📈</span> প্রতারণা প্রবণতা ও পরিসংখ্যান
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ScamShield BD পাইপলাইনে বিশ্লেষিত সাম্প্রতিক স্ক্যামের ধরণ ও লক্ষ্যবস্তু
          </p>
        </div>

        {/* 7d vs 30d Toggle */}
        <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setDays(7)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              days === 7
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            গত ৭ দিন
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              days === 30
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            গত ৩০ দিন
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">সর্বশেষ পরিসংখ্যান লোড হচ্ছে...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-950/40 border border-red-900 rounded-xl text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">মোট বার্তা বিশ্লেষণ</span>
              <div className="text-3xl font-black text-white mt-1">
                {data.total_analyses.toLocaleString('bn-BD')}
              </div>
              <span className="text-[11px] text-slate-500">গত {days} দিনে প্রক্রিয়াকৃত</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-rose-400 font-medium">উচ্চ ঝুঁকির স্ক্যাম</span>
              <div className="text-3xl font-black text-rose-400 mt-1">
                {data.risk_breakdown.high.toLocaleString('bn-BD')}
              </div>
              <span className="text-[11px] text-slate-500">
                মোটের {data.total_analyses > 0 ? Math.round((data.risk_breakdown.high / data.total_analyses) * 100) : 0}%
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-cyan-400 font-medium">কমিউনিটি রিপোর্ট</span>
              <div className="text-3xl font-black text-cyan-400 mt-1">
                {data.community_reports.toLocaleString('bn-BD')}
              </div>
              <span className="text-[11px] text-slate-500">ব্যবহারকারীদের জমাকৃত তথ্য</span>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Scam Types */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🎯</span> শীর্ষ প্রতারণার ধরণ (Top Scam Types)
              </h3>

              {data.scam_types.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  গত {days} দিনে পর্যাপ্ত ডেটা সংগৃহীত হয়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {data.scam_types.map((st) => (
                    <div key={st.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200">{st.label_bn}</span>
                        <span className="text-slate-400">{st.count} বার ({st.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(st.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Targeted Brands */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏢</span> টার্গেটকৃত ব্র্যান্ড ও প্রতিষ্ঠান
              </h3>

              {data.brands.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  গত {days} দিনে ব্র্যান্ডের কোনো তথ্য পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {data.brands.map((b) => (
                    <div key={b.brand} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200 font-semibold">{b.brand}</span>
                        <span className="text-slate-400">{b.count} বার ({b.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(b.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Appendix A Caveat */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>ℹ️</span> পরিসংখ্যান সংক্রান্ত সততা ডিসক্লেমার:
            </div>
            <p className="leading-relaxed">
              {data.caveat}
            </p>
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md"
            >
              <span>🔍</span> সন্দেহজনক মেসেজ যাচাই করুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
