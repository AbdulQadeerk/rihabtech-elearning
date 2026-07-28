import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc } from "firebase/firestore";
import { Course, COURSE_STATUS } from "./firebaseCourses";

export interface LearnerHomeData {
  enrolledCourses: HomepageCourse[];
  recommendedCourses: HomepageCourse[];
  loading: boolean;
  error: string | null;
}

export interface HomepageCourse {
  id: string;
  title: string;
  description: string;
  students: number;
  duration: number;
  progress?: number;
  price?: string; // 0 for free, any positive number for paid
  image: string;
  category: string;
  instructor: string;
}

interface EnrollmentData {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: any;
  isActive: boolean;
  lastAccessedAt: any;
  progress: number;
  totalWatchTime: number;
  completedModules: string[];
  currentModuleId: string;
  currentPosition: number;
}

// Get enrolled courses for the current learner
export const getLearnerEnrolledCourses = async (learnerId: string): Promise<HomepageCourse[]> => {
  try {
    // Get enrollments
    const enrollmentsRef = collection(db, "studentEnrollments");
    const enrollmentsQuery = query(enrollmentsRef, where("studentId", "==", learnerId));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return { id: doc.id, ...data };
    }) as EnrollmentData[];

    const enrolledCourses: HomepageCourse[] = [];

    for (const enrollment of enrollments) {
      try {
        // Fetch course details
        const courseRef = doc(db, "courseDrafts", enrollment.courseId);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as Course;

          // Fetch student progress for this course
          const progressRef = collection(db, "studentProgress");
          const progressQuery = query(
            progressRef,
            where("studentId", "==", learnerId),
            where("courseId", "==", enrollment.courseId)
          );
          const progressSnap = await getDocs(progressQuery);

          let progressPercent = 0;

          if (!progressSnap.empty) {
  const progressData = progressSnap.docs[0].data() as any;
  progressPercent = calculateProgress(progressData);
  console.log("calculated progress:", progressPercent, progressData);
}

          enrolledCourses.push({
            id: courseData.id || courseDoc.id,
            title: courseData.title,
            description: courseData.description,
            students: courseData.members?.length || 0,
            duration: Math.ceil((courseData.curriculum?.sections?.length || 0) * 1.5),
            progress: progressPercent, // ✅ now correct
            image: courseData.thumbnailUrl || "Images/courses/default-course.jpg",
            category: courseData.category,
            instructor:
              (courseData as any).instructorId ||
              courseData.members?.find(m => m.role === "instructor")?.email ||
              "Unknown",
            price: courseData.pricing ? courseData.pricing : "free",
          });
        }
      } catch (error) {
        console.error(`Error fetching course ${enrollment.courseId}:`, error);
      }
    }

    // Sort by last accessed
    return enrolledCourses.sort((a, b) => {
      const enrollmentA = enrollments.find(e => e.courseId === a.id);
      const enrollmentB = enrollments.find(e => e.courseId === b.id);

      if (enrollmentA?.lastAccessedAt && enrollmentB?.lastAccessedAt) {
        return enrollmentB.lastAccessedAt.toMillis() - enrollmentA.lastAccessedAt.toMillis();
      }
      return 0;
    });
  } catch (error) {
    console.error("Error getting enrolled courses:", error);
    return [];
  }
};



// Get recommended courses based on learner's interests and enrolled courses
export const getRecommendedCourses = async (learnerId: string, limitCount: number = 12): Promise<HomepageCourse[]> => {
  try {
    // First, get learner's enrolled courses to understand their interests
    const enrolledCourses = await getLearnerEnrolledCourses(learnerId);
    
    // Get all published courses
    const coursesRef = collection(db, "courseDrafts");
    let publishedQuery = query(
      coursesRef,
      where("isPublished", "==", true),
      where("status", "==", COURSE_STATUS.PUBLISHED)
    );
    
    const coursesSnapshot = await getDocs(publishedQuery);
    const allCourses = coursesSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      };
    }) as Course[];
    
    // Filter out courses the learner is already enrolled in
    const enrolledCourseIds = enrolledCourses.map(course => course.id);
    const availableCourses = allCourses.filter(course => !enrolledCourseIds.includes(course.id));
    
    // Get all unique categories
    const allCategories = Array.from(new Set(availableCourses.map(course => course.category)));
    
    // If user has enrolled courses, use their categories for recommendations
    const learnerCategories = enrolledCourses.length > 0 
      ? Array.from(new Set(enrolledCourses.map(course => course.category)))
      : allCategories;

    // Ensure we have courses from each category
    let sortedCourses: Course[] = [];
    
    if (enrolledCourses.length === 0) {
      // If no enrolled courses, get a mix of courses from all categories
      for (const category of allCategories) {
        const categoryCourses = availableCourses
          .filter(course => course.category === category)
          .sort((a, b) => {
            // Sort by popularity within each category
            const scoreA = (a.featured ? 10 : 0) + (a.members?.length || 0);
            const scoreB = (b.featured ? 10 : 0) + (b.members?.length || 0);
            return scoreB - scoreA;
          })
          .slice(0, Math.ceil(limitCount / allCategories.length)); // Take equal number of courses from each category
        
        sortedCourses = sortedCourses.concat(categoryCourses);
      }
    } else {
      // If user has enrolled courses, use preference-based sorting
      sortedCourses = availableCourses.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Featured courses get higher priority
        if (a.featured) scoreA += 10;
        if (b.featured) scoreB += 10;
        
        // Category match gets priority
        if (learnerCategories.includes(a.category)) scoreA += 5;
        if (learnerCategories.includes(b.category)) scoreB += 5;
        
        
        // More students = more popular
        scoreA += (a.members?.length || 0);
        scoreB += (b.members?.length || 0);
        
        return scoreB - scoreA;
      });
    }

    // Ensure we don't exceed the limit and shuffle the results a bit for variety
    sortedCourses = sortedCourses
      .slice(0, limitCount * 2) // Take more courses than needed
      .sort(() => Math.random() - 0.5) // Shuffle them
      .slice(0, limitCount); // Take the final limited amount
    
    // Convert to HomepageCourse format
    const recommendedCourses: HomepageCourse[] = sortedCourses.slice(0, limitCount).map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      students: course.members?.length || 0,
      duration: Math.ceil((course.curriculum?.sections?.length || 0) * 1.5), // Estimate weeks
      image: course.thumbnailUrl || "Images/courses/default-course.jpg",
      category: course.category,
      instructor: (course as any).instructorId || course.members?.find(m => m.role === 'instructor')?.email || 'Unknown',
      price: course.pricing
    }));
    
    return recommendedCourses;
  } catch (error) {
    console.error("Error getting recommended courses:", error);
    return [];
  }
};

// Main function to get all homepage data
export const getLearnerHomeData = async (learnerId: string): Promise<LearnerHomeData> => {
  try {
    const [enrolledCourses, recommendedCourses] = await Promise.all([
      getLearnerEnrolledCourses(learnerId),
      getRecommendedCourses(learnerId)
    ]);
    console.log('recommendedCourses:', recommendedCourses);
    
    return {
      enrolledCourses,
      recommendedCourses,
      loading: false,
      error: null
    };
  } catch (error) {
    console.error("Error getting learner home data:", error);
    return {
      enrolledCourses: [],
      recommendedCourses: [],
      loading: false,
      error: "Failed to load data."
    };
  }
};

export function calculateProgress(progressData: any): number {
  const totalLectures = progressData?.totalLectures || 0;

  let completedLecturesCount = 0;
  if (Array.isArray(progressData?.completedLectures)) {
    // Case: array of completed lecture indices
    completedLecturesCount = progressData.completedLectures.length;
  } else if (progressData?.completedLectures && typeof progressData.completedLectures === "object") {
    // Case: object of arrays (per section)
    completedLecturesCount = Object.values(progressData.completedLectures).flat().length;
  }

  return totalLectures > 0
    ? Math.round((completedLecturesCount / totalLectures) * 100)
    : 0;
}
