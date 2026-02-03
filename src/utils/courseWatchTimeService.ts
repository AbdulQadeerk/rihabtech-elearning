import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export interface CourseWatchTimeData {
  courseId: string;
  courseTitle: string;
  totalWatchTime: number; // in minutes
  totalStudents: number;
  averageWatchTime: number; // in minutes
  completionRate: number; // percentage
  lastAccessed: Date;
  watchTimeByMonth: { [month: string]: number };
}

export interface StudentCourseProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  watchTime: number;
  progress: number;
  lastAccessed: Date;
  status: 'active' | 'completed' | 'inactive' | 'dropped';
}

class CourseWatchTimeService {
  private COURSES_COLLECTION = 'courseDrafts';
  private ENROLLMENTS_COLLECTION = 'studentEnrollments';
  private USERS_COLLECTION = 'users';

  // Get course-wise watch time data for an instructor
  async getCourseWatchTimeData(instructorId: string): Promise<CourseWatchTimeData[]> {
    try {
      console.log(`Fetching course watch time data for instructor: ${instructorId}`);

      // Call the new API endpoint
      const response = await apiService.get<Array<{
        courseId: number;
        courseTitle: string;
        totalWatchTime: number;
        totalStudents: number;
        averageWatchTime: number;
        completionRate: number;
        lastAccessed: string;
      }>>(`${API_BASE_URL}instructor/dashboard/course-watch-time`);

      return response.map(item => ({
        courseId: item.courseId.toString(),
        courseTitle: item.courseTitle,
        totalWatchTime: item.totalWatchTime || 0,
        totalStudents: item.totalStudents || 0,
        averageWatchTime: item.averageWatchTime || 0,
        completionRate: item.completionRate || 0,
        lastAccessed: new Date(item.lastAccessed),
        watchTimeByMonth: {} // Can be populated if needed
      }));
    } catch (error) {
      console.error('Error getting course watch time data:', error);
      return [];
    }
  }

  // Legacy method - kept for backward compatibility but uses new API
  async getCourseWatchTimeDataLegacy(instructorId: string): Promise<CourseWatchTimeData[]> {
    try {
      console.log(`Fetching course watch time data for instructor: ${instructorId}`);

      // Get instructor's courses
      const coursesQuery = query(
        collection(db, this.COURSES_COLLECTION),
        where('instructorId', '==', instructorId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);

      if (coursesSnapshot.empty) {
        console.log('No courses found for instructor');
        return [];
      }

      const courseWatchTimeData: CourseWatchTimeData[] = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data() as any;
        const courseId = courseDoc.id;

        console.log(`Processing course: ${courseData.title}`);

        // Get enrollments for this course
        const enrollmentsQuery = query(
          collection(db, this.ENROLLMENTS_COLLECTION),
          where('courseId', '==', courseId),
          where('instructorId', '==', instructorId)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

        let totalWatchTime = 0;
        let totalStudents = 0;
        let completedStudents = 0;
        let lastAccessed = new Date(0);
        const watchTimeByMonth: { [month: string]: number } = {};

        // Process each enrollment
        for (const enrollmentDoc of enrollmentsSnapshot.docs) {
          const enrollmentData = enrollmentDoc.data() as any;
          const studentId = enrollmentData.studentId;
          const watchTime = enrollmentData.totalWatchTime || 0;
          const progress = enrollmentData.progress || 0;
          const lastAccessedAt = enrollmentData.lastAccessedAt?.toDate() || new Date(0);

          totalWatchTime += watchTime;
          totalStudents++;

          if (progress >= 100) {
            completedStudents++;
          }

          if (lastAccessedAt > lastAccessed) {
            lastAccessed = lastAccessedAt;
          }

          // Group watch time by month
          const monthKey = lastAccessedAt.toISOString().slice(0, 7); // YYYY-MM format
          if (!watchTimeByMonth[monthKey]) {
            watchTimeByMonth[monthKey] = 0;
          }
          watchTimeByMonth[monthKey] += watchTime;
        }

        const averageWatchTime = totalStudents > 0 ? totalWatchTime / totalStudents : 0;
        const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

        courseWatchTimeData.push({
          courseId,
          courseTitle: courseData.title || courseData.courseTitle || 'Unknown Course',
          totalWatchTime,
          totalStudents,
          averageWatchTime,
          completionRate,
          lastAccessed,
          watchTimeByMonth
        });

        console.log(`Course ${courseData.title}: ${totalStudents} students, ${totalWatchTime} minutes total watch time`);
      }

      // Sort by total watch time (descending)
      return courseWatchTimeData.sort((a, b) => b.totalWatchTime - a.totalWatchTime);

    } catch (error) {
      console.error('Error getting course watch time data:', error);
      return [];
    }
  }

  // Get detailed student progress for a specific course
  async getStudentCourseProgress(instructorId: string, courseId: string): Promise<StudentCourseProgress[]> {
    try {
      console.log(`Fetching student progress for course: ${courseId}`);

      // Get enrollments for this course
      const enrollmentsQuery = query(
        collection(db, this.ENROLLMENTS_COLLECTION),
        where('courseId', '==', courseId),
        where('instructorId', '==', instructorId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const studentProgress: StudentCourseProgress[] = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data() as any;
        const studentId = enrollmentData.studentId;

        // Get student details
        const studentDoc = await getDocs(query(
          collection(db, this.USERS_COLLECTION),
          where('id', '==', studentId)
        ));

        let studentName = 'Unknown Student';
        let status: 'active' | 'completed' | 'inactive' | 'dropped' = 'active';

        if (!studentDoc.empty) {
          const studentData = studentDoc.docs[0].data() as any;
          studentName = studentData.Name || studentData.name || 'Unknown Student';
          status = studentData.status || 'active';
        }

        const watchTime = enrollmentData.totalWatchTime || 0;
        const progress = enrollmentData.progress || 0;
        const lastAccessed = enrollmentData.lastAccessedAt?.toDate() || new Date(0);

        // Get course title
        const courseDoc = await getDocs(query(
          collection(db, this.COURSES_COLLECTION),
          where('id', '==', courseId)
        ));

        let courseTitle = 'Unknown Course';
        if (!courseDoc.empty) {
          const courseData = courseDoc.docs[0].data() as any;
          courseTitle = courseData.title || courseData.courseTitle || 'Unknown Course';
        }

        studentProgress.push({
          studentId,
          studentName,
          courseId,
          courseTitle,
          watchTime,
          progress,
          lastAccessed,
          status
        });
      }

      // Sort by watch time (descending)
      return studentProgress.sort((a, b) => b.watchTime - a.watchTime);

    } catch (error) {
      console.error('Error getting student course progress:', error);
      return [];
    }
  }

  // Get monthly watch time breakdown for a course
  async getCourseMonthlyWatchTime(instructorId: string, courseId: string): Promise<{ [month: string]: number }> {
    try {
      const enrollmentsQuery = query(
        collection(db, this.ENROLLMENTS_COLLECTION),
        where('courseId', '==', courseId),
        where('instructorId', '==', instructorId)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const monthlyWatchTime: { [month: string]: number } = {};

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data() as any;
        const lastAccessedAt = enrollmentData.lastAccessedAt?.toDate() || new Date(0);
        const watchTime = enrollmentData.totalWatchTime || 0;

        const monthKey = lastAccessedAt.toISOString().slice(0, 7); // YYYY-MM format
        if (!monthlyWatchTime[monthKey]) {
          monthlyWatchTime[monthKey] = 0;
        }
        monthlyWatchTime[monthKey] += watchTime;
      }

      return monthlyWatchTime;

    } catch (error) {
      console.error('Error getting course monthly watch time:', error);
      return {};
    }
  }

  // Get total watch time across all courses for an instructor
  async getTotalInstructorWatchTime(instructorId: string): Promise<number> {
    try {
      const courseWatchTimeData = await this.getCourseWatchTimeData(instructorId);
      return courseWatchTimeData.reduce((total, course) => total + course.totalWatchTime, 0);
    } catch (error) {
      console.error('Error getting total instructor watch time:', error);
      return 0;
    }
  }
}

export default new CourseWatchTimeService();
