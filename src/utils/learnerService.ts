import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { calculateProgress } from './learnerHomeService';

export interface LearnerCourse {
  id: string;
  title: string;
  description: string;
  students: number;
  duration: number;
  progress?: number;
  price?: number;
  originalPrice?: number;
  image: string;
  category?: string;
  instructor?: string;
  rating?: number;
  enrollmentDate?: any;
  lastAccessed?: any;
  completionPercentage?: number;
}

export interface WishlistItem {
  id: string;
  courseId: string;
  userId: string;
  addedDate: any;
  course?: LearnerCourse;
}

class LearnerService {
  // Get learner's enrolled courses (My Learnings)
  async getMyLearnings(userEmail: string): Promise<LearnerCourse[]> {
    try {
      console.log('🔍 Fetching enrollments for email:', userEmail);
      console.log('🔍 Email type:', typeof userEmail);
      console.log('🔍 Email length:', userEmail?.length);
      
      // Get enrollments for the user using email
      const enrollmentsQuery = query(
        collection(db, 'studentEnrollments'),
        where('studentId', '==', userEmail)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      console.log('📊 Found enrollments:', enrollmentsSnapshot.size);
      
      // Log all enrollments to see what's in the collection
      if (enrollmentsSnapshot.size === 0) {
        console.log('🔍 No enrollments found. Let me check what studentIds exist in the collection...');
        try {
          const allEnrollmentsQuery = query(collection(db, 'studentEnrollments'));
          const allEnrollmentsSnapshot = await getDocs(allEnrollmentsQuery);
          console.log('📊 Total enrollments in collection:', allEnrollmentsSnapshot.size);
          
          allEnrollmentsSnapshot.docs.forEach((doc, index) => {
            const data = doc.data() as any;
            console.log(`📋 Enrollment ${index + 1}:`, {
              id: doc.id,
              studentId: data?.studentId,
              courseId: data?.courseId,
              progress: data?.progress
            });
          });
        } catch (error) {
          console.error('❌ Error accessing studentEnrollments collection:', error);
        }
      }
      
      const courses: LearnerCourse[] = [];
      
      // Sort enrollments by date (client-side sorting to avoid Firebase index requirement)
      const sortedEnrollments = enrollmentsSnapshot.docs.sort((a, b) => {
        const aDate = (a.data() as any)?.enrolledAt?._seconds || 0;
        const bDate = (b.data() as any)?.enrolledAt?._seconds || 0;
        return bDate - aDate; // Descending order (newest first)
      });

      for (const enrollmentDoc of sortedEnrollments) {
  const enrollmentData = enrollmentDoc.data() as any;

  // Fetch progress document for this course+student
  const progressQuery = query(
    collection(db, "studentProgress"),
    where("courseId", "==", enrollmentData?.courseId),
    where("studentId", "==", enrollmentData?.studentId)
  );
  const progressSnap = await getDocs(progressQuery);

  let progressPercent = 0;
  if (!progressSnap.empty) {
  const progressData = progressSnap.docs[0].data() as any;
  progressPercent = calculateProgress(progressData);
  console.log("calculated progress:", progressPercent, progressData);
}

  // Get course details
  const courseDoc = await getDoc(doc(db, "courseDrafts", enrollmentData?.courseId));
  if (courseDoc.exists()) {
    const courseData = courseDoc.data() as any;

    // Debug logging
    console.log(
      "LearnerService - Course data for ID:",
      enrollmentData?.courseId,
      courseData
    );

    courses.push({
      id: courseDoc.id,
      title: courseData?.title || "Untitled Course",
      description: courseData?.description || "No description available",
      students: courseData?.studentsCount || 0,
      duration: courseData?.duration || 0,
      progress: progressPercent, // ✅ use calculated progress here
      price: courseData?.pricing,
      originalPrice: courseData?.originalPrice || undefined,
      image: courseData?.thumbnailUrl || "Images/courses/course 4.jpg",
      category: courseData?.category || "General",
      instructor: courseData?.instructorName || "Unknown Instructor",
      rating: courseData?.rating || 0,
      enrollmentDate: enrollmentData?.enrolledAt,
      lastAccessed: enrollmentData?.lastAccessedAt,
      completionPercentage: progressPercent, // ✅ also use here
    });
  }
}

      return courses;
    } catch (error) {
      console.error('Error fetching my learnings:', error);
      return [];
    }
  }

  // Get learner's wishlist
  async getMyWishlist(userEmail: string): Promise<LearnerCourse[]> {
    try {
      // Get wishlist items for the user
      const wishlistQuery = query(
        collection(db, 'wishlist'),
        where('userId', '==', userEmail)
      );
      
      const wishlistSnapshot = await getDocs(wishlistQuery);
      const courses: LearnerCourse[] = [];

      for (const wishlistDoc of wishlistSnapshot.docs) {
        const wishlistData = wishlistDoc.data() as any;
        
        // Get course details
        const courseDoc = await getDoc(doc(db, 'courseDrafts', wishlistData?.courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as any;
          
          courses.push({
            id: courseDoc.id,
            title: courseData?.title || 'Untitled Course',
            description: courseData?.description || 'No description available',
            students: courseData?.studentsCount || 0,
            duration: courseData?.duration || 0,
            price: courseData?.pricing === 'free' ? 0 : parseFloat(courseData?.pricing) || 0,
            originalPrice: courseData?.originalPrice || undefined,
            image: courseData?.thumbnailUrl || 'Images/courses/course 4.jpg',
            category: courseData?.category || 'General',
            instructor: courseData?.instructorName || 'Unknown Instructor',
            rating: courseData?.rating || 0
          });
        }
      }

      return courses;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  // Get learner statistics
  async getLearnerStats(userEmail: string): Promise<{
    totalCourses: number;
    totalStudents: number;
    completedCourses: number;
    inProgressCourses: number;
    wishlistCount: number;
  }> {
    try {
      const [enrollments, wishlist] = await Promise.all([
        getDocs(query(collection(db, 'studentEnrollments'), where('studentId', '==', userEmail))),
        getDocs(query(collection(db, 'wishlist'), where('userId', '==', userEmail)))
      ]);

      let totalStudents = 0;
      let completedCourses = 0;
      let inProgressCourses = 0;

      for (const enrollmentDoc of enrollments.docs) {
        const data = enrollmentDoc.data() as any;
        if (data?.progress >= 100) {
          completedCourses++;
        } else if (data?.progress > 0) {
          inProgressCourses++;
        }
        
        // Get course student count
        const courseDoc = await getDoc(doc(db, 'courseDrafts', data?.courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as any;
          totalStudents += courseData?.studentsCount || 0;
        }
      }

      return {
        totalCourses: enrollments.size,
        totalStudents,
        completedCourses,
        inProgressCourses,
        wishlistCount: wishlist.size
      };
    } catch (error) {
      console.error('Error fetching learner stats:', error);
      return {
        totalCourses: 0,
        totalStudents: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        wishlistCount: 0
      };
    }
  }

  // Add course to wishlist
  async addToWishlist(userEmail: string, courseId: string): Promise<boolean> {
    try {
      const wishlistRef = collection(db, 'wishlist');
      await getDocs(query(wishlistRef, where('userId', '==', userEmail), where('courseId', '==', courseId)));
      
      // Add to wishlist if not already exists
      // Implementation would go here
      
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  // Remove course from wishlist
  async removeFromWishlist(userEmail: string, courseId: string): Promise<boolean> {
    try {
      // Implementation would go here
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }
}

export const learnerService = new LearnerService();
