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
      // Fallback to mock data on error
      return this.getMockDashboardStats();
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
      // Try to fetch from a reviews collection if it exists
      // For now, we'll simulate dynamic data based on course enrollments
      const coursesQuery = query(
        collection(db, this.COURSES_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      if (coursesSnapshot.empty) {
        // Return mock data if no courses found
        return this.getMockReviewsData();
      }

      // Generate dynamic review data based on course performance
      const reviews: ReviewData[] = [];
      const courseIds = coursesSnapshot.docs.map(doc => doc.id);

      // Simulate reviews for each course
      courseIds.forEach((courseId, index) => {
        const courseDoc = coursesSnapshot.docs[index];
        const courseData = courseDoc.data() as any;

        // Generate 1-3 reviews per course
        const reviewCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < reviewCount; i++) {
          const studentNames = ['Mehul Shah', 'Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Neha Sharma', 'Vikram Singh'];
          const studentRoles = ['Student', 'Developer', 'Student', 'Student', 'Student', 'Student'];
          const ratings = [4, 5, 4, 5, 4, 5];
          const reviewTexts = [
            'Excellent course with practical examples. Highly recommended for beginners.',
            'Great content and clear explanations. The instructor is very knowledgeable.',
            'Very comprehensive course covering all important concepts.',
            'Good pace and easy to follow. Learned a lot from this course.',
            'Well-structured content with real-world examples.',
            'Fantastic course! The instructor explains complex topics very clearly.'
          ];

          const randomIndex = Math.floor(Math.random() * studentNames.length);
          const reviewDate = new Date();
          reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days

          reviews.push({
            id: `${courseId}-review-${i}`,
            studentName: studentNames[randomIndex],
            studentRole: studentRoles[randomIndex],
            rating: ratings[randomIndex],
            reviewText: reviewTexts[randomIndex],
            courseId: courseId,
            courseTitle: courseData.title || courseData.courseTitle || 'Unknown Course',
            reviewDate: reviewDate,
            isReplied: Math.random() > 0.7, // 30% chance of being replied to
            replyText: Math.random() > 0.7 ? 'Thank you for your feedback! We are glad you found the course helpful.' : undefined,
            replyDate: Math.random() > 0.7 ? new Date(reviewDate.getTime() + 24 * 60 * 60 * 1000) : undefined
          });
        }
      });

      // Sort by review date (newest first)
      return reviews.sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime());

    } catch (error) {
      console.error('Error getting reviews data:', error);
      // Fallback to mock data
      return this.getMockReviewsData();
    }
  }

  // Mock reviews data for fallback
  private getMockReviewsData(): ReviewData[] {
    return [
      {
        id: '1',
        studentName: 'Mehul Shah',
        studentRole: 'Student',
        rating: 5,
        reviewText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla a eleifend elit. Orci varius natoque penatibus',
        courseId: 'course-1',
        courseTitle: 'Web Development Fundamentals',
        reviewDate: new Date('2025-01-15'),
        isReplied: false
      },
      {
        id: '2',
        studentName: 'Rajesh Kumar',
        studentRole: 'Student',
        rating: 4,
        reviewText: 'Excellent course with practical examples. Highly recommended for beginners.',
        courseId: 'course-2',
        courseTitle: 'React.js Masterclass',
        reviewDate: new Date('2025-01-10'),
        isReplied: true,
        replyText: 'Thank you for your feedback! We are glad you found the course helpful.',
        replyDate: new Date('2025-01-11')
      },
      {
        id: '3',
        studentName: 'Priya Singh',
        studentRole: 'Student',
        rating: 5,
        reviewText: 'Great content and clear explanations. The instructor is very knowledgeable.',
        courseId: 'course-3',
        courseTitle: 'Node.js Backend Development',
        reviewDate: new Date('2025-01-08'),
        isReplied: false
      }
    ];
  }

  // Mock engagement data for fallback
  private getMockEngagementData(): EngagementData {
    return {
      totalMinutesWatched: 999999,
      activeLearners: 99999,
      averageCompletionRate: 75,
      monthlyStats: [
        { month: '2025-01', minutesWatched: 8000, enrollments: 15, revenue: 8000 },
        { month: '2025-02', minutesWatched: 12000, enrollments: 22, revenue: 12000 },
        { month: '2025-03', minutesWatched: 9500, enrollments: 18, revenue: 9500 }
      ],
      coursePerformance: [
        { courseId: '1', courseTitle: 'Web Development', viewed: 45, dropped: 5, amountConsumed: 85 },
        { courseId: '2', courseTitle: 'React.js', viewed: 38, dropped: 3, amountConsumed: 92 },
        { courseId: '3', courseTitle: 'Node.js', viewed: 32, dropped: 4, amountConsumed: 78 }
      ],
      deviceStats: { mobile: 45, tablet: 25, laptop: 30 }
    };
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

      // Generate realistic monthly data if no real data exists
      if (watchTimeSnapshot.empty) {
        const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
        months.forEach((month, index) => {
          // Generate varied, realistic data
          const baseMinutes = 8000 + (Math.random() * 4000 - 2000); // 6000-10000 range
          const minutesWatched = Math.round(baseMinutes + (index * 500)); // Gradual increase
          const enrollments = Math.round(15 + (Math.random() * 10 - 5)); // 10-20 range
          const revenue = Math.round(minutesWatched * 0.8); // Realistic revenue calculation

          monthlyStats.set(month, { month, minutesWatched, enrollments, revenue });
          totalMinutesWatched += minutesWatched;
        });

        // Generate realistic course performance data
        const courseTitles = [
          'Web Development Fundamentals',
          'React.js Masterclass',
          'Node.js Backend Development',
          'Python for Beginners',
          'Data Science Essentials'
        ];

        courseTitles.forEach((title, index) => {
          const viewed = Math.round(40 + (Math.random() * 30 - 15)); // 25-55 range
          const dropped = Math.round(5 + (Math.random() * 10 - 5)); // 0-10 range
          const amountConsumed = Math.round(60 + (Math.random() * 40 - 20)); // 40-80 range

          coursePerformance.set(`course-${index + 1}`, {
            courseId: `course-${index + 1}`,
            courseTitle: title,
            viewed,
            dropped,
            amountConsumed
          });
        });

        // Generate realistic device stats
        const deviceStats = {
          mobile: Math.round(35 + (Math.random() * 20 - 10)), // 25-45%
          tablet: Math.round(20 + (Math.random() * 15 - 7)),  // 13-27%
          laptop: 0 // Will be calculated
        };

        // Normalize to 100%
        const total = deviceStats.mobile + deviceStats.tablet;
        deviceStats.mobile = Math.round((deviceStats.mobile / total) * 100);
        deviceStats.tablet = Math.round((deviceStats.tablet / total) * 100);
        deviceStats.laptop = 100 - deviceStats.mobile - deviceStats.tablet;

        // Calculate realistic active learners and completion rate
        const activeLearners = Math.round(totalMinutesWatched / 100); // Realistic ratio
        const averageCompletionRate = Math.round(65 + (Math.random() * 20 - 10)); // 55-75% range

        return {
          totalMinutesWatched,
          activeLearners,
          averageCompletionRate,
          monthlyStats: Array.from(monthlyStats.values()).sort((a, b) => a.month.localeCompare(b.month)),
          coursePerformance: Array.from(coursePerformance.values()),
          deviceStats
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

      // Generate device stats (simulated based on course performance)
      const deviceStats = {
        mobile: Math.floor(Math.random() * 40) + 30, // 30-70%
        tablet: Math.floor(Math.random() * 20) + 10,  // 10-30%
        laptop: Math.floor(Math.random() * 40) + 20   // 20-60%
      };

      // Normalize device stats to 100%
      const total = deviceStats.mobile + deviceStats.tablet + deviceStats.laptop;
      deviceStats.mobile = Math.round((deviceStats.mobile / total) * 100);
      deviceStats.tablet = Math.round((deviceStats.tablet / total) * 100);
      deviceStats.laptop = 100 - deviceStats.mobile - deviceStats.tablet;

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
      // Fallback to mock data
      return this.getMockEngagementData();
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
      return ['Development', 'Design', 'Business'];
    }
  }


  // Mock data for development/testing
  getMockDashboardStats(): DashboardStats {
    return {
      totalRevenue: 9999999,
      totalEnrollments: 9999999,
      totalStudents: 9999999,
      totalCourses: 3,
      totalWatchtime: 9999999,
      currentMonthRevenue: 40000,
      currentMonthEnrollments: 999999
    };
  }


}

export const dashboardService = new DashboardService();
export default dashboardService;
