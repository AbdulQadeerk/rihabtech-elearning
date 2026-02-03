import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface Announcement {
  id: number;
  courseId?: number;
  instructorId: number;
  instructorName: string;
  title: string;
  message: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  courseId?: number;
  title: string;
  message: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

class AnnouncementApiService {
  private readonly BASE_URL = `${API_BASE_URL}announcement`;

  async getCourseAnnouncements(courseId?: number): Promise<Announcement[]> {
    try {
      const url = courseId ? `${this.BASE_URL}/course/${courseId}` : `${this.BASE_URL}/course`;
      const response = await apiClient.get<Announcement[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  }

  async getAnnouncementById(announcementId: number): Promise<Announcement> {
    try {
      const response = await apiClient.get<Announcement>(`${this.BASE_URL}/${announcementId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching announcement:', error);
      throw error;
    }
  }

  async createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
    try {
      const response = await apiClient.post<Announcement>(this.BASE_URL, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  async updateAnnouncement(announcementId: number, data: Partial<CreateAnnouncementRequest>): Promise<Announcement> {
    try {
      const response = await apiClient.put<Announcement>(`${this.BASE_URL}/${announcementId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  async deleteAnnouncement(announcementId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${announcementId}`);
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }
}

export const announcementApiService = new AnnouncementApiService();

