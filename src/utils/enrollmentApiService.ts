import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface EnrollmentRequest {
  courseId: number;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollmentId?: number;
}

export interface CheckEnrollmentResponse {
  isEnrolled: boolean;
  hasAccess: boolean;
  message?: string;
}

export interface UserEnrollment {
  courseId: number;
  courseTitle: string;
  courseThumbnail?: string;
  enrolledDate: string;
  instructorName?: string;
  progress?: number; // Progress percentage (0-100)
  totalWatchTime?: number; // Total watch time in seconds
  lastAccessedAt?: string; // Last accessed date
}

class EnrollmentApiService {
  private readonly BASE_URL = `${API_BASE_URL}enrollment`;

  /**
   * Check enrollment status and access for a course
   */
  async checkEnrollment(courseId: number): Promise<CheckEnrollmentResponse> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/check/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking enrollment:', error);
      throw new Error(error.response?.data?.message || 'Failed to check enrollment');
    }
  }

  /**
   * Enroll user in a course
   */
  async enrollInCourse(courseId: number): Promise<EnrollmentResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/enroll`, { courseId });
      return response.data;
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      throw new Error(error.response?.data?.message || 'Failed to enroll in course');
    }
  }

  /**
   * Get all enrollments for the current user
   */
  async getMyEnrollments(): Promise<UserEnrollment[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/my-enrollments`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch enrollments');
    }
  }

  /**
   * Unenroll from a course
   */
  async unenrollFromCourse(courseId: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/unenroll/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error unenrolling from course:', error);
      throw new Error(error.response?.data?.message || 'Failed to unenroll from course');
    }
  }
}

export const enrollmentApiService = new EnrollmentApiService();

