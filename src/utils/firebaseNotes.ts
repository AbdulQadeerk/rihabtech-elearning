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

export interface CourseNote {
  id: string;
  studentId: string; // This will map to userId in Firebase
  courseId: string;
  heading: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  moduleId?: string; // Optional: if note is related to specific module
  timestamp?: number; // Optional: video timestamp when note was created
}

class FirebaseNotesService {
  private readonly COLLECTION_NAME = 'courseNotes';

  // Create a new note
  async createNote(note: Omit<CourseNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Firebase Notes Service: Creating note with data:', note);
      
      const noteData: any = {
        userId: note.studentId, // Map studentId to userId for Firebase
        courseId: note.courseId,
        heading: note.heading,
        content: note.content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add moduleId if it's defined and not null
      if (note.moduleId !== undefined && note.moduleId !== null) {
        noteData.moduleId = note.moduleId;
      }

      // Only add timestamp if it's defined and not null
      if (note.timestamp !== undefined && note.timestamp !== null) {
        noteData.timestamp = note.timestamp;
      }

      console.log('Firebase Notes Service: Mapped data for Firebase:', noteData);
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), noteData);
      console.log('Firebase Notes Service: Note created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Firebase Notes Service: Error creating note:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create note: ${(error as any)?.message || 'Unknown error'}`);
    }
  }

  // Get all notes for a specific course and student
  async getCourseNotes(studentId: string, courseId: string): Promise<CourseNote[]> {
    try {
      const notesRef = collection(db, this.COLLECTION_NAME);
      // Simplified query to avoid index requirement - only filter by userId and courseId
      const q = query(
        notesRef,
        where('userId', '==', studentId), // Use userId instead of studentId
        where('courseId', '==', courseId)
      );

      const snapshot = await getDocs(q);
      const notes = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          studentId: data.userId, // Map userId back to studentId
          courseId: data.courseId,
          heading: data.heading,
          content: data.content,
          moduleId: data.moduleId,
          timestamp: data.timestamp,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CourseNote;
      });
      
      // Sort by createdAt in memory to avoid index requirement
      notes.sort((a: CourseNote, b: CourseNote) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return notes;
    } catch (error) {
      console.error('Error fetching course notes:', error);
      throw new Error('Failed to fetch notes');
    }
  }

  // Update an existing note
  async updateNote(noteId: string, updates: Partial<Pick<CourseNote, 'heading' | 'content'>>): Promise<void> {
    try {
      const noteRef = doc(db, this.COLLECTION_NAME, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, this.COLLECTION_NAME, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  // Subscribe to real-time updates for course notes
  subscribeToCourseNotes(
    studentId: string,
    courseId: string,
    callback: (notes: CourseNote[]) => void
  ): () => void {
    console.log('Firebase Notes Service: Setting up subscription for', { studentId, courseId });
    
    const notesRef = collection(db, this.COLLECTION_NAME);
    // Simplified query to avoid index requirement - only filter by userId and courseId
    const q = query(
      notesRef,
      where('userId', '==', studentId), // Use userId instead of studentId
      where('courseId', '==', courseId)
    );

    console.log('Firebase Notes Service: Query created, setting up listener');

    return onSnapshot(q, {
      next: (snapshot) => {
        console.log('Firebase notes subscription: received snapshot', (snapshot as any).docs.length, 'docs');
        const notes = (snapshot as any).docs.map((doc: any) => {
          const data = doc.data() as DocumentData;
          console.log('Processing note doc:', doc.id, data);
          return {
            id: doc.id,
            studentId: data.userId, // Map userId back to studentId
            courseId: data.courseId,
            heading: data.heading,
            content: data.content,
            moduleId: data.moduleId,
            timestamp: data.timestamp,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as CourseNote;
        });
        
        // Sort by createdAt in memory to avoid index requirement
        notes.sort((a: CourseNote, b: CourseNote) => {
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        console.log('Firebase notes subscription: processed notes', notes);
        callback(notes);
      },
      error: (error: Error) => {
        console.error('Firebase Notes Service: Error in subscription:', error);
        console.error('Error details:', {
          code: (error as any)?.code,
          message: (error as any)?.message,
          stack: (error as any)?.stack
        });
        callback([]); // Return empty array on error
      }
    });
  }

  // Get notes for a specific module (if needed)
  async getModuleNotes(studentId: string, courseId: string, moduleId: string): Promise<CourseNote[]> {
    try {
      const notesRef = collection(db, this.COLLECTION_NAME);
      // Simplified query to avoid index requirement - only filter by userId, courseId, and moduleId
      const q = query(
        notesRef,
        where('userId', '==', studentId), // Use userId instead of studentId
        where('courseId', '==', courseId),
        where('moduleId', '==', moduleId)
      );

      const snapshot = await getDocs(q);
      const notes = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          studentId: data.userId, // Map userId back to studentId
          courseId: data.courseId,
          heading: data.heading,
          content: data.content,
          moduleId: data.moduleId,
          timestamp: data.timestamp,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CourseNote;
      });
      
      // Sort by createdAt in memory to avoid index requirement
      notes.sort((a: CourseNote, b: CourseNote) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return notes;
    } catch (error) {
      console.error('Error fetching module notes:', error);
      throw new Error('Failed to fetch module notes');
    }
  }
}

// Export a singleton instance
export const firebaseNotesService = new FirebaseNotesService();

// Export individual functions for convenience
export const {
  createNote,
  getCourseNotes,
  updateNote,
  deleteNote,
  subscribeToCourseNotes,
  getModuleNotes
} = firebaseNotesService;
