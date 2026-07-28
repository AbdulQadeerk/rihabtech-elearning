import { Button } from "../../../../components/ui/button";
import { CourseCard } from "../courseList";
import { useEffect, useState } from "react";
import { courseApiService } from "../../../../utils/courseApiService";

interface InstructorCoursesProps {
  instructorId?: string;
}

export default function InstructorCourses({ instructorId }: InstructorCoursesProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!instructorId) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allCourses = await courseApiService.searchCourses({});
        const instructorCourses = [];

        for (const course of allCourses) {
          try {
            const details = await courseApiService.getCourseDetails(course.id);
            const courseInstructorId = details.instructorId ?? details.InstructorId;
            if (courseInstructorId?.toString() === instructorId) {
              instructorCourses.push({
                id: course.id,
                title: course.title,
                description: course.description || "",
                students: course.enrolments || 0,
                duration: 0,
                price: details.pricing === "free" ? 0 : parseFloat(details.pricing || "0") || 0,
                image: course.thumbnailUrl || "/Logos/brand-icon.png",
              });
            }
          } catch (error) {
            console.error(`Error loading course details for ${course.id}:`, error);
          }
        }

        setCourses(instructorCourses);
      } catch (error) {
        console.error("Error loading instructor courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [instructorId]);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="section-title text-center py-12">Instructor Popular Courses</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2 mb-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        <div className="w-full flex justify-center">
          <Button
            variant={'outline'}
            className="border-black text-black rounded-none px-4 py-2 text-sm font-medium hover:bg-blue-50"
            onClick={() => {
              window.location.href = '/#/courselist';
            }}
          >
            View All Courses
          </Button>
        </div>
      </div>
    </section>
  );
}
