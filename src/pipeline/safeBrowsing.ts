import { Signal } from './types';

/**
 * Google Safe Browsing Lookup API (v4)
 * Strict terms compliance (Spec 6.4)
 */

interface SafeBrowsingApiResponse {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threatEntryType: string;
    threat: { url: string };
  }>;
}

export async function checkSafeBrowsing(urls: string[], apiKey?: string): Promise<{ signals: Signal[]; attributionNeeded: boolean; isDegraded: boolean }> {
  if (!apiKey || urls.length === 0) {
    return { signals: [], attributionNeeded: false, isDegraded: !apiKey };
  }

  // Ensure every url has a protocol for Safe Browsing API
  const formattedUrls = urls.map((u) => (u.startsWith('http://') || u.startsWith('https://') ? u : `http://${u}`));

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: {
      clientId: 'scamshield-bd',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: formattedUrls.map((url) => ({ url })),
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('Safe Browsing API error status:', res.status, await res.text().catch(() => ''));
      return { signals: [], attributionNeeded: false, isDegraded: true };
    }

    const data = (await res.json()) as SafeBrowsingApiResponse;
    const signals: Signal[] = [];

    if (data.matches && data.matches.length > 0) {
      for (const match of data.matches) {
        signals.push({
          id: 'R09',
          label_bn: `Google Safe Browsing: লিঙ্কটি বিপজ্জনক বা ফিশিং সাইট হিসেবে চিহ্নিত (${match.threatType})`,
          evidence_quote: match.threat.url,
          source: 'safe_browsing',
          weight: 100,
          hard: true,
        });
      }
      return { signals, attributionNeeded: true, isDegraded: false };
    }

    return { signals: [], attributionNeeded: false, isDegraded: false };
  } catch (err) {
    console.error('Safe Browsing fetch exception:', err);
    return { signals: [], attributionNeeded: false, isDegraded: true };
  }
}
