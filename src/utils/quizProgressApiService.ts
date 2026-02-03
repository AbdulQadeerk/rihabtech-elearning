import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface QuizProgress {
  id: number;
  userId: number;
  courseId: number;
  sectionId: number;
  lectureId?: number;
  quizId: number;
  isCompleted: boolean;
  completedAt?: Date;
  attempts: number;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  timeSpent?: number;
  lastAttemptedAt?: Date;
  answers?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitQuizPayload {
  courseId: number;
  sectionId: number;
  lectureId?: number;
  quizId: number;
  answers: string; // JSON array of answers
  timeSpent: number; // Time spent in seconds
}

export interface QuizProgressResponse {
  success: boolean;
  message: string;
  progress?: QuizProgress;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
}

class QuizProgressApiService {
  private readonly BASE_URL = `${API_BASE_URL}quiz-progress`;

  async getQuizProgress(courseId: number, quizId: number): Promise<QuizProgress | null> {
    try {
      const response = await apiClient.get<QuizProgress>(`${this.BASE_URL}/course/${courseId}/quiz/${quizId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching quiz progress:', error);
      throw error;
    }
  }

  async submitQuiz(payload: SubmitQuizPayload): Promise<QuizProgressResponse> {
    try {
      const response = await apiClient.post<QuizProgressResponse>(`${this.BASE_URL}/submit`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  async getCourseQuizProgress(courseId: number): Promise<QuizProgress[]> {
    try {
      const response = await apiClient.get<QuizProgress[]>(`${this.BASE_URL}/course/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching course quiz progress:', error);
      throw error;
    }
  }
}

export const quizProgressApiService = new QuizProgressApiService();


