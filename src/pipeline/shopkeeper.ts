export interface ShopkeeperGuidance {
  is_shopkeeper_context: boolean;
  is_forwarded: boolean;
  is_fake_payment_suspected: boolean;
  statement_check_action: string;
  ussd_code_tip: string;
  next_steps_bn: string[];
}

const FORWARDED_PATTERNS = [
  /forwarded/i,
  /ফরোয়ার্ড/i,
  /ফরোয়ার্ড/i,
  /\[forwarded\s*message\]/i,
  /forwarded\s*from/i,
];

const PAYMENT_CLAIM_PATTERNS = [
  /(?:payment\s*received|you\s*have\s*received\s*payment|বিকাশ\s*পেমেন্ট|নগদ\s*পেমেন্ট|পেমেন্ট\s*সফল)/i,
  /(?:cash\s*in\s*received|ক্যাশ\s*ইন\s*হয়েছে|টাকা\s*পাঠানো\s*হয়েছে)/i,
  /(?:trxid|txnid|tranid|transaction\s*id)[\s:]*([a-z0-9]+)/i,
];

const SHOPKEEPER_RETAIL_PATTERNS = [
  /(?:মাল\s*দিন|মাল\s*ছাড়ুন|মালটা\s*দেন|পণ্য\s*দিন|ডেলিভারি|ক্যাশ\s*দিন|টাকা\s*পাঠাইছি\s*ভাই|কাউন্টার|দোকানদার\s*ভাই|বিল\s*পরিশোধ)/i,
  /(?:counter\s*no|ref\s*no|মার্চেন্ট\s*পে)/i,
];

export function analyzeShopkeeperMessage(
  text: string,
  isExplicitShopkeeper: boolean = false
): ShopkeeperGuidance {
  const isForwarded = FORWARDED_PATTERNS.some((p) => p.test(text));
  const hasPaymentClaim = PAYMENT_CLAIM_PATTERNS.some((p) => p.test(text));
  const hasRetailKeywords = SHOPKEEPER_RETAIL_PATTERNS.some((p) => p.test(text));

  const isShopkeeperContext = isExplicitShopkeeper || (hasPaymentClaim && (isForwarded || hasRetailKeywords));
  const isFakePaymentSuspected = hasPaymentClaim;

  const nextSteps: string[] = [];

  if (isShopkeeperContext) {
    nextSteps.push('🛑 কাস্টমারকে পণ্য বা নগদ ক্যাশ ছাড়বেন না।');
    nextSteps.push('📱 আপনার নিজস্ব বিকাশ/নগদ মার্চেন্ট অ্যাপের স্টেটমেন্টে টাকা জমা হয়েছে কি না দেখুন।');
    nextSteps.push('📟 বাটন ফোন হলে এখনই ইউএসএসডি (USSD) ডায়াল করুন: বিকাশ *247*7# অথবা নগদ *167*7# (স্টেটমেন্ট চেক)।');
    nextSteps.push('⚠️ কাস্টমারের ফোনের মেসেজ, স্ক্রিনশট বা ফরোয়ার্ড করা টেক্সট কখনোই টাকা জমার চূড়ান্ত প্রমাণ নয়।');
    nextSteps.push('📞 সন্দেহ হলে কাস্টমারকে দোকানে রেখেই সরাসরি অফিশিয়াল হেল্পলাইনে (বিকাশ ১৬২৪৭ / নগদ ১৬১৬৭) কল দিয়ে ট্রানজেকশন নিশ্চিত হোন।');
  }

  return {
    is_shopkeeper_context: isShopkeeperContext,
    is_forwarded: isForwarded,
    is_fake_payment_suspected: isFakePaymentSuspected,
    statement_check_action: 'নিজস্ব মার্চেন্ট অ্যাপ বা USSD স্টেটমেন্ট চেক করুন',
    ussd_code_tip: 'বিকাশ: *247*7# (স্টেটমেন্ট), নগদ: *167*7# (স্টেটমেন্ট)',
    next_steps_bn: nextSteps,
  };
}
