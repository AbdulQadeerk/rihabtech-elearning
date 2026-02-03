import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { COURSE_STATUS, Course } from "./firebaseCourses";
import { CourseWorkflowService } from "./courseWorkflowService";

// Coupon interface for instructor courses
export interface InstructorCourseCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  validFrom: any; // Timestamp
  validUntil: any; // Timestamp;
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  minAmount: number;
  maxDiscount?: number;
  priority: number;
  creatorType: 'admin' | 'instructor';
  isGlobal: boolean;
  courseId?: string;
  instructorId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface InstructorCourse {
  id: string;
  title: string;
  description?: string;
  status: number;
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
  rejectionInfo?: {
    rejectionReason?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionNotes?: string;
  };
  // Add coupons property
  coupons?: InstructorCourseCoupon[];
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

// Get coupons for a specific course (both global and course-specific)
const getCouponsForCourse = async (courseId: string, instructorId?: string): Promise<InstructorCourseCoupon[]> => {
  try {
    const couponsRef = collection(db, "coupons");
    
    // Create queries for different coupon types
    const queries = [
      // Course-specific coupons (both active and inactive)
      query(
        couponsRef,
        where("courseId", "==", courseId),
      )
    ];

    // If instructorId is provided, also get instructor-specific coupons
    if (instructorId) {
      queries.push(
        query(
          couponsRef,
          where("instructorId", "==", instructorId),
          where("courseId", "==", courseId)
        )
      );
    }

    const snapshots = await Promise.all(queries.map(q => getDocs(q)));
    
    // Combine all coupons and remove duplicates
    const allCoupons = new Map<string, InstructorCourseCoupon>();
    
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        const couponData = {
          id: doc.id,
          ...(doc.data() as object)
        } as InstructorCourseCoupon;
        
        // Use Map to avoid duplicates (in case a coupon appears in multiple queries)
        allCoupons.set(doc.id, couponData);
      });
    });

    // Convert to array and sort by priority (higher priority first)
    return Array.from(allCoupons.values())
      .sort((a, b) => b.priority - a.priority);
    
  } catch (error) {
    console.error("Error fetching coupons for course:", error);
    return [];
  }
};

// Get instructor-created coupons only
const getInstructorCoupons = async (instructorId: string): Promise<InstructorCourseCoupon[]> => {
  try {
    const couponsRef = collection(db, "coupons");
    const instructorCouponsQuery = query(
      couponsRef,
      where("instructorId", "==", instructorId),
      where("creatorType", "==", "instructor"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(instructorCouponsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as object)
    } as InstructorCourseCoupon));
    
  } catch (error) {
    console.error("Error fetching instructor coupons:", error);
    return [];
  }
};

// Get all courses for a specific instructor (with optional coupons)
export const getInstructorCourses = async (
  instructorId: string, 
  includeCoupons: boolean = true
): Promise<InstructorCourse[]> => {
  try {
    const coursesRef = collection(db, "courseDrafts");

    console.log("Getting all courses to filter by instructorId:", instructorId);

    const coursesQuery = query(
      coursesRef,
      where("instructorId", "==", instructorId)
    );
    const allCoursesSnapshot = await getDocs(coursesQuery);

    const allCourses = allCoursesSnapshot.docs.map((doc) => {
      const data = doc.data() as any;

      const course: InstructorCourse = {
        id: doc.id,
        title: data.title || "Untitled Course",
        description: data.description || "",
        status: data.status || "draft",
        visibility: data.visibility || "private",
        progress: data.progress || 0,

        lastModified:
          toDateSafe(data.lastModified) ||
          toDateSafe(data.createdAt) ||
          toDateSafe(data.submittedAt) ||
          new Date(),

        createdAt:
          toDateSafe(data.createdAt) ||
          toDateSafe(data.submittedAt) ||
          new Date(),

        instructorId: data.instructorId || data.instructor || instructorId,
        thumbnail: data.thumbnailUrl || data.thumbnail || data.thumbnailImage || null,
        category: data.category || "",
        subcategory: data.subcategory || "",
        level: data.level || "",
        language: data.language || "",
        pricing: data.pricing || "",
        isPublished:
          data.isPublished || data.status === "published" || data.status === "approved",
        featured: data.featured || false,
        members: data.members || [],
        curriculum: data.curriculum || { sections: [] },
        rejectionInfo: data.rejectionInfo || null
      };

      return course;
    });

    console.log("Total courses found:", allCourses.length);

    // If coupons are requested, fetch them for each course
    if (includeCoupons && allCourses.length > 0) {
      const coursesWithCoupons = await Promise.all(
        allCourses.map(async (course) => {
          const coupons = await getCouponsForCourse(course.id, instructorId);
          if(coupons.length>0){
          return {
            ...course,
            coupons
          };
        }
        else {
          return {
            ...course,
            coupons:[]
          };
        }
        })
      );
      return coursesWithCoupons;
    }
    return allCourses;
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    return [];
  }
};

// Get course by ID (with optional coupons)
export const getCourseById = async (
  courseId: string, 
  includeCoupons: boolean = true,
  instructorId?: string
): Promise<InstructorCourse | null> => {
  try {
    const courseRef = doc(db, "courseDrafts", courseId);
    const docSnap = await getDoc(courseRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const course: InstructorCourse = {
        id: docSnap.id,
        ...data,
        lastModified: data?.lastModified?.toDate() || data?.createdAt?.toDate() || new Date(),
        createdAt: data?.createdAt?.toDate() || new Date(),
        progress: data?.progress || 0,
        status: data?.status || "draft",
        visibility: data?.visibility || "private"
      } as InstructorCourse;

      // If coupons are requested, fetch them
      if (includeCoupons) {
        const coupons = await getCouponsForCourse(courseId, instructorId);
        course.coupons = coupons;
      }

      return course;
    }

    return null;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
};

// Update course
export const updateCourse = async (courseId: string, updates: Partial<InstructorCourse>): Promise<void> => {
  try {
    // Get current course data to check status
    const courseRef = doc(db, "courseDrafts", courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      throw new Error("Course not found");
    }

    const courseData = courseSnap.data() as Course;
    
    // If course is approved/published, use workflow service
    if (courseData.status === COURSE_STATUS.APPROVED || courseData.status === COURSE_STATUS.PUBLISHED) {
      if (!courseData.instructorId) {
        throw new Error("Instructor ID is required for workflow updates");
      }

      // Use workflow service to handle the update properly
      await CourseWorkflowService.updateCourse(
        courseId,
        updates,
        courseData.instructorId,
        courseData.instructorName || 'Unknown',
        courseData.instructorEmail || ''
      );
    } else {
      // Simple update for draft courses
      await updateDoc(courseRef, {
        ...updates,
        lastModified: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const courseRef = doc(db, "courseDrafts", courseId);
    await deleteDoc(courseRef);
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

// Calculate course progress based on curriculum
export const calculateCourseProgress = (course: InstructorCourse): number => {
  if (!course.curriculum?.sections) return 0;

  let totalItems = 0;
  let completedItems = 0;

  course.curriculum.sections.forEach(section => {
    if (section.published) {
      section.items.forEach(item => {
        totalItems++;
        if (item.published) {
          completedItems++;
        }
      });
    }
  });

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

// Get course statistics for instructor (with coupon stats)
export const getInstructorCourseStats = async (instructorId: string) => {
  try {
    const [courses, instructorCoupons] = await Promise.all([
      getInstructorCourses(instructorId, false),
      getInstructorCoupons(instructorId)
    ]);

    const activeCoupons = instructorCoupons.filter(c => c.isActive);
    const expiredCoupons = instructorCoupons.filter(c => {
      const now = new Date();
      const validUntil = c.validUntil.toDate ? c.validUntil.toDate() : new Date(c.validUntil);
      return validUntil < now;
    });

    const stats = {
      // Course stats
      total: courses.length,
      published: courses.filter(c => c.isPublished).length,
      drafts: courses.filter(c => c.status === COURSE_STATUS.DRAFT).length,
      pending: courses.filter(c => c.status === COURSE_STATUS.PENDING_REVIEW).length,
      approved: courses.filter(c => c.status === COURSE_STATUS.APPROVED).length,
      averageProgress: courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
        : 0,
      
      // Coupon stats
      coupons: {
        total: instructorCoupons.length,
        active: activeCoupons.length,
        expired: expiredCoupons.length,
        totalUsed: instructorCoupons.reduce((sum, c) => sum + c.usedCount, 0),
        totalCapacity: instructorCoupons.reduce((sum, c) => sum + c.maxUses, 0)
      }
    };

    return stats;
  } catch (error) {
    console.error("Error fetching course stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      pending: 0,
      approved: 0,
      averageProgress: 0,
      coupons: {
        total: 0,
        active: 0,
        expired: 0,
        totalUsed: 0,
        totalCapacity: 0
      }
    };
  }
};

// Get courses with active coupons for instructor dashboard
export const getCoursesWithActiveCoupons = async (instructorId: string): Promise<InstructorCourse[]> => {
  try {
    const coursesWithCoupons = await getInstructorCourses(instructorId, true);
    
    // Filter courses that have active coupons
    return coursesWithCoupons.filter(course => 
      course.coupons && course.coupons.some(coupon => coupon.isActive)
    );
  } catch (error) {
    console.error("Error fetching courses with active coupons:", error);
    return [];
  }
};

// Get coupon performance analytics for instructor
export const getCouponAnalytics = async (instructorId: string) => {
  try {
    const instructorCoupons = await getInstructorCoupons(instructorId);
    const now = new Date();

    const analytics = {
      totalCoupons: instructorCoupons.length,
      activeCoupons: instructorCoupons.filter(c => c.isActive).length,
      expiredCoupons: instructorCoupons.filter(c => {
        const validUntil = c.validUntil.toDate ? c.validUntil.toDate() : new Date(c.validUntil);
        return validUntil < now;
      }).length,
      totalRedemptions: instructorCoupons.reduce((sum, c) => sum + c.usedCount, 0),
      averageUsageRate: instructorCoupons.length > 0 
        ? instructorCoupons.reduce((sum, c) => sum + (c.usedCount / c.maxUses * 100), 0) / instructorCoupons.length
        : 0,
      topPerformingCoupons: instructorCoupons
        .sort((a, b) => b.usedCount - a.usedCount)
        .slice(0, 5)
        .map(c => ({
          code: c.code,
          name: c.name,
          usedCount: c.usedCount,
          maxUses: c.maxUses,
          usageRate: (c.usedCount / c.maxUses * 100).toFixed(1)
        }))
    };

    return analytics;
  } catch (error) {
    console.error("Error fetching coupon analytics:", error);
    return null;
  }
};

const toDateSafe = (val: any): Date | null => {
  if (!val) return null;
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  if (val instanceof Date) return val; // already a Date
  return new Date(val); // fallback if it's a string/number
};