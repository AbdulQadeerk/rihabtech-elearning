// Email server configuration
export const EMAIL_CONFIG = {
    // Email server URL - change this to your production email server
    EMAIL_SERVER_URL: process.env.REACT_APP_EMAIL_SERVER_URL || 'http://localhost:3000',

    // Frontend URL for email links
    FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || window.location.origin,

    // Default email settings
    DEFAULT_FROM_EMAIL: 'info@zktutorials.com',
    DEFAULT_FROM_NAME: 'ZK Tutorials',

    // Email template types mapping
    TEMPLATE_TYPES: {
        INSTRUCTOR_APPLICATION_APPROVAL: 1,
        INSTRUCTOR_APPLICATION_REJECTION: 2,
        COURSE_SUBMISSION_APPROVAL: 3,
        COURSE_SUBMISSION_REJECTION: 4,
        SUBSCRIPTION_CONFIRMATION: 5,
        SUBSCRIPTION_EXPIRY_REMINDER: 6,
        SUBSCRIPTION_EXPIRED: 7,
        COURSE_ANNOUNCEMENT: 8,
        COUPON_NOTIFICATION: 9,
        PAYMENT_CONFIRMATION: 10,
        CERTIFICATE_GENERATED: 11,
        PASSWORD_RESET: 12,
        WELCOME_EMAIL: 13,
        BULK_MARKETING_EMAIL: 14,
        INSTRUCTOR_ONBOARDING: 15,
        COURSE_COMPLETION: 16,
        PAYMENT_FAILED: 17,
        REFUND_PROCESSED: 18,
        ACCOUNT_SUSPENDED: 19,
        ACCOUNT_REACTIVATED: 20,
        STUDENT_REGISTRATION: 21,
        EMAIL_VERIFICATION: 22,
        COURSE_PURCHASE_CONFIRMATION: 23,
        ENROLLMENT_IN_COURSE: 24,
        INSTRUCTOR_APPLICATION_ON_HOLD: 25,
        COURSE_SUBMITTED_FOR_REVIEW: 26,
        COURSE_ON_HOLD: 27,
        INSTRUCTOR_ANNOUNCEMENT_SENT: 28,
        ADMIN_ANNOUNCEMENT: 29,
        STUDENT_QA_SUBMISSION: 30,
        INSTRUCTOR_REPLY_TO_QA: 31,
        SUBSCRIPTION_REVOKED: 32,
        CATEGORY_SPECIFIC_SUBSCRIPTION_CONFIRMATION: 33,
        CATEGORY_SPECIFIC_SUBSCRIPTION_EXPIRY: 34,
        BANK_DETAILS_UPDATE_REQUIRED: 35,
        MONTHLY_PAYOUT_NOTIFICATION: 36,
        COURSE_ASSIGNMENT_VIA_API: 37,
        BACKUP_DOWNLOAD_NOTIFICATION: 38,
        INSTRUCTOR_BLOCKED: 39,
        INSTRUCTOR_UNBLOCKED: 40
    }
};

// Helper function to get template type name
export const getTemplateTypeName = (type: number): string => {
    const typeNames: { [key: number]: string } = {
        1: 'Instructor Application Approval',
        2: 'Instructor Application Rejection',
        3: 'Course Submission Approval',
        4: 'Course Submission Rejection',
        5: 'Subscription Confirmation',
        6: 'Subscription Expiry Reminder',
        7: 'Subscription Expired',
        8: 'Course Announcement',
        9: 'Coupon Notification',
        10: 'Payment Confirmation',
        11: 'Certificate Generated',
        12: 'Password Reset',
        13: 'Welcome Email',
        14: 'Bulk Marketing Email',
        15: 'Instructor Onboarding',
        16: 'Course Completion',
        17: 'Payment Failed',
        18: 'Refund Processed',
        19: 'Account Suspended',
        20: 'Account Reactivated',
        21: 'Student Registration',
        22: 'Email Verification',
        23: 'Course Purchase Confirmation',
        24: 'Enrollment in Course',
        25: 'Instructor Application On Hold',
        26: 'Course Submitted for Review',
        27: 'Course On Hold',
        28: 'Instructor Announcement Sent',
        29: 'Admin Announcement',
        30: 'Student Q&A Submission',
        31: 'Instructor Reply to Q&A',
        32: 'Subscription Revoked',
        33: 'Category-Specific Subscription Confirmation',
        34: 'Category-Specific Subscription Expiry',
        35: 'Bank Details Update Required',
        36: 'Monthly Payout Notification',
        37: 'Course Assignment via API',
        38: 'Backup Download Notification',
        39: 'Instructor Blocked',
        40: 'Instructor Unblocked'
    };

    return typeNames[type] || 'Unknown Template';
};

