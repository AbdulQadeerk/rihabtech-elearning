import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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

class CourseAnalyticsService {
  private PAYOUT_REQUESTS_COLLECTION = 'payoutRequests';
  private STUDENT_ENROLLMENTS_COLLECTION = 'studentEnrollments';
  private WATCH_TIME_DATA_COLLECTION = 'watchTimeData';
  private COURSES_COLLECTION = 'courseDrafts';
  private USERS_COLLECTION = 'users';

  async getCourseAnalytics(instructorId: string): Promise<CourseAnalyticsData[]> {
    try {
      console.log('Fetching course analytics for instructor:', instructorId);
      
      // Get instructor's courses
      const coursesQuery = query(
        collection(db, this.COURSES_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      
      console.log(`Found ${coursesSnapshot.docs.length} courses for instructor ${instructorId}`);
      
      const courseAnalytics: CourseAnalyticsData[] = [];
      
      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data() as any;
        const courseId = courseDoc.id;
        
        // Get revenue data for this course
        const revenueQuery = query(
          collection(db, this.PAYOUT_REQUESTS_COLLECTION),
          where('instructorId', '==', instructorId),
          where('courseId', '==', courseId)
        );
        const revenueSnapshot = await getDocs(revenueQuery);
        
        // Calculate totals
        let totalRevenue = 0;
        let platformFee = 0;
        let taxAmount = 0;
        let netEarning = 0;
        let totalWatchTime = 0;
        
        for (const revenueDoc of revenueSnapshot.docs) {
          const revenueData = revenueDoc.data() as any;
          totalRevenue += revenueData.amount || 0;
          platformFee += revenueData.platformFee || 0;
          taxAmount += revenueData.taxAmount || 0;
          netEarning += revenueData.instructorShare || 0;
          totalWatchTime += revenueData.watchTimeMinutes || 0;
        }
        
        // Get enrollment data
        const enrollmentQuery = query(
          collection(db, this.STUDENT_ENROLLMENTS_COLLECTION),
          where('courseId', '==', courseId)
        );
        const enrollmentSnapshot = await getDocs(enrollmentQuery);
        const enrollmentCount = enrollmentSnapshot.docs.length;
        
        // Get watch time data
        const watchTimeQuery = query(
          collection(db, this.WATCH_TIME_DATA_COLLECTION),
          where('courseId', '==', courseId)
        );
        const watchTimeSnapshot = await getDocs(watchTimeQuery);
        
        let studentCount = 0;
        let completionRate = 0;
        
        if (watchTimeSnapshot.docs.length > 0) {
          studentCount = watchTimeSnapshot.docs.length;
          const completedStudents = watchTimeSnapshot.docs.filter(doc => {
            const data = doc.data() as any;
            return data.completionRate && data.completionRate >= 100;
          }).length;
          completionRate = studentCount > 0 ? (completedStudents / studentCount) * 100 : 0;
        }
        
        courseAnalytics.push({
          courseId,
          courseTitle: courseData.title || 'Unknown Course',
          totalRevenue,
          platformFee,
          taxAmount,
          netEarning,
          totalWatchTime,
          studentCount,
          enrollmentCount,
          completionRate,
          averageRating: courseData.averageRating || 0,
          lastUpdated: new Date()
        });
      }
      
      console.log(`Processed ${courseAnalytics.length} course analytics`);
      return courseAnalytics;
      
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      return [];
    }
  }

  async getCourseRevenueBreakdown(instructorId: string, courseId?: string): Promise<CourseRevenueBreakdown[]> {
    try {
      console.log('Fetching course revenue breakdown for instructor:', instructorId, 'course:', courseId);
      
      let q = query(
        collection(db, this.PAYOUT_REQUESTS_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      
      if (courseId && courseId !== 'all') {
        q = query(q, where('courseId', '==', courseId));
      }
      
      const snapshot = await getDocs(q);
      
      let totalPlatformFee = 0;
      let totalTaxAmount = 0;
      let totalNetEarning = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as any;
        totalPlatformFee += data.platformFee || 0;
        totalTaxAmount += data.taxAmount || 0;
        totalNetEarning += data.instructorShare || 0;
      }
      
      const totalAmount = totalPlatformFee + totalTaxAmount + totalNetEarning;
      
      const breakdown: CourseRevenueBreakdown[] = [
        // {
        //   name: 'Platform Charges',
        //   value: totalAmount > 0 ? (totalPlatformFee / totalAmount) * 100 : 0,
        //   color: '#FFD700',
        //   amount: totalPlatformFee
        // },
        // {
        //   name: 'Tax',
        //   value: totalAmount > 0 ? (totalTaxAmount / totalAmount) * 100 : 0,
        //   color: '#DC2626',
        //   amount: totalTaxAmount
        // },
        {
          name: 'Net Earning',
          value: totalAmount > 0 ? (totalNetEarning / totalAmount) * 100 : 0,
          color: '#3B82F6',
          amount: totalNetEarning
        }
      ];
      
      console.log('Revenue breakdown:', breakdown);
      return breakdown;
      
    } catch (error) {
      console.error('Error fetching course revenue breakdown:', error);
      return [];
    }
  }

  async getCourseRevenueList(instructorId: string, courseId?: string): Promise<CourseRevenueItem[]> {
    try {
      console.log('Fetching course revenue list for instructor:', instructorId, 'course:', courseId);
      
      const courseAnalytics = await this.getCourseAnalytics(instructorId);
      
      let filteredCourses = courseAnalytics;
      if (courseId && courseId !== 'all') {
        filteredCourses = courseAnalytics.filter(course => course.courseId === courseId);
      }
      
      const revenueList: CourseRevenueItem[] = filteredCourses.map((course, index) => ({
        srNo: index + 1,
        courseName: course.courseTitle,
        taxAmount: course.taxAmount,
        platformCharges: course.platformFee,
        netEarning: course.netEarning,
        totalWatchTime: course.totalWatchTime,
        studentCount: course.studentCount
      }));
      
      console.log(`Generated ${revenueList.length} revenue list items`);
      return revenueList;
      
    } catch (error) {
      console.error('Error fetching course revenue list:', error);
      return [];
    }
  }

  // Mock data for fallback
  getMockCourseAnalytics(): CourseAnalyticsData[] {
    return [
      {
        courseId: 'course-1',
        courseTitle: 'Introduction To Digital Design Part 1',
        totalRevenue: 99999,
        platformFee: 60000,
        taxAmount: 10000,
        netEarning: 29999,
        totalWatchTime: 470,
        studentCount: 15,
        enrollmentCount: 20,
        completionRate: 75,
        averageRating: 4.5,
        lastUpdated: new Date()
      }
    ];
  }

  getMockRevenueBreakdown(): CourseRevenueBreakdown[] {
    return [
      { name: 'Platform Charges', value: 60, color: '#FFD700', amount: 60000 },
      { name: 'Tax', value: 10, color: '#DC2626', amount: 10000 },
      { name: 'Net Earning', value: 30, color: '#3B82F6', amount: 29999 }
    ];
  }

  getMockRevenueList(): CourseRevenueItem[] {
    return [
      {
        srNo: 1,
        courseName: 'Introduction To Digital Design Part 1',
        taxAmount: 10000,
        platformCharges: 60000,
        netEarning: 29999,
        totalWatchTime: 150,
        studentCount: 5
      },
      {
        srNo: 2,
        courseName: 'Introduction To Digital Design Part 1',
        taxAmount: 10000,
        platformCharges: 60000,
        netEarning: 29999,
        totalWatchTime: 60,
        studentCount: 3
      },
      {
        srNo: 3,
        courseName: 'Introduction To Digital Design Part 1',
        taxAmount: 10000,
        platformCharges: 60000,
        netEarning: 29999,
        totalWatchTime: 200,
        studentCount: 4
      },
      {
        srNo: 4,
        courseName: 'Introduction To Digital Design Part 1',
        taxAmount: 10000,
        platformCharges: 60000,
        netEarning: 29999,
        totalWatchTime: 60,
        studentCount: 3
      }
    ];
  }
}

const courseAnalyticsService = new CourseAnalyticsService();
export default courseAnalyticsService;
