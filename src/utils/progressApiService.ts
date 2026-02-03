import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface StudentProgress {
  id: number;
  userId: number;
  courseId: number;
  sectionIndex: number;
  lectureIndex: number;
  currentSectionId?: number;
  currentLectureId?: number;
  progress: number; // 0-100
  totalLectures: number;
  completedLecturesCount: number;
  totalWatchTime: number; // in seconds
  completedSections: number[];
  completedLectures: number[]; // Array of lecture IDs
  lastAccessedAt?: string;
  lastPosition?: number; // Last position in current lecture (seconds)
  createdAt: string;
  updatedAt: string;
}

export interface LectureProgress {
  id: number;
  userId: number;
  courseId: number;
  sectionId: number;
  lectureId: number;
  isCompleted: boolean;
  completedAt?: string;
  watchTime: number; // Total watch time in seconds
  lastPosition: number; // Last position in video (seconds)
  totalWatchTime: number; // Cumulative watch time
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLectureProgressRequest {
  courseId: number;
  sectionId: number;
  lectureId: number;
  currentPosition: number; // Current position in video (seconds)
  watchTime: number; // Watch time in this session (seconds)
  isCompleted: boolean;
}

export interface WatchSession {
  id: number;
  userId: number;
  courseId: number;
  sectionId: number;
  lectureId: number;
  sessionStart: string;
  sessionEnd?: string;
  duration: number; // Duration in seconds
  startPosition: number; // Start position in video (seconds)
  endPosition?: number; // End position in video (seconds)
  watchTime: number; // Actual watch time (excluding pauses) in seconds
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface StartWatchSessionRequest {
  courseId: number;
  sectionId: number;
  lectureId: number;
  startPosition: number;
}

export interface EndWatchSessionRequest {
  sessionId: number;
  endPosition: number;
  watchTime: number; // Actual watch time in seconds
}

class ProgressApiService {
  private readonly BASE_URL = `${API_BASE_URL}progress`;
  private readonly LECTURE_PROGRESS_URL = `${API_BASE_URL}lecture-progress`;
  private readonly WATCH_SESSION_URL = `${API_BASE_URL}watch-session`;

  /**
   * Get overall course progress for a user
   */
  async getProgress(courseId: number): Promise<StudentProgress | null> {
    try {
      const response = await apiClient.get<StudentProgress>(`${this.BASE_URL}/course/${courseId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching progress:', error);
      throw error;
    }
  }

  /**
   * Update overall course progress
   */
  async updateProgress(data: {
    courseId: number;
    sectionIndex: number;
    lectureIndex: number;
    isCompleted: boolean;
  }): Promise<StudentProgress> {
    try {
      const response = await apiClient.post<{ success: boolean; progress: StudentProgress }>(
        `${this.BASE_URL}/update`,
        data
      );
      return response.data.progress;
    } catch (error: any) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get all progress for the current user
   */
  async getMyProgress(): Promise<StudentProgress[]> {
    try {
      const response = await apiClient.get<StudentProgress[]>(`${this.BASE_URL}/my-progress`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching my progress:', error);
      throw error;
    }
  }

  /**
   * Get lecture progress for a specific lecture
   */
  async getLectureProgress(courseId: number, lectureId: number): Promise<LectureProgress | null> {
    try {
      const response = await apiClient.get<LectureProgress>(
        `${this.LECTURE_PROGRESS_URL}/course/${courseId}/lecture/${lectureId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching lecture progress:', error);
      throw error;
    }
  }

  /**
   * Update lecture progress (watch time, position, completion)
   */
  async updateLectureProgress(data: UpdateLectureProgressRequest): Promise<LectureProgress> {
    try {
      const response = await apiClient.post<{ success: boolean; progress: LectureProgress }>(
        `${this.LECTURE_PROGRESS_URL}/update`,
        data
      );
      return response.data.progress;
    } catch (error: any) {
      console.error('Error updating lecture progress:', error);
      throw error;
    }
  }

  /**
   * Get all lecture progress for a course
   */
  async getCourseLectureProgress(courseId: number): Promise<LectureProgress[]> {
    try {
      const response = await apiClient.get<LectureProgress[]>(
        `${this.LECTURE_PROGRESS_URL}/course/${courseId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching course lecture progress:', error);
      throw error;
    }
  }

  /**
   * Initialize progress for a course
   */
  async initializeProgress(courseId: number, totalLectures: number): Promise<void> {
    try {
      await apiClient.post(`${this.LECTURE_PROGRESS_URL}/initialize`, {
        courseId,
        totalLectures
      });
    } catch (error: any) {
      console.error('Error initializing progress:', error);
      throw error;
    }
  }

  /**
   * Start a watch session
   */
  async startWatchSession(data: StartWatchSessionRequest): Promise<number> {
    try {
      const response = await apiClient.post<{ Success: boolean; SessionId: number }>(
        `${this.WATCH_SESSION_URL}/start`,
        data
      );
      return response.data.SessionId;
    } catch (error: any) {
      console.error('Error starting watch session:', error);
      throw error;
    }
  }

  /**
   * End a watch session
   */
  async endWatchSession(data: EndWatchSessionRequest): Promise<void> {
    try {
      await apiClient.post(`${this.WATCH_SESSION_URL}/end`, data);
    } catch (error: any) {
      console.error('Error ending watch session:', error);
      throw error;
    }
  }

  /**
   * Get watch sessions for a course
   */
  async getWatchSessions(courseId: number, lectureId?: number): Promise<WatchSession[]> {
    try {
      const url = lectureId
        ? `${this.WATCH_SESSION_URL}/course/${courseId}?lectureId=${lectureId}`
        : `${this.WATCH_SESSION_URL}/course/${courseId}`;
      const response = await apiClient.get<WatchSession[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching watch sessions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const progressApiService = new ProgressApiService();
