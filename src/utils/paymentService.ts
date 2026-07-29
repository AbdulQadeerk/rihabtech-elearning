import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  courseId: string;
  userId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    courseName: string;
    userEmail: string;
    paymentMethod?: string;
  };
}

export interface Order {
  id: string;
  courseId: string;
  userId: string;
  userEmail: string;
  courseName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  enrollmentDate?: Date;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  userEmail: string;
  enrolledAt: Date;
  progress: number;
  status: 'active' | 'completed' | 'suspended';
  paymentStatus: 'free' | 'paid';
  orderId?: string;
}

// Create a new payment intent (tracked locally — actual payment goes through Razorpay)
export const createPaymentIntent = async (
  courseId: string, 
  userId: string, 
  userEmail: string, 
  amount: number, 
  courseName: string
): Promise<string> => {
  try {
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Payment intent created:', paymentIntentId);
    return paymentIntentId;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

// Update payment intent status
export const updatePaymentIntentStatus = async (
  paymentIntentId: string, 
  status: PaymentIntent['status'],
  stripeSessionId?: string
): Promise<void> => {
  try {
    console.log('Payment intent status updated:', paymentIntentId, status);
  } catch (error) {
    console.error('Error updating payment intent:', error);
    throw new Error('Failed to update payment intent');
  }
};

// Create an order (tracked locally — actual order is managed via subscription API)
export const createOrder = async (
  courseId: string,
  userId: string,
  userEmail: string,
  courseName: string,
  amount: number,
  paymentIntentId?: string
): Promise<string> => {
  try {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Order created:', orderId);
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string, 
  status: Order['status'],
  stripeSessionId?: string
): Promise<void> => {
  try {
    console.log('Order status updated:', orderId, status);
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
};

// Enroll user in course via API
export const enrollUserInCourse = async (
  courseId: string,
  studentId: string,
  userEmail: string,
  orderId?: string,
  paymentStatus: 'free' | 'paid' = 'paid'
): Promise<string> => {
  try {
    const response = await apiClient.post(`${API_BASE_URL}enrollment/enroll`, {
      courseId: parseInt(courseId) || 0
    });

    const enrollmentId = response.data?.enrollmentId?.toString() || 
                         response.data?.id?.toString() || 
                         `enr_${Date.now()}`;
    
    return enrollmentId;
  } catch (error: any) {
    console.error('Error enrolling user:', error);
    const message = error?.response?.data?.message || error?.response?.data || error?.message;
    if (typeof message === 'string' && message.includes('already enrolled')) {
      throw new Error('User is already enrolled in this course');
    }
    throw error;
  }
};

// Get user's orders via API (uses payment transactions endpoint)
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}Subscription/my-payment-transactions`);
    const transactions = response.data || [];

    const orders: Order[] = transactions.map((txn: any) => ({
      id: txn.id?.toString() || '',
      courseId: txn.planId?.toString() || '',
      userId: txn.userId || userId,
      userEmail: txn.userEmail || '',
      courseName: txn.planName || '',
      amount: txn.totalAmount || 0,
      currency: txn.currency || 'INR',
      status: (txn.status?.toLowerCase() || 'pending') as Order['status'],
      paymentIntentId: txn.razorpayPaymentId,
      createdAt: txn.createdAt ? new Date(txn.createdAt) : new Date(),
      updatedAt: txn.createdAt ? new Date(txn.createdAt) : new Date(),
      enrollmentDate: txn.status?.toLowerCase() === 'completed' 
        ? (txn.createdAt ? new Date(txn.createdAt) : new Date()) 
        : undefined
    }));
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

// Get user's enrollments via API
export const getUserEnrollments = async (userId: string): Promise<CourseEnrollment[]> => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}enrollment/my-enrollments`);
    const enrollmentsData = response.data || [];

    const enrollments: CourseEnrollment[] = enrollmentsData.map((data: any) => ({
      id: data.id?.toString() || '',
      courseId: data.courseId?.toString() || '',
      userId: data.userId?.toString() || userId,
      userEmail: data.userEmail || '',
      enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : new Date(),
      progress: data.progress || 0,
      status: (data.status || 'active') as CourseEnrollment['status'],
      paymentStatus: data.paymentStatus || 'paid',
      orderId: data.orderId
    }));
    
    return enrollments;
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return [];
  }
};

// Check if user is enrolled in course
export const isUserEnrolledInCourse = async (
  courseId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}enrollment/check/${courseId}`);
    return response.data?.isEnrolled === true || response.data === true;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
};

// Process free course enrollment
export const enrollInFreeCourse = async (
  courseId: string,
  userId: string,
  userEmail: string,
  courseName: string
): Promise<string> => {
  try {
    const enrollmentId = await enrollUserInCourse(courseId, userId, userEmail, undefined, 'free');
    return enrollmentId;
  } catch (error) {
    console.error('Error enrolling in free course:', error);
    throw error;
  }
};

