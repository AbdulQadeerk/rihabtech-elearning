import { emailService } from './emailService';

export interface ScheduledJob {
  id: string;
  name: string;
  type: 'email_reminder' | 'subscription_check' | 'revenue_calculation';
  schedule: string; // Cron expression
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

class ScheduledJobService {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_JOBS: Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Subscription Expiry Reminders',
      type: 'email_reminder',
      schedule: '0 9 * * *', // Daily at 9 AM
      isActive: true,
      config: {
        reminderDays: [7, 3, 1], // Send reminders 7, 3, and 1 days before expiry
        timezone: 'Asia/Kolkata'
      }
    },
    {
      name: 'Expired Subscription Check',
      type: 'subscription_check',
      schedule: '0 0 * * *', // Daily at midnight
      isActive: true,
      config: {
        timezone: 'Asia/Kolkata'
      }
    }
  ];

  // Initialize scheduled jobs
  async initializeJobs(): Promise<void> {
    try {
      console.log('Initializing scheduled jobs...');
      
      // Initialize email templates first
      await emailService.initializeDefaultTemplates();
      
      // Start the scheduled jobs
      this.startSubscriptionExpiryReminders();
      this.startExpiredSubscriptionCheck();
      
      console.log('Scheduled jobs initialized successfully');
    } catch (error) {
      console.error('Error initializing scheduled jobs:', error);
    }
  }

  // Start subscription expiry reminders job
  private startSubscriptionExpiryReminders(): void {
    const jobId = 'subscription_expiry_reminders';
    
    // Clear existing job if any
    if (this.jobs.has(jobId)) {
      clearInterval(this.jobs.get(jobId)!);
    }

    // Run every hour to check for subscriptions that need reminders
    const interval = setInterval(async () => {
      try {
        console.log('Running subscription expiry reminders job...');
        await emailService.scheduleExpiryReminders();
        console.log('Subscription expiry reminders job completed');
      } catch (error) {
        console.error('Error in subscription expiry reminders job:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    this.jobs.set(jobId, interval);
    console.log('Subscription expiry reminders job started');
  }

  // Start expired subscription check job
  private startExpiredSubscriptionCheck(): void {
    const jobId = 'expired_subscription_check';
    
    // Clear existing job if any
    if (this.jobs.has(jobId)) {
      clearInterval(this.jobs.get(jobId)!);
    }

    // Run every 6 hours to check for expired subscriptions
    const interval = setInterval(async () => {
      try {
        console.log('Running expired subscription check job...');
        await emailService.checkExpiredSubscriptions();
        console.log('Expired subscription check job completed');
      } catch (error) {
        console.error('Error in expired subscription check job:', error);
      }
    }, 6 * 60 * 60 * 1000); // Run every 6 hours

    this.jobs.set(jobId, interval);
    console.log('Expired subscription check job started');
  }

  // Stop a specific job
  stopJob(jobId: string): void {
    if (this.jobs.has(jobId)) {
      clearInterval(this.jobs.get(jobId)!);
      this.jobs.delete(jobId);
      console.log(`Job ${jobId} stopped`);
    }
  }

  // Stop all jobs
  stopAllJobs(): void {
    for (const [jobId, interval] of Array.from(this.jobs.entries())) {
      clearInterval(interval);
      console.log(`Job ${jobId} stopped`);
    }
    this.jobs.clear();
    console.log('All scheduled jobs stopped');
  }

  // Get job status
  getJobStatus(): { [jobId: string]: boolean } {
    const status: { [jobId: string]: boolean } = {};
    for (const jobId of Array.from(this.jobs.keys())) {
      status[jobId] = true;
    }
    return status;
  }

  // Run a job manually (for testing)
  async runJobManually(jobType: string): Promise<void> {
    try {
      switch (jobType) {
        case 'email_reminder':
          console.log('Running subscription expiry reminders manually...');
          await emailService.scheduleExpiryReminders();
          break;
        case 'subscription_check':
          console.log('Running expired subscription check manually...');
          await emailService.checkExpiredSubscriptions();
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
      console.log(`Job ${jobType} completed successfully`);
    } catch (error) {
      console.error(`Error running job ${jobType}:`, error);
      throw error;
    }
  }

  // Parse cron expression (simplified version)
  private parseCronExpression(cronExpression: string): number {
    // This is a simplified cron parser
    // In a real implementation, you'd use a proper cron library
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    const [minute, hour, day, month, weekday] = parts;
    
    // For now, return a fixed interval based on the expression
    // In a real implementation, you'd calculate the next run time
    if (minute === '0' && hour === '9') {
      return 24 * 60 * 60 * 1000; // Daily
    } else if (minute === '0' && hour === '0') {
      return 24 * 60 * 60 * 1000; // Daily
    }
    
    return 60 * 60 * 1000; // Default to hourly
  }

  // Calculate next run time
  private calculateNextRunTime(cronExpression: string): Date {
    const now = new Date();
    const interval = this.parseCronExpression(cronExpression);
    return new Date(now.getTime() + interval);
  }

  // Get all default jobs
  getDefaultJobs(): Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt'>[] {
    return this.DEFAULT_JOBS;
  }

  // Mock data for development
  getMockJobStatus(): { [jobId: string]: { isRunning: boolean; lastRun: Date; nextRun: Date } } {
    return {
      'subscription_expiry_reminders': {
        isRunning: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000) // 22 hours from now
      },
      'expired_subscription_check': {
        isRunning: true,
        lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      }
    };
  }
}

export const scheduledJobService = new ScheduledJobService();
export default scheduledJobService;
