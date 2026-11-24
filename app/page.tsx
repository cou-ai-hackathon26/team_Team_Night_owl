'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AnalysisResponse } from '@/src/pipeline/types';
import { screenToImageCoords, normalizeRect } from '@/src/lib/redactMath';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'message' | 'url' | 'screenshot'>('message');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  // Screenshot and Redaction state (Spec F0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [redactBoxes, setRedactBoxes] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  // Analysis state
  const [isShopkeeper, setIsShopkeeper] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // TTS state (Spec F4b)
  const [hasBanglaVoice, setHasBanglaVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Detect Bangla voice for Browser SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const checkVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const bnVoice = voices.some((v) => v.lang.toLowerCase().startsWith('bn'));
        setHasBanglaVoice(bnVoice);
      };

      checkVoice();
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }
  }, []);

  // Handle URL prefill (Spec F4a & Shopkeeper)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('prefill') || params.get('text');
      if (prefill) {
        setInputText(prefill.slice(0, 4000));
        setActiveTab('message');
      }
      if (params.get('shopkeeper') === 'true') {
        setIsShopkeeper(true);
      }
    }
  }, []);

  // Handle TTS Play/Stop
  const handleToggleSpeech = () => {
    if (!result || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `${result.summary_bn}। ${result.advice_bn.slice(0, 2).join('। ')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn'));
      if (bnVoice) utterance.voice = bnVoice;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Image Selection Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRedactBoxes([]);
    setCurrentBox(null);
    setExtractedOcrText('');
    setErrorMsg(null);

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageObjRef.current = img;
      redrawCanvas([], null);
    };
  };

  // Redraw Canvas with Black Redaction Rectangles
  const redrawCanvas = (
    boxes: Array<{ x: number; y: number; width: number; height: number }>,
    previewBox: { x: number; y: number; width: number; height: number } | null
  ) => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    // Draw saved black boxes
    ctx.fillStyle = '#000000';
    for (const b of boxes) {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Draw currently active box
    if (previewBox) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(previewBox.x, previewBox.y, previewBox.width, previewBox.height);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(previewBox.x, previewBox.y, previewBox.width, previewBox.height);
    }
  };

  // Canvas Mouse/Touch Events for Drag-to-Redact
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const imgCoord = screenToImageCoords(screenX, screenY, rect.width, rect.height, img.naturalWidth, img.naturalHeight);
    setStartPos(imgCoord);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const currentImgCoord = screenToImageCoords(screenX, screenY, rect.width, rect.height, img.naturalWidth, img.naturalHeight);
    const box = normalizeRect(startPos.x, startPos.y, currentImgCoord.x, currentImgCoord.y);
    setCurrentBox(box);
    redrawCanvas(redactBoxes, box);
  };

  const handlePointerUp = () => {
    if (isDrawing && currentBox && currentBox.width > 5 && currentBox.height > 5) {
      const updated = [...redactBoxes, currentBox];
      setRedactBoxes(updated);
      redrawCanvas(updated, null);
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  // Process Screenshot (Upload redacted canvas blob)
  const handleUploadScreenshot = async () => {
    if (!canvasRef.current || !selectedFile) return;

    setOcrLoading(true);
    setErrorMsg(null);

    // Export canvas to blob (Spec 5.2.1: strips EXIF & ensures blacked-out areas)
    canvasRef.current.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorMsg('ছবি প্রস্তুত করতে সমস্যা হয়েছে।');
          setOcrLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'screenshot.jpg');

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
      },
      'image/jpeg',
      0.9
    );
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
          is_shopkeeper: isShopkeeper,
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

  // Share Text / Warning Card (Spec F5)
  const handleShareCard = async () => {
    if (!result) return;
    const shareText = `⚠️ ScamShield BD সতর্কবার্তা:\nঝুঁকি: ${result.summary_bn}\n${result.advice_bn[0] || ''}\nনিজে যাচাই করুন: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ScamShield BD সতর্কবার্তা',
          text: shareText,
          url: window.location.origin,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('সতর্কবার্তা টেক্সট কপি করা হয়েছে! পরিবার বা মেসেঞ্জারে পেস্ট করে শেয়ার করুন।');
    }
  };

  // Generate & Download 1080x1080 Warning Image Card (Spec F5)
  const handleDownloadCardImage = () => {
    if (!result || typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Dark Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle Outer Border Frame
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1020, 1020);

    // Accent header line
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(30, 30, 1020, 12);

    // 2. Top Header Branding
    ctx.font = 'bold 54px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ ScamShield BD', 540, 140);

    ctx.font = '500 28px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('সাইবার প্রতারণা সতর্কতা ও সচেতনতা কার্ড', 540, 195);

    // 3. Risk Level Badge
    const isHigh = result.risk.level === 'high';
    const isMedium = result.risk.level === 'medium';
    const badgeColor = isHigh ? '#dc2626' : isMedium ? '#d97706' : '#16a34a';
    const badgeText = isHigh ? '🚨 উচ্চ ঝুঁকি (HIGH RISK)' : isMedium ? '⚠️ মাঝারি ঝুঁকি (MEDIUM RISK)' : '✅ কম ঝুঁকি (LOW RISK)';

    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.roundRect(140, 260, 800, 110, 24);
    ctx.fill();

    ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, 540, 332);

    // 4. Scam Type Label Box
    const typeLabel = result.scam_type_label_bn || (isHigh ? 'প্রতারণামূলক মেসেজ সনাক্ত' : 'স্বাভাবিক বার্তা');
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(140, 420, 800, 90, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 34px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(typeLabel, 540, 478);

    // 5. Generic Safety Advice (Strictly no raw user text/quotes per Spec F5)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(140, 560, 800, 280, 20);
    ctx.fill();

    ctx.font = 'bold 30px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'left';
    ctx.fillText('জরুরি সতর্কতা ও করণীয়:', 180, 620);

    ctx.font = '400 26px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const advice1 = result.advice_bn[0] || 'কোনো অপরিচিত নম্বরে পিন, ওটিপি বা গোপন পাসওয়ার্ড দেবেন না।';
    const advice2 = result.advice_bn[1] || 'সন্দেহ হলে সরাসরি সংশ্লিষ্ট ব্যাংকিং হেল্পলাইনে কল করে নিশ্চিত হোন।';

    const wrapText = (text: string, x: number, y: number, maxWidth: number) => {
      const words = text.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText('• ' + line.trim(), x, y);
          line = words[n] + ' ';
          y += 38;
        } else {
          line = testLine;
        }
      }
      ctx.fillText('• ' + line.trim(), x, y);
      return y + 42;
    };

    const nextY = wrapText(advice1, 180, 675, 720);
    wrapText(advice2, 180, nextY, 720);

    // 6. Helplines & Verification Footer
    ctx.textAlign = 'center';
    ctx.font = '600 26px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#2dd4bf';
    ctx.fillText('বিকাশ: ১৬২৪৭  |  নগদ: ১৬১৬৭  |  জরুরি সেবা: ৯৯৯', 540, 920);

    ctx.font = '400 22px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('নিজে যাচাই করতে ভিজিট করুন: scamshield.bd', 540, 965);

    // Trigger Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scamshield-warning-${result.risk.level}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="space-y-8">
      {/* Emergency Red-Bordered Button (Spec 6.2.1) */}
      <div className="flex justify-center">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-sm sm:text-base transition-all shadow-lg shadow-rose-950/50 hover:scale-[1.02]"
        >
          <span className="text-xl">🚨</span>
          <span>আমি ইতিমধ্যে প্রতারিত হয়েছি</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-3">
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
                মেসেজ বা চ্যাটের স্ক্রিনশট সিলেক্ট করুন (JPEG, PNG, WebP):
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-500 file:text-slate-950 hover:file:bg-teal-400 cursor-pointer"
              />

              {/* Client-side Redaction Canvas (Spec F0 / 5.2) */}
              {imagePreviewUrl && (
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-300">
                      🛠️ গোপন অংশ ঢাকুন: মাউস বা আঙুল টেনে পিন/নম্বর ঢাকুন
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRedactBoxes([]);
                        redrawCanvas([], null);
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      আবার শুরু করুন ↺
                    </button>
                  </div>

                  <div className="overflow-auto max-h-[400px] flex justify-center bg-black/40 rounded-lg p-2 border border-slate-800">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="max-w-full h-auto cursor-crosshair touch-none rounded"
                    />
                  </div>

                  {/* Mandatory Notice and Acknowledgment Checkbox (Spec 5.2.2 & Appendix A) */}
                  <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl space-y-2 text-xs text-amber-200">
                    <p>
                      <strong>স্ক্রিনশট নোটিশ:</strong> স্ক্রিনশটে OTP, PIN বা পাসওয়ার্ড থাকলে আগে সেই অংশ ঢেকে দিন। ছবিটি বিশ্লেষণের জন্য তৃতীয়পক্ষের AI সেবায় পাঠানো হবে।
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-700 text-teal-500 focus:ring-teal-500"
                      />
                      <span>আমি বুঝেছি, আমার ছবি AI সেবায় পাঠানো হবে</span>
                    </label>
                  </div>

                  {/* Read Screen Text Button */}
                  <button
                    type="button"
                    disabled={!acknowledged || ocrLoading}
                    onClick={handleUploadScreenshot}
                    className="w-full py-2.5 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {ocrLoading ? 'ছবি থেকে লেখা পড়া হচ্ছে...' : 'লেখা পড়ুন ও যাচাইয়ের জন্য প্রস্তুত করুন →'}
                  </button>
                </div>
              )}

              {/* Editable extracted text (Spec 5.2.4) */}
              {extractedOcrText && (
                <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-medium text-teal-400">
                    আমরা এটুকু পড়তে পেরেছি। ভুল থাকলে ঠিক করে নিন:
                  </span>
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

          {/* Privacy Warning Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs">
            <span className="text-base shrink-0">⚠️</span>
            <p>
              <strong>সতর্কতা:</strong> আপনার ব্যক্তিগত পিন (PIN), ওটিপি (OTP) বা পাসওয়ার্ড কখনো এখানে লিখবেন না। বিশ্লেষণকালে নম্বর ও কোড স্বয়ংক্রিয়ভাবে স্থানীয়ভাবে মাস্ক করা হয়।
            </p>
          </div>

          {/* Shopkeeper Mode Toggle (Challenge 1) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏪</span>
              <div>
                <label htmlFor="shopkeeper-toggle" className="text-xs sm:text-sm font-bold text-white cursor-pointer">
                  দোকানদার / মার্চেন্ট মোড
                </label>
                <p className="text-[11px] text-slate-400">
                  কাস্টমারের ফরোয়ার্ড করা পেমেন্ট মেসেজ বা ভুয়া TrxID যাচাইয়ের জন্য অন করুন
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="shopkeeper-toggle"
              checked={isShopkeeper}
              onChange={(e) => setIsShopkeeper(e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 text-teal-500 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <span>যাচাই হচ্ছে...</span>
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
                  {/* Challenge 2: Verified Merchant Inline Badge */}
                  {result.vouched_offer?.is_vouched && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-bold">
                      <span className="text-emerald-400">🛡️✓</span> যাচাইকৃত কমিউনিটি মার্চেন্ট ({result.vouched_offer.merchant_name_bn})
                    </div>
                  )}
                  {/* F3: Scam Type Label with Qualified Wording */}
                  {(result as any).scam_type_label_bn && (
                    <div className="text-sm font-semibold text-amber-300 mt-1">
                      সম্ভাব্য ধরন: {(result as any).scam_type_label_bn}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Browser TTS Read Aloud Button (Spec F4b) */}
                {hasBanglaVoice && (
                  <button
                    onClick={handleToggleSpeech}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-teal-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                    <span>{isSpeaking ? 'থামান' : 'শুনুন'}</span>
                  </button>
                )}

                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-80">ঝুঁকি সূচক</div>
                  <div className="text-3xl font-black">{result.risk.score}/১০০</div>
                </div>
              </div>
            </div>

            {/* Direct Emergency Link on High Risk (Spec 6.2.1) */}
            {result.risk.level === 'high' && (
              <div className="mt-4 pt-3 border-t border-rose-900/60 flex items-center justify-between">
                <span className="text-xs text-rose-300">
                  ইতিমধ্যে তথ্য দিয়ে বা টাকা পাঠিয়ে প্রতারিত হয়ে থাকলে:
                </span>
                <Link
                  href="/help"
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  জরুরি পদক্ষেপ দেখুন →
                </Link>
              </div>
            )}
          </div>

          {/* Challenge 2: Verified Vouched Merchant Festival Offer Card */}
          {result.vouched_offer?.is_vouched && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500/80 rounded-2xl p-5 space-y-2 text-emerald-100 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-400">
                  <span className="text-xl">🎉</span> কমিউনিটি ভাউচকৃত মার্চেন্টের বৈধ উৎসব অফার (নিরাপদ)
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  False-Positive প্রতিহত
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                এই বার্তাটি <strong>{result.vouched_offer.merchant_name_bn} ({result.vouched_offer.merchant_name_en})</strong>-এর বাণিজ্যিক অফার যা পূর্বে কমিউনিটি দ্বারা ভাউচ ও যাচাই করা হয়েছে। এতে কোনো ফিশিং বা আর্থিক প্রতারণার ঝুঁকি নেই।
              </p>
              <div className="text-[11px] text-emerald-300/80 bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800/50">
                💡 <strong>সততা নোট:</strong> অনেক সময় উৎসবের ছাড়ে সাধারণ অ্যালগরিদম ভুল করে সতর্ক সংকেত দেয়, কিন্তু কমিউনিটি স্বীকৃতি থাকায় এটি নিরাপদ চিহ্নিত হয়েছে।
              </div>
            </div>
          )}

          {/* Challenge 1: Actionable Guidance for Shopkeeper Forwarded Message */}
          {result.shopkeeper_guidance?.is_shopkeeper_context && (
            <div className="bg-amber-950/40 border-2 border-amber-600 rounded-2xl p-5 space-y-3.5 text-amber-100 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-800/80 pb-3">
                <h3 className="font-bold text-base sm:text-lg text-amber-300 flex items-center gap-2">
                  <span className="text-xl">🏪</span> দোকানদারের জন্য সরাসরি করণীয় (Actionable Next Steps)
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-900/80 text-amber-200 border border-amber-700">
                  মার্চেন্ট অ্যাকশন গাইড
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-amber-100">
                {result.shopkeeper_guidance.next_steps_bn.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="font-bold text-amber-400 shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-amber-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-300">
                <span>📟 বাটন ফোন USSD কোড: <strong>{result.shopkeeper_guidance.ussd_code_tip}</strong></span>
                <span className="text-[11px] text-slate-400">কাস্টমারের স্ক্রিনশট কখনোই চূড়ান্ত প্রমাণ নয়</span>
              </div>
            </div>
          )}

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

          {/* Actions: Share & Helplines Shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setResult(null);
                  setInputText('');
                  setInputUrl('');
                  setExtractedOcrText('');
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                অন্য মেসেজ যাচাই করুন
              </button>

              {/* Share Warning Card (Spec F5) */}
              <button
                onClick={handleShareCard}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-teal-300 bg-teal-950 border border-teal-800 hover:bg-teal-900 rounded-lg transition-colors cursor-pointer"
              >
                শেয়ার করুন 📢
              </button>

              {/* 1080x1080 Warning Image Card Download (Spec F5) */}
              <button
                onClick={handleDownloadCardImage}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 rounded-lg transition-colors cursor-pointer"
                title="সোশ্যাল মিডিয়ার জন্য ১০৮০x১০৮০ সতর্কবার্তা কার্ড ডাউনলোড করুন"
              >
                কার্ড ডাউনলোড 🖼️
              </button>
            </div>

            <Link
              href="/report"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-rose-300 bg-rose-950/60 border border-rose-800 hover:bg-rose-900/60 rounded-lg transition-colors"
            >
              প্রতারক নম্বর বা লিঙ্ক রিপোর্ট করুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
