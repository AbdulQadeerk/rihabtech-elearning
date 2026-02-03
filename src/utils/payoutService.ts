import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDoc, writeBatch, Timestamp } from 'firebase/firestore';

export interface PayoutRequest {
  id: string;
  instructorId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestDate: Date;
  processedDate?: Date;
  watchTimeMinutes: number;
  courseCount: number;
  month: string;
  year: number;
  notes?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  platformFee: number;
  instructorShare: number;
  taxAmount: number;
  totalEarnings: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayouts: number;
  processedPayouts: number;
  currentMonthEarnings: number;
  totalWatchTime: number;
  totalCourses: number;
  availableForPayout: number;
}

export interface WatchTimeData {
  courseId: string;
  courseTitle: string;
  watchMinutes: number;
  isPaidContent: boolean;
  month: string;
  year: number;
  instructorId: string;
  studentId: string;
  timestamp: Date;
}

export interface PayoutBreakdown {
  baseAmount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
}

export interface CourseEarnings {
  courseId: string;
  courseTitle: string;
  watchMinutes: number;
  earnings: number;
  enrollments: number;
}

class PayoutService {
  private readonly COLLECTION_NAME = 'payoutRequests';
  private readonly WATCH_TIME_COLLECTION = 'watchTimeData';
  private readonly COURSES_COLLECTION = 'courseDrafts';
  private readonly USERS_COLLECTION = 'users';

  // Calculate earnings based on watch time (BRD requirement)
  async calculateEarnings(instructorId: string, month: string, year: number): Promise<PayoutBreakdown> {
    try {
      // Get watch time data for the specified month
      const watchTimeQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('month', '==', month),
        where('year', '==', year),
        where('isPaidContent', '==', true)
      );
      
      const watchTimeSnapshot = await getDocs(watchTimeQuery);
      let totalWatchMinutes = 0;
      
      watchTimeSnapshot.forEach(doc => {
        const data = doc.data() as any;
        totalWatchMinutes += data?.watchMinutes || 0;
      });

      // Calculate earnings based on watch time
      // BRD: Revenue sharing: 60% instructor, 40% platform
      // Base calculation: ₹1 per minute of paid watch time
      const baseAmount = totalWatchMinutes * 1; // ₹1 per minute
      const taxAmount = (baseAmount * 18) / 100; // 18% tax
      const platformFee = (baseAmount * 40) / 100; // 40% platform fee
      const instructorShare = baseAmount - platformFee; // 60% instructor share
      const totalAmount = baseAmount + taxAmount;

      return {
        baseAmount,
        taxAmount,
        platformFee,
        instructorShare,
        totalAmount
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      throw new Error('Failed to calculate earnings');
    }
  }

  // Get earnings summary for instructor
  async getEarningsSummary(instructorId: string): Promise<EarningsSummary> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear();
      
      console.log(`🔍 Getting earnings summary for ${instructorId}, current month: ${currentMonth}, current year: ${currentYear}`);

      // Get all payout requests for the instructor
      const payoutQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('instructorId', '==', instructorId)
      );
      
      const payoutSnapshot = await getDocs(payoutQuery);
      
      // Sort payouts by requestDate descending (newest first) in memory
      const payouts = payoutSnapshot.docs.map(doc => {
        const docData = doc.data() as any;
        return {
          ...docData,
          requestDate: docData?.requestDate?.toDate() || new Date()
        };
      }).sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
      
      let totalEarnings = 0;
      let pendingPayouts = 0;
      let processedPayouts = 0;
      let currentMonthEarnings = 0;

      payouts.forEach((data: any) => {
        const amount = data.amount || 0;
        
        if (data.status === 'processed') {
          totalEarnings += amount;
          processedPayouts += amount;
        } else if (data.status === 'pending' || data.status === 'approved') {
          pendingPayouts += amount;
        }

        // Check if it's current month
        if (data.month === currentMonth && data.year === currentYear) {
          currentMonthEarnings += amount;
        }
      });

      // Get total watch time and courses
      const watchTimeQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('isPaidContent', '==', true)
      );
      
      const watchTimeSnapshot = await getDocs(watchTimeQuery);
      let totalWatchTime = 0;
      const uniqueCourses = new Set();

      watchTimeSnapshot.forEach(doc => {
        const data = doc.data() as any;
        totalWatchTime += data?.watchMinutes || 0;
        uniqueCourses.add(data?.courseId);
      });

      // Calculate available for payout (current month earnings)
      let availableForPayout = 0;
      try {
        const currentMonthBreakdown = await this.calculateEarnings(instructorId, currentMonth, currentYear);
        availableForPayout = currentMonthBreakdown.instructorShare;
      } catch (error) {
        console.log(`No earnings data for current month ${currentMonth} ${currentYear}, setting availableForPayout to 0`);
        availableForPayout = 0;
      }

      return {
        totalEarnings,
        pendingPayouts,
        processedPayouts,
        currentMonthEarnings,
        totalWatchTime: Math.round(totalWatchTime / 60), // Convert to hours
        totalCourses: uniqueCourses.size,
        availableForPayout
      };
    } catch (error) {
      console.error('Error getting earnings summary:', error);
      throw new Error('Failed to get earnings summary');
    }
  }

  // Get detailed course earnings for the instructor
  async getCourseEarnings(instructorId: string, month: string, year: number): Promise<CourseEarnings[]> {
    try {
      // Get watch time data for the specified month
      const watchTimeQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('month', '==', month),
        where('year', '==', year),
        where('isPaidContent', '==', true)
      );
      
      const watchTimeSnapshot = await getDocs(watchTimeQuery);
      const courseEarningsMap = new Map<string, CourseEarnings>();

      watchTimeSnapshot.forEach(doc => {
        const data = doc.data() as any;
        const courseId = data?.courseId;
        const watchMinutes = data?.watchMinutes || 0;
        const earnings = watchMinutes * 1; // ₹1 per minute

        if (courseEarningsMap.has(courseId)) {
          const existing = courseEarningsMap.get(courseId)!;
          existing.watchMinutes += watchMinutes;
          existing.earnings += earnings;
        } else {
          courseEarningsMap.set(courseId, {
            courseId,
            courseTitle: data?.courseTitle || 'Unknown Course',
            watchMinutes,
            earnings,
            enrollments: 1
          });
        }
      });

      // Get course details from Firebase
      const coursePromises = Array.from(courseEarningsMap.keys()).map(async (courseId) => {
        try {
          const courseDoc = await getDoc(doc(db, this.COURSES_COLLECTION, courseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data() as any;
            const courseEarnings = courseEarningsMap.get(courseId)!;
            courseEarnings.courseTitle = courseData?.title || courseEarnings.courseTitle;
            // You can add more course details here if needed
          }
        } catch (error) {
          console.error(`Error fetching course ${courseId}:`, error);
        }
      });

      await Promise.all(coursePromises);

      return Array.from(courseEarningsMap.values()).sort((a, b) => b.earnings - a.earnings);
    } catch (error) {
      console.error('Error getting course earnings:', error);
      throw new Error('Failed to get course earnings');
    }
  }

  // Request a new payout
  async requestPayout(instructorId: string, month: string, year: number): Promise<string> {
    try {
      // Calculate earnings for the month
      const breakdown = await this.calculateEarnings(instructorId, month, year);
      
      if (breakdown.instructorShare < 1000) {
        throw new Error('Minimum payout amount is ₹100');
      }

      // Check if there's already a pending payout for this month
      const existingPayoutQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('instructorId', '==', instructorId),
        where('month', '==', month),
        where('year', '==', year),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const existingPayoutSnapshot = await getDocs(existingPayoutQuery);
      if (!existingPayoutSnapshot.empty) {
        throw new Error('Payout request already exists for this month');
      }

      // Get watch time data for the month
      const watchTimeQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('month', '==', month),
        where('year', '==', year),
        where('isPaidContent', '==', true)
      );
      
      const watchTimeSnapshot = await getDocs(watchTimeQuery);
      let totalWatchMinutes = 0;
      const uniqueCourses = new Set();

      watchTimeSnapshot.forEach(doc => {
        const data = doc.data() as any;
        totalWatchMinutes += data?.watchMinutes || 0;
        uniqueCourses.add(data?.courseId);
      });

      // Create payout request
      const payoutData = {
        instructorId,
        amount: breakdown.instructorShare,
        status: 'pending' as const,
        requestDate: serverTimestamp(),
        watchTimeMinutes: totalWatchMinutes,
        courseCount: uniqueCourses.size,
        month,
        year,
        platformFee: breakdown.platformFee,
        instructorShare: breakdown.instructorShare,
        taxAmount: breakdown.taxAmount,
        totalEarnings: breakdown.totalAmount,
        notes: `Payout request for ${month} ${year} based on ${totalWatchMinutes} minutes of watch time`
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), payoutData);
      return docRef.id;
    } catch (error) {
      console.error('Error requesting payout:', error);
      throw error;
    }
  }

  // Get payout history for instructor
  async getPayoutHistory(instructorId: string): Promise<PayoutRequest[]> {
    try {
      const payoutQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('instructorId', '==', instructorId)
      );
      
      const snapshot = await getDocs(payoutQuery);
      
      // Sort in memory instead of using orderBy to avoid index requirement
      const payouts = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          requestDate: data?.requestDate?.toDate() || new Date(),
          processedDate: data?.processedDate?.toDate()
        };
      }) as PayoutRequest[];
      
      // Sort by requestDate descending (newest first)
      return payouts.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
    } catch (error) {
      console.error('Error getting payout history:', error);
      throw new Error('Failed to get payout history');
    }
  }

  // Check if instructor has pending payouts
  async hasPendingPayouts(instructorId: string): Promise<boolean> {
    try {
      const pendingQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('instructorId', '==', instructorId),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const snapshot = await getDocs(pendingQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking pending payouts:', error);
      return false;
    }
  }

  // Get available payout amount for current month
  async getAvailablePayoutAmount(instructorId: string): Promise<number> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear();
      
      const breakdown = await this.calculateEarnings(instructorId, currentMonth, currentYear);
      return breakdown.instructorShare;
    } catch (error) {
      console.error('Error getting available payout amount:', error);
      return 0;
    }
  }

  // Update payout status (for admin use)
  async updatePayoutStatus(payoutId: string, status: 'approved' | 'rejected' | 'processed', notes?: string): Promise<void> {
    try {
      const payoutRef = doc(db, this.COLLECTION_NAME, payoutId);
      const updateData: any = { status };
      
      if (status === 'processed') {
        updateData.processedDate = serverTimestamp();
      }
      
      if (notes) {
        updateData.notes = notes;
      }
      
      await updateDoc(payoutRef, updateData);
    } catch (error) {
      console.error('Error updating payout status:', error);
      throw new Error('Failed to update payout status');
    }
  }

  // Get monthly earnings breakdown for chart data
  async getMonthlyEarnings(instructorId: string, year: number): Promise<{ month: string; earnings: number }[]> {
    try {
      const months = [];
      for (let i = 1; i <= 12; i++) {
        const month = `${year}-${i.toString().padStart(2, '0')}`;
        months.push(month);
      }

      const earningsPromises = months.map(async (month) => {
        try {
          const breakdown = await this.calculateEarnings(instructorId, month, year);
          return { month, earnings: breakdown.instructorShare };
        } catch (error) {
          return { month, earnings: 0 };
        }
      });

      return await Promise.all(earningsPromises);
    } catch (error) {
      console.error('Error getting monthly earnings:', error);
      throw new Error('Failed to get monthly earnings');
    }
  }

  // Mock data for development/testing
  getMockEarningsSummary(): EarningsSummary {
    return {
      totalEarnings: 25000,
      pendingPayouts: 8500,
      processedPayouts: 16500,
      currentMonthEarnings: 8500,
      totalWatchTime: 1250,
      totalCourses: 3,
      availableForPayout: 8500
    };
  }

  getMockPayoutHistory(): PayoutRequest[] {
    return [
      {
        id: '1',
        instructorId: 'mock-instructor',
        amount: 8500,
        status: 'pending',
        requestDate: new Date('2025-01-15'),
        watchTimeMinutes: 450,
        courseCount: 2,
        month: '2025-01',
        year: 2025,
        platformFee: 3400,
        instructorShare: 8500,
        taxAmount: 1530,
        totalEarnings: 10000
      },
      {
        id: '2',
        instructorId: 'mock-instructor',
        amount: 8000,
        status: 'processed',
        requestDate: new Date('2024-12-15'),
        processedDate: new Date('2024-12-20'),
        watchTimeMinutes: 400,
        courseCount: 2,
        month: '2024-12',
        year: 2024,
        platformFee: 3200,
        instructorShare: 8000,
        taxAmount: 1440,
        totalEarnings: 9600
      }
    ];
  }

  getMockCourseEarnings(): CourseEarnings[] {
    return [
      {
        courseId: '1',
        courseTitle: 'Web Development Fundamentals',
        watchMinutes: 450,
        earnings: 450,
        enrollments: 25
      },
      {
        courseId: '2',
        courseTitle: 'Advanced JavaScript',
        watchMinutes: 320,
        earnings: 320,
        enrollments: 18
      }
    ];
  }
}

export const payoutService = new PayoutService();
export default payoutService;
