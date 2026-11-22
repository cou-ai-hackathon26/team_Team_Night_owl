import officialDomainsList from '../config/official-domains.json';
import { ExtractedUrl } from './types';

/**
 * Static URL analysis without fetching target. Spec 6.4
 * NEVER fetch the URL (prevents SSRF).
 */

const KNOWN_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'is.gd', 'rb.gy', 'shorte.st'
]);

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
}

export function analyzeUrl(extractedUrl: ExtractedUrl): { flags: string[]; isBrandMisuse: boolean; isLookalike: boolean } {
  const flags: string[] = [];
  let isBrandMisuse = false;
  let isLookalike = false;

  let urlObj: URL;
  try {
    const rawWithScheme = extractedUrl.raw.startsWith('http') ? extractedUrl.raw : `http://${extractedUrl.raw}`;
    urlObj = new URL(rawWithScheme);
  } catch {
    return { flags: ['invalid_url'], isBrandMisuse: false, isLookalike: false };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const registeredDomain = extractedUrl.registered_domain.toLowerCase();

  // 1. IP-literal host
  const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) {
    flags.push('ip_literal_host');
  }

  // 2. Punycode / IDN homograph
  if (hostname.includes('xn--')) {
    flags.push('punycode_homograph');
  }

  // 3. '@' in authority
  if (extractedUrl.raw.includes('@')) {
    flags.push('at_in_authority');
  }

  // 4. Excessive subdomains (e.g., login.bkash.bonus.example.com)
  const parts = hostname.split('.');
  if (parts.length > 3) {
    flags.push('excessive_subdomains');
  }

  // 5. Non-HTTPS
  if (extractedUrl.raw.startsWith('http://')) {
    flags.push('non_https');
  }

  // 6. Known shortener
  if (KNOWN_SHORTENERS.has(registeredDomain)) {
    flags.push('shortened_url');
  }

  // 7. Brand keyword in subdomain/path while registered domain is NOT official
  const officialDomains = officialDomainsList.map((d) => d.domain.toLowerCase());

  for (const item of officialDomainsList) {
    const brandLower = item.brand.toLowerCase();
    const officialDomain = item.domain.toLowerCase();

    const containsBrand = hostname.includes(brandLower) || urlObj.pathname.toLowerCase().includes(brandLower);

    if (containsBrand && registeredDomain !== officialDomain) {
      flags.push(`brand_misuse_${brandLower}`);
      isBrandMisuse = true;
    }

    // 8. Levenshtein edit distance check (Lookalike domain)
    if (registeredDomain !== officialDomain) {
      const distance = levenshteinDistance(registeredDomain, officialDomain);
      if (distance > 0 && distance <= 2) {
        flags.push(`lookalike_domain_${brandLower}`);
        isLookalike = true;
      }
    }
  }

  return { flags, isBrandMisuse, isLookalike };
}
