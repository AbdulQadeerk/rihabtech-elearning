import {
  RazorpayOptions,
  RazorpayResponse,
  formatAmountForRazorpay
} from '../lib/razorpay';
import type { RazorpayConfig as ConfigRazorpayConfig } from './configService';
import { configService } from './configService';
import { subscriptionApiService } from './subscriptionApiService';
import { pricingService } from './pricingService';

export interface SubscriptionPaymentData {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planId: string;
  planName: string;
  planDuration: string;
  amount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
  currency: string;
  categoryId?: string;
  categoryName?: string;
  couponCode?: string;
  couponDiscount?: number;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planId: string;
  planName: string;
  planDuration: string;
  amount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
  currency: string;
  categoryId?: string;
  categoryName?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentDetails?: any;
  createdAt: Date;
  updatedAt: Date;
  receipt?: string;
  notes?: string;
}

export interface SubscriptionOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planId: string;
  planName: string;
  planDuration: string;
  amount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
  currency: string;
  categoryId?: string;
  categoryName?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentDetails?: any;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  receipt?: string;
  notes?: string;
}

class RazorpayService {
  private razorpayConfig: ConfigRazorpayConfig | null = null;
  private paymentDataCache: Map<string, { subscriptionId: string; paymentData: SubscriptionPaymentData; razorpayOrderId?: string }> = new Map(); // transactionId -> {subscriptionId, paymentData, razorpayOrderId}

  // Fetch Razorpay configuration from Firebase
  private async getRazorpayConfig(): Promise<ConfigRazorpayConfig> {
    if (this.razorpayConfig) {
      return this.razorpayConfig;
    }

    try {
      const config = await configService.getRazorpayConfig();
      this.razorpayConfig = config;
      return config;
    } catch (error) {
      console.error('Error fetching Razorpay config:', error);
      throw new Error('Failed to fetch Razorpay configuration');
    }
  }

  // Create a new payment transaction (now creates subscription via API)
  async createPaymentTransaction(data: SubscriptionPaymentData): Promise<string> {
    try {
      // Get pricing plan to get the plan ID (numeric)
      const pricingPlans = await pricingService.getPricingPlans();
      const plan = pricingPlans.find(p => p.id === data.planId || p.id?.toString() === data.planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }

      // Create subscription via API (status will be "Pending")
      const subscriptionResponse = await subscriptionApiService.createSubscription({
        pricingId: parseInt(plan.id.toString()),
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userPhone: data.userPhone,
        paymentMethod: 'Razorpay'
      });

      // Generate a transaction ID for tracking
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Cache subscription ID and payment data for use in payment success handler
      this.paymentDataCache.set(transactionId, {
        subscriptionId: subscriptionResponse.subscriptionId,
        paymentData: data
      });

      return transactionId;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Create Razorpay order and initiate payment
  async initiatePayment(
    transactionId: string,
    paymentData: SubscriptionPaymentData
  ): Promise<{ orderId: string; options: RazorpayOptions }> {
    try {
      // Get Razorpay configuration
      const config = await this.getRazorpayConfig();

      // Note: We don't create orders client-side. Razorpay will create the order automatically
      // when payment is initiated. The order_id will be returned in the payment response.
      // If you need server-side order creation, implement it via your backend API.

      // Prepare Razorpay options (without order_id - Razorpay creates it automatically)
      const options: RazorpayOptions = {
        key: config.isTestMode ? config.keyId : process.env.REACT_APP_RAZORPAY_KEY_ID || config.keyId,
        amount: formatAmountForRazorpay(paymentData.totalAmount),
        currency: config.currency || paymentData.currency,
        name: 'Rihab Technologies',
        description: config.description || `${paymentData.planName} - ${paymentData.planDuration}`,
        // Don't pass order_id - let Razorpay create it automatically
        // order_id will be in the response.razorpay_order_id after payment
        prefill: {
          name: paymentData.userName,
          email: paymentData.userEmail,
          contact: paymentData.userPhone
        },
        notes: {
          planId: paymentData.planId,
          planName: paymentData.planName,
          planDuration: paymentData.planDuration,
          userId: paymentData.userId,
          transactionId: transactionId,
          categoryId: paymentData.categoryId || '',
          categoryName: paymentData.categoryName || ''
        },
        theme: {
          color: config.theme?.color || '#3B82F6'
        },
        // Handler and modal are set in the component (SubscriptionPaymentModal),
        // not here, to avoid duplicate handler execution
        handler: () => {}, // Placeholder - will be overridden in component
        modal: {
          ondismiss: () => {} // Placeholder - will be overridden in component
        }
      };

      // Return empty orderId - it will be available in the payment response
      return { orderId: '', options };
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw new Error('Failed to initiate payment');
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(
    transactionId: string,
    response: RazorpayResponse
  ): Promise<string> {
    try {
      // Get cached payment data
      const cached = this.paymentDataCache.get(transactionId);
      if (!cached) {
        throw new Error('Transaction data not found');
      }

      const { subscriptionId, paymentData, razorpayOrderId } = cached;

      // Note: Payment signature verification should be done on the server side for security
      // The API endpoint will handle verification when confirming the payment

      // Generate receipt ID
      const receipt = `RCP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use razorpay_order_id from response, fallback to cached value if response doesn't have it
      // Razorpay response may contain razorpay_order_id or order_id
      const finalRazorpayOrderId = response.razorpay_order_id || 
                                    (response as any).order_id || 
                                    razorpayOrderId ||
                                    `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Razorpay response:', response);
      console.log('Final Razorpay Order ID:', finalRazorpayOrderId);

      // Confirm payment via API (this will activate the subscription)
      await subscriptionApiService.confirmPayment({
        subscriptionId: subscriptionId,
        orderId: orderId,
        razorpayOrderId: finalRazorpayOrderId,
        razorpayPaymentId: response.razorpay_payment_id,
        receipt: receipt,
        amount: paymentData.amount,
        taxAmount: paymentData.taxAmount,
        platformFee: paymentData.platformFee,
        totalAmount: paymentData.totalAmount,
        currency: paymentData.currency || 'INR',
        paymentMethod: 'Razorpay',
        status: 'completed',
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        userPhone: paymentData.userPhone
      });

      // Clear cache
      this.paymentDataCache.delete(transactionId);

      // Return subscriptionId for coupon confirmation
      return subscriptionId;

    } catch (error) {
      console.error('Error handling payment success:', error);
      // Clear cache on error
      this.paymentDataCache.delete(transactionId);
      throw error;
    }
  }

  // Handle payment cancellation
  async handlePaymentCancelled(transactionId: string): Promise<void> {
    try {
      // Clear cache on cancellation
      this.paymentDataCache.delete(transactionId);
      console.log('Payment cancelled, subscription remains in Pending status');
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  }

  // Handle free subscription (₹0 plans) - no payment required
  async handleFreeSubscription(data: SubscriptionPaymentData): Promise<string> {
    try {
      // Get pricing plan to get the plan ID (numeric)
      const pricingPlans = await pricingService.getPricingPlans();
      const plan = pricingPlans.find(p => p.id === data.planId || p.id?.toString() === data.planId);
      
      if (!plan) {
        throw new Error('Pricing plan not found');
      }

      // Create subscription via API (status will be "Pending")
      const subscriptionResponse = await subscriptionApiService.createSubscription({
        pricingId: parseInt(plan.id.toString()),
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userPhone: data.userPhone,
        paymentMethod: 'FREE'
      });

      // Generate receipt ID and order ID for free subscription
      const receipt = `RCP_FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderId = `ORD_FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Confirm payment via API with FREE payment method (no Razorpay IDs needed)
      await subscriptionApiService.confirmPayment({
        subscriptionId: subscriptionResponse.subscriptionId,
        orderId: orderId,
        razorpayOrderId: 'FREE', // Placeholder for free subscriptions
        razorpayPaymentId: 'FREE', // Placeholder for free subscriptions
        receipt: receipt,
        amount: data.amount || 0,
        taxAmount: data.taxAmount || 0,
        platformFee: data.platformFee || 0,
        totalAmount: data.totalAmount || 0,
        currency: data.currency || 'INR',
        paymentMethod: 'FREE',
        status: 'completed',
        userId: data.userId,
        userEmail: data.userEmail,
        userPhone: data.userPhone
      });

      // Return subscriptionId for coupon confirmation
      return subscriptionResponse.subscriptionId;

    } catch (error) {
      console.error('Error handling free subscription:', error);
      throw error;
    }
  }

  // All Firebase-related methods have been removed as they are now handled by the API
}

export const razorpayService = new RazorpayService();
