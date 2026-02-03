import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection
} from 'firebase/firestore';

export interface CoursePricingData {
  draftId: string;
  pricing: 'free' | 'paid';
  access: {
    website: boolean;
    app: boolean;
    private: boolean;
  };
  members: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Save course pricing and access data
export const savePricingData = async (data: CoursePricingData): Promise<void> => {
  try {
    const docRef = doc(db, 'coursePricing', data.draftId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

       const courseRef = doc(db, "courseDrafts", data.draftId);
  await setDoc(courseRef, {
    pricing: data.pricing,
    members: data.members
  }, { merge: true });

  } catch (error) {
    console.error('Error saving course pricing data:', error);
    throw new Error('Failed to save course pricing data');
  }
};

// Get course pricing and access data
export const getPricingData = async (draftId: string): Promise<CoursePricingData | null> => {
  try {
    const docRef = doc(db, 'coursePricing', draftId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      return {
        ...data,
        draftId: docSnap.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as CoursePricingData;
    }

    return null;
  } catch (error) {
    console.error('Error getting course pricing data:', error);
    throw new Error('Failed to get course pricing data');
  }
};

// Update course pricing and access data
export const updatePricingData = async (draftId: string, data: Partial<CoursePricingData>): Promise<void> => {
  try {
    const docRef = doc(db, 'coursePricing', draftId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating course pricing data:', error);
    throw new Error('Failed to update course pricing data');
  }
};
