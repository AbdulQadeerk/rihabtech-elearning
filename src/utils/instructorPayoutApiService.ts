import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

// Interfaces matching the component expectations
export interface PayoutRequest {
  id: string | number;
  instructorId: string | number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'Pending' | 'Approved' | 'Rejected' | 'Processed';
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
  payoutRequestId?: string;
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

export interface PayoutBreakdown {
  baseAmount: number;
  taxAmount: number;
  platformFee: number;
  instructorShare: number;
  totalAmount: number;
  totalWatchMinutes?: number;
  revenuePerMinute?: number;
  courseBreakdown?: CourseEarnings[];
}

export interface CourseEarnings {
  courseId: number | string;
  courseTitle: string;
  watchMinutes: number;
  earnings: number;
  enrollments: number;
}

export interface InstructorEarnings {
  month: string;
  year: number;
  totalEarnings: number;
  totalWatchMinutes: number;
  totalCourses: number;
}

export interface InstructorRevenueShare {
  id: number;
  instructorId: number;
  courseId: number;
  subscriptionId?: string;
  planId?: number;
  month: string;
  year: number;
  totalWatchMinutes: number;
  totalLearners: number;
  baseAmount: number;
  taxPercentage: number;
  taxAmount: number;
  platformFeePercentage: number;
  platformFee: number;
  instructorShare: number;
  revenuePerMinute?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

class InstructorPayoutApiService {
  private readonly BASE_URL = `${API_BASE_URL}instructor-payout`;

  // Record watch time (usually called from lecture progress tracking)
  async recordWatchTime(courseId: number, lectureId: number, watchTime: number): Promise<void> {
    try {
      console.log('📤 API Call - Recording watch time:', {
        url: `${this.BASE_URL}/watch-time/record`,
        payload: { courseId, lectureId, watchTime }
      });
      
      const response = await apiClient.post(`${this.BASE_URL}/watch-time/record`, {
        courseId,
        lectureId,
        watchTime // in seconds
      });
      
      console.log('✅ API Response - Watch time recorded:', response.data);
    } catch (error: any) {
      console.error('❌ API Error recording watch time:', {
        error,
        message: error?.response?.data || error?.message,
        status: error?.response?.status,
        courseId,
        lectureId,
        watchTime
      });
      // Don't throw - watch time recording is not critical
    }
  }

  // Get payout breakdown for a specific month/year
  async getPayoutBreakdown(month: string, year: number): Promise<PayoutBreakdown> {
    try {
      const response = await apiClient.get<PayoutBreakdown>(`${this.BASE_URL}/breakdown/${month}/${year}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting payout breakdown:', error);
      throw error;
    }
  }

  // Get revenue shares
  async getRevenueShares(month?: string, year?: number): Promise<InstructorRevenueShare[]> {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year.toString());
      
      const response = await apiClient.get<InstructorRevenueShare[]>(
        `${this.BASE_URL}/revenue-shares?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting revenue shares:', error);
      throw error;
    }
  }

  // Request a payout
  async requestPayout(month: string, year: number): Promise<PayoutRequest> {
    try {
      const response = await apiClient.post<PayoutRequest>(`${this.BASE_URL}/request`, {
        month,
        year
      });
      return this.mapToPayoutRequest(response.data);
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      throw error;
    }
  }

  // Get payout history
  async getPayoutHistory(status?: string): Promise<PayoutRequest[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get<PayoutRequest[]>(`${this.BASE_URL}/payouts${params}`);
      return response.data.map(p => this.mapToPayoutRequest(p));
    } catch (error: any) {
      console.error('Error getting payout history:', error);
      throw error;
    }
  }

  // Get earnings summary
  async getEarningsSummary(year?: number): Promise<EarningsSummary> {
    try {
      const params = year ? `?year=${year}` : '';
      const earnings = await apiClient.get<InstructorEarnings[]>(`${this.BASE_URL}/earnings${params}`);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthData = earnings.data.find(e => e.month === currentMonth);
      
      // Get payout history to calculate pending/processed
      const payouts = await this.getPayoutHistory();
      const pendingPayouts = payouts.filter(p => 
        p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'approved'
      );
      const processedPayouts = payouts.filter(p => p.status.toLowerCase() === 'processed');

      // Calculate totals
      const totalEarnings = earnings.data.reduce((sum, e) => sum + e.totalEarnings, 0);
      const currentMonthEarnings = currentMonthData?.totalEarnings || 0;
      const totalWatchTime = earnings.data.reduce((sum, e) => sum + e.totalWatchMinutes, 0);
      const totalCourses = earnings.data.reduce((sum, e) => sum + e.totalCourses, 0);
      const availableForPayout = pendingPayouts.reduce((sum, p) => sum + p.instructorShare, 0) + 
                                  (currentMonthData?.totalEarnings || 0);

      return {
        totalEarnings,
        pendingPayouts: pendingPayouts.length,
        processedPayouts: processedPayouts.length,
        currentMonthEarnings,
        totalWatchTime,
        totalCourses,
        availableForPayout
      };
    } catch (error: any) {
      console.error('Error getting earnings summary:', error);
      throw error;
    }
  }

  // Get total watch minutes for a month
  async getTotalWatchMinutes(month: string, year: number): Promise<number> {
    try {
      const response = await apiClient.get<{ totalWatchMinutes: number }>(
        `${this.BASE_URL}/watch-minutes/${month}/${year}`
      );
      return response.data.totalWatchMinutes;
    } catch (error: any) {
      console.error('Error getting total watch minutes:', error);
      return 0;
    }
  }

  // Get course earnings for a month
  async getCourseEarnings(month: string, year: number): Promise<CourseEarnings[]> {
    try {
      const response = await apiClient.get<CourseEarnings[]>(
        `${this.BASE_URL}/course-earnings/${month}/${year}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting course earnings:', error);
      return [];
    }
  }

  // Get monthly earnings for analytics
  async getMonthlyEarnings(year: number): Promise<{ month: string; earnings: number }[]> {
    try {
      const response = await apiClient.get<InstructorEarnings[]>(`${this.BASE_URL}/earnings?year=${year}`);
      return response.data.map(e => ({
        month: e.month,
        earnings: e.totalEarnings
      }));
    } catch (error: any) {
      console.error('Error getting monthly earnings:', error);
      return [];
    }
  }

  // Map API response to PayoutRequest interface
  private mapToPayoutRequest(data: any): PayoutRequest {
    return {
      id: data.id || data.payoutRequestId || '',
      instructorId: data.instructorId || 0,
      amount: data.instructorShare || 0,
      status: (data.status || 'pending').toLowerCase() as any,
      requestDate: data.requestedAt ? new Date(data.requestedAt) : new Date(data.createdAt || new Date()),
      processedDate: data.processedAt ? new Date(data.processedAt) : undefined,
      watchTimeMinutes: data.totalWatchMinutes || 0,
      courseCount: data.totalCourses || 0,
      month: data.month || '',
      year: data.year || new Date().getFullYear(),
      notes: data.notes,
      bankDetails: data.bankAccountNumber ? {
        accountNumber: data.bankAccountNumber,
        ifscCode: data.ifscode || '',
        accountHolderName: data.accountHolderName || '',
        bankName: data.bankName || ''
      } : undefined,
      platformFee: data.platformFee || 0,
      instructorShare: data.instructorShare || 0,
      taxAmount: data.taxAmount || 0,
      totalEarnings: data.baseAmount || 0,
      payoutRequestId: data.payoutRequestId
    };
  }

  // Calculate earnings (alias for getPayoutBreakdown to match old interface)
  async calculateEarnings(month: string, year: number): Promise<PayoutBreakdown> {
    return this.getPayoutBreakdown(month, year);
  }

  // Mock data methods (for fallback)
  getMockEarningsSummary(): EarningsSummary {
    return {
      totalEarnings: 0,
      pendingPayouts: 0,
      processedPayouts: 0,
      currentMonthEarnings: 0,
      totalWatchTime: 0,
      totalCourses: 0,
      availableForPayout: 0
    };
  }

  getMockPayoutHistory(): PayoutRequest[] {
    return [];
  }

  getMockCourseEarnings(): CourseEarnings[] {
    return [];
  }
}

export const instructorPayoutApiService = new InstructorPayoutApiService();

// Export default for backward compatibility with old payoutService
export default instructorPayoutApiService;
