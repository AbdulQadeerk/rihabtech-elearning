import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface CourseNote {
  id: string;
  studentId: string;
  courseId: string;
  heading: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  moduleId?: string;
  timestamp?: number;
}

interface NoteApiResponse {
  id: number;
  userId: number;
  courseId: number;
  heading: string;
  content: string;
  moduleId: number | null;
  timestamp: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteRequest {
  courseId: number;
  heading: string;
  content: string;
  moduleId?: number;
  timestamp?: number;
}

interface UpdateNoteRequest {
  heading: string;
  content: string;
}

class NoteApiService {
  private BASE_URL = `${API_BASE_URL}note`;

  /**
   * Get all notes for a course
   */
  async getCourseNotes(courseId: number): Promise<CourseNote[]> {
    try {
      const response = await apiClient.get<NoteApiResponse[]>(`${this.BASE_URL}/course/${courseId}`);
      return (response.data || []).map(this.mapApiToNote);
    } catch (error: any) {
      console.error('Error fetching course notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  }

  /**
   * Get a note by ID
   */
  async getNoteById(noteId: number): Promise<CourseNote> {
    try {
      const response = await apiClient.get<NoteApiResponse>(`${this.BASE_URL}/${noteId}`);
      return this.mapApiToNote(response.data);
    } catch (error: any) {
      console.error('Error fetching note:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch note');
    }
  }

  /**
   * Create a new note
   */
  async createNote(note: CreateNoteRequest): Promise<CourseNote> {
    try {
      const response = await apiClient.post<NoteApiResponse>(this.BASE_URL, note);
      return this.mapApiToNote(response.data);
    } catch (error: any) {
      console.error('Error creating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: number, note: UpdateNoteRequest): Promise<CourseNote> {
    try {
      const response = await apiClient.put<NoteApiResponse>(`${this.BASE_URL}/${noteId}`, note);
      return this.mapApiToNote(response.data);
    } catch (error: any) {
      console.error('Error updating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${noteId}`);
    } catch (error: any) {
      console.error('Error deleting note:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  }

  /**
   * Map API response to CourseNote format
   */
  private mapApiToNote(apiNote: NoteApiResponse): CourseNote {
    return {
      id: apiNote.id.toString(),
      studentId: apiNote.userId.toString(),
      courseId: apiNote.courseId.toString(),
      heading: apiNote.heading,
      content: apiNote.content,
      createdAt: new Date(apiNote.createdAt),
      updatedAt: new Date(apiNote.updatedAt),
      moduleId: apiNote.moduleId?.toString(),
      timestamp: apiNote.timestamp ?? undefined
    };
  }
}

export const noteApiService = new NoteApiService();

