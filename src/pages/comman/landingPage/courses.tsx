import { Clock, User2 } from "lucide-react";
import Divider from "../../../components/ui/divider";
import { Button } from "../../../components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { courseApiService, Category, CourseGetAllResponse } from "../../../utils/courseApiService";
import { htmlToText } from "../../../lib/utils";

// Course interface based on your Firebase data structure
// interface Course {
//   id: string;
//   title: string;
//   subtitle: string;
//   description: string;
//   thumbnailUrl: string;
//   pricing: string;
//   level: string;
//   language: string;
//   category: string;
//   subcategory: string;
//   status: string;
//   isPublished: boolean;
//   members?: Array<{
//     id: string;
//     email: string;
//     role: string;
//   }>;
//   curriculum?: {
//     sections: Array<{
//       name: string;
//       items: Array<{
//         lectureName: string;
//         contentType: string;
//         duration?: number;
//       }>;
//     }>;
//   };
// }

export default function Courses() {
  const [activeTab, setActiveTab] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<CourseGetAllResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Function to fetch featured courses from API
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const apiCoursesData = await courseApiService.getFeaturedCourses();
      console.log('Fetched featured courses:', apiCoursesData);
      setCourses(apiCoursesData);
    } catch (error) {
      console.error("Error fetching featured courses:", error);
    } finally {
      setCoursesLoading(false);
    }
  };


  // Function to get filtered courses based on selected category
  const getFilteredCourses = useCallback(() => {
    if (!activeTab || activeTab === '') {
      return courses; // Show all courses if no category is selected
    }

    // Parse activeTab to number and filter by matching category id
    const activeCategoryId = Number(activeTab);
    if (Number.isNaN(activeCategoryId)) {
      return courses;
    }

    return courses.filter((course) => {
      // course.category may be undefined or null
      return typeof course.category === 'number' && course.category === activeCategoryId;
    });
  }, [activeTab, courses]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const fetchedCategories = await courseApiService.getPublicCategories();
        console.log('Raw fetched categories:', fetchedCategories);

        // Filter categories that should show on home page (isActive and showOnHomePage)
        const categoriesToShow = fetchedCategories.filter(category =>
          category.showOnHomePage
        );

        console.log('Processed categories:', categoriesToShow);
        setCategories(categoriesToShow);

        // Set the first category as active if available
        if (categoriesToShow.length > 0) {
          const firstCategoryId = categoriesToShow[0].id;
          console.log('Setting active tab to:', firstCategoryId);
          setActiveTab(firstCategoryId.toString());
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchCourses(); // Fetch API courses when component mounts
  }, []);

  // Debug function to log when activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    console.log('Filtered courses count:', getFilteredCourses().length);
  }, [activeTab, courses, getFilteredCourses]);

  return (
    <section className="py-16 bg-[#F2F2FB]">

      <div className="container mx-auto px-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length > 0 ? (
          <>
            <div className="grid grid-cols-3 md:grid-cols-8 gap-2 justify-start mb-8">
              {categories.map((category, index) => (
                <div key={index} className={`rounded-[35px] px-2 md:px-4 flex items-center justify-center cursor-pointer ${activeTab === category.id.toString() ? 'bg-primary text-white' : 'bg-white text-primary'}`} onClick={() => {
                  setActiveTab(category.id.toString());
                }}>
                  <h2 className="flex flex-row justify-center text-center text-sm md:text-md font-medium font-['Archivo'] capitalize">{category.title}</h2>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No categories available</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-12">
          {coursesLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-600">Loading courses...</p>
            </div>
          ) : getFilteredCourses().length > 0 ? (
            <>
              {/* API Courses */}
              {getFilteredCourses().map((course, index) => (
                <div
                  key={`api-${index}`}
                  className="course-card-alt"
                  onClick={() => {
                    // Navigate to course details with the course ID
                    window.location.hash = `#/courseDetails?courseId=${course.id}`;
                  }}
                >
                  <div className="relative">
                  <img src={course.thumbnailUrl || "/Logos/brand-icon.png"} alt={course.title} className="w-full h-40 object-cover" />
                  
                </div>
                  <div className="course-body">
                    <div className="course-content">
                      <h3 className="course-title">{course.title}</h3>
                      <div className="course-meta">
                        <div className="flex items-center gap-2">
                          <User2 size={16} />
                          <span>{course.enrolments} Students</span>
                        </div>
                        <Divider />
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{course.weeks} Weeks</span>
                        </div>
                      </div>
                      <div className="course-description" >{htmlToText(course.description??'')}</div>
                    </div>

                    <div className="course-pricing">
                      {course.pricing === null || course.pricing === "" || course.pricing?.toLowerCase() === "free" ? (
                        <div className="course-free">
                          <div className="flex items-center gap-2">
                            <span className="badge-free">Free</span>
                          </div>
                          <Divider /> <button className="course-cta">Start learning</button>
                        </div>
                      ) : (
                        <div className="course-paid">
                          <div className="flex items-center gap-2">
                            <span className="badge-paid">Paid</span>
                          </div>
                          <Divider /> <button className="course-cta">Start learning</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            null
          )}
        </div>
        {getFilteredCourses().length === 0 ? (<div className="text-center py-8">
              <p className="text-gray-600">No courses available for this category.</p>
            </div>):null}
        <div className="w-full flex justify-center">
          <Button variant={'outline'} className="border-black text-black rounded-none px-4 py-2 text-sm font-medium hover:bg-blue-50" onClick={() => {
            window.location.href = '/#/courselist';
            window.scrollTo({ top: 0, behavior: 'smooth' })// Scroll to the top of the page
          }}>
            View All Courses
          </Button>
        </div>

      </div>
    </section>
  )
}