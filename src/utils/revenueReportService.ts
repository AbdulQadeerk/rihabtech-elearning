import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export interface RevenueTransaction {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  watchTimeMinutes: number;
  courseCount: number;
  month: string;
  year: number;
  platformFee: number;
  instructorShare: number;
  taxAmount: number;
  totalEarnings: number;
  processedDate?: Date;
  requestDate?: Date;
  instructorId: string;
  notes?: string;
  courseId?: string;
  courseTitle?: string;
}

export interface CourseRevenueData {
  courseId: string;
  courseTitle: string;
  totalRevenue: number;
  totalStudents: number;
  totalWatchTime: number;
  averageRevenue: number;
  completionRate: number;
  lastActivity: Date;
  monthlyRevenue: { month: string; revenue: number }[];
  enrollments: number;
  price: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  students: number;
  courses: number;
  watchTime: number;
  growth: number;
  enrollments: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalPending: number;
  totalProcessed: number;
  totalWatchTime: number;
  totalStudents: number;
  totalCourses: number;
  averageRevenuePerStudent: number;
  averageWatchTimePerStudent: number;
  completionRate: number;
  monthlyGrowth: number;
}

class RevenueReportService {
  async getRevenueTransactions(
    instructorId: string, 
    period: number = 12, 
    status?: string,
    courseId?: string
  ): Promise<RevenueTransaction[]> {
    try {
      console.log('Fetching dynamic revenue transactions for instructor:', instructorId);

      const [payoutsRes, sharesRes, monthlyRes] = await Promise.allSettled([
        apiService.get<any[]>(`${API_BASE_URL}instructor-payout/payouts`),
        apiService.get<any[]>(`${API_BASE_URL}instructor-payout/revenue-shares`),
        apiService.get<any[]>(`${API_BASE_URL}instructor/dashboard/monthly-revenue?year=${new Date().getFullYear()}`)
      ]);

      const payouts = payoutsRes.status === 'fulfilled' && Array.isArray(payoutsRes.value) ? payoutsRes.value : [];
      const shares = sharesRes.status === 'fulfilled' && Array.isArray(sharesRes.value) ? sharesRes.value : [];
      const monthly = monthlyRes.status === 'fulfilled' && Array.isArray(monthlyRes.value) ? monthlyRes.value : [];

      const transactions: RevenueTransaction[] = [];
      const seenKeys = new Set<string>();

      // 1. Process actual payout requests
      for (const p of payouts) {
        const monthStr = p.month?.toString() || '';
        const yearNum = p.year || new Date().getFullYear();
        const key = `payout-${p.id}`;
        seenKeys.add(`${monthStr}-${yearNum}`);

        const pStatus = (p.status?.toLowerCase() || 'pending') as any;
        const reqDate = p.requestedDate ? new Date(p.requestedDate) : new Date(yearNum, 0, 1);
        const procDate = (pStatus === 'processed' && p.processedDate) ? new Date(p.processedDate) : undefined;

        transactions.push({
          id: key,
          amount: p.amount || p.netAmount || 0,
          status: pStatus,
          watchTimeMinutes: p.totalWatchMinutes || 0,
          courseCount: p.totalCourses || 1,
          month: monthStr,
          year: yearNum,
          platformFee: p.platformFee || 0,
          instructorShare: p.netAmount || p.amount || 0,
          taxAmount: p.taxAmount || 0,
          totalEarnings: p.amount || p.netAmount || 0,
          processedDate: procDate,
          requestDate: reqDate,
          instructorId: instructorId,
          notes: p.notes || ''
        });
      }

      // 2. Process admin calculated revenue shares
      for (const s of shares) {
        const monthStr = s.month?.toString() || '';
        const yearNum = s.year || new Date().getFullYear();
        const dedupeKey = `${monthStr}-${yearNum}`;
        if (seenKeys.has(dedupeKey)) continue; // avoid double counting if a payout already exists for this month

        const date = s.calculatedAt ? new Date(s.calculatedAt) : new Date(yearNum, 0, 1);
        const sStatus = s.status?.toLowerCase();
        const finalStatus = (sStatus === 'processed' || sStatus === 'approved') ? sStatus : 'pending';

        transactions.push({
          id: `share-${s.id || dedupeKey}`,
          amount: s.baseAmount || s.instructorShare || 0,
          status: finalStatus as any,
          watchTimeMinutes: s.totalWatchMinutes || s.instructorWatchMinutes || s.watchMinutes || 0,
          courseCount: 1,
          month: monthStr,
          year: yearNum,
          platformFee: s.platformFee || 0,
          instructorShare: s.instructorShare || 0,
          taxAmount: s.taxAmount || 0,
          totalEarnings: s.instructorShare || 0,
          processedDate: finalStatus === 'processed' && s.calculatedAt ? new Date(s.calculatedAt) : undefined,
          requestDate: undefined,
          instructorId: instructorId,
          notes: `Revenue Share Calculation (${monthStr}/${yearNum})`
        });
        seenKeys.add(dedupeKey);
      }

      // 3. If no payouts or shares but monthly revenue exists
      if (transactions.length === 0) {
        for (const m of monthly) {
          if ((m.totalInstructorShare || 0) > 0 || (m.totalWatchTime || 0) > 0) {
            const mParts = (m.month || '').split('-');
            const mMonth = mParts.length > 1 ? mParts[1] : m.month || '01';
            const mYear = m.year || new Date().getFullYear();

            transactions.push({
              id: `monthly-${m.month}`,
              amount: m.totalRevenue || m.totalInstructorShare || 0,
              status: 'pending',
              watchTimeMinutes: m.totalWatchTime || 0,
              courseCount: 1,
              month: mMonth,
              year: mYear,
              platformFee: m.totalPlatformFee || 0,
              instructorShare: m.totalInstructorShare || 0,
              taxAmount: m.totalTax || 0,
              totalEarnings: m.totalInstructorShare || 0,
              processedDate: undefined,
              requestDate: new Date(mYear, parseInt(mMonth, 10) - 1, 1),
              instructorId: instructorId,
              notes: `Monthly Earnings for ${m.month}`
            });
          }
        }
      }

      // Apply status and course filters if passed
      let filtered = transactions;
      if (status && status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
      }
      if (courseId && courseId !== 'all') {
        filtered = filtered.filter(t => t.courseId === courseId);
      }

      return filtered.sort((a, b) => {
        const mNumA = a.month.includes('-') ? parseInt(a.month.split('-')[1], 10) : parseInt(a.month, 10);
        const mNumB = b.month.includes('-') ? parseInt(b.month.split('-')[1], 10) : parseInt(b.month, 10);
        const valA = (a.year || 0) * 100 + (!isNaN(mNumA) ? mNumA : 0);
        const valB = (b.year || 0) * 100 + (!isNaN(mNumB) ? mNumB : 0);
        return valB - valA;
      });
    } catch (error) {
      console.error('Error fetching dynamic revenue transactions:', error);
      return [];
    }
  }

  async getCourseRevenueData(instructorId: string): Promise<CourseRevenueData[]> {
    try {
      console.log('Fetching dynamic course revenue data for instructor:', instructorId);

      const [coursesRes, earningsRes, statsRes] = await Promise.allSettled([
        apiService.get<any[]>(`${API_BASE_URL}instructor/dashboard/course-watch-time`),
        apiService.get<any[]>(`${API_BASE_URL}instructor-payout/earnings`),
        apiService.get<any>(`${API_BASE_URL}instructor/dashboard/stats`)
      ]);

      const courses = coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) ? coursesRes.value : [];
      const earnings = earningsRes.status === 'fulfilled' && Array.isArray(earningsRes.value) ? earningsRes.value : [];
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;

      // Calculate total revenue pool for this instructor
      const totalEarningsFromList = earnings.reduce((sum, e) => sum + (e.earnings || e.instructorShare || 0), 0);
      const totalInstructorRevenue = totalEarningsFromList > 0 
        ? totalEarningsFromList 
        : (stats?.totalRevenue || 0);

      const totalWatchMinutesAll = courses.reduce((sum, c) => sum + (c.totalWatchTime || 0), 0);

      return courses.map(course => {
        const cWatch = course.totalWatchTime || 0;
        const cShare = totalWatchMinutesAll > 0 
          ? (cWatch / totalWatchMinutesAll) * totalInstructorRevenue 
          : 0;

        const students = course.totalStudents || 0;

        return {
          courseId: course.courseId?.toString() || '',
          courseTitle: course.courseTitle || 'Untitled Course',
          totalRevenue: cShare,
          totalStudents: students,
          totalWatchTime: cWatch,
          averageRevenue: students > 0 ? cShare / students : 0,
          completionRate: course.completionRate || 0,
          lastActivity: course.lastAccessed ? new Date(course.lastAccessed) : new Date(),
          monthlyRevenue: [],
          enrollments: students,
          price: 0
        };
      });
    } catch (error) {
      console.error('Error fetching dynamic course revenue data:', error);
      return [];
    }
  }

  async getMonthlyTrends(instructorId: string, period: number = 12): Promise<MonthlyTrend[]> {
    try {
      console.log('Fetching dynamic monthly trends for instructor:', instructorId);
      const currentYear = new Date().getFullYear();

      const [monthlyCurRes, monthlyPrevRes] = await Promise.allSettled([
        apiService.get<any[]>(`${API_BASE_URL}instructor/dashboard/monthly-revenue?year=${currentYear}`),
        apiService.get<any[]>(`${API_BASE_URL}instructor/dashboard/monthly-revenue?year=${currentYear - 1}`)
      ]);

      const curList = monthlyCurRes.status === 'fulfilled' && Array.isArray(monthlyCurRes.value) ? monthlyCurRes.value : [];
      const prevList = monthlyPrevRes.status === 'fulfilled' && Array.isArray(monthlyPrevRes.value) ? monthlyPrevRes.value : [];
      const allMonthly = [...prevList, ...curList];

      const trends: MonthlyTrend[] = [];
      let prevRevenue = 0;

      for (const m of allMonthly) {
        const rev = m.totalInstructorShare || m.totalRevenue || 0;
        let growth = 0;
        if (prevRevenue > 0) {
          growth = ((rev - prevRevenue) / prevRevenue) * 100;
        }
        prevRevenue = rev;

        trends.push({
          month: m.month,
          revenue: rev,
          students: 0,
          courses: 0,
          watchTime: m.totalWatchTime || 0,
          growth: growth,
          enrollments: 0
        });
      }

      return trends.slice(-period);
    } catch (error) {
      console.error('Error fetching dynamic monthly trends:', error);
      return [];
    }
  }

  async getRevenueAnalytics(instructorId: string, period: number = 12): Promise<RevenueAnalytics> {
    try {
      const [txns, courses, trends] = await Promise.all([
        this.getRevenueTransactions(instructorId, period),
        this.getCourseRevenueData(instructorId),
        this.getMonthlyTrends(instructorId, period)
      ]);

      const totalRevenue = txns.reduce((sum, t) => sum + (t.totalEarnings || t.amount || 0), 0);
      const totalPending = txns
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + (t.totalEarnings || t.amount || 0), 0);
      const totalProcessed = txns
        .filter(t => t.status === 'processed' || t.status === 'approved')
        .reduce((sum, t) => sum + (t.totalEarnings || t.amount || 0), 0);
      const totalWatchTime = courses.reduce((sum, c) => sum + c.totalWatchTime, 0);
      const totalStudents = courses.reduce((sum, c) => sum + c.totalStudents, 0);
      const totalCourses = courses.length;

      const averageRevenuePerStudent = totalStudents > 0 ? totalRevenue / totalStudents : 0;
      const averageWatchTimePerStudent = totalStudents > 0 ? totalWatchTime / totalStudents : 0;
      const completionRate = totalCourses > 0 
        ? courses.reduce((sum, c) => sum + c.completionRate, 0) / totalCourses 
        : 0;

      let monthlyGrowth = 0;
      if (trends.length >= 2) {
        const cur = trends[trends.length - 1];
        const prev = trends[trends.length - 2];
        if (prev.revenue > 0) {
          monthlyGrowth = ((cur.revenue - prev.revenue) / prev.revenue) * 100;
        }
      }

      return {
        totalRevenue,
        totalPending,
        totalProcessed,
        totalWatchTime,
        totalStudents,
        totalCourses,
        averageRevenuePerStudent,
        averageWatchTimePerStudent,
        completionRate,
        monthlyGrowth
      };
    } catch (error) {
      console.error('Error calculating dynamic revenue analytics:', error);
      return {
        totalRevenue: 0,
        totalPending: 0,
        totalProcessed: 0,
        totalWatchTime: 0,
        totalStudents: 0,
        totalCourses: 0,
        averageRevenuePerStudent: 0,
        averageWatchTimePerStudent: 0,
        completionRate: 0,
        monthlyGrowth: 0
      };
    }
  }
}

const revenueReportService = new RevenueReportService();
export default revenueReportService;
