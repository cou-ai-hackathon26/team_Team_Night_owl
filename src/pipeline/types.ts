export type RiskLevel = 'low' | 'medium' | 'high';

export type SignalSource = 'rule' | 'url' | 'safe_browsing' | 'community' | 'similarity' | 'llm';

export interface Signal {
  id: string;
  label_bn: string;
  evidence_quote?: string;
  source: SignalSource;
  weight?: number;
  hard?: boolean;
}

export interface ExtractedUrl {
  raw: string;
  registered_domain: string;
  flags: string[];
}

export interface ExtractedPhone {
  normalized: string;
  community_reports: number;
}

export interface AnalysisEntities {
  urls: ExtractedUrl[];
  phones: ExtractedPhone[];
}

export interface DegradedFlags {
  llm: boolean;
  safe_browsing: boolean;
  embeddings: boolean;
  community: boolean;
}

export interface AnalysisResponse {
  id: string;
  risk: {
    level: RiskLevel;
    score: number; // 0 to 100
  };
  scam_type?: string | null;
  scam_type_label_bn?: string | null;
  summary_bn: string;
  signals: Signal[];
  reasons_bn: string[];
  advice_bn: string[];
  entities: AnalysisEntities;
  degraded: DegradedFlags;
  attribution: {
    google_safe_browsing: boolean;
  };
  disclaimer_bn: string;
  models: {
    llm: string;
    embedding: string;
  };
  latency_ms: number;
}

export interface LlmAnalysisOutput {
  verdict: RiskLevel;
  scam_type: 'credential_theft' | 'prize_bait' | 'wrong_transfer' | 'impersonation' | 'phishing_link' | 'other' | 'none';
  reasons: Array<{
    text_bn: string;
    evidence_quote: string;
  }>;
  advice_bn: string[];
  confidence: number;
}
