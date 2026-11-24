import assert from 'assert';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const BANGLA_TO_ASCII_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

const ASCII_TO_BANGLA_DIGITS = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

function convertBanglaDigitsToAscii(text) {
  if (!text) return '';
  return text.replace(/[০-৯]/g, (d) => BANGLA_TO_ASCII_DIGITS[d] || d);
}

function convertAsciiDigitsToBangla(text) {
  if (!text) return '';
  return text.replace(/[0-9]/g, (d) => ASCII_TO_BANGLA_DIGITS[d] || d);
}

function normalizePhoneNumber(raw) {
  if (!raw) {
    return { canonical: '', local: '', national: '', banglaLocal: '', banglaCanonical: '', isValid: false };
  }
  const asciiOnly = convertBanglaDigitsToAscii(raw.trim());
  const cleaned = asciiOnly.replace(/[\s\-\(\)\.]/g, '');
  const parsed = parsePhoneNumberFromString(cleaned, 'BD');

  if (parsed && parsed.isValid()) {
    const canonical = parsed.number; // e.g. +8801700000000
    const national = String(parsed.nationalNumber); // e.g. 1700000000
    const local = '0' + national; // e.g. 01700000000
    const banglaLocal = convertAsciiDigitsToBangla(local);
    const banglaCanonical = '+৮৮' + banglaLocal;

    return { canonical, local, national, banglaLocal, banglaCanonical, isValid: true };
  }

  return {
    canonical: cleaned,
    local: cleaned,
    national: cleaned,
    banglaLocal: convertAsciiDigitsToBangla(cleaned),
    banglaCanonical: '+৮৮' + convertAsciiDigitsToBangla(cleaned),
    isValid: false,
  };
}

console.log('--- Testing Phone Normalization (Bangla vs English Digits) ---');

// 1. Basic Bengali vs English equivalence
const bn = normalizePhoneNumber('০১৭০০০০০০০০');
const en = normalizePhoneNumber('01700000000');
assert.strictEqual(bn.canonical, en.canonical, 'Bangla and English canonical numbers must match');
assert.strictEqual(bn.local, '01700000000', 'Local format must be 01700000000');
assert.strictEqual(bn.banglaLocal, '০১৭০০০০০০০০', 'Bangla local format must be ০১৭০০০০০০০০');
console.log('✅ PASS: Basic Bengali and English numerals produce exact identical canonical & local numbers');

// 2. Formats with country code (+88 vs +৮৮)
const ccEn = normalizePhoneNumber('+8801700000000');
const ccBn = normalizePhoneNumber('+৮৮০১৭০০০০০০০০');
assert.strictEqual(ccEn.canonical, en.canonical, '+88 input must match canonical');
assert.strictEqual(ccBn.canonical, en.canonical, '+৮৮ input must match canonical');
console.log('✅ PASS: Country code formats (+88 & +৮৮) normalize identically');

// 3. Formats with spaces, dashes, parentheses
const formattedBn = normalizePhoneNumber('০১৭০০-০০০০০০');
const formattedEn = normalizePhoneNumber('01700 000 000');
assert.strictEqual(formattedBn.canonical, en.canonical, 'Dashes in Bangla digits must be handled');
assert.strictEqual(formattedEn.canonical, en.canonical, 'Spaces in English digits must be handled');
console.log('✅ PASS: Spaces and hyphens handled seamlessly in both languages');

console.log('All phone normalization tests passed successfully!');
