import { Button } from "../../../components/ui/button";
import { CourseCard } from "./courseList";
import { useState, useEffect } from "react";
import { courseApiService, CourseGetAllResponse } from "../../../utils/courseApiService";
import { useAuth } from "../../../context/AuthContext";

interface SuggestedCoursesProps {
  currentCourseId: string | number;
}

export default function SuggestedCourses({ currentCourseId }: SuggestedCoursesProps) {
  const [suggestedCourses, setSuggestedCourses] = useState<CourseGetAllResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestedCourses = async () => {
      try {
        setLoading(true);
        
        // Get user ID from token if available
        let userId: number | undefined;
        if (user) {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const parsedToken = JSON.parse(token);
              userId = parsedToken.id;
            } catch (e) {
              console.warn('Could not parse token for userId');
            }
          }
        }

        // Convert currentCourseId to number if it's a string
        const excludeCourseId = typeof currentCourseId === 'string' 
          ? parseInt(currentCourseId, 10) 
          : currentCourseId;

        // Fetch recommended courses, excluding the current course
        const courses = await courseApiService.getRecommendedCourses(
          userId, 
          4, // Limit to 4 courses
          isNaN(excludeCourseId) ? undefined : excludeCourseId
        );

        // Additional client-side filter to ensure current course is excluded
        const filteredCourses = courses.filter(
          course => course.id.toString() !== currentCourseId.toString()
        ).slice(0, 4);

        setSuggestedCourses(filteredCourses);
      } catch (error) {
        console.error('Error fetching suggested courses:', error);
        setSuggestedCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedCourses();
  }, [currentCourseId, user]);

  // If loading, show a loading state
  if (loading) {
    return (
      <section className="py-16 bg-[#F2F2FB]">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading suggested courses...</p>
          </div>
        </div>
      </section>
    );
  }

  // If no courses available, show a message
  if (suggestedCourses.length === 0) {
    return (
      <section className="py-16 bg-[#F2F2FB]">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No other courses available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#F2F2FB]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-12">
          {suggestedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        <div className="text-center">
          <Button 
            className="bg-primary text-white hover:bg-primary/90" 
            onClick={() => window.location.href = '#/courselist'}
          >
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  );
}