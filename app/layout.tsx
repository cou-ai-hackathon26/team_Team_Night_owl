import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import Navbar from './components/Navbar';

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
    <html lang="bn" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) r.unregister();
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var k of keys) caches.delete(k);
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(){});
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white"
        suppressHydrationWarning
      >
        {/* Navigation Header with Active Route Highlighting */}
        <Navbar />

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
