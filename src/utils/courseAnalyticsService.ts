import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export interface CourseAnalyticsData {
  courseId: string;
  courseTitle: string;
  totalRevenue: number;
  platformFee: number;
  taxAmount: number;
  netEarning: number;
  totalWatchTime: number;
  studentCount: number;
  enrollmentCount: number;
  completionRate: number;
  averageRating: number;
  lastUpdated: Date;
}

export interface CourseRevenueBreakdown {
  name: string;
  value: number;
  color: string;
  amount: number;
}

export interface CourseRevenueItem {
  srNo: number;
  courseName: string;
  taxAmount: number;
  platformCharges: number;
  netEarning: number;
  totalWatchTime: number;
  studentCount: number;
}

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];

class CourseAnalyticsService {
  async getCourseAnalytics(instructorId: string): Promise<CourseAnalyticsData[]> {
    try {
      console.log('Fetching dynamic course analytics for instructor:', instructorId);

      const [coursesRes, earningsRes, sharesRes, statsRes] = await Promise.allSettled([
        apiService.get<any[]>(`${API_BASE_URL}instructor/dashboard/course-watch-time`),
        apiService.get<any[]>(`${API_BASE_URL}instructor-payout/earnings`),
        apiService.get<any[]>(`${API_BASE_URL}instructor-payout/revenue-shares`),
        apiService.get<any>(`${API_BASE_URL}instructor/dashboard/stats`)
      ]);

      const courses = coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) ? coursesRes.value : [];
      const earnings = earningsRes.status === 'fulfilled' && Array.isArray(earningsRes.value) ? earningsRes.value : [];
      const shares = sharesRes.status === 'fulfilled' && Array.isArray(sharesRes.value) ? sharesRes.value : [];
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;

      // 1. Resolve total net earnings
      const earningsTotal = earnings.reduce((sum, e) => sum + (e.earnings || e.instructorShare || 0), 0);
      const sharesTotal = shares.reduce((sum, s) => sum + (s.instructorShare || 0), 0);
      const totalNetEarnings = earningsTotal > 0 
        ? earningsTotal 
        : sharesTotal > 0 
        ? sharesTotal 
        : (stats?.totalRevenue || 0);

      // 2. Resolve platform fee and tax totals
      const totalPlatformFee = shares.reduce((sum, s) => sum + (s.platformFee || 0), 0);
      const totalTaxAmount = shares.reduce((sum, s) => sum + (s.taxAmount || 0), 0);
      const totalGrossRevenue = totalNetEarnings + totalPlatformFee + totalTaxAmount;

      const totalWatchMinutesAll = courses.reduce((sum, c) => sum + (c.totalWatchTime || 0), 0);

      const courseAnalytics: CourseAnalyticsData[] = courses.map(course => {
        const cWatch = course.totalWatchTime || 0;
        const ratio = totalWatchMinutesAll > 0 ? cWatch / totalWatchMinutesAll : 0;
        
        const cNet = ratio * totalNetEarnings;
        const cFee = ratio * totalPlatformFee;
        const cTax = ratio * totalTaxAmount;
        const cGross = ratio * totalGrossRevenue;

        const students = course.totalStudents || 0;

        return {
          courseId: course.courseId?.toString() || '',
          courseTitle: course.courseTitle || 'Untitled Course',
          totalRevenue: Math.round(cGross * 100) / 100,
          platformFee: Math.round(cFee * 100) / 100,
          taxAmount: Math.round(cTax * 100) / 100,
          netEarning: Math.round(cNet * 100) / 100,
          totalWatchTime: cWatch,
          studentCount: students,
          enrollmentCount: students,
          completionRate: course.completionRate || 0,
          averageRating: 5,
          lastUpdated: course.lastAccessed ? new Date(course.lastAccessed) : new Date()
        };
      });

      return courseAnalytics.sort((a, b) => b.totalWatchTime - a.totalWatchTime);
    } catch (error) {
      console.error('Error in getCourseAnalytics:', error);
      return [];
    }
  }

  async getCourseRevenueBreakdown(instructorId: string, courseId?: string): Promise<CourseRevenueBreakdown[]> {
    try {
      const courseAnalytics = await this.getCourseAnalytics(instructorId);

      if (courseId && courseId !== 'all') {
        const course = courseAnalytics.find(c => c.courseId === courseId);
        if (!course) return [];

        const net = course.netEarning || 0;
        const fee = course.platformFee || 0;
        const tax = course.taxAmount || 0;
        const total = net + fee + tax;

        if (total === 0) {
          return [{ name: 'No Earnings Yet', value: 100, color: '#94A3B8', amount: 0 }];
        }

        const breakdown: CourseRevenueBreakdown[] = [
          {
            name: 'Net Earning',
            value: total > 0 ? Math.round((net / total) * 100) : 100,
            color: '#10B981',
            amount: net
          }
        ];

        if (fee > 0) {
          breakdown.push({
            name: 'Platform Charges',
            value: Math.round((fee / total) * 100),
            color: '#F59E0B',
            amount: fee
          });
        }

        if (tax > 0) {
          breakdown.push({
            name: 'Tax',
            value: Math.round((tax / total) * 100),
            color: '#EF4444',
            amount: tax
          });
        }

        return breakdown;
      }

      // All Courses View: Top courses breakdown
      const activeCourses = courseAnalytics.filter(c => c.totalWatchTime > 0 || c.netEarning > 0);
      const totalNet = courseAnalytics.reduce((sum, c) => sum + c.netEarning, 0);

      if (activeCourses.length === 0 || totalNet === 0) {
        if (totalNet > 0) {
          return [{ name: 'Net Earning', value: 100, color: '#10B981', amount: totalNet }];
        }
        return [{ name: 'No Revenue Yet', value: 100, color: '#94A3B8', amount: 0 }];
      }

      // Show top active courses by net revenue share
      const topCourses = activeCourses.slice(0, 6);
      const otherCourses = activeCourses.slice(6);

      const breakdown: CourseRevenueBreakdown[] = topCourses.map((c, i) => ({
        name: c.courseTitle.length > 25 ? `${c.courseTitle.substring(0, 23)}...` : c.courseTitle,
        value: totalNet > 0 ? (c.netEarning / totalNet) * 100 : 0,
        color: PALETTE[i % PALETTE.length],
        amount: c.netEarning
      }));

      if (otherCourses.length > 0) {
        const otherSum = otherCourses.reduce((sum, c) => sum + c.netEarning, 0);
        breakdown.push({
          name: `Other (${otherCourses.length} courses)`,
          value: totalNet > 0 ? (otherSum / totalNet) * 100 : 0,
          color: '#94A3B8',
          amount: otherSum
        });
      }

      return breakdown;
    } catch (error) {
      console.error('Error in getCourseRevenueBreakdown:', error);
      return [];
    }
  }

  async getCourseRevenueList(instructorId: string, courseId?: string): Promise<CourseRevenueItem[]> {
    try {
      const courseAnalytics = await this.getCourseAnalytics(instructorId);

      let filteredCourses = courseAnalytics;
      if (courseId && courseId !== 'all') {
        filteredCourses = courseAnalytics.filter(c => c.courseId === courseId);
      }

      return filteredCourses.map((course, index) => ({
        srNo: index + 1,
        courseName: course.courseTitle,
        taxAmount: course.taxAmount,
        platformCharges: course.platformFee,
        netEarning: course.netEarning,
        totalWatchTime: Math.round(course.totalWatchTime),
        studentCount: course.studentCount
      }));
    } catch (error) {
      console.error('Error in getCourseRevenueList:', error);
      return [];
    }
  }
}

const courseAnalyticsService = new CourseAnalyticsService();
export default courseAnalyticsService;
