import { useState, useEffect } from 'react';
import apiService from '../utils/apiService';

export interface FrontendSettings {
  Frontend_WelcomeMessage: string;
  Frontend_Address: string;
  Frontend_ContactEmail: string;
  Frontend_PhoneNumber: string;
  Frontend_FacebookLink: string;
  Frontend_TwitterLink: string;
  Frontend_LinkedInLink: string;
  Frontend_InstagramLink: string;
  Frontend_YoutubeLink: string;
}

export const useFrontendSettings = () => {
  const [settings, setSettings] = useState<FrontendSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Using v1 API endpoint we created
        const data: any[] = await apiService.get('/systemsettingspublic/frontend');
        
        const settingsMap: Partial<FrontendSettings> = {};
        data.forEach(item => {
          (settingsMap as any)[item.key] = item.value;
        });

        setSettings(settingsMap as FrontendSettings);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch frontend settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};
