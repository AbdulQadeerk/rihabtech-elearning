import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, orderBy } from 'firebase/firestore';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'free' | 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: any;
  validUntil: any;
  isActive: boolean;
  isGlobal: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  categories?: string[];
  instructorId?: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
  coupon?: Coupon;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  userEmail: string;
  usedAt: any;
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
  subscriptionId?: string;
  courseId?: string;
  planId?: string;
}

class CouponService {
  // Validate coupon for use
  async validateCoupon(code: string, orderAmount: number, userId: string, categories?: string[]): Promise<CouponValidationResult> {
    try {
      // Get coupon by code
      const couponQuery = query(
        collection(db, 'coupons'),
        where('code', '==', code.toUpperCase())
      );

      const couponSnapshot = await getDocs(couponQuery);

      if (couponSnapshot.empty) {
        return {
          isValid: false,
          message: 'Invalid coupon code'
        };
      }

      const couponDoc = couponSnapshot.docs[0];
      const couponData = couponDoc.data() as any;
      const coupon: Coupon = {
        id: couponDoc.id,
        ...couponData
      } as Coupon;

      // Check if coupon is active
      if (!coupon.isActive) {
        return {
          isValid: false,
          message: 'Coupon is inactive'
        };
      }

      // Check validity period
      const now = new Date();
      const validFrom = coupon.validFrom?.toDate ? coupon.validFrom.toDate() : new Date(coupon.validFrom);
      const validUntil = coupon.validUntil?.toDate ? coupon.validUntil.toDate() : new Date(coupon.validUntil);

      if (now < validFrom || now > validUntil) {
        return {
          isValid: false,
          message: 'Coupon is expired or not yet valid'
        };
      }

      // Check usage limit
      if (coupon.usedCount >= coupon.maxUses) {
        return {
          isValid: false,
          message: 'Coupon usage limit exceeded'
        };
      }

      // Check minimum order amount
      if (coupon.minAmount && orderAmount < coupon.minAmount) {
        return {
          isValid: false,
          message: `Minimum order amount of ₹${coupon.minAmount} required`
        };
      }

      // Check if user already used this coupon
      const alreadyUsed = await this.checkCouponUsage(coupon.id, userId);
      if (alreadyUsed) {
        return {
          isValid: false,
          message: 'You have already used this coupon'
        };
      }

      // Check category restrictions
      if (coupon.categories && coupon.categories.length > 0 && categories && categories.length > 0) {
        // Normalize both arrays to lowercase and trim spaces
        const normalizedCouponCategories = coupon.categories.map((c: string) => c.toLowerCase().trim());
        const normalizedCategories = categories.map((c: string) => c.toLowerCase().trim());

        // If user has selected "All", skip category restriction check
        const isAllSelected = normalizedCategories.includes('all');

        const hasMatchingCategory = isAllSelected || normalizedCategories.some(cat => normalizedCouponCategories.includes(cat));

        if (!hasMatchingCategory) {
          return {
            isValid: false,
            message: 'Coupon is not valid for selected categories'
          };
        }
      }

      // Calculate discount
      let discountAmount = 0;
      let finalAmount = orderAmount;

      switch (coupon.type) {
        case 'free':
          discountAmount = orderAmount;
          finalAmount = 0;
          break;
        case 'percentage':
          discountAmount = (orderAmount * coupon.value) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          }
          finalAmount = orderAmount - discountAmount;
          break;
        case 'fixed':
          discountAmount = Math.min(coupon.value, orderAmount);
          finalAmount = orderAmount - discountAmount;
          break;
      }

      return {
        isValid: true,
        message: 'Coupon applied successfully',
        discountAmount,
        finalAmount,
        coupon
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        isValid: false,
        message: 'Error validating coupon'
      };
    }
  }

  // Check if user already used this coupon
  private async checkCouponUsage(couponId: string, userId: string): Promise<boolean> {
    try {
      const usageQuery = query(
        collection(db, 'couponUsage'),
        where('couponId', '==', couponId),
        where('userId', '==', userId)
      );

      const usageSnapshot = await getDocs(usageQuery);
      return !usageSnapshot.empty;
    } catch (error) {
      console.error('Error checking coupon usage:', error);
      return false;
    }
  }

  // Apply coupon and record usage
  async applyCoupon(
    couponId: string,
    userId: string,
    userEmail: string,
    orderAmount: number,
    discountAmount: number,
    finalAmount: number,
    subscriptionId?: string,
    courseId?: string,
    planId?: string
  ): Promise<boolean> {
    try {
      const usage: Omit<CouponUsage, 'id'> = {
        couponId,
        userId,
        userEmail,
        usedAt: new Date(),
        orderAmount,
        discountAmount,
        finalAmount,
        subscriptionId,
        courseId,
        planId
      };

      // Record usage
      await addDoc(collection(db, 'couponUsage'), usage);

      // Update coupon usage count
      const couponRef = doc(db, 'coupons', couponId);
      const couponDoc = await getDoc(couponRef);
      if (couponDoc.exists()) {
        const currentData = couponDoc.data() as any;
        await updateDoc(couponRef, {
          usedCount: (currentData?.usedCount || 0) + 1,
          updatedAt: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return false;
    }
  }

  // Get available coupons for user
  async getAvailableCoupons(userId: string, categories?: string[], orderAmount: number = 0): Promise<Coupon[]> {
    try {
      const { couponApiService } = await import('./couponApiService');
      const { API_BASE_URL } = await import('../lib/api');
      const apiClient = (await import('./axiosInterceptor')).default;

      const response = await apiClient.get(`${API_BASE_URL}Coupon/available`, {
        params: {
          userId,
          categoryId: categories && categories.length > 0 && !categories.includes('all') ? categories[0] : null,
          orderAmount
        }
      });

      const apiCoupons = response.data || [];
      
      // Map API response to frontend Coupon interface
      return apiCoupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        type: c.type,
        value: c.value,
        maxUses: c.maxUses,
        usedCount: c.usedCount || 0,
        minAmount: c.minAmount,
        maxDiscount: c.maxDiscount,
        validFrom: new Date(c.validFrom),
        validUntil: new Date(c.validUntil),
        isActive: c.isActive,
        isGlobal: true, // API doesn't return this, assume true for available coupons
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: categories || []
      } as Coupon));
    } catch (error) {
      console.error('Error getting available coupons:', error);
      return [];
    }
  }

  // Get coupon usage history for user
  async getUserCouponHistory(userId: string): Promise<CouponUsage[]> {
    try {
      const usageQuery = query(
        collection(db, 'couponUsage'),
        where('userId', '==', userId),
        orderBy('usedAt', 'desc')
      );

      const usageSnapshot = await getDocs(usageQuery);

      return usageSnapshot.docs.map(doc => {
        const usageData = doc.data() as any;
        return {
          id: doc.id,
          ...usageData
        } as CouponUsage;
      });
    } catch (error) {
      console.error('Error getting coupon history:', error);
      return [];
    }
  }

  // Get coupon details by ID
  async getCouponById(couponId: string): Promise<Coupon | null> {
    try {
      const couponDoc = await getDoc(doc(db, 'coupons', couponId));

      if (couponDoc.exists()) {
        const couponData = couponDoc.data() as any;
        return {
          id: couponDoc.id,
          ...couponData
        } as Coupon;
      }

      return null;
    } catch (error) {
      console.error('Error getting coupon:', error);
      return null;
    }
  }
}

export const couponService = new CouponService();
