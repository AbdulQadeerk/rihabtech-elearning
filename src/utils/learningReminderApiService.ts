import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface LearningReminder {
  id: number;
  userId: number;
  courseId?: number;
  courseTitle?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'once';
  time: string;
  selectedDays?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearningReminderRequest {
  courseId?: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'once';
  time: string;
  selectedDays?: string[];
  isActive?: boolean;
}

class LearningReminderApiService {
  private readonly BASE_URL = `${API_BASE_URL}learning-reminder`;

  async getUserReminders(): Promise<LearningReminder[]> {
    try {
      const response = await apiClient.get<LearningReminder[]>(this.BASE_URL);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  async getReminderById(reminderId: number): Promise<LearningReminder> {
    try {
      const response = await apiClient.get<LearningReminder>(`${this.BASE_URL}/${reminderId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reminder:', error);
      throw error;
    }
  }

  async createReminder(data: CreateLearningReminderRequest): Promise<LearningReminder> {
    try {
      const response = await apiClient.post<LearningReminder>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  async updateReminder(reminderId: number, data: Partial<CreateLearningReminderRequest>): Promise<LearningReminder> {
    try {
      const response = await apiClient.put<LearningReminder>(`${this.BASE_URL}/${reminderId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${reminderId}`);
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
}

export const learningReminderApiService = new LearningReminderApiService();

