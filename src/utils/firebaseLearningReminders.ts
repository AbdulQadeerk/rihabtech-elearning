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
  DocumentData
} from 'firebase/firestore';

export interface LearningReminder {
  id: string;
  userId: string; // Maps to studentId in the interface
  courseId?: string; // Optional course attachment
  name: string;
  frequency: 'daily' | 'weekly' | 'once';
  time: string; // Time in HH:MM AM/PM format
  selectedDays?: string[]; // For weekly reminders (e.g., ['Mo', 'Tu', 'We'])
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  nextTriggerAt?: Date;
}

export interface CourseOption {
  id: string;
  title: string;
  instructorId: string;
  thumbnailUrl?: string;
}

class FirebaseLearningRemindersService {
  private readonly COLLECTION_NAME = 'learningReminders';
  private readonly COURSES_COLLECTION = 'courses';

  // Create a new learning reminder
  async createReminder(reminder: Omit<LearningReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Firebase Learning Reminders Service: Creating reminder with data:', reminder);
      
      const reminderData: any = {
        userId: reminder.userId,
        name: reminder.name,
        frequency: reminder.frequency,
        time: reminder.time,
        isActive: reminder.isActive ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add optional fields if they exist
      if (reminder.courseId) {
        reminderData.courseId = reminder.courseId;
      }
      if (reminder.selectedDays && reminder.selectedDays.length > 0) {
        reminderData.selectedDays = reminder.selectedDays;
      }
      if (reminder.lastTriggeredAt) {
        reminderData.lastTriggeredAt = reminder.lastTriggeredAt;
      }
      if (reminder.nextTriggerAt) {
        reminderData.nextTriggerAt = reminder.nextTriggerAt;
      }

      console.log('Firebase Learning Reminders Service: Mapped data for Firebase:', reminderData);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), reminderData);
      console.log('Firebase Learning Reminders Service: Reminder created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase Learning Reminders Service: Error creating reminder:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create reminder: ${(error as any)?.message || 'Unknown error'}`);
    }
  }

  // Get all reminders for a specific user
  async getUserReminders(userId: string): Promise<LearningReminder[]> {
    try {
      const remindersRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        remindersRef,
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const reminders = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          userId: data.userId,
          courseId: data.courseId,
          name: data.name,
          frequency: data.frequency,
          time: data.time,
          selectedDays: data.selectedDays,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastTriggeredAt: data.lastTriggeredAt?.toDate(),
          nextTriggerAt: data.nextTriggerAt?.toDate()
        } as LearningReminder;
      });
      
      // Sort by createdAt in memory
      reminders.sort((a: LearningReminder, b: LearningReminder) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return reminders;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw new Error('Failed to fetch reminders');
    }
  }

  // Subscribe to real-time updates for user reminders
  subscribeToUserReminders(
    userId: string,
    callback: (reminders: LearningReminder[]) => void
  ): () => void {
    console.log('Firebase Learning Reminders Service: Setting up subscription for user:', userId);
    
    const remindersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      remindersRef,
      where('userId', '==', userId)
    );

    console.log('Firebase Learning Reminders Service: Query created, setting up listener');

    return onSnapshot(q, {
      next: (snapshot) => {
        console.log('Firebase reminders subscription: received snapshot', (snapshot as any).docs.length, 'docs');
        const reminders = (snapshot as any).docs.map((doc: any) => {
          const data = doc.data() as DocumentData;
          console.log('Processing reminder doc:', doc.id, data);
          return {
            id: doc.id,
            userId: data.userId,
            courseId: data.courseId,
            name: data.name,
            frequency: data.frequency,
            time: data.time,
            selectedDays: data.selectedDays,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastTriggeredAt: data.lastTriggeredAt?.toDate(),
            nextTriggerAt: data.nextTriggerAt?.toDate()
          } as LearningReminder;
        });
        
        // Sort by createdAt in memory
        reminders.sort((a: LearningReminder, b: LearningReminder) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        console.log('Firebase reminders subscription: processed reminders', reminders);
        callback(reminders);
      },
      error: (error: Error) => {
        console.error('Firebase Learning Reminders Service: Error in subscription:', error);
        console.error('Error details:', {
          code: (error as any)?.code,
          message: (error as any)?.message,
          stack: (error as any)?.stack
        });
        callback([]); // Return empty array on error
      }
    });
  }

  // Update an existing reminder
  async updateReminder(reminderId: string, updates: Partial<Pick<LearningReminder, 'name' | 'frequency' | 'time' | 'selectedDays' | 'isActive' | 'courseId'>>): Promise<void> {
    try {
      const reminderRef = doc(db, this.COLLECTION_NAME, reminderId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(reminderRef, updateData);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw new Error('Failed to update reminder');
    }
  }

  // Delete a reminder
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const reminderRef = doc(db, this.COLLECTION_NAME, reminderId);
      await deleteDoc(reminderRef);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw new Error('Failed to delete reminder');
    }
  }

  // Get available courses for the user (for reminder attachment)
  async getAvailableCourses(userId: string, instructorId?: string): Promise<CourseOption[]> {
    try {
      console.log('Firebase Learning Reminders Service: Fetching available courses for user:', userId);
      
      // Try to get courses from courseDrafts collection first (where most courses are stored)
      const courseDraftsRef = collection(db, 'courseDrafts');
      let courseDraftsQuery;
      
      if (instructorId) {
        // Filter by instructor ID if provided
        courseDraftsQuery = query(
          courseDraftsRef,
          where('instructorId', '==', instructorId),
          where('status', 'in', ['approved', 'published'])
        );
        console.log('Firebase Learning Reminders Service: Filtering courses by instructor:', instructorId);
      } else {
        // Get all approved/published courses if no instructor filter
        courseDraftsQuery = query(
          courseDraftsRef,
          where('status', 'in', ['approved', 'published'])
        );
        console.log('Firebase Learning Reminders Service: Getting all approved courses');
      }

      const courseDraftsSnapshot = await getDocs(courseDraftsQuery);
      console.log('Firebase Learning Reminders Service: Found courseDrafts:', courseDraftsSnapshot.docs.length);
      
      let courses: CourseOption[] = courseDraftsSnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          title: data.title || `Course ${doc.id.substring(0, 8)}`,
          instructorId: data.instructorId || '',
          thumbnailUrl: data.thumbnailUrl
        } as CourseOption;
      }).filter(course => course.title && course.title.trim() !== '');

      // If no courses found in courseDrafts, try the courses collection
      if (courses.length === 0) {
        console.log('Firebase Learning Reminders Service: No courses in courseDrafts, trying courses collection');
        const coursesRef = collection(db, this.COURSES_COLLECTION);
        let coursesQuery;
        
        if (instructorId) {
          coursesQuery = query(
            coursesRef,
            where('instructorId', '==', instructorId),
            where('isPublished', '==', true),
            where('status', '==', 'approved')
          );
        } else {
          coursesQuery = query(
            coursesRef,
            where('isPublished', '==', true),
            where('status', '==', 'approved')
          );
        }

        const coursesSnapshot = await getDocs(coursesQuery);
        console.log('Firebase Learning Reminders Service: Found courses:', coursesSnapshot.docs.length);
        
        courses = coursesSnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            title: data.title || 'Untitled Course',
            instructorId: data.instructorId || '',
            thumbnailUrl: data.thumbnailUrl
          } as CourseOption;
        });
      }

      // If still no courses, add some sample courses
      if (courses.length === 0) {
        console.log('Firebase Learning Reminders Service: No courses found, using sample courses');
        courses = [
          {
            id: 'sample-1',
            title: 'The Python Developer Essentials Immersive Bootcamp',
            instructorId: userId,
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=Python+Course'
          },
          {
            id: 'sample-2',
            title: 'React JS Frontend Web Development for Beginners',
            instructorId: userId,
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=React+Course'
          },
          {
            id: 'sample-3',
            title: 'Introduction To Python Programming',
            instructorId: userId,
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=Python+Intro'
          },
          {
            id: 'sample-4',
            title: 'Advanced JavaScript and ES6+',
            instructorId: userId,
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=JavaScript+Advanced'
          },
          {
            id: 'sample-5',
            title: 'Full-Stack Web Development with Node.js',
            instructorId: userId,
            thumbnailUrl: 'https://via.placeholder.com/300x200?text=Full+Stack'
          }
        ];
      }

      console.log('Firebase Learning Reminders Service: Returning courses:', courses);
      return courses;
    } catch (error) {
      console.error('Error fetching available courses:', error);
      // Return sample courses on error to prevent UI breaking
      return [
        {
          id: 'sample-1',
          title: 'The Python Developer Essentials Immersive Bootcamp',
          instructorId: userId,
          thumbnailUrl: 'https://via.placeholder.com/300x200?text=Python+Course'
        },
        {
          id: 'sample-2',
          title: 'React JS Frontend Web Development for Beginners',
          instructorId: userId,
          thumbnailUrl: 'https://via.placeholder.com/300x200?text=React+Course'
        },
        {
          id: 'sample-3',
          title: 'Introduction To Python Programming',
          instructorId: userId,
          thumbnailUrl: 'https://via.placeholder.com/300x200?text=Python+Intro'
        }
      ];
    }
  }

  // Mark reminder as triggered
  async markReminderTriggered(reminderId: string): Promise<void> {
    try {
      const reminderRef = doc(db, this.COLLECTION_NAME, reminderId);
      const now = new Date();
      
      // Calculate next trigger time based on frequency
      const nextTrigger = this.calculateNextTrigger(now);
      
      await updateDoc(reminderRef, {
        lastTriggeredAt: serverTimestamp(),
        nextTriggerAt: nextTrigger,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking reminder as triggered:', error);
      throw new Error('Failed to mark reminder as triggered');
    }
  }

  // Calculate next trigger time based on frequency
  private calculateNextTrigger(currentTime: Date): Date {
    const next = new Date(currentTime);
    
    // This is a simplified calculation
    // In a real app, you'd want more sophisticated scheduling
    next.setDate(next.getDate() + 1); // Default to next day
    
    return next;
  }
}

// Export a singleton instance
export const firebaseLearningRemindersService = new FirebaseLearningRemindersService();
