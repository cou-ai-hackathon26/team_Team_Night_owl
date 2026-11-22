import { normalizeInput } from './normalize';
import { extractPhones, extractUrls } from './entities';
import { analyzeUrl } from './urlAnalysis';
import { checkSafeBrowsing } from './safeBrowsing';
import { maskSensitiveData } from './mask';
import { runRuleEngine } from './rules';
import { analyzeWithGemini } from './llm';
import { fuseSignals } from './fuse';
import { AnalysisResponse, Signal } from './types';
import crypto from 'crypto';

export interface AnalyzeOptions {
  text?: string;
  url?: string;
}

export async function runScamAnalysisPipeline(options: AnalyzeOptions): Promise<AnalysisResponse> {
  const startTime = Date.now();
  const inputRaw = (options.text || options.url || '').trim();

  // 1. Normalization (Spec 6.1)
  const norm = normalizeInput(inputRaw);

  // 2. Entity Extraction (Spec 6.2)
  const phones = extractPhones(norm.normalized);
  const rawUrls = extractUrls(norm.normalized);

  // If input was a bare url option
  if (options.url && !rawUrls.some((u) => u.raw === options.url)) {
    rawUrls.push(...extractUrls(options.url));
  }

  // 3. Static URL Analysis (Spec 6.4)
  const urlSignals: Signal[] = [];
  const processedUrls = rawUrls.map((u) => {
    const analysis = analyzeUrl(u);
    u.flags = analysis.flags;

    if (analysis.isLookalike) {
      urlSignals.push({
        id: 'R06',
        label_bn: `সন্দেহজনক ভুয়া ডোমেইন যা অফিসিয়াল ডোমেইনের সাথে অনুকরণ করা হয়েছে (${u.registered_domain})`,
        evidence_quote: u.raw,
        source: 'url',
        weight: 45,
      });
    } else if (analysis.isBrandMisuse) {
      urlSignals.push({
        id: 'R06',
        label_bn: `অননুমোদিত ডোমেইনে ব্র্যান্ডের নাম ব্যবহার করা হয়েছে (${u.registered_domain})`,
        evidence_quote: u.raw,
        source: 'url',
        weight: 35,
      });
    }

    if (analysis.flags.includes('shortened_url')) {
      urlSignals.push({
        id: 'R07',
        label_bn: 'সংক্ষিপ্ত বা লুকানো লিংক (Shortened URL) ব্যবহার করা হয়েছে',
        evidence_quote: u.raw,
        source: 'url',
        weight: 20,
      });
    }

    if (analysis.flags.includes('ip_literal_host') || analysis.flags.includes('punycode_homograph')) {
      urlSignals.push({
        id: 'R08',
        label_bn: 'অস্বাভাবিক বা সম্ভাব্য প্রতারণামূলক ওয়েব অ্যাড্রেস',
        evidence_quote: u.raw,
        source: 'url',
        weight: 30,
      });
    }

    return u;
  });

  // 4. Google Safe Browsing Lookup (Spec 6.4)
  const safeBrowsingKey = process.env.SAFE_BROWSING_API_KEY;
  const urlsToCheck = processedUrls.map((u) => u.raw);
  const { signals: sbSignals, attributionNeeded, isDegraded: sbDegraded } = await checkSafeBrowsing(urlsToCheck, safeBrowsingKey);

  // 5. Sensitive Data Masking (Spec 6.3)
  const { maskedText } = maskSensitiveData(norm.normalized);

  // 6. Deterministic Rule Engine (Spec 6.5)
  const ruleSignals = runRuleEngine(norm.normalized);

  // Combine deterministic signals
  const allDeterministicSignals = [...ruleSignals, ...urlSignals, ...sbSignals];

  // 7. LLM Reasoning (Spec 6.7)
  const geminiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.LLM_MODEL || 'gemini-2.5-flash';
  const { result: llmOutput, isDegraded: llmDegraded } = await analyzeWithGemini(
    maskedText,
    norm.normalized,
    allDeterministicSignals,
    geminiKey,
    modelName
  );

  // 8. Fusion (Spec 6.8)
  const fusion = fuseSignals(allDeterministicSignals, llmOutput, llmDegraded);

  const latency_ms = Date.now() - startTime;

  return {
    id: crypto.randomUUID(),
    risk: {
      level: fusion.finalLevel,
      score: fusion.score,
    },
    summary_bn: fusion.summary_bn,
    signals: allDeterministicSignals,
    reasons_bn: fusion.reasons_bn,
    advice_bn: fusion.advice_bn,
    entities: {
      urls: processedUrls,
      phones,
    },
    degraded: {
      llm: llmDegraded,
      safe_browsing: sbDegraded,
      embeddings: true, // P1
      community: true,  // P1
    },
    attribution: {
      google_safe_browsing: attributionNeeded,
    },
    disclaimer_bn: 'এটি একটি সহায়ক টুল। এর ফলাফল শতভাগ নির্ভুল নয়। টাকা পাঠানো বা কোনো তথ্য দেওয়ার আগে অফিসিয়াল হেল্পলাইনে যাচাই করুন।',
    models: {
      llm: llmDegraded ? 'none (degraded mode)' : modelName,
      embedding: 'gemini-embedding-001',
    },
    latency_ms,
  };
}
