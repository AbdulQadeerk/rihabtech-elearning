import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface WatchTime {
  id: number;
  studentId: number;
  courseId: number;
  courseTitle?: string;
  instructorId?: number;
  watchMinutes: number;
  isPaidContent: boolean;
  month?: string; // Format: "YYYY-MM"
  year?: number;
  timestamp: string;
  createdAt: string;
}

export interface AddWatchTimeRequest {
  courseId: number;
  watchMinutes: number;
}

export interface WatchTimeResponse {
  success: boolean;
  message: string;
  totalWatchMinutes: number;
}

class WatchTimeApiService {
  private readonly BASE_URL = `${API_BASE_URL}watch-time`;

  /**
   * Add watch time for a course
   */
  async addWatchTime(data: AddWatchTimeRequest): Promise<WatchTimeResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/add`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error adding watch time:', error);
      throw new Error(error.response?.data?.message || 'Failed to add watch time');
    }
  }

  /**
   * Get total watch time (optionally for a specific course)
   */
  async getTotalWatchTime(courseId?: number): Promise<number> {
    try {
      const url = courseId 
        ? `${this.BASE_URL}/total?courseId=${courseId}`
        : `${this.BASE_URL}/total`;
      
      const response = await apiClient.get(url);
      return response.data?.totalWatchMinutes || 0;
    } catch (error: any) {
      console.error('Error fetching total watch time:', error);
      return 0;
    }
  }

  /**
   * Get watch time history (optionally for a specific course)
   */
  async getWatchTimeHistory(courseId?: number): Promise<WatchTime[]> {
    try {
      const url = courseId
        ? `${this.BASE_URL}/history?courseId=${courseId}`
        : `${this.BASE_URL}/history`;
      
      const response = await apiClient.get(url);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching watch time history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch watch time history');
    }
  }
}

export const watchTimeApiService = new WatchTimeApiService();

