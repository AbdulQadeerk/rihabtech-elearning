import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  currency: string;
  theme: {
    color: string;
  };
  isTestMode: boolean;
  webhookSecret?: string;
  webhookUrl?: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    platform: string;
    source: string;
  };
}

export interface RazorpayConfigData {
  keyId: string;
  keySecret: string;
  currency?: string;
  theme?: {
    color?: string;
  };
  isTestMode?: boolean;
  webhookSecret?: string;
  webhookUrl?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    platform: string;
    source: string;
  };
}

export interface EmailSettings {
  provider: 'smtp' | 'gmail' | 'outlook' | 'sendgrid' | 'mailgun';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  gmail?: {
    user: string;
    pass: string;
  };
  outlook?: {
    user: string;
    pass: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
}

export interface EmailSettingsData {
  provider?: 'smtp' | 'gmail' | 'outlook' | 'sendgrid' | 'mailgun';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  gmail?: {
    user: string;
    pass: string;
  };
  outlook?: {
    user: string;
    pass: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  from?: {
    name: string;
    email: string;
  };
  replyTo?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  type: 'subscription_confirmation' | 'subscription_expiry_reminder' | 'payment_confirmation' | 'subscription_expired';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables?: string[];
  type: 'subscription_confirmation' | 'subscription_expiry_reminder' | 'payment_confirmation' | 'subscription_expired';
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

class ConfigService {
  private razorpayConfigCache: RazorpayConfig | null = null;
  private emailSettingsCache: EmailSettings | null = null;
  private emailTemplatesCache: EmailTemplate[] = [];
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime = 0;

  // Get Razorpay configuration from Firebase
  async getRazorpayConfig(): Promise<RazorpayConfig> {
    try {
      // Check cache first
      if (this.razorpayConfigCache && this.isCacheValid()) {
        return this.razorpayConfigCache;
      }

      // Fetch from Firebase
      const configQuery = query(
        collection(db, 'razorpayConfig'),
        //orderBy('updatedAt', 'desc'),
        limit(1)
      );

      const configSnapshot = await getDocs(configQuery);

      if (configSnapshot.empty) {
        throw new Error('No Razorpay configuration found');
      }

      const configDoc = configSnapshot.docs[0];
      const configData = configDoc.data() as RazorpayConfigData;

      const config: RazorpayConfig = {
        keyId: configData.keyId,
        keySecret: configData.keySecret,
        currency: configData.currency || 'INR',
        theme: {
          color: configData.theme?.color || '#6A5ACD'
        },
        isTestMode: configData.isTestMode !== false,
        webhookSecret: configData.webhookSecret,
        webhookUrl: configData.webhookUrl,
        description: configData.description || 'Subscription Payment',
        prefill: configData.prefill,
        notes: configData.notes || {
          platform: 'Rihab Technologies',
          source: 'admin_panel'
        }
      };

      // Cache the configuration
      this.razorpayConfigCache = config;
      this.lastCacheTime = Date.now();

      return config;
    } catch (error) {
      console.error('Error getting Razorpay config:', error);

      // Return fallback configuration
      return {
        keyId: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxxx',
        keySecret: process.env.REACT_APP_RAZORPAY_KEY_SECRET || 'fallback_secret',
        currency: 'INR',
        theme: {
          color: '#6A5ACD'
        },
        isTestMode: true,
        description: 'Subscription Payment',
        notes: {
          platform: 'Rihab Technologies',
          source: 'fallback'
        }
      };
    }
  }

  // Get email settings from Firebase
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      // Check cache first
      if (this.emailSettingsCache && this.isCacheValid()) {
        return this.emailSettingsCache;
      }

      // Fetch from Firebase
      const settingsQuery = query(
        collection(db, 'emailSettings'),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );

      const settingsSnapshot = await getDocs(settingsQuery);

      if (settingsSnapshot.empty) {
        throw new Error('No email settings found');
      }

      const settingsDoc = settingsSnapshot.docs[0];
      const settingsData = settingsDoc.data() as EmailSettingsData;

      const settings: EmailSettings = {
        provider: settingsData.provider || 'smtp',
        smtp: settingsData.smtp,
        gmail: settingsData.gmail,
        outlook: settingsData.outlook,
        sendgrid: settingsData.sendgrid,
        mailgun: settingsData.mailgun,
        from: settingsData.from || {
          name: 'Rihab Technologies',
          email: 'noreply@rihabtech.com'
        },
        replyTo: settingsData.replyTo
      };

      // Cache the settings
      this.emailSettingsCache = settings;
      this.lastCacheTime = Date.now();

      return settings;
    } catch (error) {
      console.error('Error getting email settings:', error);

      // Return fallback settings
      return {
        provider: 'smtp',
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'noreply@rihabtech.com',
            pass: 'fallback_password'
          }
        },
        from: {
          name: 'Rihab Technologies',
          email: 'noreply@rihabtech.com'
        }
      };
    }
  }

  // Get email templates from Firebase
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      // Check cache first
      if (this.emailTemplatesCache.length > 0 && this.isCacheValid()) {
        return this.emailTemplatesCache;
      }

      // Fetch from Firebase
      const templatesQuery = query(
        collection(db, 'emailTemplates'),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const templatesSnapshot = await getDocs(templatesQuery);

      const templates: EmailTemplate[] = templatesSnapshot.docs.map(doc => {
        const data = doc.data() as EmailTemplateData;
        return {
          id: doc.id,
          name: data.name,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          variables: data.variables || [],
          type: data.type,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });

      // Cache the templates
      this.emailTemplatesCache = templates;
      this.lastCacheTime = Date.now();

      return templates;
    } catch (error) {
      console.error('Error getting email templates:', error);
      return [];
    }
  }

  // Get specific email template by type
  async getEmailTemplate(type: string): Promise<EmailTemplate | null> {
    try {
      const templates = await this.getEmailTemplates();
      return templates.find(template => template.type === type) || null;
    } catch (error) {
      console.error('Error getting email template:', error);
      return null;
    }
  }

  // Clear cache
  clearCache(): void {
    this.razorpayConfigCache = null;
    this.emailSettingsCache = null;
    this.emailTemplatesCache = [];
    this.lastCacheTime = 0;
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheTime < this.cacheExpiry;
  }

  // Get public Razorpay config (without sensitive data)
  async getPublicRazorpayConfig(): Promise<any> {
    try {
      const config = await this.getRazorpayConfig();
      return {
        keyId: config.keyId,
        currency: config.currency,
        theme: config.theme,
        description: config.description,
        prefill: config.prefill,
        notes: config.notes
      };
    } catch (error) {
      console.error('Error getting public Razorpay config:', error);
      return null;
    }
  }

  // Get public email settings (without sensitive data)
  async getPublicEmailSettings(): Promise<any> {
    try {
      const settings = await this.getEmailSettings();
      return {
        provider: settings.provider,
        from: settings.from,
        replyTo: settings.replyTo,
        smtp: settings.smtp ? {
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.secure
        } : undefined
      };
    } catch (error) {
      console.error('Error getting public email settings:', error);
      return null;
    }
  }

  // Validate configuration
  validateRazorpayConfig(config: RazorpayConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.keyId) {
      errors.push('Key ID is required');
    } else if (!config.keyId.startsWith('rzp_')) {
      errors.push('Key ID must start with "rzp_"');
    }

    if (!config.keySecret) {
      errors.push('Key Secret is required');
    }

    if (!config.currency) {
      errors.push('Currency is required');
    }

    if (!config.theme?.color) {
      errors.push('Theme color is required');
    } else if (!/^#[0-9A-F]{6}$/i.test(config.theme.color)) {
      errors.push('Theme color must be a valid hex color');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate email settings
  validateEmailSettings(settings: EmailSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.provider) {
      errors.push('Email provider is required');
    }

    if (!settings.from?.name) {
      errors.push('From name is required');
    }

    if (!settings.from?.email) {
      errors.push('From email is required');
    } else if (!this.isValidEmail(settings.from.email)) {
      errors.push('From email must be a valid email address');
    }

    if (settings.replyTo && !this.isValidEmail(settings.replyTo)) {
      errors.push('Reply-to email must be a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const configService = new ConfigService();

// Export convenience functions
export const getRazorpayConfig = () => configService.getRazorpayConfig();
export const getEmailSettings = () => configService.getEmailSettings();
export const getEmailTemplates = () => configService.getEmailTemplates();
export const getEmailTemplate = (type: string) => configService.getEmailTemplate(type);
export const clearConfigCache = () => configService.clearCache();

export default configService;
