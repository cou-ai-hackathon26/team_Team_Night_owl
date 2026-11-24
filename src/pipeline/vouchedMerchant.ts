import vouchedMerchants from '../../config/vouched-merchants.json';

export interface VouchedMerchant {
  id: string;
  name_bn: string;
  name_en: string;
  sender_names: string[];
  domains: string[];
  category: string;
  vouched_by_community: boolean;
  verified_on: string;
  source_url: string;
  notes: string;
}

export interface VouchedOfferDetection {
  isVouchedOffer: boolean;
  merchant?: VouchedMerchant;
  offerType?: string;
  evidenceQuote?: string;
}

const FESTIVAL_DISCOUNT_PATTERNS = [
  // 1. Seasonal/Festival keywords + offer/discount/cashback/sale
  /(?:ঈদ|eid|পূজা|puja|বৈশাখ|boishakh|রমজান|ramadan|উৎসব|বিজয়|স্বাধীনতা|মেলা|ধামাকা|শীতকালীন|winter|summer|গ্রীষ্মকালীন)[\s\S]{0,50}?(?:অফার|offer|ডিসকাউন্ট|discount|ছাড়|ছাড়|sale|ক্যাশব্যাক|cashback|উপলক্ষে|ভাউচার|voucher)/i,
  // 2. Percentage off with Bangla or English digits (e.g. 20% বা ২০% পর্যন্ত ছাড়/discount)
  /(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়|discount|off|ক্যাশব্যাক|অফার|ছ[া়া-ঢ়]+))/i,
  // 3. Flat discount
  /(?:ফ্ল্যাট|flat)[\s\S]{0,25}?(?:[০-৯0-9]+%\s*(?:ছাড়|ছাড়|discount|off))/i,
  // 4. Coupon code / promo code
  /(?:কুপন\s*কোড|coupon\s*code|promo\s*code)[\s:]*[\w\d]+/i,
  // 5. Shopping / product categories + discount
  /(?:কেনাকাটায়|শপিংয়ে|কেনাকাটা\s*করলে|পোশাকে|পণ্যে|আইটেমে)[\s\S]{0,40}?(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়)|ক্যাশব্যাক|অফার)/i,
  // 6. Generic items / all items discount
  /(?:সকল|যেকোনো|নির্বাচিত)\s*[\s\S]{0,40}?(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়)|discount)/i,
];

// Dangerous patterns that invalidate a discount (must NEVER be treated as legitimate)
const RED_FLAG_PATTERNS = [
  /(?:pin|otp|পিন|ওটিপি|পাসওয়ার্ড|গোপন কোড|verification code)/i,
  /(?:account|একাউন্ট)[\s\S]{0,30}?(?:suspend|blocked|bondho|স্থগিত|বন্ধ)/i,
  /(?:personal\s*number|ব্যক্তিগত\s*নম্বরে)[\s\S]{0,30}?(?:send|টাকা\s*পাঠান)/i,
  /(?:ভুল\s*করে\s*টাকা|bhul\s*kore\s*taka)/i,
];

export function detectVouchedFestivalOffer(
  text: string,
  domains: string[] = []
): VouchedOfferDetection {
  if (!text) return { isVouchedOffer: false };

  // Normalize Bengali Unicode (NFC)
  const normText = text.normalize('NFC');
  const lowerText = normText.toLowerCase();

  // 1. If any red flag is present (e.g. asking for OTP), it is NOT a safe offer
  for (const rf of RED_FLAG_PATTERNS) {
    if (rf.test(normText)) {
      return { isVouchedOffer: false };
    }
  }

  // 2. Identify if any vouched merchant is mentioned
  let matchedMerchant: VouchedMerchant | undefined;

  for (const m of vouchedMerchants as VouchedMerchant[]) {
    const normBn = m.name_bn.normalize('NFC').toLowerCase();
    const normEn = m.name_en.normalize('NFC').toLowerCase();

    // Check Bengali name and English name
    if (lowerText.includes(normBn) || lowerText.includes(normEn)) {
      matchedMerchant = m;
      break;
    }

    // Check sender names
    for (const name of m.sender_names) {
      if (lowerText.includes(name.normalize('NFC').toLowerCase())) {
        matchedMerchant = m;
        break;
      }
    }
    if (matchedMerchant) break;

    // Check domains
    for (const d of m.domains) {
      const ld = d.toLowerCase();
      if (domains.some((dom) => dom && dom.toLowerCase().includes(ld)) || lowerText.includes(ld)) {
        matchedMerchant = m;
        break;
      }
    }
    if (matchedMerchant) break;
  }

  if (!matchedMerchant) {
    return { isVouchedOffer: false };
  }

  // 3. Check for festival / discount patterns
  let matchedQuote = '';
  for (const pat of FESTIVAL_DISCOUNT_PATTERNS) {
    const match = pat.exec(normText);
    if (match) {
      matchedQuote = match[0];
      break;
    }
  }

  if (matchedQuote) {
    return {
      isVouchedOffer: true,
      merchant: matchedMerchant,
      offerType: 'festival_discount',
      evidenceQuote: matchedQuote,
    };
  }

  return { isVouchedOffer: false };
}
