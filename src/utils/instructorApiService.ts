import { apiService } from './apiService';

// Interface for instructor status response
export interface InstructorStatusResponse {
  currStatus?: number | null;
  currStatusDate?: string | null;
  isBlocked?: boolean;
}

// Interface for instructor application data (if needed in future)
export interface InstructorApplication {
  id: string;
  status: number;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

// Interface for instructor profile data (if needed in future)
export interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  specialties?: string[];
  experience?: string;
  education?: string;
  certifications?: string[];
}

class InstructorApiService {
  // Get current instructor status
  async getCurrentStatus(): Promise<InstructorStatusResponse> {
    return apiService.get<InstructorStatusResponse>('/instructor/current-status');
  }

  // Submit instructor application (if needed in future)
  async submitApplication(applicationData: any): Promise<{ message: string }> {
    return apiService.post<{ message: string }>('/instructor/apply', applicationData);
  }

  // Get instructor profile (if needed in future)
  async getProfile(id:number): Promise<{}> {
    return apiService.get('/instructor/details'+`/${id}`);
  }

  // Update instructor profile (if needed in future)
  async updateProfile(profileData: Partial<InstructorProfile>): Promise<{ message: string }> {
    return apiService.put<{ message: string }>('/instructor/profile', profileData);
  }

  // Get instructor dashboard stats (if needed in future)
  async getDashboardStats(): Promise<{
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    return apiService.get<{
      totalCourses: number;
      totalStudents: number;
      totalRevenue: number;
      averageRating: number;
    }>('/instructor/dashboard/stats');
  }

  // Get instructor applications history (if needed in future)
  async getApplicationsHistory(): Promise<InstructorApplication[]> {
    return apiService.get<InstructorApplication[]>('/instructor/applications');
  }
}

export const instructorApiService = new InstructorApiService();
export default instructorApiService;
