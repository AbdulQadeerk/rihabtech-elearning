import axios from 'axios';
import { EMAIL_CONFIG } from '../config/emailConfig';
import { db } from '../lib/firebase';
import { collection, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Email server configuration
const EMAIL_SERVER_URL = EMAIL_CONFIG.EMAIL_SERVER_URL;

export interface EmailTemplate {
    id: string;
    type: number;
    name: string;
    subject: string;
    body: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailData {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    templateType: number;
    variables: { [key: string]: any };
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

export interface SubscriptionEmailData {
    userEmail: string;
    userName: string;
    planName: string;
    planDuration: string;
    amount: number;
    currency: string;
    receipt: string;
    paymentId: string;
    subscriptionId: string;
    startDate: Date;
    endDate: Date;
    categoryName?: string;
}

export interface ExpiryReminderData {
    userEmail: string;
    userName: string;
    planName: string;
    planDuration: string;
    endDate: Date;
    daysUntilExpiry: number;
    subscriptionId: string;
    renewalUrl: string;
}

class NodemailerService {
    private readonly EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';
    private readonly EMAIL_NOTIFICATIONS_COLLECTION = 'emailNotifications';
    private readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';
    private readonly USERS_COLLECTION = 'users';

    /**
     * Send email using template with dynamic placeholders
     */
    async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const response = await axios.post(`${EMAIL_SERVER_URL}/email/send-template`, {
                to: emailData.to,
                cc: emailData.cc,
                bcc: emailData.bcc,
                templateType: emailData.templateType,
                variables: emailData.variables,
                attachments: emailData.attachments
            });

            return {
                success: response.data.success,
                messageId: response.data.messageId,
                error: response.data.error
            };

        } catch (error: any) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to send email'
            };
        }
    }

    /**
     * Send subscription confirmation email
     */
    async sendSubscriptionConfirmation(data: SubscriptionEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 5, // Subscription Confirmation
            variables: {
                firstName: data.userName,
                planName: data.planName,
                amount: data.amount,
                currency: data.currency,
                startDate: data.startDate.toLocaleDateString('en-IN'),
                endDate: data.endDate.toLocaleDateString('en-IN'),
                categoryName: data.categoryName || 'All Categories',
                loginNowLink: `${window.location.origin}/dashboard`,
                browseCoursesLink: `${window.location.origin}/courses`
            }
        });
    }

    /**
     * Send subscription expiry reminder
     */
    async sendSubscriptionExpiryReminder(data: ExpiryReminderData): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 6, // Subscription Expiry Reminder
            variables: {
                firstName: data.userName,
                planName: data.planName,
                expiryDate: data.endDate.toLocaleDateString('en-IN'),
                daysUntilExpiry: data.daysUntilExpiry,
                renewNowLink: `${window.location.origin}/pricing?renew=true`
            }
        });
    }

    /**
     * Send subscription expired notification
     */
    async sendSubscriptionExpired(data: ExpiryReminderData): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 7, // Subscription Expired
            variables: {
                firstName: data.userName,
                planName: data.planName,
                expiryDate: data.endDate.toLocaleDateString('en-IN'),
                renewNowLink: `${window.location.origin}/pricing?renew=true`
            }
        });
    }

    /**
     * Send instructor application approval
     */
    async sendInstructorApproval(data: {
        userEmail: string;
        userName: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 1, // Instructor Application Approval
            variables: {
                firstName: data.userName,
                createCourseLink: `${window.location.origin}/instructor/dashboard/courses/create`
            }
        });
    }

    /**
     * Send instructor application rejection
     */
    async sendInstructorRejection(data: {
        userEmail: string;
        userName: string;
        reason?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 2, // Instructor Application Rejection
            variables: {
                firstName: data.userName,
                rejectionReason: data.reason || 'Please review our instructor requirements and try again.'
            }
        });
    }

    /**
     * Send course approval notification
     */
    async sendCourseApproval(data: {
        userEmail: string;
        userName: string;
        courseName: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 3, // Course Submission Approval
            variables: {
                firstName: data.userName,
                courseName: data.courseName,
                viewCourseLink: `${window.location.origin}/courses/${data.courseName.toLowerCase().replace(/\s+/g, '-')}`
            }
        });
    }

    /**
     * Send course rejection notification
     */
    async sendCourseRejection(data: {
        userEmail: string;
        userName: string;
        courseName: string;
        reason: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 4, // Course Submission Rejection
            variables: {
                firstName: data.userName,
                courseName: data.courseName,
                rejectionReason: data.reason
            }
        });
    }

    /**
     * Send subscription revoked notification
     */
    async sendSubscriptionRevoked(data: {
        userEmail: string;
        userName: string;
        reason: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 32, // Subscription Revoked
            variables: {
                firstName: data.userName,
                revocationReason: data.reason
            }
        });
    }

    /**
     * Send category-specific subscription confirmation
     */
    async sendCategorySubscriptionConfirmation(data: {
        userEmail: string;
        userName: string;
        categoryName: string;
        planName: string;
        amount: number;
        currency: string;
        endDate: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 33, // Category-Specific Subscription Confirmation
            variables: {
                firstName: data.userName,
                categoryName: data.categoryName,
                planName: data.planName,
                amount: data.amount,
                currency: data.currency,
                endDate: data.endDate,
                browseCoursesLink: `${window.location.origin}/courses?category=${data.categoryName.toLowerCase()}`
            }
        });
    }

    /**
     * Send monthly payout notification to instructor
     */
    async sendMonthlyPayout(data: {
        userEmail: string;
        userName: string;
        monthYear: string;
        totalWatchMinutes: number;
        instructorShare: number;
        platformFee: number;
        taxAmount: number;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 36, // Monthly Payout Notification
            variables: {
                firstName: data.userName,
                monthYear: data.monthYear,
                totalWatchMinutes: data.totalWatchMinutes,
                instructorShare: data.instructorShare,
                platformFee: data.platformFee,
                taxAmount: data.taxAmount
            }
        });
    }

    /**
     * Send course assignment via API
     */
    async sendCourseAssignment(data: {
        userEmail: string;
        userName: string;
        courseName: string;
        categoryName: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 37, // Course Assignment via API
            variables: {
                firstName: data.userName,
                courseName: data.courseName,
                categoryName: data.categoryName,
                accessCourseLink: `${window.location.origin}/courses/${data.courseName.toLowerCase().replace(/\s+/g, '-')}`
            }
        });
    }

    /**
     * Send instructor blocked notification
     */
    async sendInstructorBlocked(data: {
        userEmail: string;
        userName: string;
        reason: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 39, // Instructor Blocked
            variables: {
                firstName: data.userName,
                blockReason: data.reason
            }
        });
    }

    /**
     * Send instructor unblocked notification
     */
    async sendInstructorUnblocked(data: {
        userEmail: string;
        userName: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        return this.sendEmail({
            to: data.userEmail,
            templateType: 40, // Instructor Unblocked
            variables: {
                firstName: data.userName
            }
        });
    }

    /**
     * Send bulk email to multiple recipients
     */
    async sendBulkEmail(data: {
        recipients: string[];
        templateType: number;
        variables: { [key: string]: any };
    }): Promise<{ success: boolean; sentCount: number; failedCount: number; errors: string[] }> {
        const results = await Promise.allSettled(
            data.recipients.map(email =>
                this.sendEmail({
                    to: email,
                    templateType: data.templateType,
                    variables: data.variables
                })
            )
        );

        const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failedCount = results.length - sentCount;
        const errors = results
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
            .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error);

        return {
            success: failedCount === 0,
            sentCount,
            failedCount,
            errors
        };
    }

    /**
     * Get available email templates
     */
    async getEmailTemplates(): Promise<{ success: boolean; templates?: EmailTemplate[]; error?: string }> {
        try {
            const response = await axios.get(`${EMAIL_SERVER_URL}/email/templates`);
            return {
                success: response.data.success,
                templates: response.data.templates,
                error: response.data.error
            };
        } catch (error: any) {
            console.error('Error fetching email templates:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to fetch templates'
            };
        }
    }

    /**
     * Test email server connection
     */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await axios.get(`${EMAIL_SERVER_URL}/health`);
            return {
                success: response.data.status === 'OK',
                error: response.data.status !== 'OK' ? 'Server not responding' : undefined
            };
        } catch (error: any) {
            console.error('Error testing email server connection:', error);
            return {
                success: false,
                error: error.message || 'Failed to connect to email server'
            };
        }
    }

    /**
     * Schedule expiry reminders for all active subscriptions
     */
    async scheduleExpiryReminders(): Promise<void> {
        try {
            const now = new Date();
            const reminderDays = [7, 3, 1]; // Send reminders 7, 3, and 1 days before expiry

            for (const days of reminderDays) {
                const reminderDate = new Date(now);
                reminderDate.setDate(reminderDate.getDate() + days);

                // Get subscriptions expiring on the reminder date
                const subscriptionsQuery = query(
                    collection(db, this.SUBSCRIPTIONS_COLLECTION),
                    where('status', '==', 'active'),
                    where('isActive', '==', true)
                );

                const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

                for (const doc of subscriptionsSnapshot.docs) {
                    const subscription = doc.data() as any;
                    const endDate = subscription.endDate?.toDate();

                    if (endDate && this.isSameDay(endDate, reminderDate)) {
                        // Get user details
                        const userDoc = await getDocs(query(
                            collection(db, this.USERS_COLLECTION),
                            where('__name__', '==', subscription.userId)
                        ));

                        if (!userDoc.empty) {
                            const userData = userDoc.docs[0].data() as any;

                            const reminderData: ExpiryReminderData = {
                                userEmail: subscription.userEmail,
                                userName: userData.displayName || userData.name || 'User',
                                planName: subscription.planName,
                                planDuration: subscription.planDuration,
                                endDate: endDate,
                                daysUntilExpiry: days,
                                subscriptionId: doc.id,
                                renewalUrl: `${window.location.origin}/pricing?renew=${doc.id}`
                            };

                            await this.sendSubscriptionExpiryReminder(reminderData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error scheduling expiry reminders:', error);
        }
    }

    /**
     * Check for expired subscriptions and send notifications
     */
    async checkExpiredSubscriptions(): Promise<void> {
        try {
            const now = new Date();

            // Get subscriptions that expired today
            const subscriptionsQuery = query(
                collection(db, this.SUBSCRIPTIONS_COLLECTION),
                where('status', '==', 'active'),
                where('isActive', '==', true)
            );

            const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

            for (const docSnapshot of subscriptionsSnapshot.docs) {
                const subscription = docSnapshot.data() as any;
                const endDate = subscription.endDate?.toDate();

                if (endDate && endDate <= now) {
                    // Mark subscription as expired
                    await updateDoc(doc(db, this.SUBSCRIPTIONS_COLLECTION, docSnapshot.id), {
                        status: 'expired',
                        isActive: false,
                        updatedAt: serverTimestamp()
                    });

                    // Get user details
                    const userDoc = await getDocs(query(
                        collection(db, this.USERS_COLLECTION),
                        where('__name__', '==', subscription.userId)
                    ));

                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data() as any;

                        const expiredData: ExpiryReminderData = {
                            userEmail: subscription.userEmail,
                            userName: userData.displayName || userData.name || 'User',
                            planName: subscription.planName,
                            planDuration: subscription.planDuration,
                            endDate: endDate,
                            daysUntilExpiry: 0,
                            subscriptionId: docSnapshot.id,
                            renewalUrl: `${window.location.origin}/pricing?renew=${docSnapshot.id}`
                        };

                        await this.sendSubscriptionExpired(expiredData);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking expired subscriptions:', error);
        }
    }

    /**
     * Helper function to check if two dates are the same day
     */
    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
}

export const nodemailerService = new NodemailerService();
export default nodemailerService;
