import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { reviewApiService, CourseReview, ReviewStats } from "../../../utils/reviewApiService";
import { useAuth } from "../../../context/AuthContext";

interface CourseReviewsProps {
  courseId?: string;
  loading?: boolean;
}

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${Math.floor(diffInSeconds / 60) === 1 ? 'Minute' : 'Minutes'} Ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${Math.floor(diffInSeconds / 3600) === 1 ? 'Hour' : 'Hours'} Ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ${Math.floor(diffInSeconds / 86400) === 1 ? 'Day' : 'Days'} Ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ${Math.floor(diffInSeconds / 2592000) === 1 ? 'Month' : 'Months'} Ago`;
  return `${Math.floor(diffInSeconds / 31536000)} ${Math.floor(diffInSeconds / 31536000) === 1 ? 'Year' : 'Years'} Ago`;
};

// Helper function to get initial from name
const getInitial = (name?: string): string => {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
};

export default function CourseReviews({ courseId, loading: propLoading = false }: CourseReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const courseIdNum = parseInt(courseId, 10);
        if (isNaN(courseIdNum)) {
          throw new Error('Invalid course ID');
        }
        
        // Load reviews and stats in parallel
        const [reviewsData, statsData] = await Promise.all([
          reviewApiService.getCourseReviews(courseIdNum, true),
          reviewApiService.getReviewStats(courseIdNum)
        ]);
        
        setReviews(reviewsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [courseId]);

  if (propLoading || loading) {
    return (
      <div className="w-full mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Review Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <img 
                    key={i}
                    src="Images/icons/Container (6).png" 
                    className={`h-4 w-4 ${i < Math.round(stats.averageRating) ? 'opacity-100' : 'opacity-30'}`}
                    alt="Star" 
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-gray-500 text-center">No reviews yet. Be the first to review this course!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-800 text-white flex items-center justify-center text-3xl mb-1 font-normal mr-4">
                    {getInitial(review.userName)}
                  </div>
                  <div>
                    <h3 className="text-black text-[15px] font-medium font-['Poppins'] mb-2">
                      {review.userName || review.userEmail || 'Anonymous'}
                    </h3>
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <img 
                          key={i}
                          src="Images/icons/Container (6).png" 
                          className="h-4 w-4" 
                          alt="Star" 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[#676767] text-xs font-medium font-['Poppins']">
                  {formatTimeAgo(review.createdAt)}
                </span>
              </div>
              
              <p className="text-[#3d3d3d] text-sm font-normal font-['Poppins'] mt-3">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
