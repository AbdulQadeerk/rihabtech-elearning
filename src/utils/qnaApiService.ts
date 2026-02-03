import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface QNA {
  id: number;
  courseId: number;
  userId: number;
  userName: string;
  userEmail: string;
  parentId?: number;
  question: string;
  answer?: string;
  answeredBy?: number;
  answeredByName?: string;
  answeredAt?: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: QNA[];
}

export interface CreateQNARequest {
  courseId: number;
  parentId?: number;
  question: string;
}

export interface AnswerQNARequest {
  answer: string;
  isResolved?: boolean;
}

class QNAApiService {
  private readonly BASE_URL = `${API_BASE_URL}qna`;

  async getCourseQNA(courseId: number): Promise<QNA[]> {
    try {
      const response = await apiClient.get<QNA[]>(`${this.BASE_URL}/course/${courseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching QNA:', error);
      throw error;
    }
  }

  async getQNAById(qnaId: number): Promise<QNA> {
    try {
      const response = await apiClient.get<QNA>(`${this.BASE_URL}/${qnaId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching QNA:', error);
      throw error;
    }
  }

  async createQNA(data: CreateQNARequest): Promise<QNA> {
    try {
      const response = await apiClient.post<QNA>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating QNA:', error);
      throw error;
    }
  }

  async answerQNA(qnaId: number, data: AnswerQNARequest): Promise<QNA> {
    try {
      const response = await apiClient.post<QNA>(`${this.BASE_URL}/${qnaId}/answer`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error answering QNA:', error);
      throw error;
    }
  }

  async deleteQNA(qnaId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${qnaId}`);
    } catch (error: any) {
      console.error('Error deleting QNA:', error);
      throw error;
    }
  }
}

export const qnaApiService = new QNAApiService();

