import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, doc, updateDoc, writeBatch, getCountFromServer } from "firebase/firestore";
import { CourseStatus, COURSE_STATUS, COURSE_STATUS_TEXT } from "./firebaseCourses";

export interface Notification {
  id: string;
  userId: string;
  type: 'course_status_change' | 'course_approved' | 'course_rejected' | 'course_needs_revision' | 'course_published' | 'course_archived' | 'course_made_live';
  title: string;
  message: string;
  courseId?: string;
  courseTitle?: string;
  status?: CourseStatus;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  
  /**
   * Send notification to user
   */
  static async sendNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    courseId?: string,
    courseTitle?: string,
    status?: CourseStatus,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const notificationsRef = collection(db, "notifications");
      
      const notification: Omit<Notification, 'id'> = {
        userId,
        type,
        title,
        message,
        courseId,
        courseTitle,
        status,
        isRead: false,
        createdAt: new Date(),
        actionUrl,
        metadata
      };
      
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }
  
  /**
   * Send course status change notification to instructor
   */
  static async sendCourseStatusNotification(
    instructorId: string,
    courseId: string,
    courseTitle: string,
    oldStatus: CourseStatus,
    newStatus: CourseStatus,
    performedBy: string,
    notes?: string
  ): Promise<void> {
    const { title, message, type } = this.getStatusChangeNotification(
      oldStatus,
      newStatus,
      courseTitle,
      performedBy,
      notes
    );
    
    const actionUrl = this.getActionUrl(newStatus, courseId);
    
    await this.sendNotification(
      instructorId,
      type,
      title,
      message,
      courseId,
      courseTitle,
      newStatus,
      actionUrl,
      { oldStatus, performedBy, notes }
    );
  }
  
  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    limitCount: number = 50
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data && typeof data === 'object' ? data : {})
        } as Notification;
      });
      
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        const docRef = doc as any;
        batch.update(docRef.ref, {
          isRead: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
  
  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false)
      );
      
      const snapshot = await getCountFromServer(q);
      return (snapshot.data().count as any) || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }
  
  /**
   * Get status change notification details
   */
  private static getStatusChangeNotification(
    oldStatus: CourseStatus,
    newStatus: CourseStatus,
    courseTitle: string,
    performedBy: string,
    notes?: string
  ): { title: string; message: string; type: Notification['type'] } {
    const courseName = `"${courseTitle}"`;
    
    switch (newStatus) {
      case COURSE_STATUS.PENDING_REVIEW:
        return {
          title: "Course Submitted for Review",
          message: `Your course ${courseName} has been submitted for admin review.`,
          type: 'course_status_change'
        };
        
      case COURSE_STATUS.APPROVED:
        return {
          title: "Course Approved! 🎉",
          message: `Congratulations! Your course ${courseName} has been approved and is ready to be published.${notes ? `\n\nAdmin notes: ${notes}` : ''}`,
          type: 'course_approved'
        };
        
      case COURSE_STATUS.NEEDS_REVISION:
        return {
          title: "Course Rejected",
          message: `Unfortunately, your course ${courseName} was not approved.${notes ? `\n\nReason: ${notes}` : ''}`,
          type: 'course_rejected'
        };
        
      case COURSE_STATUS.NEEDS_REVISION:
        return {
          title: "Course Needs Revision",
          message: `Your course ${courseName} needs some changes before it can be approved.${notes ? `\n\nFeedback: ${notes}` : ''}`,
          type: 'course_needs_revision'
        };
        
      case COURSE_STATUS.PUBLISHED:
        return {
          title: "Course Published! 🌐",
          message: `Your course ${courseName} is now live and available to learners!`,
          type: 'course_published'
        };
        
      case COURSE_STATUS.ARCHIVED:
        return {
          title: "Course Archived",
          message: `Your course ${courseName} has been archived.${notes ? `\n\nReason: ${notes}` : ''}`,
          type: 'course_archived'
        };
        
      default:
        return {
          title: "Course Status Updated",
          message: `Your course ${courseName} status has been updated to ${COURSE_STATUS_TEXT[newStatus]}.`,
          type: 'course_status_change'
        };
    }
  }
  
  /**
   * Get action URL for instructor based on status
   */
  private static getActionUrl(status: CourseStatus, courseId: string): string {
    switch (status) {
      case COURSE_STATUS.PENDING_REVIEW:
        return `/instructor/courses/${courseId}`;
      case COURSE_STATUS.APPROVED:
        return `/instructor/courses/${courseId}/publish`;
      case COURSE_STATUS.NEEDS_REVISION:
      case COURSE_STATUS.NEEDS_REVISION:
        return `/instructor/courses/${courseId}/edit`;
      case COURSE_STATUS.PUBLISHED:
        return `/course/${courseId}`;
      case COURSE_STATUS.ARCHIVED:
        return `/instructor/courses/${courseId}`;
      default:
        return `/instructor/courses/${courseId}`;
    }
  }
  
  /**
   * Send email notification (if email service is configured)
   */
  static async sendEmailNotification(
    userEmail: string,
    notification: Notification
  ): Promise<void> {
    // This would integrate with your email service
    // For now, we'll just log it
    console.log(`Email notification to ${userEmail}:`, notification);
    
    // TODO: Integrate with email service
    // await emailService.send({
    //   to: userEmail,
    //   subject: notification.title,
    //   html: this.generateEmailHTML(notification)
    // });
  }
  
  /**
   * Generate email HTML for notification
   */
  private static generateEmailHTML(notification: Notification): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p style="color: #666; line-height: 1.6;">${notification.message}</p>
        ${notification.actionUrl ? `
          <div style="margin: 20px 0;">
            <a href="${notification.actionUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Course
            </a>
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from the e-learning platform.
        </p>
      </div>
    `;
  }
}

