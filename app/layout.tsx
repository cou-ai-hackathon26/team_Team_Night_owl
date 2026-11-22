import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScamShield BD | এআই ভিত্তিক প্রতারণা ও ফিশিং সতর্কবার্তা',
  description: 'বিকাশ, নগদ, রকেট ও ব্যাংকিং গ্রাহকদের জন্য বাংলা-ফার্স্ট এআই প্রতারণা ও ফিশিং সনাক্তকরণ প্ল্যাটফর্ম।',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
        {/* Navigation Header */}
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

            <nav className="flex items-center gap-3 md:gap-5 text-sm font-medium">
              <Link href="/" className="hover:text-teal-400 transition-colors hidden sm:inline">
                যাচাই
              </Link>
              <Link href="/search" className="hover:text-teal-40 transition-colors flex items-center gap-1">
                নম্বর সার্চ
              </Link>
              <Link href="/how-it-works" className="hover:text-teal-400 transition-colors hidden md:inline">
                কিভাবে কাজ করে
              </Link>
              <Link href="/safety" className="hover:text-teal-400 transition-colors hidden sm:inline">
                হেল্পলাইন
              </Link>
              <Link href="/report" className="px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all shadow-sm">
                রিপোর্ট করুন
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 py-8 text-center text-xs text-slate-400">
          <div className="max-w-5xl mx-auto px-4 space-y-3">
            <p className="text-slate-300">
              ScamShield BD — টিম নাইট আউল (CoU AI Hackathon 2026).
            </p>
            <p className="max-w-2xl mx-auto text-slate-500 text-[11px] leading-relaxed">
              সতর্কতা: এটি একটি এআই-সহায়ক নিরাপত্তা টুল। এর ফলাফল শতভাগ নিখুঁত নিশ্চয়তা নয়। সন্দেহজনক কোনো আর্থিক লেনদেনের পূর্বে সরাসরি অফিসিয়াল হেল্পলাইনে (১৬২৪৭ / ১৬১৬৭) যোগাযোগ করুন।
            </p>
            <div className="flex justify-center gap-4 text-slate-400 pt-2">
              <Link href="/search" className="hover:text-teal-400 underline underline-offset-2">
                রিপোর্টেড নম্বর ডাটাবেজ
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-teal-400 underline underline-offset-2">
                গোপনীয়তা ও যোগাযোগ
              </Link>
              <span>•</span>
              <Link href="/how-it-works" className="hover:text-teal-400 underline underline-offset-2">
                পাইপলাইন আর্কিটেকচার
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
