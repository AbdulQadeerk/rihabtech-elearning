import { fetchPublicSettings } from '../lib/configService';
import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

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

  // Get Razorpay configuration from SQL Backend
  async getRazorpayConfig(): Promise<RazorpayConfig> {
    try {
      const publicSettings = await fetchPublicSettings();

      const config: RazorpayConfig = {
        keyId: publicSettings.razorpayKeyId,
        keySecret: '', // Don't expose secret to frontend
        currency: publicSettings.currency || 'INR',
        theme: {
          color: '#3B82F6'
        },
        isTestMode: publicSettings.razorpayKeyId.startsWith('rzp_test_'),
        description: 'Subscription Payment',
        notes: {
          platform: 'Rihab Technologies',
          source: 'learner_app'
        }
      };

      this.razorpayConfigCache = config;
      return config;
    } catch (error) {
      console.error('Error getting Razorpay config:', error);
      // Fallback
      return {
        keyId: 'rzp_test_xxxxxxxxxxxxx',
        keySecret: '',
        currency: 'INR',
        theme: { color: '#3B82F6' },
        isTestMode: true,
        description: 'Subscription Payment',
        notes: { platform: 'Rihab Technologies', source: 'fallback' }
      };
    }
  }

  // Get email settings from API
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      // Check cache first
      if (this.emailSettingsCache && this.isCacheValid()) {
        return this.emailSettingsCache;
      }

      // Fetch from .NET API
      const response = await apiClient.get(`${API_BASE_URL}admin/EmailSettings/get-all`);
      const settingsData = response.data;

      if (!settingsData || (Array.isArray(settingsData) && settingsData.length === 0)) {
        throw new Error('No email settings found');
      }

      // Get the first (active) email setting
      const setting = Array.isArray(settingsData) ? settingsData[0] : settingsData;

      const settings: EmailSettings = {
        provider: 'smtp',
        smtp: {
          host: setting.outgoingMailServer || 'smtp.gmail.com',
          port: setting.smtpPort || 587,
          secure: (setting.smtpPort === 465),
          auth: {
            user: setting.sendEmailAddress || '',
            pass: setting.password || ''
          }
        },
        from: {
          name: setting.displayName || 'Rihab Technologies',
          email: setting.sendEmailAddress || 'connect@zktutorials.com'
        },
        replyTo: setting.receiverEmailAddress
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
            user: 'connect@zktutorials.com',
            pass: 'fallback_password'
          }
        },
        from: {
          name: 'Rihab Technologies',
          email: 'connect@zktutorials.com'
        }
      };
    }
  }

  // Get email templates from API
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      // Check cache first
      if (this.emailTemplatesCache.length > 0 && this.isCacheValid()) {
        return this.emailTemplatesCache;
      }

      // Fetch from .NET API
      const response = await apiClient.post(`${API_BASE_URL}admin/email-template/get/all`, {});
      const templatesData = response.data;

      if (!templatesData || !Array.isArray(templatesData)) {
        return [];
      }

      const templates: EmailTemplate[] = templatesData.map((data: any) => {
        return {
          id: data.id?.toString() || '',
          name: data.name || '',
          subject: data.subject || '',
          htmlContent: data.htmlContent || data.body || '',
          textContent: data.textContent || '',
          variables: data.variables || [],
          type: data.type || data.templateType || 'payment_confirmation',
          isActive: data.isActive !== false && data.bDeleted !== true,
          createdAt: data.createdDate ? new Date(data.createdDate) : new Date(),
          updatedAt: data.modifiedDate ? new Date(data.modifiedDate) : new Date()
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
