import { Clock, User2 } from "lucide-react";
import Divider from "../../../components/ui/divider";
import { Button } from "../../../components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { courseApiService, Category, CourseGetAllResponse } from "../../../utils/courseApiService";
import { htmlToText } from "../../../lib/utils";
import { FilterSidebar } from "../../../components/ui/FilterSidebar";
import { Filter } from "lucide-react";

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
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Filter States
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync activeTab with selectedCategories for FilterSidebar compatibility
  const selectedCategories = activeTab && activeTab !== 'all' ? [activeTab] : [];
  const setSelectedCategories = (cats: string[]) => {
    setActiveTab(cats.length > 0 ? cats[0] : 'all');
  };

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


  // Function to get filtered courses based on selected category and sidebar filters
  const getFilteredCourses = useCallback(() => {
    let filtered = [...courses];

    // Category filter (linked with activeTab)
    if (activeTab && activeTab !== '' && activeTab !== 'all') {
      const activeCategoryId = Number(activeTab);
      if (!Number.isNaN(activeCategoryId)) {
        filtered = filtered.filter((course) => typeof course.category === 'number' && course.category === activeCategoryId);
      }
    }

    // Price Filter
    if (selectedPrice.length > 0) {
      filtered = filtered.filter(course => {
        const c = course as any;
        const pricing = course.pricing || c['price'];
        const isFree = pricing === "free" || pricing === null || pricing === "" || pricing === 0;
        
        if (selectedPrice.includes('free') && isFree) return true;
        if (selectedPrice.includes('paid') && !isFree) return true;
        return false;
      });
    }

    // Video Duration Filter
    if (selectedDuration.length > 0) {
      filtered = filtered.filter(course => {
        const durationStr = (course as any).duration || (course as any).durationString || "";
        const weeksStr = (course as any).weeks ? `${(course as any).weeks} weeks` : "";
        const durationLower = (typeof durationStr === 'string' ? durationStr : weeksStr).toLowerCase();
        
        if (selectedDuration.includes('duration-0-1') && (durationLower.includes('0-1') || durationLower.includes('1 hour') || durationLower.includes('mins'))) return true;
        if (selectedDuration.includes('duration-1-3') && (durationLower.includes('1-3') || durationLower.includes('2 hours') || durationLower.includes('3 hours'))) return true;
        if (selectedDuration.includes('duration-3-6') && (durationLower.includes('3-6') || durationLower.includes('4 hours') || durationLower.includes('5 hours') || durationLower.includes('6 hours'))) return true;
        if (selectedDuration.includes('duration-6-17') && (durationLower.includes('6-17') || durationLower.includes('weeks') || durationLower.includes('month'))) return true;
        
        return false;
      });
    }

    // Rating Filter (Simplified for now - can be expanded later when api has ratings)
    // Note: Mocking rating filter check if courses don't have explicit ratings from this API
    if (selectedRatings.length > 0) {
       // Optional: Add logic to filter by ratings if featured courses API includes ratings
    }

    // Subcategory / Topic filter
    if (selectedTopics.length > 0) {
       // Optional: Add logic to filter by topic if featured courses API includes topics
    }

    return filtered;
  }, [activeTab, courses, selectedPrice, selectedDuration, selectedRatings, selectedTopics]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const fetchedCategories = await courseApiService.getPublicCategories();
        console.log('Raw fetched categories:', fetchedCategories);

        // Filter categories that should show on home page (isActive and showOnHomePage)
        const categoriesToShow = fetchedCategories
          .filter(category => category.showOnHomePage)
          .sort((a, b) => a.title.localeCompare(b.title));

        console.log('Processed categories:', categoriesToShow);
        setCategories(categoriesToShow);

        // Set 'all' as the default active tab
        setActiveTab('all');
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
    setVisibleCount(8);
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
              <div 
                className={`rounded-[35px] px-2 md:px-4 flex items-center justify-center cursor-pointer ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-white text-primary'}`} 
                onClick={() => setActiveTab('all')}
              >
                <h2 className="flex flex-row justify-center text-center text-sm md:text-md font-medium font-['Archivo'] capitalize">All</h2>
              </div>
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

        {/* Filter Toggle */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} />
            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          {isFilterOpen && (
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div>
                <FilterSidebar 
                  categoryId={activeTab === 'all' ? undefined : activeTab}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  selectedRatings={selectedRatings}
                  setSelectedRatings={setSelectedRatings}
                  selectedPrice={selectedPrice}
                  setSelectedPrice={setSelectedPrice}
                  selectedDuration={selectedDuration}
                  setSelectedDuration={setSelectedDuration}
                  selectedTopics={selectedTopics}
                  setSelectedTopics={setSelectedTopics}
                  hideCategories={false}
                />
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className={`w-full ${isFilterOpen ? 'md:w-3/4 lg:w-4/5' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-12">
              {coursesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-gray-600">Loading courses...</p>
                </div>
          ) : getFilteredCourses().length > 0 ? (
            <>
              {/* API Courses */}
              {getFilteredCourses().slice(0, visibleCount).map((course, index) => (
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
                          <span>{course.enrolments || (course as any).enrollment || (course as any).students || 0} Students</span>
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
            {getFilteredCourses().length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">No courses available for this category.</p>
              </div>
            ):null}
            <div className="col-span-full w-full flex justify-center gap-4">
              {getFilteredCourses().length > visibleCount && (
                <Button 
                  variant={'outline'} 
                  className="border-primary text-primary rounded-none px-4 py-2 text-sm font-medium hover:bg-blue-50" 
                  onClick={() => setVisibleCount(prev => prev + 8)}
                >
                  Show More ({getFilteredCourses().length - visibleCount})
                </Button>
              )}
              <Button variant={'outline'} className="border-black text-black rounded-none px-4 py-2 text-sm font-medium hover:bg-blue-50" onClick={() => {
                window.location.href = '/#/courselist';
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}>
                View All Courses
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}