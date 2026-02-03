import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface PricingPlan {
  id: string;
  firebaseId?: string; // Firebase document ID
  name: string;
  description: string;
  longDescription?: string; // CKEditor content
  duration: number | string; // in months, can be string from Firebase
  durationText: string; // e.g., "1 Month", "6 Months", "1 Year"
  basePrice: number;
  totalAmount?: number; // Total amount including tax
  taxPercentage: number;
  platformFeePercentage: number;
  isActive: boolean;
  categoryId?: string; // for category-specific pricing
  categoryName?: string;
  isAllCategories: boolean; // true for platform-wide access
  
  // New fields for frontend pricing cards
  generalFeatures: string[]; // Bullet points like "HD video quality", "Mobile access"
  keyFeatures: string[]; // Checked features like "Unlimited course access"
  prioritySupport: boolean; // For 6+ month plans
  exclusiveContent: boolean; // For 6+ month plans
  premiumFeatures: boolean; // For annual plans
  earlyAccess: boolean; // For annual plans
  gstRate?: number | string; // GST percentage, can be string from Firebase
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PricingCategory {
  id: string;
  name: string;
  subCategories: string[];
  pricingPlans: PricingPlan[];
}

export interface PricingBreakdown {
  basePrice: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalPrice: number;
}

class PricingService {
  private pricingPlans: PricingPlan[] = [];
  private categories: PricingCategory[] = [];

  // Fetch all pricing plans from API
  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
      if (this.pricingPlans.length > 0) {
        return this.pricingPlans;
      }

      console.log('Fetching pricing plans from API...');
      const response = await apiClient.get(`${API_BASE_URL}Pricing/Get-All`);
      const plansData = response.data || [];

      console.log(`Found ${plansData.length} pricing plans from API`);
      
      this.pricingPlans = plansData.map((data: any) => {
        console.log('Processing plan:', data.id, data);
        
        return {
          id: data.id?.toString() || '',
          name: data?.name || 'Untitled Plan',
          description: data?.description || '',
          longDescription: data?.longDescription || '',
          duration: data?.duration || data?.numberOfDays || 1,
          durationText: data?.durationText || '1 Month',
          basePrice: data?.basePrice || 0,
          totalAmount: data?.totalAmount || 0,
          taxPercentage: data?.taxPercentage || 18,
          platformFeePercentage: data?.platformFeePercentage || 40,
          isActive: data?.isActive !== false,
          categoryId: data?.categoryId?.toString(),
          categoryName: data?.categoryName,
          isAllCategories: data?.isAllCategories !== false,
          generalFeatures: data?.generalFeatures || [],
          keyFeatures: data?.keyFeatures || [],
          prioritySupport: data?.prioritySupport || false,
          exclusiveContent: data?.exclusiveContent || false,
          premiumFeatures: data?.premiumFeatures || false,
          earlyAccess: data?.earlyAccess || false,
          createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
          gstRate: data?.taxPercentage || 18
        } as PricingPlan;
      });

      // Sort plans by duration after fetching (convert string to number for sorting)
      this.pricingPlans.sort((a, b) => {
        const durationA = typeof a.duration === 'string' ? parseInt(a.duration) : a.duration;
        const durationB = typeof b.duration === 'string' ? parseInt(b.duration) : b.duration;
        return durationA - durationB;
      });

      console.log('Final pricing plans:', this.pricingPlans);
      return this.pricingPlans;
    } catch (error) {
      console.error('Error fetching pricing plans from API:', error);
      // Return default pricing plans if API fails
      return [];
    }
  }

  // Get pricing plans by category
  async getPricingPlansByCategory(categoryId?: string): Promise<PricingPlan[]> {
    const allPlans = await this.getPricingPlans();
    
    if (!categoryId) {
      // Return all categories plans
      return allPlans.filter(plan => plan.isAllCategories);
    }
    
    // Return only category-specific plans when a specific category is requested
    return allPlans.filter(plan => plan.categoryId === categoryId);
  }

  // Get categories with pricing
  async getCategoriesWithPricing(): Promise<PricingCategory[]> {
    try {
      // Categories are now fetched separately via courseApiService
      // This method is kept for backward compatibility but returns empty array
      // Categories should be fetched from the course API instead
      console.warn('getCategoriesWithPricing: Categories should be fetched from course API');
      return [];
    } catch (error) {
      console.error('Error fetching categories with pricing:', error);
      return this.getDefaultCategories();
    }
  }

  // Calculate pricing breakdown
  calculatePricingBreakdown(plan: PricingPlan): PricingBreakdown {
    // Use totalAmount if basePrice is 0 or not set
    const totalAmount = (plan as any).totalAmount || 0;
    const basePrice = plan.basePrice || 0;
    
    console.log('Pricing calculation for plan:', plan.name);
    console.log('Original basePrice:', basePrice);
    console.log('Total amount:', totalAmount);
    console.log('Tax percentage:', plan.taxPercentage);
    
    // If basePrice is 0 but totalAmount exists, calculate basePrice from totalAmount
    let calculatedBasePrice = basePrice;
    if (basePrice === 0 && totalAmount > 0) {
      // Reverse calculate basePrice from totalAmount
      // totalAmount = basePrice + (basePrice * taxPercentage / 100)
      // totalAmount = basePrice * (1 + taxPercentage / 100)
      // basePrice = totalAmount / (1 + taxPercentage / 100)
      calculatedBasePrice = totalAmount / (1 + plan.taxPercentage / 100);
      console.log('Calculated basePrice from totalAmount:', calculatedBasePrice);
    }
    
    const taxAmount = (calculatedBasePrice * plan.taxPercentage) / 100;
    const platformFee = (calculatedBasePrice * plan.platformFeePercentage) / 100;
    const instructorShare = calculatedBasePrice - platformFee;
    const totalPrice = totalAmount > 0 ? totalAmount : calculatedBasePrice + taxAmount;

    console.log('Final pricing breakdown:', {
      basePrice: calculatedBasePrice,
      taxAmount,
      platformFee,
      instructorShare,
      totalPrice
    });

    return {
      basePrice: calculatedBasePrice,
      taxAmount,
      platformFee,
      instructorShare,
      totalPrice
    };
  }

  // Get default categories (fallback)
  private getDefaultCategories(): PricingCategory[] {
    return [
      {
        id: 'sap',
        name: 'SAP',
        subCategories: ['SAP ABAP', 'SAP MM', 'SAP SD', 'SAP FI'],
        pricingPlans: []
      },
      {
        id: 'school',
        name: 'School',
        subCategories: ['CBSE', 'State Board', 'ICSE'],
        pricingPlans: []
      },
      {
        id: 'technology',
        name: 'Technology',
        subCategories: ['Web Development', 'Mobile Development', 'Data Science'],
        pricingPlans: []
      }
    ];
  }

  // Clear cache
  clearCache(): void {
    this.pricingPlans = [];
    this.categories = [];
    console.log('Cache cleared, will fetch fresh data from API');
  }

  // Force refresh from API (ignores cache)
  async refreshPricingPlans(): Promise<PricingPlan[]> {
    console.log('Forcing refresh from API...');
    this.clearCache();
    return await this.getPricingPlans();
  }
}

export const pricingService = new PricingService();

// Export the getPricingPlans function for direct use
export const getPricingPlans = () => pricingService.getPricingPlans();

export default pricingService;
