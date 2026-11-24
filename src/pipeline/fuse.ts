import { LlmAnalysisOutput, RiskLevel, Signal } from './types';

/**
 * Signal Fusion Engine (Spec 6.8)
 *
 * Enforced Safety Invariants:
 * 1. Hard rules enforce minimum risk levels (R09 -> high; R01 + (R02 or R05) -> high).
 * 2. LLM can raise risk level by at most one step, but can NEVER lower a rule-derived level.
 *    final_level = max(rule_level, min(llm_verdict, rule_level + 1))
 */

const RISK_HIERARCHY: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const NUM_TO_RISK: RiskLevel[] = ['low', 'medium', 'high'];

export interface FusionResult {
  finalLevel: RiskLevel;
  score: number;
  summary_bn: string;
  reasons_bn: string[];
  advice_bn: string[];
}

export function fuseSignals(
  firedSignals: Signal[],
  llmOutput: LlmAnalysisOutput | null,
  isLlmDegraded: boolean,
  isVouchedOffer: boolean = false
): FusionResult {
  // 1. Calculate rule points
  let rulePoints = 0;
  const signalIds = new Set(firedSignals.map((s) => s.id));

  for (const sig of firedSignals) {
    rulePoints += sig.weight || 20;
  }

  // 2. Compute rule risk level
  let ruleLevel: RiskLevel = 'low';
  if (rulePoints >= 60) {
    ruleLevel = 'high';
  } else if (rulePoints >= 25) {
    ruleLevel = 'medium';
  }

  // 3. Apply Hard Rule Guarantees (Spec 6.8)
  // R09: Safe Browsing match -> High
  if (signalIds.has('R09')) {
    ruleLevel = 'high';
  }
  // R01 (Credential/OTP request) combined with R02 (Urgency) or R05 (Impersonation) -> High
  if (signalIds.has('R01') && (signalIds.has('R02') || signalIds.has('R05'))) {
    ruleLevel = 'high';
  }

  // 4. Challenge 2: If vouched merchant festival offer and no credential theft / malicious link
  const hasHardSecurityRisk = signalIds.has('R01') || signalIds.has('R09') || signalIds.has('R06') || signalIds.has('R08');
  if (isVouchedOffer && !hasHardSecurityRisk) {
    ruleLevel = 'low';
    rulePoints = 0;
  }

  // 5. LLM Fusion: final_level = max(rule_level, min(llm_verdict, rule_level + 1))
  let finalLevel: RiskLevel = ruleLevel;
  if (!isVouchedOffer && llmOutput && !isLlmDegraded) {
    const rLvlNum = RISK_HIERARCHY[ruleLevel];
    const llmLvlNum = RISK_HIERARCHY[llmOutput.verdict];
    // LLM cannot lower ruleLevel; can raise by at most +1
    const fusedNum = Math.max(rLvlNum, Math.min(llmLvlNum, rLvlNum + 1));
    finalLevel = NUM_TO_RISK[fusedNum];
  }

  // 6. Score calculation (0 - 100)
  let score = Math.min(100, rulePoints);
  if (finalLevel === 'high' && score < 75) score = 85;
  if (finalLevel === 'medium' && score < 40) score = 55;
  if (finalLevel === 'low' && score > 30) score = 20;
  if (isVouchedOffer && !hasHardSecurityRisk) score = 0;

  // 7. Reasons & Advice aggregation
  const reasons_bn: string[] = [];
  const advice_bn: string[] = [];

  // Add rule reasons first with highlighted evidence
  for (const sig of firedSignals) {
    if (sig.evidence_quote) {
      reasons_bn.push(`${sig.label_bn} (চিহ্নিত অংশ: "${sig.evidence_quote}")`);
    } else {
      reasons_bn.push(sig.label_bn);
    }
  }

  // Add LLM reasons
  if (llmOutput && llmOutput.reasons) {
    for (const r of llmOutput.reasons) {
      if (r.text_bn && !reasons_bn.includes(r.text_bn)) {
        reasons_bn.push(r.text_bn);
      }
    }
  }

  // Standard official advice
  if (finalLevel === 'high') {
    advice_bn.push('কোনো অবস্থাতেই আপনার PIN, OTP বা পাসওয়ার্ড কাউকে শেয়ার করবেন না।');
    advice_bn.push('মেসেজে থাকা লিংকে ক্লিক করবেন না বা দেওয়া নম্বরে টাকা পাঠাবেন না।');
    advice_bn.push('সরাসরি অফিসিয়াল হেল্পলাইনে (বিকাশ ১৬২৪৭ বা নগদ ১৬১৬৭) কল করে যাচাই করুন।');
  } else if (finalLevel === 'medium') {
    advice_bn.push('বার্তাটিতে সতর্কতামূলক সংকেত রয়েছে, কোনো সিদ্ধান্ত নেওয়ার আগে যাচাই করুন।');
    advice_bn.push('কলার বা প্রেরকের নম্বর স্পুফ করা সম্ভব, প্রয়োজনে অফিশিয়াল নম্বরে পুনরায় কল করুন।');
  } else {
    advice_bn.push('স্পষ্ট কোনো প্রতারণার লক্ষণ পাওয়া যায়নি, তবে সব সময় নিজের আর্থিক নিরাপত্তা বজায় রাখুন।');
  }

  if (llmOutput && llmOutput.advice_bn) {
    for (const adv of llmOutput.advice_bn) {
      if (!advice_bn.includes(adv)) {
        advice_bn.push(adv);
      }
    }
  }

  // Summary Bangla text (from Appendix A)
  let summary_bn = '';
  if (isVouchedOffer && !hasHardSecurityRisk) {
    summary_bn = 'কমিউনিটি ভাউচকৃত মার্চেন্টের বৈধ উৎসব অফার (নিরাপদ)';
    advice_bn.unshift('এটি একটি বৈধ বাণিজ্যিক প্রচারমূলক অফার। কোনো পিন বা ওটিপি ছাড়াই অফারটি উপভোগ করতে পারেন।');
  } else if (finalLevel === 'high') {
    summary_bn = 'প্রতারণার উচ্চ সম্ভাবনা';
  } else if (finalLevel === 'medium') {
    summary_bn = 'সন্দেহজনক, সাবধান থাকুন';
  } else {
    summary_bn = 'কোনো স্পষ্ট সতর্ক সংকেত পাওয়া যায়নি (তবে এটি নিরাপত্তার নিশ্চয়তা নয়)';
  }

  return {
    finalLevel,
    score,
    summary_bn,
    reasons_bn,
    advice_bn,
  };
}
