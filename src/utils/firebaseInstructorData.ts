import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from "firebase/firestore";

export interface InstructorData {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  role: string;
  totalStudents: number;
  totalCourses: number;
  rating: number;
  isVerified: boolean;
  joinDate: Date;
  profilePicture: string;
  address: string;
  phone: string;
  bio: string;
  updatedAt: Date;
  status: string;
}

export interface CourseData {
  id: string;
  title: string;
  description?: string;
  status: string;
  visibility: string;
  progress: number;
  thumbnail?: string;
  lastModified: Date;
  createdAt: Date;
  instructorId: string;
  category?: string;
  subcategory?: string;
  level?: string;
  language?: string;
  pricing?: string;
  isPublished?: boolean;
  featured?: boolean;
  members?: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  curriculum?: {
    sections: Array<{
      id?: string;
      name: string;
      published: boolean;
      items: Array<{
        id?: string;
        contentType: string;
        lectureName: string;
        description: string;
        published: boolean;
        contentFiles?: Array<{
          duration?: number;
          name: string;
          url: string;
        }>;
      }>;
    }>;
  };
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  isActive: boolean;
  lastAccessedAt: Date;
  progress: number;
  totalWatchTime: number;
  completedModules: string[];
  currentModuleId: string;
  currentPosition: number;
}

export interface StudentData {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture: string;
  bio: string;
  joinDate: Date;
  status: string;
}

// Get instructor data by email/username
export const getInstructorData = async (instructorId: string): Promise<InstructorData | null> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "instructor"));
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const data = doc.data() as any;
      if (data.email === instructorId || data.userName === instructorId) {
        return {
          id: doc.id,
          email: data.email || "",
          userName: data.userName || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          role: data.role || "instructor",
          totalStudents: data.totalStudents || 0,
          totalCourses: data.totalCourses || 0,
          rating: data.rating || 0,
          isVerified: data.isVerified || false,
          joinDate: data.joinDate?.toDate() || new Date(),
          profilePicture: data.profilePicture || "",
          address: data.address || "",
          phone: data.phone || "",
          bio: data.bio || "",
          updatedAt: data.updatedAt?.toDate() || new Date(),
          status: data.status || "active"
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching instructor data:", error);
    return null;
  }
};

// Get all courses for an instructor
export const getInstructorCoursesData = async (instructorId: string): Promise<CourseData[]> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const querySnapshot = await getDocs(coursesRef);

    const courses: CourseData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // For now, we'll return all courses since courseDrafts don't have instructorId
      // In production, you should add instructorId when creating courses
      const course: CourseData = {
        id: doc.id,
        title: data.title || "Untitled Course",
        description: data.description || "",
        status: data.status || "draft",
        visibility: data.visibility || "private",
        progress: data.progress || 0,
        lastModified: data.lastModified?.toDate() || data.createdAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        instructorId: instructorId, // Assign the current instructor
        thumbnail: data.thumbnailUrl || data.thumbnail || data.thumbnailImage || null,
        category: data.category || "",
        subcategory: data.subcategory || "",
        level: data.level || "",
        language: data.language || "",
        pricing: data.pricing || "",
        isPublished: data.isPublished || data.status === "published" || data.status === "approved",
        featured: data.featured || false,
        members: data.members || [],
        curriculum: data.curriculum || {
          sections: []
        }
      };
      
      courses.push(course);
    });

    return courses;
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    return [];
  }
};

// Get student enrollments for instructor's courses
export const getStudentEnrollments = async (instructorId: string): Promise<StudentEnrollment[]> => {
  try {
    const enrollmentsRef = collection(db, "studentEnrollments");
    const querySnapshot = await getDocs(enrollmentsRef);

    const enrollments: StudentEnrollment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const enrollment: StudentEnrollment = {
        id: doc.id,
        studentId: data.studentId || "",
        courseId: data.courseId || "",
        enrolledAt: data.enrolledAt?.toDate() || new Date(),
        isActive: data.isActive || false,
        lastAccessedAt: data.lastAccessedAt?.toDate() || new Date(),
        progress: data.progress || 0,
        totalWatchTime: data.totalWatchTime || 0,
        completedModules: data.completedModules || [],
        currentModuleId: data.currentModuleId || "",
        currentPosition: data.currentPosition || 0
      };
      
      enrollments.push(enrollment);
    });

    return enrollments;
  } catch (error) {
    console.error("Error fetching student enrollments:", error);
    return [];
  }
};

// Get student data by IDs
export const getStudentsData = async (studentIds: string[]): Promise<StudentData[]> => {
  try {
    const usersRef = collection(db, "users");
    const students: StudentData[] = [];

    for (const studentId of studentIds) {
      const q = query(usersRef, where("email", "==", studentId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data.role === "learner") {
          const student: StudentData = {
            id: doc.id,
            email: data.email || "",
            userName: data.userName || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            role: data.role || "learner",
            profilePicture: data.profilePicture || "",
            bio: data.bio || "",
            joinDate: data.joinDate?.toDate() || new Date(),
            status: data.status || "active"
          };
          students.push(student);
        }
      });
    }

    return students;
  } catch (error) {
    console.error("Error fetching students data:", error);
    return [];
  }
};

// Get course pricing data
export const getCoursePricing = async (courseId: string) => {
  try {
    const pricingRef = doc(db, "coursePricing", courseId);
    const docSnap = await getDoc(pricingRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching course pricing:", error);
    return null;
  }
};

// Get instructor dashboard statistics
export const getInstructorStats = async (instructorId: string) => {
  try {
    const [courses, enrollments, students] = await Promise.all([
      getInstructorCoursesData(instructorId),
      getStudentEnrollments(instructorId),
      getStudentsData([])
    ]);

    const uniqueStudentIds = Array.from(new Set(enrollments.map(e => e.studentId)));
    const allStudents = await getStudentsData(uniqueStudentIds);

    const stats = {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.isPublished).length,
      draftCourses: courses.filter(c => c.status === "draft").length,
      totalStudents: uniqueStudentIds.length,
      totalEnrollments: enrollments.length,
      totalWatchTime: enrollments.reduce((sum, e) => sum + e.totalWatchTime, 0),
      averageProgress: enrollments.length > 0 
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
        : 0,
      currentMonthEnrollments: enrollments.filter(e => {
        const now = new Date();
        const enrollmentDate = e.enrolledAt;
        return enrollmentDate.getMonth() === now.getMonth() && 
               enrollmentDate.getFullYear() === now.getFullYear();
      }).length
    };

    return stats;
  } catch (error) {
    console.error("Error fetching instructor stats:", error);
    return {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalStudents: 0,
      totalEnrollments: 0,
      totalWatchTime: 0,
      averageProgress: 0,
      currentMonthEnrollments: 0
    };
  }
};
