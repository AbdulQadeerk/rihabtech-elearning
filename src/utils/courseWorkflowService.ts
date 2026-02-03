import { db } from "../lib/firebase";
import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  Course, 
  CourseStatus, 
  CourseEditType, 
  COURSE_STATUS, 
  COURSE_EDIT_TYPE,
  ApprovalInfo,
  RejectionInfo,
  CourseVersion,
  CourseHistoryEntry
} from "./firebaseCourses";
import { NotificationService } from "./notificationService";
import { enrollUserInCourse } from "./paymentService";

export class CourseWorkflowService {
  
  /**
   * Submit a course for review
   */
  static async submitCourseForReview(
    courseId: string, 
    instructorId: string, 
    instructorName: string, 
    instructorEmail: string
  ): Promise<void> {
    try {
      console.log('Starting course submission for review:', { courseId, instructorId });
      
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      console.log('Course data retrieved:', courseData);

if (courseData.members && Array.isArray(courseData.members)) {
  for (const member of courseData.members) {
    console.log('Enrolling member:', member);

    try {
      await enrollUserInCourse(
        courseId,
        member.email || member.id,
        member.email || '',
        undefined,
        courseData?.pricing === 'free' ? 'free' : 'paid'
      );
      console.log(`Member enrolled successfully: ${member.email || member.id}`);
    } catch (err) {
      console.error(`Failed to enroll member ${member.email || member.id}:`, err);
    }
  }
}
      
      // Basic validation - just check if course has a title
      if (!courseData.title || courseData.title.trim() === '') {
        throw new Error("Course title is required for submission");
      }
      
      console.log('Course validation passed, updating status...');
      
      // Lock the course during review
      const updateData = {
        status: COURSE_STATUS.PENDING_REVIEW,
        submittedAt: new Date().toISOString(),
        isLocked: true,
        lockedBy: 'system',
        lockedAt: serverTimestamp(),
        lockReason: 'Under review',
        instructorId,
        instructorName,
        instructorEmail,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      console.log('Course status updated successfully');
      
      // Add to course history (optional, don't fail if this fails)
      try {
        await this.addCourseHistoryEntry(courseId, {
          action: 'submitted_for_review',
          performedBy: {
            name: instructorName,
            email: instructorEmail,
            userId: instructorId
          },
          timestamp: new Date(),
          details: 'Course submitted for admin review',
          previousStatus: courseData.status,
          newStatus: COURSE_STATUS.PENDING_REVIEW
        });
        console.log('Course history entry added');
      } catch (historyError) {
        console.warn('Failed to add course history entry:', historyError);
        // Don't throw, this is not critical
      }
      
      // Send notification to instructor (optional, don't fail if this fails)
      try {
        await NotificationService.sendCourseStatusNotification(
          instructorId,
          courseId,
          courseData.title,
          courseData.status,
          COURSE_STATUS.PENDING_REVIEW,
          instructorName
        );
        console.log('Notification sent successfully');
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't throw, this is not critical
      }
      
      console.log('Course submission completed successfully');
      
    } catch (error) {
      console.error("Error submitting course for review:", error);
      throw error;
    }
  }
  
  
  
  
  /**
   * Check if course can be edited by instructor
   */
  static canEditCourse(course: Course, instructorId: string): boolean {
    // Instructor can only edit their own courses
    if (course.instructorId !== instructorId) {
      return false;
    }
    
    // Check if course is locked
    if (course.isLocked) {
      return false;
    }
    
    // Check status-based editing permissions
    switch (course.status) {
      case COURSE_STATUS.DRAFT:
      case COURSE_STATUS.NEEDS_REVISION:
        return true;
      case COURSE_STATUS.APPROVED:
      case COURSE_STATUS.PUBLISHED:
        // Instructors can edit approved/published courses for minor changes
        return true;
      case COURSE_STATUS.PENDING_REVIEW:
      case COURSE_STATUS.NEEDS_REVISION:
        return false;
      default:
        return false;
    }
  }

  /**
   * Approve a course (Admin only)
   */
  static async approveCourse(
    courseId: string,
    adminId: string,
    adminName: string,
    approvalNotes?: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Validate course is in pending approval
      if (courseData.status !== COURSE_STATUS.PENDING_REVIEW) {
        throw new Error("Course is not pending approval");
      }
      
      // Update course status
      const updateData = {
        status: COURSE_STATUS.APPROVED,
        approvedAt: new Date().toISOString(),
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        lockReason: null,
        approvalInfo: {
          approvedBy: {
            name: adminName,
            email: '',
            userId: adminId,
            timestamp: new Date()
          },
          approvedAt: new Date(),
          approvalNotes: approvalNotes || '',
          featured: false
        } as ApprovalInfo,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: 'approved',
        performedBy: {
          name: adminName,
          email: '',
          userId: adminId
        },
        timestamp: new Date(),
        details: `Course approved by ${adminName}${approvalNotes ? `: ${approvalNotes}` : ''}`,
        previousStatus: COURSE_STATUS.PENDING_REVIEW,
        newStatus: COURSE_STATUS.APPROVED
      });
      
      // Send notification to instructor
      await NotificationService.sendNotification(
        courseData.instructorId,
        'course_approved',
        'Course Approved',
        `Your course "${courseData.title}" has been approved and is ready to publish.`,
        courseId,
        courseData.title
      );
      
    } catch (error) {
      console.error("Error approving course:", error);
      throw error;
    }
  }

  /**
   * Reject a course (Admin only)
   */
  static async rejectCourse(
    courseId: string,
    adminId: string,
    adminName: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Validate course is in pending approval
      if (courseData.status !== COURSE_STATUS.PENDING_REVIEW) {
        throw new Error("Course is not pending approval");
      }
      
      // Update course status
      const updateData = {
        status: COURSE_STATUS.NEEDS_REVISION,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        lockReason: null,
        rejectionInfo: {
          rejectedBy: {
            name: adminName,
            email: '',
            userId: adminId,
            timestamp: new Date()
          },
          rejectedAt: new Date(),
          rejectionReason: rejectionReason,
          rejectionNotes: rejectionReason
        } as RejectionInfo,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: 'rejected',
        performedBy: {
          name: adminName,
          email: '',
          userId: adminId
        },
        timestamp: new Date(),
        details: `Course rejected by ${adminName}: ${rejectionReason}`,
        previousStatus: COURSE_STATUS.PENDING_REVIEW,
        newStatus: COURSE_STATUS.NEEDS_REVISION
      });
      
      // Send notification to instructor
      await NotificationService.sendNotification(
        courseData.instructorId,
        'course_rejected',
        'Course Rejected',
        `Your course "${courseData.title}" was rejected. Reason: ${rejectionReason}`,
        courseId,
        courseData.title
      );
      
    } catch (error) {
      console.error("Error rejecting course:", error);
      throw error;
    }
  }

  /**
   * Request course revision (Admin only)
   */
  static async requestCourseRevision(
    courseId: string,
    adminId: string,
    adminName: string,
    revisionNotes: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Validate course is in pending approval
      if (courseData.status !== COURSE_STATUS.PENDING_REVIEW) {
        throw new Error("Course is not pending approval");
      }
      
      // Update course status
      const updateData = {
        status: COURSE_STATUS.NEEDS_REVISION,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        lockReason: null,
        rejectionInfo: {
          rejectedBy: {
            name: adminName,
            email: '',
            userId: adminId,
            timestamp: new Date()
          },
          rejectedAt: new Date(),
          rejectionReason: revisionNotes,
          rejectionNotes: revisionNotes
        } as RejectionInfo,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: 'revision_requested',
        performedBy: {
          name: adminName,
          email: '',
          userId: adminId
        },
        timestamp: new Date(),
        details: `Revision requested by ${adminName}: ${revisionNotes}`,
        previousStatus: COURSE_STATUS.PENDING_REVIEW,
        newStatus: COURSE_STATUS.NEEDS_REVISION
      });
      
      // Send notification to instructor
      await NotificationService.sendNotification(
        courseData.instructorId,
        'course_needs_revision',
        'Course Revision Required',
        `Your course "${courseData.title}" needs revisions. ${revisionNotes}`,
        courseId,
        courseData.title
      );
      
    } catch (error) {
      console.error("Error requesting course revision:", error);
      throw error;
    }
  }

  /**
   * Publish an approved course (Admin only - for immediate publishing)
   */
  static async publishCourse(
    courseId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Validate course is approved
      if (courseData.status !== COURSE_STATUS.APPROVED) {
        throw new Error("Course must be approved before publishing");
      }
      
      // Update course status
      const updateData = {
        status: COURSE_STATUS.PUBLISHED,
        isPublished: true,
        publishedAt: new Date().toISOString(),
        publishedBy: userId,
        publishedByName: userName,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: 'published',
        performedBy: {
          name: userName,
          email: userEmail,
          userId: userId
        },
        timestamp: new Date(),
        details: `Course published by ${userName}`,
        previousStatus: COURSE_STATUS.APPROVED,
        newStatus: COURSE_STATUS.PUBLISHED
      });
      
      // Send notification to instructor
      await NotificationService.sendNotification(
        courseData.instructorId,
        'course_published',
        'Course Published',
        `Your course "${courseData.title}" is now live and available to learners!`,
        courseId,
        courseData.title
      );
      
    } catch (error) {
      console.error("Error publishing course:", error);
      throw error;
    }
  }

  /**
   * Make course live (Instructor only - after admin approval)
   */
  static async makeCourseLive(
    courseId: string,
    instructorId: string,
    instructorName: string,
    instructorEmail: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Validate course is approved
      if (courseData.status !== COURSE_STATUS.APPROVED) {
        throw new Error("Course must be approved before making live");
      }
      
      // Update course status
      const updateData = {
        status: COURSE_STATUS.PUBLISHED,
        isPublished: true,
        publishedAt: new Date().toISOString(),
        lastPublishedAt: new Date(),
        hasUnpublishedChanges: false,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: 'made_live',
        performedBy: {
          name: instructorName,
          email: instructorEmail,
          userId: instructorId
        },
        timestamp: new Date(),
        details: 'Course made live by instructor after admin approval',
        previousStatus: COURSE_STATUS.APPROVED,
        newStatus: COURSE_STATUS.PUBLISHED
      });
      
      // Send notification to instructor
      // await NotificationService.sendNotification(
      //   instructorId,
      //   'course_made_live',
      //   'Course Made Live',
      //   `Your course "${courseData.title}" is now live and available to learners!`,
      //   courseId,
      //   courseData.title
      // );
      
    } catch (error) {
      console.error("Error making course live:", error);
      throw error;
    }
  }
  
  /**
   * Determine if course edit requires re-approval
   */
  static determineEditType(course: Course, changes: any): CourseEditType {
    // Major changes that require re-approval
    const majorChangeFields = [
      'title',
      'description',
      'curriculum',
      'pricing',
      'objectives',
      'syllabus',
      'requirements',
      'targetAudience'
    ];
    
    // Check if any major fields have changed
    for (const field of majorChangeFields) {
      if (changes[field] !== undefined && changes[field] !== course[field as keyof Course]) {
        return COURSE_EDIT_TYPE.MAJOR;
      }
    }
    
    // Check for new media files or curriculum changes
    if (changes.mediaFiles || changes.curriculum) {
      return COURSE_EDIT_TYPE.MAJOR;
    }
    
    return COURSE_EDIT_TYPE.MINOR;
  }
  
  /**
   * Update course with edit type handling (instructor only)
   */
  static async updateCourse(
    courseId: string,
    changes: any,
    instructorId: string,
    instructorName: string,
    instructorEmail: string
  ): Promise<void> {
    try {
      const courseRef = doc(db, "courseDrafts", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error("Course not found");
      }
      
      const courseData = courseSnap.data() as Course;
      
      // Check if instructor can edit
      if (!this.canEditCourse(courseData, instructorId)) {
        throw new Error("You don't have permission to edit this course");
      }
      
      // Determine edit type
      const editType = this.determineEditType(courseData, changes);
      
      // Prepare update data
      const updateData = {
        ...changes,
        updatedAt: serverTimestamp(),
        version: courseData.version + 1
      };
      
      // Handle major changes for approved/published courses
      if (editType === COURSE_EDIT_TYPE.MAJOR && 
          (courseData.status === COURSE_STATUS.APPROVED || courseData.status === COURSE_STATUS.PUBLISHED)) {
        
        // Create new version
        const newVersion: CourseVersion = {
          versionNumber: courseData.version + 1,
          createdAt: new Date(),
          createdBy: instructorId,
          changes: Object.keys(changes),
          status: courseData.status
        };
        
        updateData.versions = [...(courseData.versions || []), newVersion];
        updateData.status = COURSE_STATUS.DRAFT_UPDATE;
        updateData.isPublished = false;
        updateData.isLocked = true;
        updateData.lockedBy = 'system';
        updateData.lockedAt = serverTimestamp();
        updateData.lockReason = 'Major changes require re-approval';
        updateData.hasUnpublishedChanges = true;
      }
      
      await updateDoc(courseRef, updateData);
      
      // Add to course history
      await this.addCourseHistoryEntry(courseId, {
        action: editType === COURSE_EDIT_TYPE.MAJOR ? 'major_edit' : 'minor_edit',
        performedBy: {
          name: instructorName,
          email: instructorEmail,
          userId: instructorId
        },
        timestamp: new Date(),
        details: `${editType} edit made to course`,
        previousStatus: courseData.status,
        newStatus: updateData.status || courseData.status
      });
      
    } catch (error) {
      console.error("Error updating course:", error);
      throw error;
    }
  }
  
  
  
  /**
   * Get course history
   */
  static async getCourseHistory(courseId: string): Promise<CourseHistoryEntry[]> {
    try {
      const historyRef = collection(db, "courseHistory");
      const q = query(
        historyRef,
        where("courseId", "==", courseId),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data && typeof data === 'object' ? data : {})
        } as CourseHistoryEntry;
      });
      
    } catch (error) {
      console.error("Error fetching course history:", error);
      return [];
    }
  }
  
  /**
   * Add entry to course history
   */
  private static async addCourseHistoryEntry(
    courseId: string, 
    entry: Omit<CourseHistoryEntry, 'id'>
  ): Promise<void> {
    try {
      const historyRef = collection(db, "courseHistory");
      await addDoc(historyRef, {
        courseId,
        ...entry,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding course history entry:", error);
    }
  }
  
  /**
   * Check if course is ready for submission
   */
  private static isCourseReadyForSubmission(course: Course): boolean {
    // Basic required fields
    const basicRequiredFields = ['title', 'description'];
    
    // Check basic required fields
    for (const field of basicRequiredFields) {
      if (!course[field as keyof Course] || course[field as keyof Course] === '') {
        console.log(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Check if course has curriculum with at least one section
    if (!course.curriculum || !course.curriculum.sections || course.curriculum.sections.length === 0) {
      console.log('Missing curriculum sections');
      return false;
    }
    
    // Check if curriculum has at least one item
    const hasItems = course.curriculum.sections.some(section => 
      section.items && section.items.length > 0
    );
    
    if (!hasItems) {
      console.log('Curriculum sections have no items');
      return false;
    }
    
    return true;
  }
  
  
  /**
   * Get instructor's courses
   */
  static async getInstructorCourses(instructorId: string): Promise<Course[]> {
    try {
      const coursesRef = collection(db, "courseDrafts");
      const q = query(
        coursesRef,
        where("instructorId", "==", instructorId),
        orderBy("updatedAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data && typeof data === 'object' ? data : {})
        } as Course;
      });
      
    } catch (error) {
      console.error("Error fetching instructor courses:", error);
      return [];
    }
  }
}
