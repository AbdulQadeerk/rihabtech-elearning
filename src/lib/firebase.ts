import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { fetchPublicSettings, getPublicSettings } from './configService';

const getFirebaseConfig = () => {
  const settings = getPublicSettings();
  if (settings && settings.firebase) {
    return settings.firebase;
  }

  // Fallback to hardcoded values
  return {
    apiKey: "AIzaSyBdnctU4CXXeU8zX6bT8kVyMp_Te_yc7os",
    authDomain: "rihaab-bfd76.firebaseapp.com",
    projectId: "rihaab-bfd76",
    storageBucket: "rihaab-bfd76.appspot.com",
    messagingSenderId: "680465438268",
    appId: "1:680465438268:web:0f62ca9614a8fb08065539",
    measurementId: "G-ZMYVLV7GY4"
  };
};

const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 