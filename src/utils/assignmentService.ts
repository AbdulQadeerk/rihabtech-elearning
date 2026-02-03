import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  courseId?: string;
  courseName?: string;
  dueDate: Date;
  maxPoints: number;
  instructions: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: Date;
  content: string;
  attachments?: string[];
  grade?: number;
  feedback?: string;
  isGraded: boolean;
  gradedAt?: Date;
  gradedBy?: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  courseId?: string;
  courseName?: string;
  dueDate: Date;
  maxPoints: number;
  instructions: string;
  attachments?: string[];
}

class AssignmentService {
  private ASSIGNMENTS_COLLECTION = 'assignments';
  private SUBMISSIONS_COLLECTION = 'assignmentSubmissions';

  // Create a new assignment
  async createAssignment(assignmentData: CreateAssignmentData): Promise<Assignment> {
    try {
      const docRef = await addDoc(collection(db, this.ASSIGNMENTS_COLLECTION), {
        ...assignmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });

      return {
        id: docRef.id,
        ...assignmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        submissions: []
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  }

  // Get assignments for an instructor
  async getInstructorAssignments(instructorId: string): Promise<Assignment[]> {
    try {
      const assignmentsQuery = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('instructorId', '==', instructorId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments: Assignment[] = [];

      for (const doc of assignmentsSnapshot.docs) {
        const data = doc.data() as any;
        const assignment: Assignment = {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          instructorId: data.instructorId || '',
          instructorName: data.instructorName || '',
          courseId: data.courseId,
          courseName: data.courseName,
          dueDate: data.dueDate?.toDate() || new Date(),
          maxPoints: data.maxPoints || 0,
          instructions: data.instructions || '',
          attachments: data.attachments || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isActive: data.isActive || true,
          submissions: []
        };

        // Get submissions for this assignment
        const submissions = await this.getAssignmentSubmissions(doc.id);
        assignment.submissions = submissions;

        assignments.push(assignment);
      }

      return assignments;
    } catch (error) {
      console.error('Error getting instructor assignments:', error);
      return [];
    }
  }

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const submissionsQuery = query(
        collection(db, this.SUBMISSIONS_COLLECTION),
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
      );

      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissions: AssignmentSubmission[] = [];

      submissionsSnapshot.forEach(doc => {
        const data = doc.data() as any;
        submissions.push({
          id: doc.id,
          assignmentId: data.assignmentId || '',
          studentId: data.studentId || '',
          studentName: data.studentName || '',
          submittedAt: data.submittedAt?.toDate() || new Date(),
          content: data.content || '',
          attachments: data.attachments || [],
          grade: data.grade,
          feedback: data.feedback || '',
          isGraded: data.isGraded || false,
          gradedAt: data.gradedAt?.toDate(),
          gradedBy: data.gradedBy || ''
        });
      });

      return submissions;
    } catch (error) {
      console.error('Error getting assignment submissions:', error);
      return [];
    }
  }

  // Grade an assignment submission
  async gradeSubmission(
    submissionId: string, 
    grade: number, 
    feedback: string, 
    gradedBy: string
  ): Promise<void> {
    try {
      const submissionRef = doc(db, this.SUBMISSIONS_COLLECTION, submissionId);
      await updateDoc(submissionRef, {
        grade,
        feedback,
        isGraded: true,
        gradedAt: serverTimestamp(),
        gradedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      throw new Error('Failed to grade submission');
    }
  }

  // Update assignment
  async updateAssignment(assignmentId: string, updateData: Partial<CreateAssignmentData>): Promise<void> {
    try {
      const assignmentRef = doc(db, this.ASSIGNMENTS_COLLECTION, assignmentId);
      await updateDoc(assignmentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw new Error('Failed to update assignment');
    }
  }

  // Delete assignment (soft delete)
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      const assignmentRef = doc(db, this.ASSIGNMENTS_COLLECTION, assignmentId);
      await updateDoc(assignmentRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw new Error('Failed to delete assignment');
    }
  }

  // Get assignment statistics
  async getAssignmentStats(instructorId: string): Promise<{
    totalAssignments: number;
    totalSubmissions: number;
    pendingGrading: number;
    averageGrade: number;
  }> {
    try {
      const assignments = await this.getInstructorAssignments(instructorId);
      let totalSubmissions = 0;
      let pendingGrading = 0;
      let totalGrades = 0;
      let gradedCount = 0;

      for (const assignment of assignments) {
        if (assignment.submissions) {
          totalSubmissions += assignment.submissions.length;
          for (const submission of assignment.submissions) {
            if (!submission.isGraded) {
              pendingGrading++;
            } else if (submission.grade !== undefined) {
              totalGrades += submission.grade;
              gradedCount++;
            }
          }
        }
      }

      return {
        totalAssignments: assignments.length,
        totalSubmissions,
        pendingGrading,
        averageGrade: gradedCount > 0 ? totalGrades / gradedCount : 0
      };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return {
        totalAssignments: 0,
        totalSubmissions: 0,
        pendingGrading: 0,
        averageGrade: 0
      };
    }
  }
}

export const assignmentService = new AssignmentService();
