import assert from 'assert';
import { runScamAnalysisPipeline } from '../src/pipeline';
import { detectVouchedFestivalOffer } from '../src/pipeline/vouchedMerchant';
import { analyzeShopkeeperMessage } from '../src/pipeline/shopkeeper';

console.log('--- Testing Hackathon Challenges (Shopkeeper & Vouched Festival Discount) ---');

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc}`);
    console.error(err);
    failed++;
  }
}

async function itAsync(desc: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc}`);
    console.error(err);
    failed++;
  }
}

async function run() {
  // --- Challenge 1: Shopkeeper Forwarded Message Checking ---
  it('Challenge 1: Detects forwarded fake payment SMS for shopkeeper', () => {
    const text = 'Forwarded: You have received Payment Tk 5000 from 01711000000. TrxID 9A8B7C6D. দোকানদার ভাই টাকা পাঠিয়েছি মাল ছেড়ে দিন।';
    const res = analyzeShopkeeperMessage(text, false);

    assert.strictEqual(res.is_shopkeeper_context, true, 'Should detect shopkeeper context');
    assert.strictEqual(res.is_forwarded, true, 'Should detect forwarded flag');
    assert.strictEqual(res.is_fake_payment_suspected, true, 'Should suspect fake payment');
    assert.ok(res.next_steps_bn.length >= 4, 'Should provide at least 4 actionable next steps');
    assert.ok(res.ussd_code_tip.includes('*247*7#'), 'Should include bKash USSD code for button phones');
  });

  it('Challenge 1: Explicit shopkeeper mode triggers shopkeeper guidance', () => {
    const text = '01811223344 থেকে ভুল করে ৫০০০ টাকা চলে গেছে ফেরত দিন';
    const res = analyzeShopkeeperMessage(text, true);

    assert.strictEqual(res.is_shopkeeper_context, true, 'Explicit mode should activate shopkeeper context');
    assert.ok(res.next_steps_bn.some(step => step.includes('পণ্য বা নগদ ক্যাশ ছাড়বেন না')));
  });

  await itAsync('Challenge 1 (Pipeline): Pipeline returns shopkeeper_guidance for forwarded fake payment', async () => {
    const text = 'Forwarded: bKash Payment Received Tk 2500 from 01912345678 TrxID 8K9L0M1. মালটা ডেলিভারি দিন ভাই।';
    const res = await runScamAnalysisPipeline({
      text,
      persistEvent: false,
      useLlm: false,
      useSafeBrowsing: false,
    });

    assert.ok(res.shopkeeper_guidance, 'Response should contain shopkeeper_guidance');
    assert.strictEqual(res.shopkeeper_guidance?.is_shopkeeper_context, true);
    assert.ok(res.advice_bn.some(a => a.includes('স্টেটমেন্টে টাকা জমা')));
  });

  // --- Challenge 2: Stop checker from flagging legitimate festival discount from vouched merchant ---
  it('Challenge 2: Detects legitimate Aarong Eid festival discount as vouched', () => {
    const text = 'ঈদ ধামাকা অফার! আড়ং এ কেনাকাটায় পাচ্ছেন ফ্ল্যাট ২০% ছাড়। কুপন কোড: EID20। ভিজিট করুন: aarong.com';
    const res = detectVouchedFestivalOffer(text, ['aarong.com']);

    assert.strictEqual(res.isVouchedOffer, true, 'Should be recognized as vouched festival offer');
    assert.strictEqual(res.merchant?.id, 'aarong');
    assert.strictEqual(res.merchant?.vouched_by_community, true);
  });

  it('Challenge 2: Detects Shwapno festival cashback discount as vouched', () => {
    const text = 'স্বপ্ন সুপারস্টোরে ঈদ অফার: নির্বাচিত সকল পণ্যে ১৫% ক্যাশব্যাক! অফারটি চলবে চাঁদ রাত পর্যন্ত। shwapno.com';
    const res = detectVouchedFestivalOffer(text, ['shwapno.com']);

    assert.strictEqual(res.isVouchedOffer, true, 'Should detect Shwapno festival offer');
    assert.strictEqual(res.merchant?.id, 'shwapno');
  });

  it('Challenge 2: Never vouches an offer asking for OTP or PIN (Security invariant)', () => {
    const phishingText = 'আড়ং ঈদ অফারে বোনাস ক্যাশব্যাক পেতে আপনার পিন ও ওটিপি দিন';
    const res = detectVouchedFestivalOffer(phishingText, ['aarong.com']);

    assert.strictEqual(res.isVouchedOffer, false, 'Must reject offers that ask for credentials/OTP');
  });

  await itAsync('Challenge 2 (Pipeline): Legitimate festival discount gets LOW risk (False-Positive prevented)', async () => {
    const text = 'ঈদ উৎসব অফার! বাটা এর সকল শোরুমে কেনাকাটায় ফ্ল্যাট ২৫% ডিসকাউন্ট! কুপন কোড: BATAEID25। ভিজিট করুন: batabd.com';
    const res = await runScamAnalysisPipeline({
      text,
      persistEvent: false,
      useLlm: false,
      useSafeBrowsing: false,
    });

    assert.strictEqual(res.risk.level, 'low', 'Legitimate vouched festival discount must be LOW risk');
    assert.ok(res.vouched_offer?.is_vouched, 'vouched_offer should be true');
    assert.strictEqual(res.vouched_offer?.merchant_name_bn, 'বাটা');
    assert.ok(res.summary_bn.includes('কমিউনিটি ভাউচকৃত'), 'Summary should note vouched safe offer');
  });

  console.log(`\nHackathon Challenges Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

run();
