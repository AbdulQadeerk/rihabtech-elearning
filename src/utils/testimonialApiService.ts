import { apiService } from './apiService';

export interface Testimonial {
  id: number;
  authorName: string;
  authorImagePath?: string;
  message: string;
  designation: string;
  companyName?: string;
  rating?: number;
}

class TestimonialApiService {
  // Get active testimonials (public endpoint)
  async getActiveTestimonials(): Promise<Testimonial[]> {
    return apiService.get<Testimonial[]>('/testimonial/active');
  }
}

export const testimonialApiService = new TestimonialApiService();
export default testimonialApiService;
