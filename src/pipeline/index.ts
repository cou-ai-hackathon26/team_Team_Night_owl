import { normalizeInput } from './normalize';
import { extractPhones, extractUrls } from './entities';
import { analyzeUrl } from './urlAnalysis';
import { checkSafeBrowsing } from './safeBrowsing';
import { maskSensitiveData } from './mask';
import { runRuleEngine, RULES } from './rules';
import { analyzeWithGemini } from './llm';
import { fuseSignals } from './fuse';
import { AnalysisResponse, Signal, ExtractedUrl } from './types';
import { getDomain } from 'tldts';
import { getDbPool } from '../db/pool';
import crypto from 'crypto';
import scamTypesData from '../../config/scam-types.json';
import { detectVouchedFestivalOffer } from './vouchedMerchant';
import { analyzeShopkeeperMessage } from './shopkeeper';

export interface PipelineOptions {
  text?: string;
  url?: string;
  isShopkeeper?: boolean;
  persistEvent?: boolean;
  useCommunity?: boolean;
  useSimilarity?: boolean;
  useLlm?: boolean;
  useSafeBrowsing?: boolean;
}

export async function runScamAnalysisPipeline(options: PipelineOptions): Promise<AnalysisResponse> {
  const startTime = Date.now();
  const rawText = (options.text || '').trim();
  const rawInputUrl = (options.url || '').trim();
  const combinedInput = rawInputUrl ? `${rawText} ${rawInputUrl}`.trim() : rawText;

  const persistEvent = options.persistEvent !== false;
  const useLlm = options.useLlm !== false;
  const useSafeBrowsing = options.useSafeBrowsing !== false;

  // 1. Normalization (Spec 6.1)
  const norm = normalizeInput(combinedInput);

  // 2. Entity Extraction (Spec 6.2)
  const phones = extractPhones(norm.normalized);
  const rawUrls: ExtractedUrl[] = extractUrls(norm.normalized);

  if (rawInputUrl) {
    let cleanUrl = rawInputUrl.replace(/[.,!?;]+$/, '');
    const hasScheme = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
    const urlWithScheme = hasScheme ? cleanUrl : `http://${cleanUrl}`;

    try {
      const parsed = new URL(urlWithScheme);
      const regDomain = getDomain(parsed.hostname) || parsed.hostname;
      if (!rawUrls.some((u) => u.raw === cleanUrl || u.registered_domain === regDomain)) {
        rawUrls.push({
          raw: cleanUrl,
          registered_domain: regDomain,
          flags: [],
        });
      }
    } catch {
      // Ignored
    }
  }

  // 3. Static URL Analysis (Spec 6.4)
  const urlSignals: Signal[] = [];
  let impersonatedBrand: string | null = null;

  const processedUrls = rawUrls.map((u) => {
    const analysis = analyzeUrl(u);
    u.flags = analysis.flags;

    if (analysis.isLookalike) {
      urlSignals.push({
        id: 'R06',
        label_bn: `সন্দেহজনক ভুয়া ডোমেইন যা অফিসিয়াল ডোমেইনের সাথে অনুকরণ করা হয়েছে (${u.registered_domain})`,
        evidence_quote: u.raw,
        source: 'url',
        weight: 50,
      });
    } else if (analysis.isBrandMisuse) {
      urlSignals.push({
        id: 'R06',
        label_bn: `অননুমোদিত ডোমেইনে অফিসিয়াল ব্র্যান্ডের নাম ব্যবহার করা হয়েছে (${u.registered_domain})`,
        evidence_quote: u.raw,
        source: 'url',
        weight: 40,
      });
      // Extract brand flag if present
      const brandFlag = analysis.flags.find((f) => f.startsWith('brand_misuse_'));
      if (brandFlag) impersonatedBrand = brandFlag.replace('brand_misuse_', '');
    }

    if (analysis.flags.includes('shortened_url')) {
      urlSignals.push({
        id: 'R07',
        label_bn: 'সংক্ষিপ্ত বা লুকানো লিংক (Shortened URL) ব্যবহার করা হয়েছে',
        evidence_quote: u.raw,
        source: 'url',
        weight: 25,
      });
    }

    if (analysis.flags.includes('ip_literal_host') || analysis.flags.includes('punycode_homograph')) {
      urlSignals.push({
        id: 'R08',
        label_bn: 'অস্বাভাবিক বা বিপজ্জনক সংকেতযুক্ত ওয়েব অ্যাড্রেস',
        evidence_quote: u.raw,
        source: 'url',
        weight: 35,
      });
    }

    return u;
  });

  // 4. Google Safe Browsing Lookup (Spec 6.4)
  let sbSignals: Signal[] = [];
  let attributionNeeded = false;
  let sbDegraded = false;

  if (useSafeBrowsing) {
    const safeBrowsingKey = process.env.SAFE_BROWSING_API_KEY;
    const urlsToCheck = processedUrls.map((u) => u.raw);
    const sbResult = await checkSafeBrowsing(urlsToCheck, safeBrowsingKey);
    sbSignals = sbResult.signals;
    attributionNeeded = sbResult.attributionNeeded;
    sbDegraded = sbResult.isDegraded;
  }

  // 5. Sensitive Data Masking (Spec 6.3)
  const { maskedText } = maskSensitiveData(norm.normalized);

  // 6. Deterministic Rule Engine (Spec 6.5)
  const ruleSignals = runRuleEngine(norm.normalized);

  // 6b. Challenge 2: Community Vouched Merchant Festival Discount Detection
  const domainList = processedUrls.map((u) => u.registered_domain);
  const vouchedDetection = detectVouchedFestivalOffer(norm.normalized, domainList);

  // If vouched merchant discount, filter out false-positive R03 (Prize/Lottery Bait)
  let activeRuleSignals = [...ruleSignals];
  if (vouchedDetection.isVouchedOffer) {
    activeRuleSignals = activeRuleSignals.filter((s) => s.id !== 'R03');
    activeRuleSignals.push({
      id: 'S_VOUCHED_MERCHANT',
      label_bn: `কমিউনিটি ভাউচকৃত বিশ্বস্ত মার্চেন্টের বৈধ অফার (${vouchedDetection.merchant?.name_bn})`,
      evidence_quote: vouchedDetection.evidenceQuote,
      source: 'community',
      weight: 0,
    });
  }

  // Combine deterministic signals
  const allDeterministicSignals = [...activeRuleSignals, ...urlSignals, ...sbSignals];

  // 6c. Challenge 1: Shopkeeper Forwarded Message Analysis
  const shopkeeperGuidance = analyzeShopkeeperMessage(norm.normalized, options.isShopkeeper);

  // 7. LLM Reasoning (Spec 6.7)
  let llmOutput = null;
  let llmDegraded = false;

  if (useLlm) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.LLM_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModel = process.env.LLM_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    const llmRes = await analyzeWithGemini(
      maskedText,
      norm.normalized,
      allDeterministicSignals,
      geminiKey,
      modelName,
      fallbackModel
    );
    llmOutput = llmRes.result;
    llmDegraded = llmRes.isDegraded;
  } else {
    llmDegraded = true;
  }

  // 8. Fusion (Spec 6.8 & Challenge 2 Whitelisting)
  const fusion = fuseSignals(allDeterministicSignals, llmOutput, llmDegraded, vouchedDetection.isVouchedOffer);

  // Inject Shopkeeper Guidance when in shopkeeper context (Challenge 1)
  if (shopkeeperGuidance.is_shopkeeper_context) {
    if (shopkeeperGuidance.is_fake_payment_suspected) {
      fusion.reasons_bn.unshift('দোকানদারদের লক্ষ্য করে পাঠানো সম্ভাব্য ভুয়া পেমেন্ট বার্তা (কাস্টমারের ফোনের মেসেজ দেখে পণ্য ছাড়বেন না)');
    }
    for (const step of shopkeeperGuidance.next_steps_bn) {
      if (!fusion.advice_bn.includes(step)) {
        fusion.advice_bn.push(step);
      }
    }
  }

  // 9. F3: Scam Type Decision (Addendum Spec 8.3)
  // Determine rule type from fired rules' scam_type_hint (weighted voting)
  const hintVotes: Record<string, number> = {};
  for (const sig of ruleSignals) {
    const rDef = RULES.find((r) => r.id === sig.id);
    if (rDef && rDef.scam_type_hint) {
      hintVotes[rDef.scam_type_hint] = (hintVotes[rDef.scam_type_hint] || 0) + rDef.weight;
    }
  }

  // Check URL signals for hints
  if (urlSignals.some((s) => s.id === 'R06' || s.id === 'R08')) {
    hintVotes['phishing_link'] = (hintVotes['phishing_link'] || 0) + 40;
  }

  let topRuleType: string | null = null;
  let maxWeight = 0;
  for (const [t, w] of Object.entries(hintVotes)) {
    if (w > maxWeight) {
      maxWeight = w;
      topRuleType = t;
    }
  }

  // Resolution rule: Rule type beats LLM type
  let resolvedScamType: string | null = null;
  if (topRuleType) {
    resolvedScamType = topRuleType;
  } else if (llmOutput && llmOutput.scam_type && llmOutput.scam_type !== 'none') {
    resolvedScamType = llmOutput.scam_type;
  }

  // Validate resolvedScamType against enabled taxonomy
  const enabledTaxonomy = scamTypesData.filter((st) => st.enabled);
  const isTypeValid = enabledTaxonomy.some((st) => st.id === resolvedScamType);
  if (resolvedScamType && !isTypeValid) {
    resolvedScamType = 'other';
  }

  // Low risk level returns null scam_type (Spec 8.3.4)
  if (fusion.finalLevel === 'low') {
    resolvedScamType = null;
  }

  // Type specific label and advice
  let scamTypeLabelBn: string | null = null;
  if (resolvedScamType) {
    const matchedTaxon = enabledTaxonomy.find((st) => st.id === resolvedScamType);
    if (matchedTaxon) {
      scamTypeLabelBn = matchedTaxon.label_bn;
      // Append sourced type-specific advice
      for (const adv of matchedTaxon.advice_bn) {
        if (!fusion.advice_bn.includes(adv.text_bn)) {
          fusion.advice_bn.push(adv.text_bn);
        }
      }
    }
  }

  // Track impersonated brand if R05 fired
  if (ruleSignals.some((s) => s.id === 'R05')) {
    const textLower = norm.normalized.toLowerCase();
    if (textLower.includes('bkash') || textLower.includes('বিকাশ')) impersonatedBrand = 'bKash';
    else if (textLower.includes('nagad') || textLower.includes('নগদ')) impersonatedBrand = 'Nagad';
    else if (textLower.includes('rocket') || textLower.includes('রকেট')) impersonatedBrand = 'Rocket';
    else if (textLower.includes('upay') || textLower.includes('উপায়')) impersonatedBrand = 'Upay';
  }

  const latency_ms = Date.now() - startTime;
  const eventId = crypto.randomUUID();

  // 10. Persist Event (Spec 4.2: Omits message text, URLs, and phones per privacy architecture) // claims-ok: architectural guarantee
  if (persistEvent) {
    const pool = getDbPool();
    if (pool) {
      pool.query(
        `INSERT INTO analysis_events (id, input_kind, risk_level, score, signal_ids, degraded, latency_ms, scam_type, brand)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          eventId,
          rawInputUrl && rawText ? 'mixed' : rawInputUrl ? 'url' : 'text',
          fusion.finalLevel,
          fusion.score,
          allDeterministicSignals.map((s) => s.id),
          JSON.stringify({
            llm: llmDegraded,
            safe_browsing: sbDegraded,
            embeddings: true,
            community: false,
          }),
          latency_ms,
          resolvedScamType,
          impersonatedBrand,
        ]
      ).catch((err) => console.error('Error logging analysis_event:', err));
    }
  }

  return {
    id: eventId,
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
      embeddings: true,
      community: false,
    },
    attribution: {
      google_safe_browsing: attributionNeeded,
    },
    disclaimer_bn: 'এটি একটি সহায়ক টুল। এর ফলাফল শতভাগ নির্ভুল নয়। টাকা পাঠানো বা কোনো তথ্য দেওয়ার আগে অফিসিয়াল হেল্পলাইনে যাচাই করুন।',
    models: {
      llm: llmDegraded ? 'none (degraded mode)' : process.env.LLM_MODEL || 'gemini-3.5-flash-lite',
      embedding: 'gemini-embedding-001',
    },
    latency_ms,
    scam_type: resolvedScamType,
    scam_type_label_bn: scamTypeLabelBn,
    vouched_offer: vouchedDetection.isVouchedOffer && vouchedDetection.merchant ? {
      is_vouched: true,
      merchant_name_bn: vouchedDetection.merchant.name_bn,
      merchant_name_en: vouchedDetection.merchant.name_en,
      offer_type: vouchedDetection.offerType || 'festival_discount',
      notes: vouchedDetection.merchant.notes,
    } : null,
    shopkeeper_guidance: shopkeeperGuidance.is_shopkeeper_context ? shopkeeperGuidance : null,
  } as AnalysisResponse;
}
