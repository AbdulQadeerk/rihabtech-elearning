import { useState, useEffect, useRef } from "react";
import { Search, List } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Button } from "../../../components/ui/button";
import { courseApiService, Category, SearchCourseResponse } from "../../../utils/courseApiService";

export default function BannerSection() {
  const [searchTxt, setSearchTxt] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [filteredCourses, setFilteredCourses] = useState<SearchCourseResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
        const [isCategoriesloading, setisCategoriesloading] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await courseApiService.getPublicCategories();
      setisCategoriesloading(false);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  // Initial load - fetch all courses when component mounts
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        setLoading(true);
        const results = await courseApiService.searchCourses({});
        setFilteredCourses(results);
      } catch (error) {
        console.error("Error loading courses:", error);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllCourses();
  }, []);

  // Search courses when typing (with debouncing)
  useEffect(() => {
    if (!searchTxt.trim()) {
      // If search is empty, show all courses
      const loadAllCourses = async () => {
        try {
          setLoading(true);
          const results = await courseApiService.searchCourses({});
          setFilteredCourses(results);
        } catch (error) {
          console.error("Error loading courses:", error);
          setFilteredCourses([]);
        } finally {
          setLoading(false);
        }
      };
      loadAllCourses();
      return;
    }

    // Perform search with searchText
    const searchCourses = async () => {
      try {
        setLoading(true);
        const results = await courseApiService.searchCourses({ searchText: searchTxt });
        setFilteredCourses(results);
      } catch (error) {
        console.error("Error searching courses:", error);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchCourses();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchTxt]);

  return (
    <section className="bg-gradient-to-b from-white to-[#f1f1fb] py-12 md:py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        {/* Left side */}
        <div className="flex flex-col gap-6 md:w-1/2">
          <p className="banner-section-subtitle">Professional & Lifelong Learning</p>
          <h1 className="banner-section-title">
            Online Courses With Certificates & Guidance
          </h1>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Categories Popover */}
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <Button className="px-6 py-3 rounded-none h-auto text-white hover:bg-blue-700 font-medium">
                  <List /> Categories
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 bg-white shadow-xl rounded-xl p-2">
                {isCategoriesloading && (
                  <p className="text-gray-500 text-sm p-4">Loading Categories...</p>
                )}
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 rounded"
                    onClick={() => {
                      window.location.href = `#/courselist/${cat.id.toString()}`;
                      setIsCategoryOpen(false);
                    }}
                  >
                    {cat.title}
                  </div>
                ))}
              </PopoverContent>
            </Popover>

            {/* Search Popover */}
            <div className="relative w-full">
              <input
                ref={inputRef}
                placeholder="What do you want to learn?"
                className="outline outline-1 outline-offset-[-1px] outline-[#ff7700] px-4 py-3 w-full"
                value={searchTxt}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchTxt(e.target.value);
                  setIsSearchOpen(true);
                }}
                onBlur={(e) => {
                  // Don't close if clicking on popover content
                  setTimeout(() => {
                    const popoverContent = document.querySelector('[role="dialog"]');
                    if (!popoverContent?.contains(document.activeElement)) {
                      setIsSearchOpen(false);
                    }
                  }, 200);
                }}
              />
              <Search className="absolute top-1/4 right-4 pointer-events-none z-5" />
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[500px] bg-white p-4 max-h-96 overflow-auto shadow-xl rounded-xl"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  align="start"
                  sideOffset={4}
                >
                  {loading ? (
                    <div className="p-6 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <p className="mt-2 text-gray-600 text-sm">Searching...</p>
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No courses found</p>
                  ) : (
                    filteredCourses.map((course, idx) => (
                      <div
                        key={course.id || idx}
                        className="flex items-start gap-4 p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          window.location.href = `#/courseDetails?courseId=${course.id}`;
                          setIsSearchOpen(false);
                        }}
                      >
                        <div className="w-24 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-course.jpg';
                              }}
                            />
                          ) : (
                            <Search className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                          {course.description && (
                            <p 
                              className="text-xs text-gray-600 w-64 truncate mt-1"
                              dangerouslySetInnerHTML={{ __html: course.description }}
                            />
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {course.category && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {course.category}
                              </span>
                            )}
                            {course.subCategory && (
                              <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                {course.subCategory}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <img
              src="Images/Banners/col-md-6.png"
              alt="Happy student learning"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
