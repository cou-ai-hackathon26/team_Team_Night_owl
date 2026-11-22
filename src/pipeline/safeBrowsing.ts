import { Signal } from './types';

/**
 * Google Safe Browsing Lookup API (v4)
 * Strict terms compliance (Spec 6.4):
 * - Qualified language ("suspected", "possible")
 * - Attribution: "Advisory provided by Google"
 * - Imperfect protection notice
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
      threatEntries: urls.map((url) => ({ url })),
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { signals: [], attributionNeeded: false, isDegraded: true };
    }

    const data = (await res.json()) as SafeBrowsingApiResponse;
    const signals: Signal[] = [];

    if (data.matches && data.matches.length > 0) {
      for (const match of data.matches) {
        signals.push({
          id: 'R09',
          label_bn: `Google Safe Browsing: লিঙ্কটি সন্দেহজনক ফিশিং বা ম্যালওয়্যার হিসেবে চিহ্নিত (${match.threatType})`,
          evidence_quote: match.threat.url,
          source: 'safe_browsing',
          weight: 100,
          hard: true,
        });
      }
      return { signals, attributionNeeded: true, isDegraded: false };
    }

    return { signals: [], attributionNeeded: false, isDegraded: false };
  } catch {
    return { signals: [], attributionNeeded: false, isDegraded: true };
  }
}
