import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export interface DashboardStats {
  totalRevenue: number;
  totalEnrollments: number;
  totalStudents: number;
  totalCourses: number;
  currentMonthRevenue: number;
  totalWatchtime: number;
  currentMonthEnrollments: number;
}

export interface StudentData {
  id: string;
  name: string;
  email: string;
  location?: string;
  phone?: string;
  education?: string;
  enrolledDate: Date;
  enrollmentDate: Date; // Alias for enrolledDate
  numberOfCourses: number;
  status: 'active' | 'inactive' | 'completed' | 'dropped';
  lastAccessedAt: Date;
  lastActive: Date; // Alias for lastAccessedAt
  progress: number;
  course: string;
  courseId: string;
}

export interface ReviewData {
  id: string;
  studentName: string;
  studentRole: string;
  rating: number;
  reviewText: string;
  courseId: string;
  courseTitle: string;
  reviewDate: Date;
  isReplied: boolean;
  replyText?: string;
  replyDate?: Date;
}

export interface EngagementData {
  totalMinutesWatched: number;
  activeLearners: number;
  averageCompletionRate: number;
  monthlyStats: {
    month: string;
    minutesWatched: number;
    enrollments: number;
    revenue: number;
  }[];
  coursePerformance: {
    courseId: string;
    courseTitle: string;
    viewed: number;
    dropped: number;
    amountConsumed: number;
  }[];
  deviceStats: {
    mobile: number;
    tablet: number;
    laptop: number;
  };
}

export interface RevenueData {
  month: string;
  revenue: number;
  enrollments: number;
  percentage: number;
}

export interface CourseData {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  isActive: boolean;
}

class DashboardService {
  private readonly WATCH_TIME_COLLECTION = 'watchTimeData';
  private readonly COURSES_COLLECTION = 'courseDrafts';
  private readonly PAYOUT_REQUESTS_COLLECTION = 'payoutRequests';
  private readonly STUDENT_ENROLLMENTS_COLLECTION = 'studentEnrollments';
  private readonly MODULE_PROGRESS_COLLECTION = 'moduleProgress';

  // Get overview statistics
  async getDashboardStats(instructorId: string, selectedCourse: string | null): Promise<DashboardStats> {
    try {
      console.log(`Getting dashboard stats for instructor: ${instructorId}`);

      // Call the new API endpoint
      const courseIdParam = selectedCourse && selectedCourse !== "all-courses" ? parseInt(selectedCourse) : null;
      const response = await apiService.get<{
        totalRevenue: number;
        totalEnrollments: number;
        totalStudents: number;
        totalCourses: number;
        currentMonthRevenue: number;
        totalWatchtime: number;
        currentMonthEnrollments: number;
      }>(
        `${API_BASE_URL}instructor/dashboard/stats`,
        courseIdParam ? { courseId: courseIdParam } : undefined
      );

      return {
        totalRevenue: response.totalRevenue || 0,
        totalEnrollments: response.totalEnrollments || 0,
        totalStudents: response.totalStudents || 0,
        totalCourses: response.totalCourses || 0,
        totalWatchtime: response.totalWatchtime || 0,
        currentMonthRevenue: response.currentMonthRevenue || 0,
        currentMonthEnrollments: response.currentMonthEnrollments || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalRevenue: 0,
        totalEnrollments: 0,
        totalStudents: 0,
        totalCourses: 0,
        totalWatchtime: 0,
        currentMonthRevenue: 0,
        currentMonthEnrollments: 0
      };
    }
  }

  // Get students data
  async getStudentsData(instructorId: string, courseId?: string | null): Promise<StudentData[]> {
    try {
      console.log(`Getting students data for instructor: ${instructorId}, courseId: ${courseId}`);
      
      // Call the new API endpoint
      const courseIdParam = courseId && courseId !== "all" ? parseInt(courseId) : null;
      const response = await apiService.get<Array<{
        id: number;
        name: string;
        email: string;
        location?: string;
        phone?: string;
        education?: string;
        enrolledDate: string;
        numberOfCourses: number;
        status: string;
        lastAccessedAt?: string;
        progress: number;
        course: string;
        courseId: number;
      }>>(
        `${API_BASE_URL}instructor/dashboard/students`,
        courseIdParam ? { courseId: courseIdParam } : undefined
      );

      return response.map(item => ({
        id: item.id.toString(),
        name: item.name || 'Unknown Student',
        email: item.email || '',
        location: item.location,
        phone: item.phone,
        education: item.education,
        enrolledDate: new Date(item.enrolledDate),
        enrollmentDate: new Date(item.enrolledDate),
        numberOfCourses: item.numberOfCourses || 0,
        status: (item.status?.toLowerCase() || 'active') as 'active' | 'inactive' | 'completed' | 'dropped',
        lastAccessedAt: item.lastAccessedAt ? new Date(item.lastAccessedAt) : new Date(item.enrolledDate),
        lastActive: item.lastAccessedAt ? new Date(item.lastAccessedAt) : new Date(item.enrolledDate),
        progress: item.progress || 0,
        course: item.course || '',
        courseId: item.courseId.toString()
      }));
    } catch (error) {
      console.error('Error getting students data:', error);
      return [];
    }
  }


  // Get reviews data
  async getReviewsData(instructorId: string): Promise<ReviewData[]> {
    try {
      const coursesQuery = query(
        collection(db, this.COURSES_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      if (coursesSnapshot.empty) {
        return [];
      }

      // Real reviews are loaded via reviewApiService on the reviews page
      return [];
    } catch (error) {
      console.error('Error getting reviews data:', error);
      return [];
    }
  }

  // Get engagement data
  async getEngagementData(instructorId: string): Promise<EngagementData> {
    try {
      const currentYear = new Date().getFullYear();

      // Get watch time data
      const watchTimeQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('year', '==', currentYear)
      );
      const watchTimeSnapshot = await getDocs(watchTimeQuery);

      let totalMinutesWatched = 0;
      const monthlyStats = new Map<string, { month: string; minutesWatched: number; enrollments: number; revenue: number }>();
      const coursePerformance = new Map<string, { courseId: string; courseTitle: string; viewed: number; dropped: number; amountConsumed: number }>();

      if (watchTimeSnapshot.empty) {
        return {
          totalMinutesWatched: 0,
          activeLearners: 0,
          averageCompletionRate: 0,
          monthlyStats: [],
          coursePerformance: [],
          deviceStats: { mobile: 0, tablet: 0, laptop: 0 }
        };
      }

      // Process real data if it exists
      watchTimeSnapshot.forEach(doc => {
        const data = doc.data() as any;
        const watchMinutes = data.watchMinutes || 0;
        totalMinutesWatched += watchMinutes;

        // Monthly stats
        const month = data.month;
        if (!monthlyStats.has(month)) {
          monthlyStats.set(month, { month, minutesWatched: 0, enrollments: 0, revenue: 0 });
        }
        const monthStat = monthlyStats.get(month)!;
        monthStat.minutesWatched += watchMinutes;
        monthStat.revenue += watchMinutes * 1; // ₹1 per minute

        // Course performance
        const courseId = data.courseId;
        if (!coursePerformance.has(courseId)) {
          coursePerformance.set(courseId, {
            courseId,
            courseTitle: data.courseTitle || 'Unknown Course',
            viewed: 0,
            dropped: 0,
            amountConsumed: 0
          });
        }
        const courseStat = coursePerformance.get(courseId)!;
        courseStat.viewed += 1;
        courseStat.amountConsumed += watchMinutes;
      });

      // Get course enrollments for monthly stats
      const enrollmentsQuery = query(
        collection(db, this.STUDENT_ENROLLMENTS_COLLECTION),
        where('instructorId', '==', instructorId),
        where('year', '==', currentYear)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      enrollmentsSnapshot.forEach(doc => {
        const data = doc.data() as any;
        const month = data.month;
        if (monthlyStats.has(month)) {
          const monthStat = monthlyStats.get(month)!;
          monthStat.enrollments += 1;
        }
      });

      // Calculate active learners (students who watched content in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeLearnersQuery = query(
        collection(db, this.WATCH_TIME_COLLECTION),
        where('instructorId', '==', instructorId),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      const activeLearnersSnapshot = await getDocs(activeLearnersQuery);

      const activeLearnerIds = new Set();
      activeLearnersSnapshot.forEach(doc => {
        const data = doc.data() as any;
        activeLearnerIds.add(data.studentId);
      });

      // Calculate average completion rate based on watch time vs course duration
      let totalCompletionRate = 0;
      let courseCount = 0;

      coursePerformance.forEach(course => {
        // Simulate completion rate based on amount consumed
        const completionRate = Math.min((course.amountConsumed / 100) * 100, 100); // Assuming 100 minutes = 100% completion
        totalCompletionRate += completionRate;
        courseCount++;
      });

      const averageCompletionRate = courseCount > 0 ? totalCompletionRate / courseCount : 0;

      const deviceStats = { mobile: 0, tablet: 0, laptop: 0 };

      return {
        totalMinutesWatched,
        activeLearners: activeLearnerIds.size,
        averageCompletionRate: Math.round(averageCompletionRate),
        monthlyStats: Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month)),
        coursePerformance: Array.from(coursePerformance.values()),
        deviceStats
      };

    } catch (error) {
      console.error('Error getting engagement data:', error);
      return {
        totalMinutesWatched: 0,
        activeLearners: 0,
        averageCompletionRate: 0,
        monthlyStats: [],
        coursePerformance: [],
        deviceStats: { mobile: 0, tablet: 0, laptop: 0 }
      };
    }
  }

  // Get revenue statistics for charts
  async getRevenueStatistics(instructorId: string, year: number): Promise<RevenueData[]> {
    try {
      // Call the new API endpoint
      const response = await apiService.get<Array<{
        month: string;
        revenue: number;
        enrollments: number;
        percentage: number;
      }>>(
        `${API_BASE_URL}instructor/dashboard/revenue-statistics`,
        { year }
      );

      return response.map(item => ({
        month: item.month,
        revenue: item.revenue || 0,
        enrollments: item.enrollments || 0,
        percentage: item.percentage || 0
      }));
    } catch (error) {
      console.error('Error getting revenue statistics:', error);
      // Return empty data for all 12 months on error
      return Array.from({ length: 12 }, (_, i) => ({
        month: (i + 1).toString().padStart(2, '0'),
        revenue: 0,
        enrollments: 0,
        percentage: 0
      }));
    }
  }

  // Get courses data for dropdown
  async getCoursesData(instructorId: string): Promise<CourseData[]> {
    try {
      console.log(`Getting courses data for instructor: ${instructorId}`);
      
      // Call the new API endpoint
      const response = await apiService.get<Array<{
        id: number;
        title: string;
        category: string;
        subCategory: string;
        isActive: boolean;
      }>>(`${API_BASE_URL}instructor/dashboard/courses`);

      return response.map(item => ({
        id: item.id.toString(),
        title: item.title || 'Unknown Course',
        category: item.category || '',
        subcategory: item.subCategory || '',
        isActive: item.isActive !== false
      })).sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      console.error('Error getting courses data:', error);
      return [];
    }
  }

  // Get course categories for filtering
  async getCourseCategories(instructorId: string): Promise<string[]> {
    try {
      const coursesQuery = query(
        collection(db, this.COURSES_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      if (coursesSnapshot.empty) {
        return ['Development', 'Design', 'Business'];
      }

      const categories = new Set<string>();
      coursesSnapshot.forEach(doc => {
        const data = doc.data() as any;
        if (data.category) {
          categories.add(data.category);
        }
      });

      return Array.from(categories).sort();

    } catch (error) {
      console.error('Error getting course categories:', error);
      return [];
    }
  }

}

export const dashboardService = new DashboardService();
export default dashboardService;
