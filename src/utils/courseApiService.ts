import { apiService } from './apiService';


export interface CourseCreateRequest {
  title: string;
}

export interface Category {
  id: number;
  title: string;
  isActive?: boolean;
  showOnHomePage: boolean;
}

export interface SubCategory {
  id: number;
  name?: string;
  title?: string;
  subCategoryName?: string;
  categoryId: number;
  showOnHomePage?: boolean;
}

export interface CourseUpdateRequest {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: number | null;
  subCategory: number | null;
  level: string | null;
  language: string | null;
  pricing: string | null;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  welcomeMessage: string | null;
  congratulationsMessage: string | null;
  learn?: string[];
  requirements?: string[];
  target?: string[];
  curriculum?: {
    sections: Array<{
      id?: number; // Section ID from API - required for UPSERT
      name: string;
      published: boolean;
      seqNo: number; // Sequence number
      items: Array<{
        id?: number; // Item ID from API - required for UPSERT (lecture/quiz/assignment)
        type: 'lecture' | 'quiz' | 'assignment';
        lectureName?: string;
        description?: string;
        contentType?: 'video' | 'article';
        videoSource?: 'upload' | 'link';
        contentUrl?: string;
        contentText?: string;
        articleSource?: 'upload' | 'link' | 'write';
        contentFiles?: Array<{
          id?: number; // Content file ID from API
          name: string;
          url: string;
          cloudinaryUrl?: string;
          cloudinaryPublicId?: string;
          duration?: number;
          status: 'uploaded' | 'uploading' | 'failed';
          uploadedAt: string;
        }>;
        resources?: Array<{
          id?: number; // Resource ID from API
          name: string;
          url?: string;
          cloudinaryUrl?: string;
          cloudinaryPublicId?: string;
          type: string;
        }>;
        published: boolean;
        isPromotional?: boolean;
        duration?: number;
        seqNo?: number; // Item sequence number
        // Quiz specific fields
        quizTitle?: string;
        quizDescription?: string;
        questions?: Array<{
          id?: number; // Question ID from API
          question: string;
          options: string[];
          correctOption: number[];
        }>;
        // Assignment specific fields
        title?: string;
        totalMarks?: number;
        assignmentQuestions?: Array<{
          question: string;
          marks: number;
          answer?: string;
          maxWordLimit?: number;
        }>;
      }>;
    }>;
  };
}

// CourseDetailsResponse matches the API response from /course/details/{id}
export interface CourseDetailsResponse {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: number | null;
  subCategory?: number | null;
  level?: string | null;
  language?: string | null;
  pricing?: string | null;
  thumbnailUrl?: string | null;
  promoVideoUrl?: string | null;
  welcomeMessage?: string | null;
  congratulationsMessage?: string | null;
  instructorId?: number | null;
  InstructorId?: number | null; // Backward compatibility
  instructorName?: string | null;
  InstructorName?: string | null; // Backward compatibility
  status?: number;
  isPublished?: boolean;
  hasUnpublishedChanges?: boolean;
  is_featured?: boolean;
  IsFeatured?: boolean;
  submittedAt?: string | null;
  createdDate?: string;
  modifiedDate?: string;
  learn?: string[];
  requirements?: string[];
  target?: string[];
  curriculum?: {
    sections: Array<{
      id?: number;
      name: string;
      published: boolean;
      seqNo?: number;
      items: Array<any>;
    }>;
  };
  enrollment?: number;
  rating?: number;
}

export interface CourseResponse {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: number | null;
  subCategory?: number | null;
  level?: string | null;
  language?: string | null;
  pricing?: string | null;
  visibility?: string | null;
  modifiedDate?: Date | string | null;
  thumbnailUrl?: string | null;
  promoVideoUrl?: string | null;
  welcomeMessage?: string | null;
  congratulationsMessage?: string | null;
  learn?: string[];
  requirements?: string[];
  target?: string[];
  createdAt?: string;
  updatedAt?: string;
  earnings?: number | null;
  rating?: number | null;
  ratingScore?: number | null;
  enrollment?: number | null;
  status?: number | null;
  instructorId?: string | null;
  progress?: number;
  isPublished?: boolean;
  publishedAt?: string | null;
  lastPublishedAt?: string | null;
  submittedForReview?: boolean;
  submittedAt?: string | null;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: string | null;
  lockReason?: string | null;
  version?: number;
  hasUnpublishedChanges?: boolean;
  isIntendedLearnersFinal?: boolean;
  isCurriculumFinal?: boolean;
  allowResubmission?: boolean;
  createdDate?: string;
  curriculum?: {
    sections: Array<{
      id?: number;
      name: string;
      published: boolean;
      seqNo?: number;
      items: Array<{
        id?: number;
        type: 'lecture' | 'quiz' | 'assignment';
        lectureName?: string;
        description?: string;
        contentType?: 'video' | 'article';
        videoSource?: 'upload' | 'link';
        contentUrl?: string;
        contentText?: string;
        articleSource?: 'upload' | 'link' | 'write';
        contentFiles?: Array<{
          id?: number;
          name: string;
          url: string;
          cloudinaryUrl?: string;
          cloudinaryPublicId?: string;
          duration?: number;
          status: 'uploaded' | 'uploading' | 'failed';
          uploadedAt: string;
        }>;
        resources?: Array<{
          id?: number;
          name: string;
          url?: string;
          cloudinaryUrl?: string;
          cloudinaryPublicId?: string;
          type: string;
        }>;
        published: boolean;
        seqNo?: number;
        isPromotional?: boolean;
        duration?: number;
        // Quiz specific fields
        quizTitle?: string;
        quizDescription?: string;
        quizQuestions?: Array<{
          question: string;
          options: string[];
          correctOption: number[];
        }>;
        // Assignment specific fields
        title?: string;
        totalMarks?: number;
        assignmentQuestions?: Array<{
          question: string;
          marks: number;
          answer?: string;
          maxWordLimit?: number;
        }>;
      }>;
    }>;
  };
  rejectionInfo?: {
    rejectionReason?: string;
    rejectionNotes?: string;
    reason?: string;
    rejectedAt?: string | number | Date;
    rejectedBy?: {
      name?: string;
      timestamp?: string | number | Date;
      [key: string]: any;
    };
    [key: string]: any;
  } | null;
}

export interface UpdateCourseMessageResponse {
  message: string;
}

export interface CoursePublishRequest {
  id: number;
}

export interface CoursePublishResponse {
  message: string;
  publishedAt?: string;
  isPublished?: boolean;
}

export interface CourseSubmitForReviewResponse {
  message: string;
  submittedAt?: string;
  isSubmitted?: boolean;
}

export interface CourseUnpublishResponse {
  message: string;
  unpublishedAt?: string;
  isPublished?: boolean;
}

export interface CourseGetAllResponse {
  id: number;
  title: string;
  description: string | null;
  pricing: string | null;
  enrolments: number;
  weeks: number;
  category?: number | null;
  subCategory?: number | null;
  progress?: number;
  thumbnailUrl?: string | null;
  subCategoryText?: string | null;
}

export interface SearchCourseRequest {
  searchText?: string;
}

export interface SearchCourseResponse {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
}

class CourseApiService {
  // Create a new course
  async createCourse(courseData: CourseCreateRequest): Promise<number | CourseResponse> {
    return apiService.post<number | CourseResponse>('/instructor/course/create-new', courseData);
  }

  // Update an existing course
  async updateCourse(courseData: CourseUpdateRequest): Promise<UpdateCourseMessageResponse> {
    // Use longer timeout for draft updates as they involve multiple database operations
    return apiService.post<UpdateCourseMessageResponse>('/instructor/course/update/draft', courseData, { timeout: 60000 }); // 60 seconds
  }

  // Get course by ID
  async getCourseById(id: number): Promise<CourseResponse> {
    return apiService.get<CourseResponse>(`/instructor/course/get-by-id/${id}`);
  }

  // Get course by ID (public endpoint for enrolled students)
  async getCourseByIdPublic(id: number): Promise<CourseResponse> {
    return apiService.get<CourseResponse>(`/course/get-by-id-public/${id}`);
  }

    async getCourseDetails(id: number): Promise<CourseDetailsResponse> {
    return apiService.get<CourseDetailsResponse>(`/course/details/${id}`);
  }

  // Get all courses for instructor
  async getAllCourses(): Promise<CourseResponse[]> {
    return apiService.get<CourseResponse[]>('/instructor/course/get-all');
  }

  // Get all categories
  async getAllCategories(): Promise<Category[]> {
    return apiService.get<Category[]>('/instructor/course/categories');
  }

  // Get all subcategories
  async getAllSubCategories(): Promise<SubCategory[]> {
    return apiService.get<SubCategory[]>('/instructor/course/sub-categories');
  }

  // Get all categories (public endpoint)
  async getPublicCategories(): Promise<Category[]> {
    return apiService.get<Category[]>('/course/categories');
  }

  // Get all subcategories (public endpoint)
  async getPublicSubCategories(): Promise<SubCategory[]> {
    return apiService.get<SubCategory[]>('/course/sub-categories');
  }

  // Get all courses (public endpoint) with filters
  async getAllPublicCourses(filters?: {
    category?: number;
    subCategories?: number[];
    subCategory?: number; // Backward compatibility
    searchText?: string;
    pricing?: string;
    minVideoDuration?: number[];
    maxVideoDuration?: number[];
    minRating?: number[];
    maxRating?: number[];
  }): Promise<CourseGetAllResponse[]> {
    // Always include all required fields with default values
    const requestBody: {
      category: number;
      subCategories: number[];
      subCategory: number;
      searchText: string;
      pricing: string;
      minVideoDuration: number[];
      maxVideoDuration: number[];
      minRating: number[];
      maxRating: number[];
    } = {
      category: filters?.category ?? 0,
      subCategories: filters?.subCategories && filters.subCategories.length > 0 ? filters.subCategories : [0],
      subCategory: filters?.subCategory ?? 0,
      searchText: filters?.searchText ?? '',
      pricing: filters?.pricing ?? '',
      minVideoDuration: filters?.minVideoDuration && filters.minVideoDuration.length > 0 ? filters.minVideoDuration : [0],
      maxVideoDuration: filters?.maxVideoDuration && filters.maxVideoDuration.length > 0 ? filters.maxVideoDuration : [0],
      minRating: filters?.minRating && filters.minRating.length > 0 ? filters.minRating : [0],
      maxRating: filters?.maxRating && filters.maxRating.length > 0 ? filters.maxRating : [0]
    };
    
    return apiService.post<CourseGetAllResponse[]>('/course/get-all', requestBody);
  }

  // Get featured courses (public endpoint)
  async getFeaturedCourses(): Promise<CourseGetAllResponse[]> {
    return apiService.get<CourseGetAllResponse[]>('/course/featured-Course');
  }

  // Get recommended courses (excludes enrolled courses)
  async getRecommendedCourses(userId?: number, limit: number = 12, excludeCourseId?: number): Promise<CourseGetAllResponse[]> {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId.toString());
    }
    if (excludeCourseId) {
      params.append('excludeCourseId', excludeCourseId.toString());
    }
    params.append('limit', limit.toString());
    return apiService.get<CourseGetAllResponse[]>(`/course/recommended?${params.toString()}`);
  }

  // Search courses (public endpoint)
  async searchCourses(searchRequest: SearchCourseRequest = {}): Promise<SearchCourseResponse[]> {
    return apiService.post<SearchCourseResponse[]>('/course/search', searchRequest);
  }

  // Publish a course
  async publishCourse(courseId: number): Promise<CoursePublishResponse> {
    return apiService.post<CoursePublishResponse>('/instructor/course/publish', courseId);
  }

  // Submit course for review
  async submitCourseForReview(courseId: number): Promise<CourseSubmitForReviewResponse> {
    return apiService.post<CourseSubmitForReviewResponse>('/instructor/course/submit-for-review', courseId);
  }

  // Unpublish a course
  async unpublishCourse(courseId: number): Promise<CourseUnpublishResponse> {
    return apiService.post<CourseUnpublishResponse>('/instructor/course/unpublish', { courseId });
  }

  // Get pending changes for a course
  async getCoursePendingChanges(courseId: number): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>(`/course/pending-changes/${courseId}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching pending changes:', error);
      return [];
    }
  }
}

export const courseApiService = new CourseApiService();
export default courseApiService;
