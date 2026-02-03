import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

// Interface for student enrollment
export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  isActive: boolean;
  lastAccessedAt: Date;
  progress: number; // 0-100
  totalWatchTime: number; // in seconds
  completedModules: string[]; // array of module IDs
  currentModuleId?: string;
  currentPosition?: number; // current position in video in seconds
}

// Interface for module progress
export interface ModuleProgress {
  id: string;
  studentId: string;
  courseId: string;
  moduleId: string;
  moduleType: 'video' | 'quiz' | 'document';
  isCompleted: boolean;
  completedAt?: Date;
  watchTime: number; // in seconds
  lastPosition: number; // last position in video
  attempts: number; // for quizzes
  score?: number; // for quizzes
  notes?: string;
}

// Interface for watch session
export interface WatchSession {
  id: string;
  studentId: string;
  courseId: string;
  moduleId: string;
  startTime: number; // video position in seconds
  endTime: number; // video position in seconds
  duration: number; // session duration in seconds
  startedAt: Date;
  endedAt: Date;
}

// Interface for course progress summary
export interface CourseProgressSummary {
  courseId: string;
  studentId: string;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  totalWatchTime: number;
  lastAccessedAt: Date;
  estimatedTimeRemaining: number; // in minutes
}

// Get or create student enrollment
export const getOrCreateEnrollment = async (
  studentId: string,
  courseId: string
): Promise<StudentEnrollment> => {
  try {
    const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (enrollmentDoc.exists()) {
      const enrollmentData = enrollmentDoc.data() as any;
      return {
        id: enrollmentDoc.id,
        ...enrollmentData
      } as StudentEnrollment;
    } else {
      // Create new enrollment
      const newEnrollment: Omit<StudentEnrollment, 'id'> = {
        studentId,
        courseId,
        enrolledAt: new Date(),
        isActive: true,
        lastAccessedAt: new Date(),
        progress: 0,
        totalWatchTime: 0,
        completedModules: [],
      };

      await setDoc(enrollmentRef, newEnrollment);

      return {
        id: enrollmentRef.id,
        ...newEnrollment
      } as StudentEnrollment;
    }
  } catch (error) {
    console.error("Error getting/creating enrollment:", error);
    throw error;
  }
};

// Update student progress
export const updateStudentProgress = async (
  studentId: string,
  courseId: string,
  updates: Partial<StudentEnrollment>
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);
    await updateDoc(enrollmentRef, {
      ...updates,
      lastAccessedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating student progress:", error);
    throw error;
  }
};

// Mark module as completed
export const markModuleCompleted = async (
  studentId: string,
  courseId: string,
  moduleId: string,
  moduleType: 'video' | 'quiz' | 'document',
  score?: number
): Promise<void> => {
  try {
    // Update enrollment progress
    const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (enrollmentDoc.exists()) {
      const enrollment = enrollmentDoc.data() as StudentEnrollment;
      const completedModules = [...enrollment.completedModules];

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);

        // Calculate new progress percentage
        const totalModules = await getTotalModulesInCourse(courseId);
        const progressPercentage = Math.round((completedModules.length / totalModules) * 100);

        await updateDoc(enrollmentRef, {
          completedModules,
          progress: progressPercentage
        });
      }
    }

    // Create or update module progress
    const moduleProgressRef = doc(db, "moduleProgress", `${studentId}_${courseId}_${moduleId}`);
    const moduleProgressDoc = await getDoc(moduleProgressRef);

    const moduleProgress: ModuleProgress = {
      id: moduleProgressRef.id,
      studentId,
      courseId,
      moduleId,
      moduleType,
      isCompleted: true,
      completedAt: new Date(),
      watchTime: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.watchTime : 0,
      lastPosition: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.lastPosition : 0,
      attempts: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.attempts + 1 : 1,
      score
    };

    await setDoc(moduleProgressRef, moduleProgress);
  } catch (error) {
    console.error("Error marking module completed:", error);
    throw error;
  }
};

// Update module watch time and position
export const updateModuleProgress = async (
  studentId: string,
  courseId: string,
  moduleId: string,
  moduleType: 'video' | 'quiz' | 'document',
  watchTime: number,
  currentPosition: number
): Promise<void> => {
  try {
    const moduleProgressRef = doc(db, "moduleProgress", `${studentId}_${courseId}_${moduleId}`);
    const moduleProgressDoc = await getDoc(moduleProgressRef);

    const moduleProgress: ModuleProgress = {
      id: moduleProgressRef.id,
      studentId,
      courseId,
      moduleId,
      moduleType,
      isCompleted: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.isCompleted : false,
      completedAt: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.completedAt : undefined,
      watchTime,
      lastPosition: currentPosition,
      attempts: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.attempts : 0,
      score: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.score : undefined,
      notes: moduleProgressDoc.exists() ? (moduleProgressDoc.data() as any)?.notes : undefined
    };

    await setDoc(moduleProgressRef, moduleProgress);

    // Update total watch time in enrollment
    await updateStudentProgress(studentId, courseId, {
      totalWatchTime: watchTime
    });
  } catch (error) {
    console.error("Error updating module progress:", error);
    throw error;
  }
};

// Record watch session
export const recordWatchSession = async (
  studentId: string,
  courseId: string,
  moduleId: string,
  startTime: number,
  endTime: number,
  duration: number
): Promise<void> => {
  try {
    const watchSession: Omit<WatchSession, 'id'> = {
      studentId,
      courseId,
      moduleId,
      startTime,
      endTime,
      duration,
      startedAt: new Date(),
      endedAt: new Date()
    };

    await addDoc(collection(db, "watchSessions"), watchSession);
  } catch (error) {
    console.error("Error recording watch session:", error);
    throw error;
  }
};

// Get student's course progress
export const getStudentCourseProgress = async (
  studentId: string,
  courseId: string
): Promise<CourseProgressSummary | null> => {
  try {
    const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      return null;
    }

    const enrollment = enrollmentDoc.data() as StudentEnrollment;
    const totalModules = await getTotalModulesInCourse(courseId);

    return {
      courseId,
      studentId,
      totalModules,
      completedModules: enrollment.completedModules.length,
      progressPercentage: enrollment.progress,
      totalWatchTime: enrollment.totalWatchTime,
      lastAccessedAt: enrollment.lastAccessedAt,
      estimatedTimeRemaining: Math.round((totalModules - enrollment.completedModules.length) * 15) // Estimate 15 min per module
    };
  } catch (error) {
    console.error("Error getting student course progress:", error);
    throw error;
  }
};

// Get all enrollments for a student
export const getStudentEnrollments = async (studentId: string): Promise<StudentEnrollment[]> => {
  try {
    const enrollmentsRef = collection(db, "studentEnrollments");
    const q = query(
      enrollmentsRef,
      where("studentId", "==", studentId),
      where("isActive", "==", true),
      orderBy("lastAccessedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      };
    }) as StudentEnrollment[];
  } catch (error) {
    console.error("Error getting student enrollments:", error);
    throw error;
  }
};

// Get module progress for a specific module
export const getModuleProgress = async (
  studentId: string,
  courseId: string,
  moduleId: string
): Promise<ModuleProgress | null> => {
  try {
    const moduleProgressRef = doc(db, "moduleProgress", `${studentId}_${courseId}_${moduleId}`);
    const moduleProgressDoc = await getDoc(moduleProgressRef);

    if (!moduleProgressDoc.exists()) {
      return null;
    }

    const moduleData = moduleProgressDoc.data() as any;
    return {
      id: moduleProgressDoc.id,
      ...moduleData
    } as ModuleProgress;
  } catch (error) {
    console.error("Error getting module progress:", error);
    throw error;
  }
};

// Helper function to get total modules in a course
const getTotalModulesInCourse = async (courseId: string): Promise<number> => {
  try {
    const courseRef = doc(db, "courseDrafts", courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      return 0;
    }

    const course = courseDoc.data() as any;
    let totalModules = 0;

    if (course?.curriculum?.sections) {
      course.curriculum.sections.forEach((section: any) => {
        if (section.published && section.items) {
          section.items.forEach((item: any) => {
            if (item.published) {
              totalModules++;
            }
          });
        }
      });
    }

    return totalModules;
  } catch (error) {
    console.error("Error getting total modules:", error);
    return 0;
  }
};

// Real-time listener for enrollment updates
export const subscribeToEnrollment = (
  studentId: string,
  courseId: string,
  callback: (enrollment: StudentEnrollment | null) => void
) => {
  const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);

  return onSnapshot(enrollmentRef, {
    next: (docSnapshot: any) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as any;
        callback({
          id: docSnapshot.id,
          ...data
        } as StudentEnrollment);
      } else {
        callback(null);
      }
    },
    error: (error) => {
      console.error("Error in enrollment listener:", error);
      callback(null);
    }
  });
};

// Real-time listener for course progress
export const subscribeToCourseProgress = (
  studentId: string,
  courseId: string,
  callback: (progress: CourseProgressSummary | null) => void
) => {
  const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);

  return onSnapshot(enrollmentRef, {
    next: async (docSnapshot: any) => {
      if (docSnapshot.exists()) {
        try {
          const progress = await getStudentCourseProgress(studentId, courseId);
          callback(progress);
        } catch (error) {
          console.error("Error getting course progress:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    },
    error: (error) => {
      console.error("Error in progress listener:", error);
      callback(null);
    }
  });
};
