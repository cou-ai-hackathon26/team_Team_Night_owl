import { Signal } from './types';
import { convertBanglaDigitsToAscii } from './normalize';

export interface RuleDefinition {
  id: string;
  name: string;
  label_bn: string;
  patterns: RegExp[];
  weight: number;
  hard: boolean;
  evidence_source: string;
  enabled: boolean;
  scam_type_hint?: string;
}

/**
 * Deterministic Rules R01 - R13 (Spec 6.5 & Addendum F3)
 */
export const RULES: RuleDefinition[] = [
  {
    id: 'R01',
    name: 'Asks for PIN/OTP/Password',
    label_bn: 'পিন (PIN), ওটিপি (OTP), গোপন কোড বা পাসওয়ার্ড চাওয়া হয়েছে',
    patterns: [
      /(?:pin|otp|পাসওয়ার্ড|গোপন কোড|ভেরিফিকেশন কোড|security code|পিন নম্বর|ওটিপি কোড)[\s:]*(?:দিন|pathan|din|send|share|দিন|verify)/i,
      /(?:আপনার|apnar)[\s\w]*(?:pin|otp|পাসওয়ার্ড|গোপন কোড)[\s\w]*(?:চাওয়া|pathan|din|শেয়ার)/i,
      /otp\s*<\s*code\s*>\s*din/i,
      /enter\s*(?:your\s*)?(?:pin|otp|code)/i,
      /pin\s*verify\s*korun/i
    ],
    weight: 40,
    hard: false,
    evidence_source: 'https://www.bkash.com/en/customer-service/avoid-fraud',
    enabled: true,
    scam_type_hint: 'credential_theft',
  },
  {
    id: 'R02',
    name: 'Urgency or Threat',
    label_bn: 'হুমকি বা অবিলম্বে ব্যবস্থা নেওয়ার তাগিদ (অ্যাকাউন্ট বন্ধ বা স্থগিত করার ভয়)',
    patterns: [
      /(?:account|একাউন্ট|একাউন্টটি|account ti)[\s\w]*(?:suspend|blocked|bondho|স্থগিত|বন্ধ|বাতিল)/i,
      /(?:urgent|ekhoni|এখনই|অবিলম্বে|24 ghonta|২৪ ঘণ্টার)[\s\w]*(?:call|করুন|jogajog|যোগাযোগ)/i,
      /account\s*ti\s*suspend\s*kora\s*hoyeche/i,
      /account\s*ti\s*bondho\s*hoye\s*jabe/i,
      /kyc\s*update\s*korte/i
    ],
    weight: 35,
    hard: false,
    evidence_source: 'https://www.bkash.com/en/customer-service/avoid-fraud',
    enabled: true,
    scam_type_hint: 'credential_theft',
  },
  {
    id: 'R03',
    name: 'Prize/Lottery Bait',
    label_bn: 'লটারি, নগদ বোনাস বা লোভনীয় পুরস্কারের ফাঁদ',
    patterns: [
      /(?:lottery|লটারি|bonus|বোনাস|puroskar|পুরস্কার|congratulations|অভিনন্দন)[\s\w]*(?:jitechen|জিতেছেন|peyechen|claim|নিন)/i,
      /eid\s*bonus/i,
      /lottery\s*te\s*.*taka\s*jitechen/i,
      /cashback.*offer\s*nite/i
    ],
    weight: 30,
    hard: false,
    evidence_source: 'https://www.bkash.com/en/page/security-tips',
    enabled: true,
    scam_type_hint: 'prize_bait',
  },
  {
    id: 'R04',
    name: 'Sent Money by Mistake',
    label_bn: 'ভুল করে টাকা পাঠানোর দাবি ও ফেরত চাওয়ার অপচেষ্টা',
    patterns: [
      /(?:bhul\s*kore|ভুল\s*করে)[\s\w]*(?:taka|টাকা|send)[\s\w]*(?:ferot|ফেরত|দিন|den)/i,
      /ma\s*osustho.*bhul\s*kore/i,
      /amar\s*bkash\s*theke\s*bhul\s*kore/i
    ],
    weight: 35,
    hard: false,
    evidence_source: 'Real collected samples & MFS customer advisories',
    enabled: true,
    scam_type_hint: 'wrong_transfer_refund',
  },
  {
    id: 'R05',
    name: 'Brand Impersonation',
    label_bn: 'বিকাশ, নগদ, ব্যাংক বা সরকারি প্রতিষ্ঠানের ভুয়া পরিচয় ব্যবহার',
    patterns: [
      /(?:bkash|nagad|rocket|upay|বিকাশ|নগদ)[\s\w]*(?:alert|customer care|helpline|হেড অফিস|অফিসার)/i,
      /bkash\s*customer\s*care/i,
      /bkash\s*alert/i,
      /priyo\s*grahok.*bkash/i
    ],
    weight: 25,
    hard: false,
    evidence_source: 'https://www.bkash.com/en/customer-service/avoid-fraud',
    enabled: true,
    scam_type_hint: 'impersonation',
  },
  {
    id: 'R10',
    name: 'Personal Number Fee/Charge',
    label_bn: 'ব্যক্তিগত নম্বরে ফি বা প্রসেসিং চার্জ পাঠাতে বলা',
    patterns: [
      /(?:fee|charge|খরচ|টাকা)[\s\w]*(?:pathan|pathan|send|দিন)[\s\w]*(?:number|নম্বর)/i,
      /personal\s*number\s*e/i
    ],
    weight: 20,
    hard: false,
    evidence_source: 'MFS fraud warnings',
    enabled: true,
    scam_type_hint: 'fake_job_task',
  },
];

export function runRuleEngine(originalText: string): Signal[] {
  const firedSignals: Signal[] = [];
  const normalizedForRules = convertBanglaDigitsToAscii(originalText);

  for (const rule of RULES) {
    if (!rule.enabled) continue;

    for (const pattern of rule.patterns) {
      const match = pattern.exec(normalizedForRules) || pattern.exec(originalText);
      if (match) {
        // Extract exact substring from original text for UI highlighting
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;
        const evidenceQuote = originalText.slice(startIndex, endIndex) || match[0];

        firedSignals.push({
          id: rule.id,
          label_bn: rule.label_bn,
          evidence_quote: evidenceQuote.trim(),
          source: 'rule',
          weight: rule.weight,
          hard: rule.hard,
        });
        break; // Only trigger each rule once per text
      }
    }
  }

  return firedSignals;
}
