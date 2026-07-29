export interface RazorpayConfig {
  createdAt: Date | string;
  updatedAt: Date | string;
  currency: string;
  description: string;
  isTestMode: boolean;
  keyId: string;
  keySecret: string;
  notes?: Record<string, string>;
  platform: string;
  source: string;
  prefill: {
    contact: string;
    email: string;
    name: string;
  };
  theme: {
    color: string;
  };
  updatedBy: string;
  webhookSecret: string;
  webhookUrl: string;
}

export interface RazorpayConfigWithId extends RazorpayConfig {
  id: string;
}