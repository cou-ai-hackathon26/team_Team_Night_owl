/**
 * Mask sensitive data (OTP, PIN, TrxID, Phone) before external API calls.
 * Spec 6.3:
 * "replace detected phone numbers with <PHONE> and standalone 4 to 8 digit codes with <CODE>."
 */

export function maskSensitiveData(text: string): { maskedText: string; maskedTokensCount: number } {
  let count = 0;

  // 1. Mask Bangladesh mobile numbers (+8801... / 01...)
  // Works with both ASCII digits and normalized digits
  const phoneRegex = /(?:\+?8801|01)[3-9]\d{8}\b/g;
  let masked = text.replace(phoneRegex, () => {
    count++;
    return '<PHONE>';
  });

  // 2. Mask 4 to 8 digit standalone numbers (potential OTP / PIN / TrxID numeric codes)
  // e.g. "OTP is 5482", "PIN 1234", "TrxID 98765432"
  const codeRegex = /\b\d{4,8}\b/g;
  masked = masked.replace(codeRegex, () => {
    count++;
    return '<CODE>';
  });

  return {
    maskedText: masked,
    maskedTokensCount: count,
  };
}
