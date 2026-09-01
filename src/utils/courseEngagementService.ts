import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export type EngagementPeriod = '7d' | '30d' | '12m' | '12m+';
export type EngagementMinuteType = 'all' | 'paid' | 'free_preview';

export interface EngagementSeriesPoint {
  label: string;
  periodKey: string;
  minutesTaught: number;
  paidMinutes?: number;
  freePreviewMinutes?: number;
  activeLearners: number;
}

export interface EngagementCourseRow {
  courseId: number;
  courseTitle: string;
  instructorId?: number;
  instructorName?: string;
  isPublished: boolean;
  status: number;
  minutesTaught: number;
  paidMinutes?: number;
  freePreviewMinutes?: number;
  activeLearners: number;
  paidActiveLearners?: number;
  freePreviewActiveLearners?: number;
  minutesPerActiveLearner: number;
}

export interface CourseEngagementReport {
  totalMinutesTaught: number;
  paidMinutesTaught?: number;
  freePreviewMinutesTaught?: number;
  activeLearners: number;
  paidActiveLearners?: number;
  freePreviewActiveLearners?: number;
  minuteType?: EngagementMinuteType | string;
  period: string;
  fromDate: string;
  toDate: string;
  courseId?: number | null;
  instructorId?: number | null;
  series: EngagementSeriesPoint[];
  courses: EngagementCourseRow[];
}

export interface EngagementCourseOption {
  courseId: number;
  courseTitle: string;
  isPublished: boolean;
  status: number;
  instructorId: number;
  instructorName?: string;
}

class CourseEngagementService {
  async getReport(
    period: EngagementPeriod | string = '12m',
    courseId?: number | null,
    year?: number | null,
    month?: number | null,
    minuteType: EngagementMinuteType | string = 'all'
  ): Promise<CourseEngagementReport> {
    const params: Record<string, string | number> = { period, minuteType };
    if (courseId) {
      params.courseId = courseId;
    }
    if (year) {
      params.year = year;
    }
    if (month) {
      params.month = month;
    }
    return apiService.get<CourseEngagementReport>(
      `${API_BASE_URL}instructor/dashboard/engagement`,
      params
    );
  }

  async getCourses(): Promise<EngagementCourseOption[]> {
    return apiService.get<EngagementCourseOption[]>(
      `${API_BASE_URL}instructor/dashboard/engagement/courses`
    );
  }
}

export const courseEngagementService = new CourseEngagementService();
export default courseEngagementService;
