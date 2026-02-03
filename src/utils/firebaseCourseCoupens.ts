import { collection, doc, getDocs, query, setDoc, where, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface UnifiedCoupon {
  // Common fields
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  createdAt: Date | number | any;
  updatedAt: Date | number | any;
  validFrom: Date | number | any; // renamed from startDate for consistency
  validUntil: Date | number | any; // renamed from endDate for consistency
  usedCount: number;
  
  // Usage limits
  maxUses: number; // renamed from usageLimit
  maxUsesPerUser: number;
  minAmount: number; // renamed from minPurchase
  maxDiscount?: number;
  
  // Creator information
  createdBy: string; // "admin" or instructor ID
  creatorType: 'admin' | 'instructor';
  
  // Scope and targeting
  isGlobal: boolean; // true for admin coupons, false for instructor coupons
  scope: 'global' | 'course' | 'instructor'; // defines the coupon scope
  
  // Category and course targeting
  applicablePlans: string[]; // for admin coupons
  categories: string[]; // for admin coupons
  subCategories: string[]; // for admin coupons
  isAllCategories: boolean; // for admin coupons
  isAllSubCategories: boolean; // for admin coupons
  
  // Course-specific fields (for instructor coupons)
  courseId?: string; // specific course ID for instructor coupons
  instructorId?: string; // instructor who created the coupon
  
  // Additional settings
  autoApply: boolean;
  priority: number; // higher number = higher priority
}


export const saveCouponToFirebase = async (couponData: UnifiedCoupon) => {
  try {
    const couponRef = doc(db, 'coupons', couponData.id);
    // Convert Date -> Timestamp for Firestore
    const docData = {
      ...couponData,
      // store dates as milliseconds to avoid SDK Timestamp runtime issues
      createdAt: (couponData.createdAt instanceof Date) ? couponData.createdAt.getTime() : couponData.createdAt,
      updatedAt: (couponData.updatedAt instanceof Date) ? couponData.updatedAt.getTime() : couponData.updatedAt,
      validFrom: (couponData.validFrom instanceof Date) ? couponData.validFrom.getTime() : couponData.validFrom,
      validUntil: (couponData.validUntil instanceof Date) ? couponData.validUntil.getTime() : couponData.validUntil,
    } as any;
    await setDoc(couponRef, docData);
    console.log('Coupon saved successfully');
  } catch (error) {
    console.error('Error saving coupon:', error);
  }
};

// Query functions for different coupon types
export const getAdminCoupons = async () => {
  const now = Date.now(); // Use current timestamp in milliseconds

  // Query coupons that are not expired
  const q = query(
    collection(db, "coupons"),
    where("creatorType", "==", "admin"),
    where("validUntil", ">=", now) // ensure coupon not expired
  );

  const querySnapshot = await getDocs(q);

  const coupons = querySnapshot.docs.map((d) => {
    const data = d.data() as any;

    const parseDateField = (v: any) => {
      if (!v) return v;
      if (typeof v === "number") return new Date(v);
      if (v.toDate && typeof v.toDate === "function") return v.toDate();
      if (typeof v === "string") return new Date(v);
      return v;
    };

    return {
      ...data,
      id: d.id,
      createdAt: parseDateField(data.createdAt),
      updatedAt: parseDateField(data.updatedAt),
      validFrom: parseDateField(data.validFrom),
      validUntil: parseDateField(data.validUntil),
    } as UnifiedCoupon;
  });

  // Additional check: only keep coupons that have already started
  const nowDate = new Date();
  return coupons.filter(
    (c) => c.validFrom && c.validUntil && c.validFrom <= nowDate && c.validUntil >= nowDate
  );
};

export const getInstructorCoupons = async (instructorId: string,CourseId?: string) => {
  let q;
  if(CourseId){
   q = query(
    collection(db, 'coupons'), 
    where('creatorType', '==', 'instructor'),
    where('instructorId', '==', instructorId),
    where('courseId', '==', CourseId),
  );
  } else{
    q = query(
    collection(db, 'coupons'), 
    where('creatorType', '==', 'instructor'),
    where('instructorId', '==', instructorId)
  );
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => {
    const data = d.data() as any;
    const parseDateField = (v: any) => {
      if (!v) return v;
      if (typeof v === 'number') return new Date(v);
      if (v.toDate && typeof v.toDate === 'function') return v.toDate();
      if (typeof v === 'string') return new Date(v);
      return v;
    };
    return {
      ...data,
      createdAt: parseDateField(data.createdAt),
      updatedAt: parseDateField(data.updatedAt),
      validFrom: parseDateField(data.validFrom),
      validUntil: parseDateField(data.validUntil),
    } as UnifiedCoupon;
  });
};

export const getCourseCoupons = async (courseId: string) => {
  const q = query(
    collection(db, 'coupons'), 
    where('courseId', '==', courseId),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => {
    const data = d.data() as any;
    const parseDateField = (v: any) => {
      if (!v) return v;
      if (typeof v === 'number') return new Date(v);
      if (v.toDate && typeof v.toDate === 'function') return v.toDate();
      if (typeof v === 'string') return new Date(v);
      return v;
    };
    return {
      ...data,
      createdAt: parseDateField(data.createdAt),
      updatedAt: parseDateField(data.updatedAt),
      validFrom: parseDateField(data.validFrom),
      validUntil: parseDateField(data.validUntil),
    } as UnifiedCoupon;
  });
};

export const getCouponById = async (id: string): Promise<UnifiedCoupon | null> => {
  try {
    const docRef = doc(db, 'coupons', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const parseDateField = (v: any) => {
        if (!v) return v;
        if (typeof v === 'number') return new Date(v);
        if (v.toDate && typeof v.toDate === 'function') return v.toDate();
        if (typeof v === 'string') return new Date(v);
        return v;
      };
      return {
        ...data,
        createdAt: parseDateField(data.createdAt),
        updatedAt: parseDateField(data.updatedAt),
        validFrom: parseDateField(data.validFrom),
        validUntil: parseDateField(data.validUntil),
      } as UnifiedCoupon;
    }
    return null;
  } catch (error) {
    console.error('Error fetching coupon by id:', error);
    return null;
  }
};

export const createOrUpdateCoupon = async (coupon: UnifiedCoupon) => {
  try {
    const docRef = doc(db, 'coupons', coupon.id);
    // Convert Date -> number (ms) before saving
    const docData = {
      ...coupon,
      createdAt: (coupon.createdAt instanceof Date) ? coupon.createdAt.getTime() : coupon.createdAt,
      updatedAt: (coupon.updatedAt instanceof Date) ? coupon.updatedAt.getTime() : coupon.updatedAt,
      validFrom: (coupon.validFrom instanceof Date) ? coupon.validFrom.getTime() : coupon.validFrom,
      validUntil: (coupon.validUntil instanceof Date) ? coupon.validUntil.getTime() : coupon.validUntil,
    } as any;
    await setDoc(docRef, docData);
    return true;
  } catch (error) {
    console.error('Error creating/updating coupon:', error);
    return false;
  }
};

export const deleteCoupon = async (id: string) => {
  try {
    const docRef = doc(db, 'coupons', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return false;
  }
};

// Coupon application logic
// const getApplicableCoupons = async (courseId: string, userId: string, cartAmount: number) => {
//   const allCoupons = await Promise.all([
//     // Get global admin coupons
//     query(collection(db, 'coupons'), 
//       where('isGlobal', '==', true),
//       where('isActive', '==', true)
//     ),
//     // Get course-specific coupons
//     query(collection(db, 'coupons'), 
//       where('courseId', '==', courseId),
//       where('isActive', '==', true)
//     )
//   ]);

//   // Filter and sort by priority
//   return allCoupons
//     .flat()
//     .filter(coupon => {
//       // Check amount limits
//       if (coupon.minAmount && cartAmount < coupon.minAmount) return false;
      
//       // Check usage limits
//       if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return false;
      
//       // Check date validity
//       const now = new Date();
//       if (now < coupon.validFrom.toDate() || now > coupon.validUntil.toDate()) return false;
      
//       return true;
//     })
//     .sort((a, b) => b.priority - a.priority); // Higher priority first
// };