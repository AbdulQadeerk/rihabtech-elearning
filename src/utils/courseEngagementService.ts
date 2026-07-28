import apiService from './apiService';
import { API_BASE_URL } from '../lib/api';

export type EngagementPeriod = '7d' | '30d' | '12m' | '12m+';

export interface EngagementSeriesPoint {
  label: string;
  periodKey: string;
  minutesTaught: number;
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
  activeLearners: number;
  minutesPerActiveLearner: number;
}

export interface CourseEngagementReport {
  totalMinutesTaught: number;
  activeLearners: number;
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
  async getReport(period: EngagementPeriod = '12m', courseId?: number | null): Promise<CourseEngagementReport> {
    const params: Record<string, string | number> = { period };
    if (courseId) {
      params.courseId = courseId;
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
