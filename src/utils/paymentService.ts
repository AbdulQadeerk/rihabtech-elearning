import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

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

// Create a new payment intent
export const createPaymentIntent = async (
  courseId: string, 
  userId: string, 
  userEmail: string, 
  amount: number, 
  courseName: string
): Promise<string> => {
  try {
    const paymentData = {
      courseId,
      userId,
      userEmail,
      amount,
      currency: 'inr',
      status: 'pending',
      courseName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'paymentIntents'), paymentData);
    return docRef.id;
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
    const paymentRef = doc(db, 'paymentIntents', paymentIntentId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (stripeSessionId) {
      updateData.stripeSessionId = stripeSessionId;
    }

    await updateDoc(paymentRef, updateData);
  } catch (error) {
    console.error('Error updating payment intent:', error);
    throw new Error('Failed to update payment intent');
  }
};

// Create an order
export const createOrder = async (
  courseId: string,
  userId: string,
  userEmail: string,
  courseName: string,
  amount: number,
  paymentIntentId?: string
): Promise<string> => {
  try {
    const orderData = {
      courseId,
      userId,
      userEmail,
      courseName,
      amount,
      currency: 'inr',
      status: 'pending',
      paymentIntentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
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
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (stripeSessionId) {
      updateData.stripeSessionId = stripeSessionId;
    }

    if (status === 'completed') {
      updateData.enrollmentDate = serverTimestamp();
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
};

// Enroll user in course
export const enrollUserInCourse = async (
  courseId: string,
  studentId: string,
  userEmail: string,
  orderId?: string,
  paymentStatus: 'free' | 'paid' = 'paid'
): Promise<string> => {
  try {
    // Check if user is already enrolled
    const enrollmentsRef = collection(db, 'studentEnrollments');
    const existingEnrollmentQuery = query(
      enrollmentsRef,
      where('courseId', '==', courseId),
      where('studentId', '==', studentId)
    );
    
    const existingEnrollments = await getDocs(existingEnrollmentQuery);
    
    if (!existingEnrollments.empty) {
      throw new Error('User is already enrolled in this course');
    }

    const enrollmentData = {
      courseId,
      studentId:studentId,
      userEmail:userEmail,
      enrolledAt: serverTimestamp(),
      progress: 0,
      status: 'active',
      paymentStatus,
      //orderId,
    };

    const docRef = await addDoc(enrollmentsRef, enrollmentData);
    
    // Update course member count
    await updateCourseMemberCount(courseId, studentId, userEmail);
    
    return docRef.id;
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
};

// Update course member count
const updateCourseMemberCount = async (
  courseId: string, 
  userId: string, 
  userEmail: string
): Promise<void> => {
  try {
    const courseRef = doc(db, 'courseDrafts', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const courseData = courseSnap.data() as any;
      const currentMembers = courseData?.members || [];
      
      // Check if user is already a member
      const isAlreadyMember = currentMembers.some((member: any) => 
        member.email === userEmail || member.id === userId
      );
      
      if (!isAlreadyMember) {
        const newMember = {
          id: userId,
          email: userEmail,
          role: 'student',
          joinedAt: new Date().toISOString(),
        };
        
        await updateDoc(courseRef, {
          members: [...currentMembers, newMember],
          students: (courseData?.students || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating course members:', error);
    // Don't throw error here as enrollment is more important
  }
};

// Get user's orders
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const userOrdersQuery = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(userOrdersQuery);
    
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any;
      orders.push({
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        enrollmentDate: data?.enrollmentDate?.toDate(),
      } as Order);
    });
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

// Get user's enrollments
export const getUserEnrollments = async (userId: string): Promise<CourseEnrollment[]> => {
  try {
    const enrollmentsRef = collection(db, 'studentEnrollments');
    const userEnrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
    const querySnapshot = await getDocs(userEnrollmentsQuery);
    
    const enrollments: CourseEnrollment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any;
      enrollments.push({
        id: doc.id,
        ...data,
        enrolledAt: data?.enrolledAt?.toDate() || new Date(),
      } as CourseEnrollment);
    });
    
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
    const enrollments = await getUserEnrollments(userId);
    return enrollments.some(enrollment => 
      enrollment.courseId === courseId && enrollment.status === 'active'
    );
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
    // Create order for record keeping
    const orderId = await createOrder(courseId, userId, userEmail, courseName, 0);
    
    // Update order status to completed
    await updateOrderStatus(orderId, 'completed');
    
    // Enroll user
    const enrollmentId = await enrollUserInCourse(courseId, userId, userEmail, orderId, 'free');
    
    return enrollmentId;
  } catch (error) {
    console.error('Error enrolling in free course:', error);
    throw error;
  }
};
