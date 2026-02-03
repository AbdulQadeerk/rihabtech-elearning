
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ChevronRight, Search, ShoppingCart, Bell, ChevronDown, List, RefreshCw } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { enrollmentApiService, UserEnrollment } from '../../utils/enrollmentApiService';
import { progressApiService } from '../../utils/progressApiService';
import courseApiService, { Category, CourseGetAllResponse, SearchCourseResponse } from "../../utils/courseApiService";
import { toast } from 'sonner';
import { htmlToText } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";

export default function HomePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ Name?: string } | null>(null);
  interface HomepageCourse {
    id: string;
    title: string;
    thumbnail: string;
    instructor: string;
    progress: number;
    enrolledAt: Date;
    lastAccessed: Date;
  }
  const [enrolledCourses, setEnrolledCourses] = useState<HomepageCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<CourseGetAllResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [searchTxt, setSearchTxt] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
      const [isCategoriesloading, setisCategoriesloading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
      const [filteredCourses, setFilteredCourses] = useState<SearchCourseResponse[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      // Try to get from localStorage first
      const cached = localStorage.getItem('token');
      if (cached) {
        setProfile(JSON.parse(cached));
      } else if (user) {
        setProfile({ Name: user.displayName || user.email || undefined });
      } else {
        setProfile({});
      }
    };
    fetchProfile();
  }, [user]);

    useEffect(() => {
      const fetchCategories = async () => {
        const data = await courseApiService.getPublicCategories();
        setisCategoriesloading(false);
        setCategories(data);
      };
      fetchCategories();
    }, []);


  useEffect(() => {
    const loadHomeData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Loading enrolled courses for user:', user.email);
        // Get enrolled courses from API
        const enrollments = await enrollmentApiService.getMyEnrollments();
        console.log('Found enrollments:', enrollments);

        // Transform enrollments to homepage format
        const enrolledCoursesData = await Promise.all(
          enrollments.slice(0, 4).map(async (enrollment: UserEnrollment) => {
            try {
              // Use progress from enrollment API (already includes progress data)
              let progressValue = enrollment.progress || 0;
              let lastAccessedDate = enrollment.lastAccessedAt 
                ? new Date(enrollment.lastAccessedAt) 
                : new Date(enrollment.enrolledDate);
              
              // If progress is 0, try to fetch from progress API
              if (progressValue === 0) {
                try {
                  const progress = await progressApiService.getProgress(enrollment.courseId);
                  if (progress) {
                    progressValue = progress.progress || 0;
                    lastAccessedDate = progress.lastAccessedAt 
                      ? new Date(progress.lastAccessedAt) 
                      : lastAccessedDate;
                  }
                } catch (err) {
                  console.warn(`Could not fetch progress for course ${enrollment.courseId}:`, err);
                }
              }
              
              return {
                id: enrollment.courseId.toString(),
                title: enrollment.courseTitle,
                thumbnail: enrollment.courseThumbnail || "/Images/courses/default-course.jpg",
                instructor: enrollment.instructorName || "Unknown Instructor",
                progress: progressValue,
                enrolledAt: new Date(enrollment.enrolledDate),
                lastAccessed: lastAccessedDate,
              };
            } catch (err) {
              console.error(`Error loading course ${enrollment.courseId}:`, err);
              return null;
            }
          })
        );

        setEnrolledCourses(enrolledCoursesData.filter(c => c !== null) as HomepageCourse[]);
        setError(null);

        // Fetch recommended courses after enrollments are loaded
        const fetchRecommendedCourses = async () => {
          try {
            // Get user ID from token if available
            let userId: number | undefined = undefined;
            try {
              const token = localStorage.getItem('token');
              if (token) {
                const tokenData = JSON.parse(token);
                userId = tokenData?.id || tokenData?.Id || undefined;
              }
            } catch (e) {
              console.warn('Could not parse user ID from token:', e);
            }
            
            // Fetch recommended courses (excludes enrolled courses)
            const apiCourses = await courseApiService.getRecommendedCourses(userId, 12);
            console.log('Fetched recommended courses:', apiCourses);
            
            // Additional filter on frontend to ensure no enrolled courses slip through
            const enrolledCourseIds = enrollments.map(e => e.courseId.toString());
            const filteredCourses = apiCourses.filter(course => 
              !enrolledCourseIds.includes(course.id.toString())
            );
            
            setRecommendedCourses(filteredCourses);
          } catch (error) {
            console.error("Error fetching recommended courses:", error);
            // Fallback to all public courses if recommended endpoint fails
            try {
              const apiCourses = await courseApiService.getAllPublicCourses();
              const enrolledCourseIds = enrollments.map(e => e.courseId.toString());
              const filteredCourses = apiCourses.filter(course => 
                !enrolledCourseIds.includes(course.id.toString())
              );
              setRecommendedCourses(filteredCourses);
            } catch (fallbackError) {
              console.error("Error fetching fallback courses:", fallbackError);
              setRecommendedCourses([]);
            }
          }
        };
    
        await fetchRecommendedCourses();
      } catch (error) {
        console.error('Error loading home data:', error);
        setError('Failed to load data');
        toast.error('Failed to load enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [user]);

  const handleRefresh = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);

      // Reload enrolled courses
      const enrollments = await enrollmentApiService.getMyEnrollments();
      const enrolledCoursesData = await Promise.all(
        enrollments.slice(0, 4).map(async (enrollment: UserEnrollment) => {
          try {
            const courseDetails = await courseApiService.getCourseDetails(enrollment.courseId);
            const progress = await progressApiService.getProgress(enrollment.courseId);
            
            return {
              id: enrollment.courseId.toString(),
              title: enrollment.courseTitle,
              thumbnail: enrollment.courseThumbnail || "/Images/courses/default-course.jpg",
              instructor: enrollment.instructorName || "Unknown Instructor",
              progress: progress?.progress || 0,
              enrolledAt: new Date(enrollment.enrolledDate),
              lastAccessed: progress?.lastAccessedAt ? new Date(progress.lastAccessedAt) : new Date(enrollment.enrolledDate),
            };
          } catch (err) {
            console.error(`Error loading course ${enrollment.courseId}:`, err);
            return null;
          }
        })
      );
      setEnrolledCourses(enrolledCoursesData.filter(c => c !== null) as HomepageCourse[]);
      setError(null);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      // setEnrolledCourses(getMockEnrolledCourses());
      // setRecommendedCourses(getMockRecommendedCourses());
      setError('Failed to refresh data');
      toast.error('Failed to refresh data. Using sample data instead.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex flex-col min-h-screen">

      {/* Hero Section */}
      <section className="landing-gradient py-12 md:py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-start">
          <div className="flex flex-col gap-6 md:w-1/2">
            <p className="banner-section-subtitle">
              Professional & Lifelong Learning
            </p>
            <h1 className="banner-section-title">
              Welcome Back, <span className="text-primary">{profile?.Name || user?.displayName || user?.email || 'Learner'}!</span>
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

      {/* My Learnings Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">My Learnings</h2>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Using sample data
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {enrolledCourses.map((course, index) => (
                <div
                  key={course.id || index}
                  className="course-card overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (course.progress && course.progress > 0) {
                      window.location.href = `/#/learner/current-course?courseId=${course.id}`;
                    } else {
                      window.location.href = `/#/courseDetails?courseId=${course.id}`;
                    }
                  }}
                >
                  <div className="relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} />
                    ) : (
                      <img src="/Logos/brand-icon.png" alt={course.title} />
                    )}
                  </div>
                  <div className="course-details-section">
                    <div className="course-content">
                      <div className="course-students">
                        <div className="py-0.5 flex gap-2 items-center">
                          <span>{course.progress?.toFixed(0) ?? 0}% complete</span>
                        </div>
                      </div>
                      <h3 className="course-title line-clamp-2">{course.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">You haven't enrolled in any courses yet.</p>
              <Button
                onClick={() => window.location.href = '/#/courselist'}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700"
              >
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Courses You May Like Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">Courses You May Like</h2>
            {error && (
              <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Using sample data
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : recommendedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedCourses.slice(0, 4).map((course, index) => (
                  <CourseCard key={course.id || index} course={course} />
                ))}
              </div>

              {recommendedCourses.length > 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {recommendedCourses.slice(4, 8).map((course, index) => (
                    <CourseCard key={course.id || index} course={course} />
                  ))}
                </div>
              )}

              {recommendedCourses.length > 8 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {recommendedCourses.slice(8, 12).map((course, index) => (
                    <CourseCard key={course.id || index} course={course} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No recommended courses available at the moment.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}



function CourseCard({ course, progress = false }: { course: CourseGetAllResponse; progress?: boolean }) {
  return (
    <div className="course-card overflow-hidden" onClick={() => {
      if (course.progress!>0) {
        window.location.href = `/#/learner/current-course/?courseId=${course.id}`;
      } else {
        window.location.href = `/#/courseDetails/?courseId=${course.id}`;
      }
    }}>
      <div className="relative">
        {course.thumbnailUrl?(
        <img src={course.thumbnailUrl} alt={course.title} />
        ):(
<img src='/Logos/brand-icon.png' alt={course.title} />
        )}


      </div>

      <div className="course-details-section">
        <div className="course-content">
          <div className="course-students">
            <div className=" py-0.5 flex gap-2 items-center">
              {/* <User2 size={16}/> */}
              <span>{course.enrolments} Students</span>
            </div>
            {/* <Divider/> */}
            <div className="py-0.5 flex items-center gap-2">
              {/* <Clock size={16}/> */}
              <span>{course.weeks} Weeks</span>
            </div>
          </div>
          <h3 className="course-title">{course.title}</h3>
          <p className="course-desciption">{htmlToText(course.description??'')}</p>

          {progress && (
            <div className="course-progress">
              <div className="course-progress-bar">
                <div
                  className="progress-completed"
                  style={{ width: `${course.progress}%` }}
                ></div><div className="progress-dot" />
              </div>
              <div className="progress-text-completed">{course.progress}% Completed</div>
            </div>
          )}
        </div>

        <div className="course-price-section">
          {(course.pricing=='free') ? (
            <span className="badge-free">{course.pricing}</span>
          ) : (
            <span className="badge-paid">{course.pricing}</span>
          )}
        </div>
      </div>
    </div>
  );
}