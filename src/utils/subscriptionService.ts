// This file now uses the API service instead of Firebase
// Maintains backward compatibility with existing code

import { subscriptionApiService, Subscription, Subscription as ApiSubscription } from './subscriptionApiService';

// Re-export types for backward compatibility
export type { Subscription };
export interface SubscriptionOrder {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  planDuration: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionId?: string;
}

// Helper function to convert API subscription to legacy format
function convertToLegacyFormat(sub: ApiSubscription | null): Subscription | null {
  if (!sub) return null;
  
  // Create a new object with the correct types for legacy compatibility
  const legacySub: any = {
    id: sub.subscriptionId || sub.id?.toString() || '',
    subscriptionId: sub.subscriptionId,
    userId: sub.userId,
    userEmail: sub.userEmail,
    userPhone: sub.userPhone,
    planId: sub.planId?.toString() || '',
    planName: sub.planName,
    planDuration: sub.planDuration,
    amount: sub.totalAmount,
    currency: sub.currency.toLowerCase(),
    status: sub.status.toLowerCase() as 'active' | 'expired' | 'cancelled' | 'pending',
    startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
    endDate: sub.endDate ? new Date(sub.endDate) : new Date(),
    createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
    updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
    categoryId: sub.categoryId?.toString(),
    orderId: sub.orderId,
    isActive: sub.isActive
  };
  
  return legacySub as Subscription;
}

// Create a subscription order (legacy function - no longer used, kept for compatibility)
export const createSubscriptionOrder = async (
  userId: string,
  userEmail: string,
  planId: string,
  planName: string,
  planDuration: string,
  amount: number
): Promise<string> => {
  console.warn('createSubscriptionOrder is deprecated. Subscription orders are now handled via API.');
  // Return a dummy ID for backward compatibility
  return `order_${Date.now()}`;
};

// Update subscription order status (legacy function - no longer used)
export const updateSubscriptionOrderStatus = async (
  orderId: string,
  status: SubscriptionOrder['status'],
  stripeSessionId?: string
): Promise<void> => {
  console.warn('updateSubscriptionOrderStatus is deprecated. Payment confirmation is now handled via API.');
};

// Create active subscription (legacy function - no longer used)
export const createSubscription = async (
  userId: string,
  userEmail: string,
  planId: string,
  planName: string,
  planDuration: string,
  amount: number,
  orderId?: string
): Promise<string> => {
  console.warn('createSubscription is deprecated. Subscriptions are now created via API.');
  return `sub_${Date.now()}`;
};

// Get all user's active subscriptions (only Active status)
export const getAllUserActiveSubscriptions = async (userId: string): Promise<Subscription[]> => {
  try {
    const subscriptions = await subscriptionApiService.getUserSubscriptions(userId);
    // Filter only Active subscriptions for header display
    const activeSubscriptions = subscriptions.filter(sub => 
      sub.status === 'Active' && 
      (!sub.endDate || new Date(sub.endDate) > new Date())
    );
    return activeSubscriptions.map(sub => convertToLegacyFormat(sub)!).filter(Boolean) as Subscription[];
  } catch (error) {
    console.error('Error getting all active subscriptions:', error);
    return [];
  }
};

// Get user's active subscription
export const getUserActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const subscription = await subscriptionApiService.getActiveSubscription(userId);
    return convertToLegacyFormat(subscription);
  } catch (error) {
    console.error('Error getting active subscription:', error);
    return null;
  }
};

// Get user's subscription orders (legacy function - returns empty array)
export const getUserSubscriptionOrders = async (userId: string): Promise<SubscriptionOrder[]> => {
  console.warn('getUserSubscriptionOrders is deprecated. Orders are now handled via payment transactions in the API.');
  return [];
};

// Process subscription purchase (legacy function - no longer used)
export const processSubscriptionPurchase = async (
  userId: string,
  userEmail: string,
  planId: string,
  planName: string,
  planDuration: string,
  amount: number
): Promise<string> => {
  console.warn('processSubscriptionPurchase is deprecated. Use razorpayService with API endpoints instead.');
  throw new Error('processSubscriptionPurchase is deprecated. Use the new payment flow.');
};

// Check if user has access to courses (has active subscription)
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    return await subscriptionApiService.hasActiveSubscription(userId);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Select subscription (legacy function - no longer needed as API handles active subscriptions)
export const selectSubscription = async (userId: string, subscriptionId: string): Promise<void> => {
  console.warn('selectSubscription is deprecated. Active subscriptions are automatically determined by the API.');
};
