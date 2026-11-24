import { parsePhoneNumberFromString } from 'libphonenumber-js';

const BANGLA_TO_ASCII_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

const ASCII_TO_BANGLA_DIGITS: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

export function convertBanglaDigitsToAscii(text: string): string {
  if (!text) return '';
  return text.replace(/[০-৯]/g, (d) => BANGLA_TO_ASCII_DIGITS[d] || d);
}

export function convertAsciiDigitsToBangla(text: string): string {
  if (!text) return '';
  return text.replace(/[0-9]/g, (d) => ASCII_TO_BANGLA_DIGITS[d] || d);
}

export interface NormalizedPhoneResult {
  canonical: string;       // e.g. "+8801700000000"
  local: string;           // e.g. "01700000000"
  national: string;        // e.g. "1700000000"
  banglaLocal: string;     // e.g. "০১৭০০০০০০০০"
  banglaCanonical: string; // e.g. "+৮৮০১৭০০০০০০০০"
  isValid: boolean;
}

export function normalizePhoneNumber(raw: string): NormalizedPhoneResult {
  if (!raw) {
    return { canonical: '', local: '', national: '', banglaLocal: '', banglaCanonical: '', isValid: false };
  }

  // 1. Convert any Bangla numerals to ASCII numerals
  const asciiOnly = convertBanglaDigitsToAscii(raw.trim());

  // 2. Remove whitespace, dashes, dots, parentheses
  const cleaned = asciiOnly.replace(/[\s\-\(\)\.]/g, '');

  // 3. Parse using libphonenumber-js for Bangladesh
  const parsed = parsePhoneNumberFromString(cleaned, 'BD');

  if (parsed && parsed.isValid()) {
    const canonical = parsed.number; // e.g. +8801700000000
    const national = String(parsed.nationalNumber); // e.g. 1700000000
    const local = '0' + national; // e.g. 01700000000
    const banglaLocal = convertAsciiDigitsToBangla(local); // e.g. ০১৭০০০০০০০০
    const banglaCanonical = '+৮৮' + banglaLocal;

    return {
      canonical,
      local,
      national,
      banglaLocal,
      banglaCanonical,
      isValid: true,
    };
  }

  // Fallback for non-standard inputs
  return {
    canonical: cleaned,
    local: cleaned,
    national: cleaned,
    banglaLocal: convertAsciiDigitsToBangla(cleaned),
    banglaCanonical: '+৮৮' + convertAsciiDigitsToBangla(cleaned),
    isValid: false,
  };
}
