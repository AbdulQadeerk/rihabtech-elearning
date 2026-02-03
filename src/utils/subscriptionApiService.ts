import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface Subscription {
  id: number;
  subscriptionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  planId: number;
  planName: string;
  planDuration: string;
  numberOfDays: number;
  categoryId?: number;
  categoryName?: string;
  baseAmount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  status: 'Active' | 'Expired' | 'Cancelled' | 'Pending';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  isActive?: boolean;
  daysRemaining?: number;
  isExpired?: boolean;
  // Legacy fields for compatibility
  amount?: number;
  orderId?: string;
}

export interface CreateSubscriptionRequest {
  pricingId: number;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  paymentMethod?: string;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  totalAmount: number;
  currency: string;
  message: string;
}

export interface ConfirmPaymentRequest {
  subscriptionId: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  receipt: string;
  amount: number;
  taxAmount: number;
  platformFee: number;
  totalAmount: number;
  currency?: string;
  paymentMethod: string;
  status: string;
  userId: string;
  userEmail: string;
  userPhone: string;
}

class SubscriptionApiService {
  private readonly BASE_URL = `${API_BASE_URL}Subscription`;

  /**
   * Get all user subscriptions
   */
  async getUserSubscriptions(userId?: string): Promise<Subscription[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/my-subscriptions`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching user subscriptions:', error);
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch subscriptions');
    }
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(userId?: string): Promise<Subscription | null> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/active`);
      return response.data || null;
    } catch (error: any) {
      console.error('Error fetching active subscription:', error);
      if (error.response?.status === 404) {
        return null; // No active subscription
      }
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      // Return null on error to allow app to continue
      return null;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/${subscriptionId}`);
      return response.data || null;
    } catch (error: any) {
      console.error('Error fetching subscription by ID:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }

  /**
   * Create a new subscription (before payment)
   */
  async createSubscription(data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/create`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw new Error(error.response?.data?.message || 'Failed to create subscription');
    }
  }

  /**
   * Confirm payment and activate subscription
   */
  async confirmPayment(data: ConfirmPaymentRequest): Promise<void> {
    try {
      console.log('Calling confirm-payment API with data:', data);
      const response = await apiClient.post(`${this.BASE_URL}/confirm-payment`, data);
      console.log('Confirm payment API response:', response.data);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors || error.message || 'Failed to confirm payment';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId?: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) return false;

      // Check if subscription is still valid (not expired)
      if (subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        return endDate > new Date();
      }

      return subscription.status === 'Active' && subscription.isActive === true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export const subscriptionApiService = new SubscriptionApiService();

// Legacy function exports for backward compatibility
export const getUserActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  return subscriptionApiService.getActiveSubscription(userId);
};

export const getAllUserActiveSubscriptions = async (userId: string): Promise<Subscription[]> => {
  return subscriptionApiService.getUserSubscriptions(userId);
};

export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  return subscriptionApiService.hasActiveSubscription(userId);
};

