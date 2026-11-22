/**
 * Bangla text normalization according to Spec 6.1
 */

const BANGLA_TO_ASCII_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function convertBanglaDigitsToAscii(text: string): string {
  return text.replace(/[০-৯]/g, (digit) => BANGLA_TO_ASCII_DIGITS[digit] || digit);
}

export function stripZeroWidth(text: string): string {
  // Strip zero-width space, non-joiner, joiner (ZWSP, ZWNJ, ZWJ)
  return text.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export interface NormalizedInput {
  original: string;
  normalized: string;
  asciiDigitsText: string;
  language: 'bn' | 'en' | 'bn-latn' | 'mixed';
}

export function detectLanguage(text: string): 'bn' | 'en' | 'bn-latn' | 'mixed' {
  const banglaRegex = /[\u0980-\u09FF]/;
  const englishRegex = /[a-zA-Z]/;

  const hasBangla = banglaRegex.test(text);
  const hasEnglish = englishRegex.test(text);

  if (hasBangla && hasEnglish) return 'mixed';
  if (hasBangla) return 'bn';
  // If it's English alphabet, could be English or Banglish
  return 'en';
}

export function normalizeInput(rawText: string): NormalizedInput {
  // Unicode NFC
  const nfcText = rawText.normalize('NFC');
  const stripped = stripZeroWidth(nfcText);
  const normalized = normalizeWhitespace(stripped);
  const asciiDigitsText = convertBanglaDigitsToAscii(normalized);
  const language = detectLanguage(normalized);

  return {
    original: rawText,
    normalized,
    asciiDigitsText,
    language,
  };
}
