import { db } from "../lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { Course } from "./firebaseCourses";
import { StudentEnrollment, CourseProgressSummary } from "./firebaseStudentProgress";

// Interface for enrolled course with progress
export interface EnrolledCourse extends Course {
  enrollment: StudentEnrollment;
  courseProgress: CourseProgressSummary;
  lastAccessedAt: Date;
}

// Get all enrolled courses for a student
export const getEnrolledCourses = async (studentId: string): Promise<EnrolledCourse[]> => {
  try {
    console.log("Searching for enrollments with studentId:", studentId);

    // Get all enrollments for the student
    const enrollmentsRef = collection(db, "studentEnrollments");
    const enrollmentsQuery = query(
      enrollmentsRef,
      where("studentId", "==", studentId),
      where("isActive", "==", true)
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    console.log("Enrollments query result:", enrollmentsSnapshot.docs.length, "documents found");

    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      console.log("Enrollment data:", doc.id, data);

      // Convert Firestore timestamps to JavaScript Date objects
      const enrollment: StudentEnrollment = {
        id: doc.id,
        studentId: data.studentId,
        courseId: data.courseId,
        enrolledAt: data.enrolledAt?.toDate ? data.enrolledAt.toDate() : new Date(data.enrolledAt),
        isActive: data.isActive,
        lastAccessedAt: data.lastAccessedAt?.toDate ? data.lastAccessedAt.toDate() : new Date(data.lastAccessedAt),
        progress: data.progress,
        totalWatchTime: data.totalWatchTime,
        completedModules: data.completedModules || [],
        currentModuleId: data.currentModuleId,
        currentPosition: data.currentPosition
      };

      return enrollment;
    });

    // Get course data for each enrollment
    const enrolledCourses: EnrolledCourse[] = [];

    for (const enrollment of enrollments) {
      try {
        console.log("Looking for course with ID:", enrollment.courseId);
        const courseRef = doc(db, "courseDrafts", enrollment.courseId);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
          console.log("Course found:", enrollment.courseId);
          const courseData = courseDoc.data() as Course;
          const course: Course = {
            ...courseData,
            id: courseDoc.id
          };

          // Get progress summary
          const progress = await getCourseProgressSummary(enrollment);

          enrolledCourses.push({
            ...course,
            enrollment,
            courseProgress: progress,
            lastAccessedAt: enrollment.lastAccessedAt
          });
        } else {
          console.log("Course not found in courseDrafts:", enrollment.courseId);
        }
      } catch (error) {
        console.error(`Error fetching course ${enrollment.courseId}:`, error);
        // Continue with other courses
      }
    }

    // Sort by last accessed (most recent first)
    return enrolledCourses.sort((a, b) =>
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  } catch (error) {
    console.error("Error getting enrolled courses:", error);
    return [];
  }
};

// Get a specific enrolled course
export const getEnrolledCourse = async (
  studentId: string,
  courseId: string
): Promise<EnrolledCourse | null> => {
  try {
    // Get enrollment
    const enrollmentRef = doc(db, "studentEnrollments", `${studentId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      return null;
    }

    const enrollment = enrollmentDoc.data() as StudentEnrollment;

    // Get course data
    const courseRef = doc(db, "courseDrafts", courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      return null;
    }

    const courseData = courseDoc.data() as Course;
    const course: Course = {
      ...courseData,
      id: courseDoc.id
    };

    // Get progress summary
    const progress = await getCourseProgressSummary(enrollment);

    return {
      ...course,
      enrollment,
      courseProgress: progress,
      lastAccessedAt: enrollment.lastAccessedAt
    };
  } catch (error) {
    console.error("Error getting enrolled course:", error);
    return null;
  }
};

// Helper function to get course progress summary
const getCourseProgressSummary = async (enrollment: StudentEnrollment): Promise<CourseProgressSummary> => {
  try {
    const courseRef = doc(db, "courseDrafts", enrollment.courseId);
    const courseDoc = await getDoc(courseRef);

    let totalModules = 0;
    if (courseDoc.exists()) {
      const course = courseDoc.data() as any;
      if (course.curriculum?.sections) {
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
    }

    return {
      courseId: enrollment.courseId,
      studentId: enrollment.studentId,
      totalModules,
      completedModules: enrollment.completedModules.length,
      progressPercentage: enrollment.progress,
      totalWatchTime: enrollment.totalWatchTime,
      lastAccessedAt: enrollment.lastAccessedAt,
      estimatedTimeRemaining: Math.round((totalModules - enrollment.completedModules.length) * 15)
    };
  } catch (error) {
    console.error("Error getting course progress summary:", error);
    return {
      courseId: enrollment.courseId,
      studentId: enrollment.studentId,
      totalModules: 0,
      completedModules: enrollment.completedModules.length,
      progressPercentage: enrollment.progress,
      totalWatchTime: enrollment.totalWatchTime,
      lastAccessedAt: enrollment.lastAccessedAt,
      estimatedTimeRemaining: 0
    };
  }
};

// Get course curriculum with progress information
export const getCourseCurriculumWithProgress = async (
  studentId: string,
  courseId: string
) => {
  try {
    const course = await getEnrolledCourse(studentId, courseId);
    if (!course || !course.curriculum?.sections) {
      return null;
    }

    // Get module progress for all modules
    const curriculumWithProgress = {
      ...course.curriculum,
      sections: await Promise.all(
        course.curriculum.sections.map(async (section) => {
          if (!section.published) return section;

          const itemsWithProgress = await Promise.all(
            section.items.map(async (item) => {
              if (!item.published) return item;

              // Get module progress
              const moduleProgressRef = doc(db, "moduleProgress", `${studentId}_${courseId}_${item.id || 'unknown'}`);
              const moduleProgressDoc = await getDoc(moduleProgressRef);

              let progress = null;
              if (moduleProgressDoc.exists()) {
                progress = moduleProgressDoc.data();
              }

              return {
                ...item,
                progress,
                isCompleted: progress?.isCompleted || false,
                watchTime: progress?.watchTime || 0,
                lastPosition: progress?.lastPosition || 0
              };
            })
          );

          return {
            ...section,
            items: itemsWithProgress
          };
        })
      )
    };

    return curriculumWithProgress;
  } catch (error) {
    console.error("Error getting course curriculum with progress:", error);
    return null;
  }
};
