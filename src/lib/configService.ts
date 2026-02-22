import { API_BASE_URL } from './api';

export interface PublicSettings {
    googleClientId: string;
    razorpayKeyId: string;
    currency: string;
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId: string;
    };
}

let cachedSettings: PublicSettings | null = null;

export const fetchPublicSettings = async (): Promise<PublicSettings> => {
    if (cachedSettings) return cachedSettings;

    try {
        const response = await fetch(`${API_BASE_URL}public/settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        cachedSettings = data;
        return data;
    } catch (error) {
        console.error('Error fetching public settings:', error);
        // Fallback values
        return {
            googleClientId: '465095851917-4kotnibtq8h02ufetudjtvb1bmfju3pt.apps.googleusercontent.com',
            razorpayKeyId: 'rzp_test_1234567890',
            currency: 'INR',
            firebase: {
                apiKey: "AIzaSyBdnctU4CXXeU8zX6bT8kVyMp_Te_yc7os",
                authDomain: "rihaab-bfd76.firebaseapp.com",
                projectId: "rihaab-bfd76",
                storageBucket: "rihaab-bfd76.appspot.com",
                messagingSenderId: "680465438268",
                appId: "1:680465438268:web:0f62ca9614a8fb08065539",
                measurementId: "G-ZMYVLV7GY4"
            }
        };
    }
};

export const getPublicSettings = () => cachedSettings;
