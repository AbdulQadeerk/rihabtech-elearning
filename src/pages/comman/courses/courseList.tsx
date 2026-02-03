import { BookOpen, ChevronDown, ChevronRight, Filter, User2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect, useCallback, use } from "react";
import { Checkbox } from "../../../components/ui/checkbox";
import { useParams } from "react-router-dom";
import { courseApiService, CourseGetAllResponse, SubCategory } from "../../../utils/courseApiService";

export default function CourseList() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseGetAllResponse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseGetAllResponse[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(8); // Show 8 courses per page
  const [displayedCourses, setDisplayedCourses] = useState<CourseGetAllResponse[]>([]);
  
  // Filter states
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [categoryName, setcategoryName] = useState<string | null>(null);
    const { categoryId } = useParams<{ categoryId?: string }>();
  
  const toggleFilter = () => setIsFilterOpen(!isFilterOpen);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedRatings([]);
    setSelectedPrice([]);
    setSelectedDuration([]);
    setSelectedTopics([]);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedRatings.length > 0 || selectedPrice.length > 0 || selectedDuration.length > 0 || selectedTopics.length > 0;

  // Fetch courses from API with filters
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Build filter object for API with all required fields and default values
        const filters: {
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
          category: 0,
          subCategories: [0],
          subCategory: 0,
          searchText: '',
          pricing: '',
          minVideoDuration: [0],
          maxVideoDuration: [0],
          minRating: [0],
          maxRating: [0]
        };
        
        // Category filter
        if (categoryId) {
          filters.category = parseInt(categoryId);
        }
        
        // Pricing filter
        if (selectedPrice.length > 0) {
          if (selectedPrice.includes('free') && selectedPrice.includes('paid')) {
            // Both selected, no filter - keep default empty string
            filters.pricing = '';
          } else if (selectedPrice.includes('free')) {
            filters.pricing = 'free';
          } else if (selectedPrice.includes('paid')) {
            filters.pricing = 'paid';
          }
        }
        
        // Video duration filter - support multiple duration ranges
        if (selectedDuration.length > 0) {
          const minDurations: number[] = [];
          const maxDurations: number[] = [];
          
          selectedDuration.forEach(dur => {
            if (dur === 'duration-0-1') {
              minDurations.push(0);
              maxDurations.push(1);
            } else if (dur === 'duration-1-3') {
              minDurations.push(1);
              maxDurations.push(3);
            } else if (dur === 'duration-3-6') {
              minDurations.push(3);
              maxDurations.push(6);
            } else if (dur === 'duration-6-17') {
              minDurations.push(6);
              maxDurations.push(17);
            } else if (dur === 'duration-17-plus') {
              minDurations.push(17);
              maxDurations.push(999); // Large number for "and above"
            }
          });
          
          if (minDurations.length > 0) {
            filters.minVideoDuration = minDurations;
          }
          if (maxDurations.length > 0) {
            filters.maxVideoDuration = maxDurations;
          }
        }
        
        // SubCategory filter - support multiple subcategories
        if (selectedTopics.length > 0) {
          // Extract subcategory IDs from selected topics
          const subCatIds = selectedTopics
            .map(topic => {
              // Try to parse as number (if topic is subcategory ID)
              const id = parseInt(topic);
              return isNaN(id) ? null : id;
            })
            .filter((id): id is number => id !== null);
          
          if (subCatIds.length > 0) {
            filters.subCategories = subCatIds;
          }
        }
        
        // Rating filter - support multiple minimum ratings
        if (selectedRatings.length > 0) {
          const minRatings = selectedRatings.map(r => parseFloat(r));
          filters.minRating = minRatings;
          // For "X & up" ratings, we don't need max, just min
        }
        
        const apiCourses = await courseApiService.getAllPublicCourses(filters);
        console.log('Fetched API courses with filters:', apiCourses);
        
        setCourses(apiCourses);
        setFilteredCourses(apiCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [categoryId, selectedPrice, selectedDuration, selectedTopics, selectedRatings]); // Re-fetch when filters change

     useEffect(() => {
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await courseApiService.getPublicCategories();
      console.log('Raw fetched categories:', fetchedCategories);

      // ✅ find category by ID
      const categoryIdNumber = categoryId ? parseInt(categoryId, 10) : undefined;
      const category = fetchedCategories.find((c: any) => c.id === categoryIdNumber);

      console.log('Processed category:', category);
      if (category) {
        setcategoryName(category.title);
      }

    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchCategories();
}, [categoryId]);

  // Apply client-side filters (only for subcategories/topics since API handles others)
  const applyFilters = useCallback(() => {
    let filtered = [...courses];

    // Topic/SubCategory filter (client-side since we're matching by subCategoryText)
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(course => {
        console.log('Filtering course:', course.title, 'with subCategoryText:', course.subCategoryText);
        return selectedTopics.some(topic => {
          // Match by subCategory ID or title
          const topicId = String(topic);
          const topicString = String(topic || '').toLowerCase();
          return course.subCategory?.toString() === topicId || 
                 (course.subCategoryText && course.subCategoryText.toLowerCase().includes(topicString));
        });
      });
    }

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [courses, selectedTopics]); // Only depend on topics since price and duration are handled by API

  // Pagination logic
  const updateDisplayedCourses = useCallback(() => {
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    setDisplayedCourses(filteredCourses.slice(startIndex, endIndex));
  }, [filteredCourses, currentPage, coursesPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startResult = (currentPage - 1) * coursesPerPage + 1;
  const endResult = Math.min(currentPage * coursesPerPage, filteredCourses.length);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply filters whenever filter states change (only topics now)
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Update displayed courses when filteredCourses or currentPage changes
  useEffect(() => {
    updateDisplayedCourses();
  }, [updateDisplayedCourses]);

  // Initialize filtered courses on component mount
  useEffect(() => {
    if (courses.length > 0) {
      setFilteredCourses(courses);
    }
  }, [courses]);

  // Calculate total students across all courses
  const totalStudents = courses.reduce((total, course) => {
    return total + (course.enrolments || 0);
  }, 0);

  // Count free courses
  const freeCoursesCount = courses.filter(course => 
    course.pricing === "free" || course.pricing === null || course.pricing === ""
  ).length;

  return (
    <section className="min-h-screen bg-white font-sans relative">
      {/* Breadcrumb Navigation */}
      {/* Main content with desktop filter */}
      <div className="flex flex-row w-full justify-center">
        {/* Filter Sidebar - Desktop */}
        <div className={`hidden lg:block lg:w-1/4 xl:w-1/5 pr-8 ${isFilterOpen ? '' : 'lg:hidden'}`}>
          <FilterContent 
            selectedRatings={selectedRatings}
            setSelectedRatings={setSelectedRatings}
            selectedPrice={selectedPrice}
            setSelectedPrice={setSelectedPrice}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            selectedTopics={selectedTopics}
            setSelectedTopics={setSelectedTopics}
          />
        </div>
        <div>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center text-sm">
              <button className="text-[#000927] text-base font-normal font-['Barlow'] leading-relaxed hover:text-primary">Home</button>
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <button className="text-[#000927] text-base font-normal font-['Barlow'] leading-relaxed hover:text-primary">Courses</button>
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              <span className="text-gray-500 text-base font-normal font-['Barlow'] leading-relaxed">{categoryName??'All Courses'}</span>
            </div>
          </div>

          {/* Design Category Header */}
          <div className="container mx-auto px-4 py-2">
            <h1 className="page-title mb-6">{categoryName??'All Courses'}</h1>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading courses...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-8 mb-6">
                  <div className="flex items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                    <BookOpen className="mr-2" color="#666666" size={16} />
                    <span>{freeCoursesCount} Free Courses</span>
                  </div>
                  <div className="flex items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                    <User2 className="mr-2" color="#666666" size={16} />
                    <span>{totalStudents} Students</span>
                  </div>
                </div>

                <p className="text-[#666666] text-base font-normal font-['Barlow'] leading-relaxed mb-8 max-w-6xl">
                  Step into a world of endless learning opportunities with our online course marketplace. Browse a wide range of expertly crafted courses that help you build new skills, grow professionally, and follow your passions. Whether you're aiming to level up your career or dive into a personal hobby, find the perfect course that fits your goals and sparks your curiosity.
                </p>

                {/* Filter and Results */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                  <Button
                    className="mb-4 md:mb-0 px-8 py-2 rounded-none flex items-center justify-center"
                    onClick={toggleFilter}
                  >
                    <Filter size={20} className="mr-2" />
                    Filter
                  </Button>

                  <div className="flex items-center space-x-3">
                    <span className="text-[#666666] text-base font-normal font-['Barlow'] leading-relaxed">
                      Showing {filteredCourses.length > 0 ? startResult : 0} - {endResult} of {filteredCourses.length} results
                    </span>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="text-[#666666] text-base font-normal font-['Barlow'] leading-[19px]">Newly published</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row">
              {/* Filter Sidebar - Mobile */}
              <div className={`fixed inset-y-0 right-0 transform lg:hidden bg-white w-4/5 max-w-sm z-50 overflow-y-auto shadow-lg transition-transform duration-300 ease-in-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl font-semibold">Filters</h2>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          onClick={clearAllFilters}
                          className="text-sm text-primary hover:text-primary-dark p-1"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    <Button variant="ghost" onClick={toggleFilter} className="p-1">
                      <X size={24} />
                    </Button>
                  </div>

                  <FilterContent 
                    selectedRatings={selectedRatings}
                    setSelectedRatings={setSelectedRatings}
                    selectedPrice={selectedPrice}
                    setSelectedPrice={setSelectedPrice}
                    selectedDuration={selectedDuration}
                    setSelectedDuration={setSelectedDuration}
                    selectedTopics={selectedTopics}
                    setSelectedTopics={setSelectedTopics}
                  />
                </div>
              </div>

              {/* Overlay for mobile */}
              {isFilterOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                  onClick={toggleFilter}
                ></div>
              )}



              {/* Course Grid */}
              <div className={`w-full`}>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600 text-lg">Loading courses...</span>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg mb-4">No courses match your current filters.</p>
                    <p className="text-gray-400">Please try adjusting your filter selections.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mt-2 mb-6">
                      {displayedCourses.map((course, index) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="w-full flex justify-center items-center space-x-2 mb-6">
                        <Button
                          variant="outline"
                          className="border-gray-300 text-gray-600 rounded px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              className={`w-10 h-10 rounded text-sm font-medium ${
                                currentPage === page 
                                  ? "bg-primary text-white border-primary" 
                                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                              }`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          className="border-gray-300 text-gray-600 rounded px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

// Accordion Component
type FilterAccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function FilterAccordion({ title, children, defaultOpen = true }: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <ChevronDown 
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          size={20} 
        />
      </button>
      
      <div className={`mt-4 transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {children}
      </div>
    </div>
  );
}

// Filter Content Component with Accordions
function FilterContent({ 
  selectedRatings, 
  setSelectedRatings, 
  selectedPrice, 
  setSelectedPrice, 
  selectedDuration, 
  setSelectedDuration, 
  selectedTopics, 
  setSelectedTopics 
}: {
  selectedRatings: string[];
  setSelectedRatings: (value: string[]) => void;
  selectedPrice: string[];
  setSelectedPrice: (value: string[]) => void;
  selectedDuration: string[];
  setSelectedDuration: (value: string[]) => void;
  selectedTopics: string[];
  setSelectedTopics: (value: string[]) => void;
}) {
  // State for expanded sections
  const [showMoreDuration, setShowMoreDuration] = useState(false);
  const [showMoreTopics, setShowMoreTopics] = useState(false);
    const [additionalTopics, setadditionalTopics] = useState<SubCategory[]>([]);
  
  // Additional items that will show when "Show more" is clicked
  const additionalDurations = [
    { id: "duration-17-plus", label: "17+ Hours" },
    { id: "duration-all", label: "All Durations" }
  ];

  useEffect(() => {
    // Simulate fetching additional topics from an API or data source
    const fetchAdditionalTopics = async () => {
      // Replace this with actual data fetching logic if needed 
      courseApiService.getPublicSubCategories().then((data) => {
            setadditionalTopics(data as any);
          });
        }
    fetchAdditionalTopics();
  }, []);
        
          


  // Handle price filter changes
  const handlePriceChange = (priceType: string, checked: boolean) => {
    if (checked) {
      setSelectedPrice([...selectedPrice, priceType]);
    } else {
      setSelectedPrice(selectedPrice.filter(p => p !== priceType));
    }
  };

  // Handle duration filter changes
  const handleDurationChange = (durationId: string, checked: boolean) => {
    if (checked) {
      setSelectedDuration([...selectedDuration, durationId]);
    } else {
      setSelectedDuration(selectedDuration.filter(d => d !== durationId));
    }
  };

  // Handle topic filter changes
  const handleTopicChange = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics([...selectedTopics, topicId]);
    } else {
      setSelectedTopics(selectedTopics.filter(t => t !== topicId));
    }
  };

  return (
    <div className="space-y-2">
      

      <FilterAccordion title="Price">
        <div className="space-y-3 font-bold">
          <div className="flex items-center">
            <Checkbox 
              id="free" 
              className="mr-3" 
              checked={selectedPrice.includes('free')}
              onCheckedChange={(checked) => handlePriceChange('free', checked as boolean)}
            />
            <label htmlFor="free">Free</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="paid" 
              className="mr-3" 
              checked={selectedPrice.includes('paid')}
              onCheckedChange={(checked) => handlePriceChange('paid', checked as boolean)}
            />
            <label htmlFor="paid">Paid</label>
          </div>
        </div>
      </FilterAccordion>

      {/* Topic Filter */}
      <FilterAccordion title="Sub Category">
        <div className="space-y-3 font-bold max-h-64 overflow-y-auto">
          {additionalTopics.length > 0 && (
            <>
              {additionalTopics.map((topic: any) => {
                // Show first topic always, others only when "Show more" is clicked
                if (!showMoreTopics && additionalTopics.indexOf(topic) > 0) {
                  return null;
                }
                return (
                  <div key={topic.id} className="flex items-center">
                    <Checkbox 
                      id={String(topic.id)} 
                      className="mr-3" 
                      checked={selectedTopics.includes(String(topic.id))}
                      onCheckedChange={(checked) => handleTopicChange(String(topic.id), checked as boolean)}
                    />
                    <label htmlFor={String(topic.id)}>{topic.title}</label>
                  </div>
                );
              })}
            </>
          )}
        </div>
        {additionalTopics.length > 0 && (
          <button 
            className="text-purple-600 mt-3 font-medium focus:outline-none"
            onClick={() => setShowMoreTopics(!showMoreTopics)}
          >
            {showMoreTopics ? "Show less" : "Show more"}
          </button>
        )}
      </FilterAccordion>

      {/* Video Duration Filter */}
      <FilterAccordion title="Video Duration">
        <div className="space-y-3 font-bold">
          <div className="flex items-center">
            <Checkbox 
              id="duration-0-1" 
              className="mr-3" 
              checked={selectedDuration.includes('duration-0-1')}
              onCheckedChange={(checked) => handleDurationChange('duration-0-1', checked as boolean)}
            />
            <label htmlFor="duration-0-1">0-1 Hour</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-1-3" 
              className="mr-3" 
              checked={selectedDuration.includes('duration-1-3')}
              onCheckedChange={(checked) => handleDurationChange('duration-1-3', checked as boolean)}
            />
            <label htmlFor="duration-1-3">1-3 Hours</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-3-6" 
              className="mr-3" 
              checked={selectedDuration.includes('duration-3-6')}
              onCheckedChange={(checked) => handleDurationChange('duration-3-6', checked as boolean)}
            />
            <label htmlFor="duration-3-6">3-6 Hours</label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="duration-6-17" 
              className="mr-3" 
              checked={selectedDuration.includes('duration-6-17')}
              onCheckedChange={(checked) => handleDurationChange('duration-6-17', checked as boolean)}
            />
            <label htmlFor="duration-6-17">6-17 Hours</label>
          </div>
          
          {/* Additional items that appear when "Show more" is clicked */}
          {showMoreDuration && (
            <>
              {additionalDurations.map(duration => (
                <div key={duration.id} className="flex items-center">
                  <Checkbox 
                    id={duration.id} 
                    className="mr-3" 
                    checked={selectedDuration.includes(duration.id)}
                    onCheckedChange={(checked) => handleDurationChange(duration.id, checked as boolean)}
                  />
                  <label htmlFor={duration.id}>{duration.label}</label>
                </div>
              ))}
            </>
          )}
        </div>
        <button 
          className="text-purple-600 mt-3 font-medium focus:outline-none"
          onClick={() => setShowMoreDuration(!showMoreDuration)}
        >
          {showMoreDuration ? "Show less" : "Show more"}
        </button>
      </FilterAccordion>
      
      

      {/* Ratings Filter */}
      <FilterAccordion title="Ratings">
        <div className="space-y-3 font-bold">
          <div className="flex items-center">
            <Checkbox 
              id="rating-4.5" 
              className="mr-3" 
              checked={selectedRatings.includes("4.5")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRatings([...selectedRatings, "4.5"]);
                } else {
                  setSelectedRatings(selectedRatings.filter(r => r !== "4.5"));
                }
              }}
            />
            <label htmlFor="rating-4.5" className="flex items-center">
              <div className="flex text-yellow-400">
                ★★★★<span className="text-yellow-400">½</span>
              </div>
              <span className="ml-2">4.5 & up (320)</span>
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="rating-4.0" 
              className="mr-3" 
              checked={selectedRatings.includes("4.0")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRatings([...selectedRatings, "4.0"]);
                } else {
                  setSelectedRatings(selectedRatings.filter(r => r !== "4.0"));
                }
              }}
            />
            <label htmlFor="rating-4.0" className="flex items-center">
              <div className="flex text-yellow-400">
                ★★★★<span className="text-gray-300">★</span>
              </div>
              <span className="ml-2">4.0 & up (669)</span>
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="rating-3.5" 
              className="mr-3" 
              checked={selectedRatings.includes("3.5")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRatings([...selectedRatings, "3.5"]);
                } else {
                  setSelectedRatings(selectedRatings.filter(r => r !== "3.5"));
                }
              }}
            />
            <label htmlFor="rating-3.5" className="flex items-center">
              <div className="flex text-yellow-400">
                ★★★<span className="text-yellow-400">½</span><span className="text-gray-300">★</span>
              </div>
              <span className="ml-2">3.5 & up (764)</span>
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="rating-3.0" 
              className="mr-3" 
              checked={selectedRatings.includes("3.0")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedRatings([...selectedRatings, "3.0"]);
                } else {
                  setSelectedRatings(selectedRatings.filter(r => r !== "3.0"));
                }
              }}
            />
            <label htmlFor="rating-3.0" className="flex items-center">
              <div className="flex text-yellow-400">
                ★★★<span className="text-gray-300">★★</span>
              </div>
              <span className="ml-2">3.0 & up (781)</span>
            </label>
          </div>
        </div>
      </FilterAccordion>
    </div>
  );
}


export function CourseCard({ course, progress = false }: { 
  course: CourseGetAllResponse | {
    id: string | number;
    title: string;
    description: string;
    students?: number;
    duration?: number;
    progress?: number;
    price?: number;
    originalPrice?: number;
    image?: string;
    thumbnailUrl?: string;
    pricing?: string;
    enrolments?: number;
    weeks?: number;
  }; 
  progress?: boolean 
}) {
  // Calculate student count - handle both interfaces
  const studentCount = (course as any).enrolments || (course as any).students || 0;
  
  // Calculate course duration - handle both interfaces
  const courseDuration = (course as any).weeks || (course as any).duration || 0;
  
  // Get image source - handle both interfaces
  const imageSrc = (course as any).thumbnailUrl || (course as any).image || "/Logos/brand-icon.png";
  
  // Get pricing - handle both interfaces
  const pricing = (course as any).pricing || (course as any).price;
  const isFree = pricing === "free" || pricing === null || pricing === "" || pricing === 0;
  
  // Strip HTML tags from description for preview (keep only text)
  const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };
  
  const descriptionText = stripHtml(course.description || "");
  const truncatedDescription = descriptionText.length > 120 
    ? descriptionText.substring(0, 120) + "..." 
    : descriptionText;
  
  // Format student count
  const formatStudentCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  return (
    <div 
      className="course-card overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg" 
      onClick={() => {
        window.location.hash = `#/courseDetails?courseId=${course.id}`;
        window.location.reload();
      }}
    >
      {/* Course Image */}
      <div className="relative overflow-hidden bg-gray-200 h-40 flex-shrink-0">
        <img 
          src={imageSrc} 
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ minHeight: '10rem', maxHeight: '10rem' }}
          onError={(e) => {
            e.currentTarget.src = '/Logos/brand-icon.png';
          }}
        />
        {/* Pricing Badge on Image */}
        <div className="absolute top-2 right-2 z-10">
          {isFree ? (
            <span className="badge-free-small">Free</span>
          ) : (
            <span className="badge-paid-small">Paid</span>
          )}
        </div>
      </div>

      {/* Course Details */}
      <div className="course-details-section">
        <div className="course-content">
          {/* Course Meta Info */}
          <div className="course-students mb-2">
            <div className="flex items-center gap-4 text-xs text-[#666666]">
              <div className="flex items-center gap-1">
                <User2 size={14} />
                <span>{formatStudentCount(studentCount)} Students</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={14} />
                <span>{courseDuration} {courseDuration === 1 ? 'Week' : 'Weeks'}</span>
              </div>
            </div>
          </div>
          
          {/* Course Title */}
          <h3 className="course-title mb-2 group-hover:text-primary transition-colors duration-200">
            {course.title}
          </h3>
          
          {/* Course Description */}
          {descriptionText && (
            <p className="course-desciption mb-3">
              {truncatedDescription}
            </p>
          )}

          {/* Progress Bar (if applicable) */}
          {progress && (course as any).progress && (
            <div className="course-progress mb-3">
              <div className="course-progress-bar">
                <div
                  className="progress-completed"
                  style={{ width: `${(course as any).progress}%` }}
                ></div>
                <div className="progress-dot" />
              </div>
              <div className="progress-text-completed">{(course as any).progress}% Completed</div>
            </div>
          )}
        </div>

        {/* Course Price Section */}
        <div className="course-price-section mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between w-full">
            {isFree ? (
              <span className="badge-free text-sm">Free Course</span>
            ) : (
              <span className="badge-paid text-sm">View Details</span>
            )}
            <ChevronRight 
              size={18} 
              className="text-[#666666] group-hover:text-primary transition-colors duration-200 flex-shrink-0" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}