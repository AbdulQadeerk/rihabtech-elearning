import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  DocumentData,
  orderBy
} from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  courseId?: string; // If null/undefined, applies to all courses
  instructorId: string;
  startDate?: Date; // When announcement becomes visible
  endDate?: Date; // When announcement expires
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateAnnouncementData {
  title: string;
  message: string;
  courseId?: string; // If not provided, applies to all courses
  instructorId: string;
  startDate?: Date; // When announcement becomes visible
  endDate?: Date; // When announcement expires
}

class FirebaseAnnouncementsService {
  private readonly COLLECTION_NAME = 'announcements';

  // Create a new announcement
  async createAnnouncement(announcement: CreateAnnouncementData): Promise<string> {
    try {
      console.log('Firebase Announcements Service: Creating announcement with data:', announcement);
      
      const announcementData: any = {
        title: announcement.title,
        message: announcement.message,
        courseId: announcement.courseId || null, // Store null for "All Courses"
        instructorId: announcement.instructorId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add startDate if it's provided
      if (announcement.startDate) {
        announcementData.startDate = announcement.startDate;
      }

      // Only add endDate if it's provided
      if (announcement.endDate) {
        announcementData.endDate = announcement.endDate;
      }

      console.log('Firebase Announcements Service: Mapped data for Firebase:', announcementData);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), announcementData);
      console.log('Firebase Announcements Service: Announcement created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase Announcements Service: Error creating announcement:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create announcement: ${(error as any)?.message || 'Unknown error'}`);
    }
  }

  // Get announcements for a specific course
  async getCourseAnnouncements(courseId: string): Promise<Announcement[]> {
    try {
      console.log('Firebase Announcements Service: Fetching announcements for course:', courseId);
      
      const announcementsRef = collection(db, this.COLLECTION_NAME);
      
      // Get both course-specific announcements and "All Courses" announcements
      const q = query(
        announcementsRef,
        where('isActive', '==', true),
        where('courseId', 'in', [courseId, null]) // courseId or null (All Courses)
      );

      const snapshot = await getDocs(q);
      const allAnnouncements = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          courseId: data.courseId,
          instructorId: data.instructorId,
          startDate: data.startDate?.toDate() || undefined,
          endDate: data.endDate?.toDate() || undefined,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Announcement;
      });
      
      // Filter by current date (only show announcements that are currently active)
      const currentDate = new Date();
      const announcements = allAnnouncements.filter(announcement => {
        // If no startDate, announcement is immediately visible
        if (!announcement.startDate && !announcement.endDate) {
          return true;
        }
        
        // Check if current date is after startDate (or startDate is not set)
        const isAfterStart = !announcement.startDate || currentDate >= announcement.startDate;
        
        // Check if current date is before endDate (or endDate is not set)
        const isBeforeEnd = !announcement.endDate || currentDate <= announcement.endDate;
        
        return isAfterStart && isBeforeEnd;
      });
      
      // Sort by createdAt in descending order (newest first)
      announcements.sort((a: Announcement, b: Announcement) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      console.log('Firebase Announcements Service: Found announcements:', announcements.length);
      return announcements;
    } catch (error) {
      console.error('Error fetching course announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  // Get all announcements for an instructor
  async getInstructorAnnouncements(instructorId: string): Promise<Announcement[]> {
    try {
      console.log('Firebase Announcements Service: Fetching announcements for instructor:', instructorId);
      
      const announcementsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        announcementsRef,
        where('instructorId', '==', instructorId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const announcements = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          courseId: data.courseId,
          instructorId: data.instructorId,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Announcement;
      });
      
      // Sort by createdAt in descending order (newest first)
      announcements.sort((a: Announcement, b: Announcement) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      console.log('Firebase Announcements Service: Found instructor announcements:', announcements.length);
      return announcements;
    } catch (error) {
      console.error('Error fetching instructor announcements:', error);
      throw new Error('Failed to fetch instructor announcements');
    }
  }

  // Subscribe to real-time updates for course announcements
  subscribeToCourseAnnouncements(
    courseId: string,
    callback: (announcements: Announcement[]) => void
  ): () => void {
    console.log('Firebase Announcements Service: Setting up subscription for course:', courseId);
    
    const announcementsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      announcementsRef,
      where('isActive', '==', true),
      where('courseId', 'in', [courseId, null]) // courseId or null (All Courses)
    );

    console.log('Firebase Announcements Service: Query created, setting up listener');

    return onSnapshot(q, {
      next: (snapshot) => {
        console.log('Firebase announcements subscription: received snapshot', (snapshot as any).docs.length, 'docs');
        const allAnnouncements = (snapshot as any).docs.map((doc: any) => {
          const data = doc.data() as DocumentData;
          console.log('Processing announcement doc:', doc.id, data);
          return {
            id: doc.id,
            title: data.title,
            message: data.message,
            courseId: data.courseId,
            instructorId: data.instructorId,
            startDate: data.startDate?.toDate() || undefined,
            endDate: data.endDate?.toDate() || undefined,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Announcement;
        });
        
        // Filter by current date (only show announcements that are currently active)
        const currentDate = new Date();
        const announcements = allAnnouncements.filter((announcement: Announcement) => {
          // If no startDate, announcement is immediately visible
          if (!announcement.startDate && !announcement.endDate) {
            return true;
          }
          
          // Check if current date is after startDate (or startDate is not set)
          const isAfterStart = !announcement.startDate || currentDate >= announcement.startDate;
          
          // Check if current date is before endDate (or endDate is not set)
          const isBeforeEnd = !announcement.endDate || currentDate <= announcement.endDate;
          
          return isAfterStart && isBeforeEnd;
        });
        
        // Sort by createdAt in descending order (newest first)
        announcements.sort((a: Announcement, b: Announcement) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        console.log('Firebase announcements subscription: processed announcements', announcements);
        callback(announcements);
      },
      error: (error: Error) => {
        console.error('Firebase Announcements Service: Error in subscription:', error);
        console.error('Error details:', {
          code: (error as any)?.code,
          message: (error as any)?.message,
          stack: (error as any)?.stack
        });
        callback([]); // Return empty array on error
      }
    });
  }

  // Update an existing announcement
  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, 'title' | 'message' | 'courseId' | 'isActive' | 'startDate' | 'endDate'>>): Promise<void> {
    try {
      const announcementRef = doc(db, this.COLLECTION_NAME, announcementId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(announcementRef, updateData);
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw new Error('Failed to update announcement');
    }
  }

  // Delete an announcement (soft delete by setting isActive to false)
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      const announcementRef = doc(db, this.COLLECTION_NAME, announcementId);
      await updateDoc(announcementRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement');
    }
  }

  // Get announcements by date range
  async getAnnouncementsByDateRange(
    courseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Announcement[]> {
    try {
      console.log('Firebase Announcements Service: Fetching announcements by date range:', { courseId, startDate, endDate });
      
      const announcements = await this.getCourseAnnouncements(courseId);
      
      // Filter by date range
      const filteredAnnouncements = announcements.filter(announcement => {
        const announcementDate = announcement.createdAt;
        return announcementDate >= startDate && announcementDate <= endDate;
      });
      
      console.log('Firebase Announcements Service: Found announcements in date range:', filteredAnnouncements.length);
      return filteredAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements by date range:', error);
      throw new Error('Failed to fetch announcements by date range');
    }
  }
}

// Export a singleton instance
export const firebaseAnnouncementsService = new FirebaseAnnouncementsService();
