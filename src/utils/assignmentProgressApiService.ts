import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface AssignmentProgress {
  id: number;
  userId: number;
  courseId: number;
  sectionId: number;
  assignmentId: number;
  isCompleted: boolean;
  completedAt?: Date;
  submittedAt?: Date;
  marksObtained?: number;
  totalMarks?: number;
  percentage?: number;
  status: string; // NotStarted, InProgress, Submitted, Graded
  submission?: string;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: number;
  timeSpent?: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitAssignmentPayload {
  courseId: number;
  sectionId: number;
  assignmentId: number;
  submission: string; // JSON or text submission
  timeSpent: number; // Time spent in seconds
}

export interface AssignmentProgressResponse {
  success: boolean;
  message: string;
  progress?: AssignmentProgress;
}

class AssignmentProgressApiService {
  private readonly BASE_URL = `${API_BASE_URL}assignment-progress`;

  async getAssignmentProgress(courseId: number, assignmentId: number): Promise<AssignmentProgress | null> {
    try {
      const response = await apiClient.get<AssignmentProgress>(`${this.BASE_URL}/course/${courseId}/assignment/${assignmentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching assignment progress:', error);
      throw error;
    }
  }

  async submitAssignment(payload: SubmitAssignmentPayload): Promise<AssignmentProgressResponse> {
    try {
      const response = await apiClient.post<AssignmentProgressResponse>(`${this.BASE_URL}/submit`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  }

  async getCourseAssignmentProgress(courseId: number): Promise<AssignmentProgress[]> {
    try {
      const response = await apiClient.get<AssignmentProgress[]>(`${this.BASE_URL}/course/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching course assignment progress:', error);
      throw error;
    }
  }
}

export const assignmentProgressApiService = new AssignmentProgressApiService();


