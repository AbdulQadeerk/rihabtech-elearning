import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore";

// Shared course status constants - using numeric IDs for consistency
export const COURSE_STATUS = {
  DRAFT: 1,
  PENDING_REVIEW: 2,
  NEEDS_REVISION: 3,
  APPROVED: 4,
  PUBLISHED: 5,
  ARCHIVED: 6,
  DRAFT_UPDATE: 7
} as const;

export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];

// Course status text mapping
export const COURSE_STATUS_TEXT = {
  [COURSE_STATUS.DRAFT]: 'Draft',
  [COURSE_STATUS.PENDING_REVIEW]: 'Pending Review',
  [COURSE_STATUS.NEEDS_REVISION]: 'Needs Revision',
  [COURSE_STATUS.APPROVED]: 'Approved',
  [COURSE_STATUS.PUBLISHED]: 'Published',
  [COURSE_STATUS.ARCHIVED]: 'Archived',
  [COURSE_STATUS.DRAFT_UPDATE]: 'Draft Update'
} as const;

export const COURSE_STATUS_LABELS: Record<any, any> = {
  1: "Draft",
  2: "Pending Review",
  3: "Needs Revision",
  4: "Approved",
  5: "Published",
  6: "Archived",
  7: "Draft Update",
};

// Course edit types for determining re-approval requirements
export const COURSE_EDIT_TYPE = {
  MINOR: 'minor',
  MAJOR: 'major'
} as const;

export type CourseEditType = typeof COURSE_EDIT_TYPE[keyof typeof COURSE_EDIT_TYPE];

// Approval information interface
export interface ApprovalInfo {
  approvedBy: {
    name: string;
    email: string;
    userId: string;
    timestamp: Date;
  };
  approvedAt: Date;
  approvalNotes?: string;
  featured: boolean;
}

// Rejection information interface
export interface RejectionInfo {
  rejectedBy: {
    name: string;
    email: string;
    userId: string;
    timestamp: Date;
  };
  rejectedAt: Date;
  rejectionReason: string;
  rejectionNotes?: string;
}

// Course version information
export interface CourseVersion {
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  changes: string[];
  status: CourseStatus;
}

// Course history entry
export interface CourseHistoryEntry {
  id: string;
  action: string;
  performedBy: {
    name: string;
    email: string;
    userId: string;
  };
  timestamp: Date;
  details: string;
  previousStatus?: CourseStatus;
  newStatus?: CourseStatus;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  promoVideoUrl?: string;
  featured: boolean;
  isPublished: boolean;
  status: CourseStatus;
  category: string;
  subcategory?: string;
  level: string;
  language: string;
  progress?: number;
  pricing: string;
  submittedAt: string;
  approvedAt?: string;
  
  // Enhanced approval workflow fields
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Approval and rejection information
  approvalInfo?: ApprovalInfo;
  rejectionInfo?: RejectionInfo;
  
  // Course locking during review
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  lockReason?: string;
  
  // Versioning and history
  version: number;
  versions?: CourseVersion[];
  history?: CourseHistoryEntry[];
  
  // Content requirements
  objectives: string[];
  syllabus: string;
  requirements: string[];
  targetAudience: string;
  
  // Media and content
  mediaFiles?: Array<{
    id: string;
    type: 'video' | 'pdf' | 'audio' | 'image' | 'quiz';
    name: string;
    url: string;
    duration?: number;
    size?: number;
    uploadedAt: Date;
  }>;
  
  // Quality assurance
  qualityScore?: number;
  complianceChecked: boolean;
  accessibilityChecked: boolean;
  
  // Add coupons property
  coupons?: CourseCoupon[];
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
        isPromotional?: boolean;
        contentFiles?: Array<{
          duration?: number | string;
          name: string;
          url: string;
        }>;
      }>;
    }>;
  };
  members?: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  
  // New fields for tracking edited vs published content
  publishedVersion?: CourseVersion; // Last published version
  draftVersion?: CourseVersion; // Current draft version
  hasUnpublishedChanges?: boolean; // Flag to indicate if there are changes not yet published
  lastPublishedAt?: Date; // When the course was last made live
  lastEditedAt?: Date; // When the course was last edited
  editSummary?: {
    newContent: string[]; // List of new content added
    editedContent: string[]; // List of content that was edited
    removedContent: string[]; // List of content that was removed
  };
}

// Define coupon interface for course context
export interface CourseCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  validFrom: any; // Timestamp
  validUntil: any; // Timestamp
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  minAmount: number;
  maxDiscount?: number;
  priority: number;
  creatorType: 'admin' | 'instructor';
  isGlobal: boolean;
}

// Helper function to calculate course duration from curriculum
export const calculateCourseDuration = (course: Course): number => {
  if (!course.curriculum?.sections) return 0;

  let totalDuration = 0;

  course.curriculum.sections.forEach(section => {
    // Include all sections, not just published ones
    if (section.items) {
      section.items.forEach(item => {
        // Include all items, not just published ones
        if (item.contentFiles) {
          item.contentFiles.forEach(file => {
            if (file.duration !== undefined && file.duration !== null) {
              let durationValue: number;

              // Handle both integer and decimal duration values
              if (typeof file.duration === 'string') {
                // Check if it's already formatted as "MM:SS" or "HH:MM:SS"
                if (file.duration.includes(':')) {
                  const parts = file.duration.split(':');
                  if (parts.length === 2) {
                    // Format: "MM:SS"
                    durationValue = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
                  } else if (parts.length === 3) {
                    // Format: "HH:MM:SS"
                    durationValue = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                  } else {
                    durationValue = parseFloat(file.duration);
                  }
                } else {
                  // Try to parse as number
                  durationValue = parseFloat(file.duration);
                }
              } else {
                durationValue = file.duration;
              }

              if (!isNaN(durationValue) && durationValue > 0) {
                totalDuration += durationValue; // Don't round, keep decimal precision
                console.log(`Course duration: Adding ${durationValue} seconds from file: ${file.name}`);
              }
            }
          });
        }
      });
    }
  });

  console.log(`Total course duration in seconds: ${totalDuration}`);

  // Convert seconds to hours and round to nearest 0.1 hour
  const hours = totalDuration / 3600;
  return Math.round(hours * 10) / 10; // Round to 1 decimal place
};

// Get coupons for a specific course
const getCourseCoupons = async (courseId: string): Promise<CourseCoupon[]> => {
  try {
    const couponsRef = collection(db, "coupons");
    
    // Get both global coupons and course-specific coupons
    const [globalCouponsQuery, courseCouponsQuery] = [
      query(
        couponsRef,
        where("isGlobal", "==", true),
        where("isActive", "==", true),
        orderBy("priority", "desc")
      ),
      query(
        couponsRef,
        where("courseId", "==", courseId),
        where("isActive", "==", true),
        orderBy("priority", "desc")
      )
    ];

    const [globalSnapshot, courseSnapshot] = await Promise.all([
      getDocs(globalCouponsQuery),
      getDocs(courseCouponsQuery)
    ]);

    const globalCoupons = globalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as object
    } as CourseCoupon));

    const courseCoupons = courseSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as object
    } as CourseCoupon));

    // Combine and sort by priority (higher priority first)
    const allCoupons = [...globalCoupons, ...courseCoupons];
    return allCoupons.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error("Error fetching course coupons:", error);
    return [];
  }
};

// Get all courses without any filters (with coupons)
export const getAllCourses = async (includeCoupons: boolean = false): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const coursesQuery = query(
            coursesRef,
            where("status", "==", COURSE_STATUS.PUBLISHED),
            where("isPublished", "==", true)
          );
    
    const querySnapshot = await getDocs(coursesQuery);

    const allCourses = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      } as Course;
    });

    // If coupons are requested, fetch them for each course
    if (includeCoupons && allCourses.length > 0) {
      const coursesWithCoupons = await Promise.all(
        allCourses.map(async (course) => {
          const coupons = await getCourseCoupons(course.id);
          return {
            ...course,
            coupons
          };
        })
      );
      return coursesWithCoupons;
    }

    return allCourses;
  } catch (error) {
    console.error("Error fetching all courses:", error);
    return [];
  }
};

// Get featured courses (with optional coupons)
export const getFeaturedCourses = async (includeCoupons: boolean = false): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const featuredQuery = query(
      coursesRef,
      where("isPublished", "==", true),
      where("status", "==", COURSE_STATUS.PUBLISHED),
      where("featured", "==", true)
    );

    const featuredSnapshot = await getDocs(featuredQuery);
    let featuredCourses = featuredSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      } as Course;
    });

    // If no featured courses found, get all published and approved courses as fallback
    if (featuredCourses.length === 0) {
      const fallbackQuery = query(
        coursesRef,
        where("isPublished", "==", true),
        where("status", "==", "approved")
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      featuredCourses = fallbackSnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data
        } as Course;
      });
    }

    // If coupons are requested, fetch them for each course
    if (includeCoupons && featuredCourses.length > 0) {
      const coursesWithCoupons = await Promise.all(
        featuredCourses.map(async (course) => {
          const coupons = await getCourseCoupons(course.id);
          return {
            ...course,
            coupons
          };
        })
      );
      return coursesWithCoupons;
    }

    return featuredCourses;
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }
};

// Get courses by category (with optional coupons)
export const getCoursesByCategory = async (categoryId: string, includeCoupons: boolean = false): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const categoryQuery = query(
      coursesRef,
      where("category", "==", categoryId),
      where("isPublished", "==", true),
      where("status", "==", COURSE_STATUS.APPROVED)
    );

    const categorySnapshot = await getDocs(categoryQuery);
    const courses = categorySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      } as Course;
    });

    // If coupons are requested, fetch them for each course
    if (includeCoupons && courses.length > 0) {
      const coursesWithCoupons = await Promise.all(
        courses.map(async (course) => {
          const coupons = await getCourseCoupons(course.id);
          return {
            ...course,
            coupons
          };
        })
      );
      return coursesWithCoupons;
    }

    return courses;
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    return [];
  }
};

// Get single course with coupons
export const getCourseWithCoupons = async (courseId: string): Promise<Course | null> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const courseQuery = query(coursesRef, where("__name__", "==", courseId));
    const courseSnapshot = await getDocs(courseQuery);

    if (courseSnapshot.empty) {
      return null;
    }

    const courseDoc = courseSnapshot.docs[0];
    const courseData = {
      id: courseDoc.id,
      ...(courseDoc.data() as object)
    } as Course;

    // Fetch coupons for this course
    const coupons = await getCourseCoupons(courseId);
    
    return {
      ...courseData,
      coupons
    };
  } catch (error) {
    console.error("Error fetching course with coupons:", error);
    return null;
  }
};

// Get applicable coupons for checkout (filters by amount and validity)
export const getApplicableCouponsForCourse = async (
  courseId: string, 
  cartAmount: number,
  userId?: string
): Promise<CourseCoupon[]> => {
  try {
    const allCoupons = await getCourseCoupons(courseId);
    const now = new Date();

    return allCoupons.filter(coupon => {
      // Check if coupon is active
      if (!coupon.isActive) return false;

      // Check minimum amount requirement
      if (coupon.minAmount && cartAmount < coupon.minAmount) return false;

      // Check usage limits
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return false;

      // Check date validity
      const validFrom = coupon.validFrom.toDate ? coupon.validFrom.toDate() : new Date(coupon.validFrom);
      const validUntil = coupon.validUntil.toDate ? coupon.validUntil.toDate() : new Date(coupon.validUntil);
      
      if (now < validFrom || now > validUntil) return false;

      return true;
    });
  } catch (error) {
    console.error("Error fetching applicable coupons:", error);
    return [];
  }
};

// Calculate discount amount for a coupon
export const calculateCouponDiscount = (
  coupon: CourseCoupon, 
  coursePrice: number
): number => {
  if (coupon.type === 'percentage') {
    let discount = (coursePrice * coupon.value) / 100;
    
    // Apply maximum discount limit if set
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  } else {
    // Fixed amount discount
    return Math.min(coupon.value, coursePrice); // Don't discount more than the course price
  }
};

// Get course count by category (existing function unchanged)
export const getCourseCountByCategory = async (categoryId: string): Promise<number> => {
  try {
    const coursesRef = collection(db, "courseDrafts");
    const countQuery = query(
      coursesRef,
      where("category", "==", categoryId),
      where("isPublished", "==", true),
      where("status", "==", COURSE_STATUS.APPROVED)
    );

    const snapshot = await getCountFromServer(countQuery);
    return (snapshot.data() as any).count;
  } catch (error) {
    console.error("Error getting course count by category:", error);
    return 0;
  }
};

// Get all course counts by category (existing function unchanged)
export const getAllCourseCountsByCategory = async (): Promise<Record<string, number>> => {
  try {
    const categories = await getDocs(collection(db, "categories"));
    const courseCounts: Record<string, number> = {};

    for (const categoryDoc of categories.docs) {
      const categoryId = categoryDoc.id;
      const count = await getCourseCountByCategory(categoryId);
      courseCounts[categoryId] = count;
    }

    return courseCounts;
  } catch (error) {
    console.error("Error getting all course counts by category:", error);
    return {};
  }
};