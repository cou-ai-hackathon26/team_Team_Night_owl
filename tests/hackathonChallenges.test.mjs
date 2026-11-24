import assert from 'assert';
import fs from 'fs';

const merchants = JSON.parse(fs.readFileSync(new URL('../config/vouched-merchants.json', import.meta.url), 'utf8'));

// Test Challenge 2 with the user's exact input
const userExactMessage = 'আড়ং (Aarong) বিজয় উৎসব উপলক্ষে সকল শীতকালীন পোশাকে পাচ্ছেন ২০% পর্যন্ত ছাড়! অফার চলবে ৩০ নভেম্বর পর্যন্ত। বিস্তারিত: https://www.aarong.com';

function detectVouchedFestivalOffer(text, domains = []) {
  if (!text) return { isVouchedOffer: false };
  const normText = text.normalize('NFC');
  const lowerText = normText.toLowerCase();

  const RED_FLAG_PATTERNS = [
    /(?:pin|otp|পিন|ওটিপি|পাসওয়ার্ড|গোপন কোড|verification code)/i,
    /(?:account|একাউন্ট)[\s\S]{0,30}?(?:suspend|blocked|bondho|স্থগিত|বন্ধ)/i,
    /(?:personal\s*number|ব্যক্তিগত\s*নম্বরে)[\s\S]{0,30}?(?:send|টাকা\s*পাঠান)/i,
    /(?:ভুল\s*করে\s*টাকা|bhul\s*kore\s*taka)/i,
  ];

  for (const rf of RED_FLAG_PATTERNS) {
    if (rf.test(normText)) return { isVouchedOffer: false };
  }

  let matchedMerchant;
  for (const m of merchants) {
    const normBn = m.name_bn.normalize('NFC').toLowerCase();
    const normEn = m.name_en.normalize('NFC').toLowerCase();
    if (lowerText.includes(normBn) || lowerText.includes(normEn)) {
      matchedMerchant = m;
      break;
    }
    for (const name of m.sender_names) {
      if (lowerText.includes(name.normalize('NFC').toLowerCase())) {
        matchedMerchant = m;
        break;
      }
    }
    if (matchedMerchant) break;
    for (const d of m.domains) {
      const ld = d.toLowerCase();
      if (domains.some((dom) => dom && dom.toLowerCase().includes(ld)) || lowerText.includes(ld)) {
        matchedMerchant = m;
        break;
      }
    }
    if (matchedMerchant) break;
  }

  if (!matchedMerchant) return { isVouchedOffer: false };

  const FESTIVAL_DISCOUNT_PATTERNS = [
    /(?:ঈদ|eid|পূজা|puja|বৈশাখ|boishakh|রমজান|ramadan|উৎসব|বিজয়|স্বাধীনতা|মেলা|ধামাকা|শীতকালীন|winter|summer|গ্রীষ্মকালীন)[\s\S]{0,50}?(?:অফার|offer|ডিসকাউন্ট|discount|ছাড়|ছাড়|sale|ক্যাশব্যাক|cashback|উপলক্ষে|ভাউচার|voucher)/i,
    /(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়|discount|off|ক্যাশব্যাক|অফার|ছ[া়া-ঢ়]+))/i,
    /(?:ফ্ল্যাট|flat)[\s\S]{0,25}?(?:[০-৯0-9]+%\s*(?:ছাড়|ছাড়|discount|off))/i,
    /(?:কুপন\s*কোড|coupon\s*code|promo\s*code)[\s:]*[\w\d]+/i,
    /(?:কেনাকাটায়|শপিংয়ে|কেনাকাটা\s*করলে|পোশাকে|পণ্যে|আইটেমে)[\s\S]{0,40}?(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়)|ক্যাশব্যাক|অফার)/i,
    /(?:সকল|যেকোনো|নির্বাচিত)\s*[\s\S]{0,40}?(?:[০-৯0-9]+%\s*(?:পর্যন্ত\s*)?(?:ছাড়|ছাড়)|discount)/i,
  ];

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

const res = detectVouchedFestivalOffer(userExactMessage, ['aarong.com']);
assert.strictEqual(res.isVouchedOffer, true, 'User exact message must be identified as vouched offer');
assert.strictEqual(res.merchant?.id, 'aarong', 'Merchant must be Aarong');
console.log('✅ Challenge 2 User Exact Message Test PASSED! Merchant:', res.merchant?.name_bn, 'Quote:', res.evidenceQuote);

// Test Red Flag Impersonation (Scammer asking for OTP using Aarong)
const fakeAarongScam = 'আড়ং (Aarong) বিজয় অফারে ৫,০০০ টাকার ফ্রি গিফট ভাউচার পেতে আপনার পিন ও ওটিপি ভেরিফাই করুন: https://aarong-fake.top';
const fakeRes = detectVouchedFestivalOffer(fakeAarongScam, ['aarong-fake.top']);
assert.strictEqual(fakeRes.isVouchedOffer, false, 'Red flag scam must NOT be whitelisted as vouched offer');
console.log('✅ Red Flag Override Test PASSED!');
