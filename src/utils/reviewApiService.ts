import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface CourseReview {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userProfileImage?: string;
  courseId: number;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number }; // Rating (1-5) -> Count
}

interface ReviewApiResponse {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userProfileImage: string | null;
  courseId: number;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateReviewRequest {
  courseId: number;
  rating: number;
  comment: string;
}

interface UpdateReviewRequest {
  rating: number;
  comment: string;
}

class ReviewApiService {
  private BASE_URL = `${API_BASE_URL}review`;

  /**
   * Get all reviews for a course
   */
  async getCourseReviews(courseId: number, approvedOnly: boolean = true): Promise<CourseReview[]> {
    try {
      const response = await apiClient.get<ReviewApiResponse[]>(
        `${this.BASE_URL}/course/${courseId}?approvedOnly=${approvedOnly}`
      );
      return (response.data || []).map(this.mapApiToReview);
    } catch (error: any) {
      console.error('Error fetching course reviews:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }

  /**
   * Get review statistics for a course
   */
  async getReviewStats(courseId: number): Promise<ReviewStats> {
    try {
      const response = await apiClient.get<ReviewStats>(`${this.BASE_URL}/course/${courseId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching review stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch review statistics');
    }
  }

  /**
   * Get user's review for a course
   */
  async getMyReview(courseId: number): Promise<CourseReview | null> {
    try {
      const response = await apiClient.get<ReviewApiResponse>(`${this.BASE_URL}/my-review/${courseId}`);
      return this.mapApiToReview(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching my review:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch review');
    }
  }

  /**
   * Create a new review
   */
  async createReview(review: CreateReviewRequest): Promise<CourseReview> {
    try {
      const response = await apiClient.post<ReviewApiResponse>(this.BASE_URL, review);
      return this.mapApiToReview(response.data);
    } catch (error: any) {
      console.error('Error creating review:', error);
      throw new Error(error.response?.data?.message || 'Failed to create review');
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId: number, review: UpdateReviewRequest): Promise<CourseReview> {
    try {
      const response = await apiClient.put<ReviewApiResponse>(`${this.BASE_URL}/${reviewId}`, review);
      return this.mapApiToReview(response.data);
    } catch (error: any) {
      console.error('Error updating review:', error);
      throw new Error(error.response?.data?.message || 'Failed to update review');
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${reviewId}`);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  }

  /**
   * Map API response to CourseReview format
   */
  private mapApiToReview(apiReview: ReviewApiResponse): CourseReview {
    return {
      id: apiReview.id,
      userId: apiReview.userId,
      userName: apiReview.userName || undefined,
      userEmail: apiReview.userEmail || undefined,
      userProfileImage: apiReview.userProfileImage || undefined,
      courseId: apiReview.courseId,
      rating: apiReview.rating,
      comment: apiReview.comment,
      isApproved: apiReview.isApproved,
      createdAt: new Date(apiReview.createdAt),
      updatedAt: new Date(apiReview.updatedAt)
    };
  }
}

export const reviewApiService = new ReviewApiService();

