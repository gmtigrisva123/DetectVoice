export interface VoiceProfile {
  id: string;
  username: string;
  passphrase: string;
  enrolledAt: string;
  fingerprint: {
    pitch: string;
    ageRange: string;
    speechRate: string;
    tone: string;
    resonance: string;
    noiseAnomaly: number;
    features: string[];
  };
  encryptedKey: string; // Representing E2EE wrapped key
}

export interface FirewallLog {
  id: string;
  timestamp: string;
  type: 'auth_success' | 'auth_failed' | 'spoof_attempt' | 'rate_limit' | 'replay_attack' | 'access_allowed';
  ip: string;
  location: string;
  userAgent: string;
  details: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigated: boolean;
}

export interface AdminAlert {
  id: string;
  timestamp: string;
  message: string;
  type: string;
  severity: 'warning' | 'critical';
  resolved: boolean;
}

export interface VoiceVerificationResult {
  verified: boolean;
  confidence: number;
  pitchMatch: boolean;
  features: {
    pitch: string;
    speechRate: string;
    tone: string;
    noiseAnomaly: number;
  };
  spoofDetected: boolean;
  spoofReason?: string;
  firewallStatus?: {
    blocked: boolean;
    reason?: string;
  };
}
