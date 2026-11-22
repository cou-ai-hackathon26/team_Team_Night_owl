import { normalizeInput, convertBanglaDigitsToAscii, stripZeroWidth } from '../src/pipeline/normalize';
import { extractPhones, extractUrls } from '../src/pipeline/entities';
import { maskSensitiveData } from '../src/pipeline/mask';
import { analyzeUrl } from '../src/pipeline/urlAnalysis';
import { runRuleEngine } from '../src/pipeline/rules';
import { fuseSignals } from '../src/pipeline/fuse';
import { Signal, LlmAnalysisOutput } from '../src/pipeline/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${desc}`);
    failed++;
  }
}

console.log('--- ScamShield BD Pipeline Unit Tests ---\n');

// 1. Normalization & Digits
const banglaDigits = 'বিকাশ ০১৭০০১২৩৪৫৬';
const asciiDigits = convertBanglaDigitsToAscii(banglaDigits);
assert(asciiDigits.includes('01700123456'), 'Bangla digits converted to ASCII');

const zeroWidthText = 'টেস্ট\u200Bলেখা\uFEFF';
assert(stripZeroWidth(zeroWidthText) === 'টেস্টলেখা', 'Zero-width characters stripped');

// 2. Sensitive Masking
const sampleWithPhoneAndOtp = 'Your bKash OTP is 5849 from 01812345678';
const { maskedText } = maskSensitiveData(sampleWithPhoneAndOtp);
assert(maskedText.includes('<CODE>'), 'OTP code masked to <CODE>');
assert(maskedText.includes('<PHONE>'), 'Phone number masked to <PHONE>');

// 3. Entity Extraction
const textWithPhone = 'যোগাযোগ করুন 01712345678 এই নম্বরে';
const phones = extractPhones(textWithPhone);
assert(phones.length === 1 && phones[0].normalized === '+8801712345678', 'Bangladesh phone normalized to E.164');

const textWithUrls = 'Check bonus at bkash-bonus.xyz/claim and https://bkash.com';
const urls = extractUrls(textWithUrls);
assert(urls.length >= 2, 'URLs extracted successfully with/without scheme');

// 4. URL Analysis & Lookalike Detection
const lookalike = analyzeUrl({ raw: 'http://bkas-login.com', registered_domain: 'bkas-login.com', flags: [] });
const brandMisuse = analyzeUrl({ raw: 'http://bkash-bonus.xyz/login', registered_domain: 'bkash-bonus.xyz', flags: [] });
assert(brandMisuse.isBrandMisuse, 'Brand keyword misuse detected on unofficial domain');

// 5. Rule Engine
const scamSuspension = 'bKash Alert: Apnar account ti suspend kora hoyeche. Account active korte pin verify korun';
const ruleSignals = runRuleEngine(scamSuspension);
const ruleIds = ruleSignals.map((r) => r.id);
assert(ruleIds.includes('R01'), 'Rule R01 (Asks for PIN) fired');
assert(ruleIds.includes('R02'), 'Rule R02 (Urgency/Suspension threat) fired');
assert(Boolean(ruleSignals[0]?.evidence_quote && ruleSignals[0].evidence_quote.length > 0), 'Exact evidence substring extracted from original text');

// 6. Fusion Engine: Hard Rule & LLM Downgrade Protection
const fakeLlmLowVerdict: LlmAnalysisOutput = {
  verdict: 'low',
  scam_type: 'none',
  reasons: [{ text_bn: 'সব ঠিক আছে', evidence_quote: '' }],
  advice_bn: [],
  confidence: 0.9,
};

// Test that LLM CANNOT lower a hard signal or rule alert
const fused = fuseSignals(ruleSignals, fakeLlmLowVerdict, false);
assert(fused.finalLevel === 'high', 'Prompt Injection Defense: LLM cannot lower a hard rule combination (R01+R02) to low');

console.log(`\nTests Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
}
