import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getDomain } from 'tldts';
import { ExtractedPhone, ExtractedUrl } from './types';
import { convertBanglaDigitsToAscii } from './normalize';

/**
 * Extract phone numbers and URLs from normalized text.
 * Spec 6.2
 */

export function extractPhones(text: string): ExtractedPhone[] {
  const asciiText = convertBanglaDigitsToAscii(text);
  const foundNumbers: ExtractedPhone[] = [];

  // Match BD mobile numbers (+8801... or 01...)
  const phonePattern = /(?:\+?8801|01)[3-9]\d{8}\b/g;
  const matches = asciiText.match(phonePattern) || [];

  const seen = new Set<string>();

  for (const raw of matches) {
    const parsed = parsePhoneNumberFromString(raw, 'BD');
    if (parsed && parsed.isValid()) {
      const e164 = parsed.number;
      if (!seen.has(e164)) {
        seen.add(e164);
        foundNumbers.push({
          normalized: e164,
          community_reports: 0,
        });
      }
    }
  }

  return foundNumbers;
}

export function extractUrls(text: string): ExtractedUrl[] {
  const urls: ExtractedUrl[] = [];
  const seen = new Set<string>();

  // Tolerant regex for URLs with or without http(s)://
  const urlRegex = /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?/gi;
  const matches = text.match(urlRegex) || [];

  for (const match of matches) {
    let cleanMatch = match.replace(/[.,!?;]+$/, ''); // Strip trailing punctuation
    if (!cleanMatch.startsWith('http://') && !cleanMatch.startsWith('https://')) {
      cleanMatch = `http://${cleanMatch}`;
    }

    try {
      const parsed = new URL(cleanMatch);
      const hostname = parsed.hostname;
      const registeredDomain = getDomain(hostname) || hostname;

      if (!seen.has(cleanMatch)) {
        seen.add(cleanMatch);
        urls.push({
          raw: match,
          registered_domain: registeredDomain,
          flags: [],
        });
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  return urls;
}
