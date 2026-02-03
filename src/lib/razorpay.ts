// Razorpay configuration and utilities
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    [key: string]: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key_id: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Replace with your Razorpay key
  currency: 'INR',
  theme: {
    color: '#3B82F6'
  }
};

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay
export const initializeRazorpay = async (): Promise<any> => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script');
  }
  
  return (window as any).Razorpay;
};

// Create Razorpay order (this would typically be done on your backend)
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<RazorpayOrder> => {
  // In a real implementation, this would be a call to your backend
  // For now, we'll simulate the order creation
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: orderId,
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    receipt,
    status: 'created',
    created_at: Date.now()
  };
};

// Verify payment signature (this would typically be done on your backend)
export const verifyPaymentSignature = async (
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string
): Promise<boolean> => {
  // In a real implementation, this would be a call to your backend
  // to verify the payment signature using your secret key
  console.log('Verifying payment signature:', {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  });
  
  // For demo purposes, always return true
  // In production, implement proper signature verification
  return true;
};

// Format amount for display
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format amount for Razorpay (convert to paise)
export const formatAmountForRazorpay = (amount: number): number => {
  return Math.round(amount * 100);
};

// Parse amount from Razorpay (convert from paise)
export const parseAmountFromRazorpay = (amount: number): number => {
  return amount / 100;
};
