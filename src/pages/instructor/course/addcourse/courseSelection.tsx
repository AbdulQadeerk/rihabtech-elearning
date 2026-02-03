
import { useState, useEffect, useCallback } from "react";
import { Button } from "../../../../components/ui/button";
import { BookOpen, Edit3, MoreHorizontal } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { courseApiService, CourseResponse } from "../../../../utils/courseApiService";
import { COURSE_STATUS as STATUS_CONSTANTS } from "../../../../constants/courseStatus";
import { transformApiCurriculumToForm, sortCurriculumBySeqNo, stripFilesFromCurriculumForStorage } from "../../../../utils/curriculumHelper";
import { toast } from "sonner";

// Helper function to strip HTML tags from description
const stripHtmlTags = (html: string | null) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Helper function to format pricing value
const formatPricing = (pricing: string | null | undefined): string => {
  if (!pricing) return 'Free';
  const lowerPricing = pricing.toLowerCase();
  if (lowerPricing === 'free' || lowerPricing === 'paid') {
    return lowerPricing.charAt(0).toUpperCase() + lowerPricing.slice(1);
  }
  return pricing; // Return as-is if it's not 'free' or 'paid'
};

// Interface for API course display
interface ApiCourseDisplayData extends CourseResponse {
  progress: number;
  modifiedDate?: Date | null;
  visibility: string;
  pricing: string;
  thumbnail?: string | null;
  description?: string | null;
}

const CourseSelection = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<ApiCourseDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownCourseId, setOpenDropdownCourseId] = useState<number | null>(null);

  // Helper function to calculate course progress
  const calculateCourseProgress = (course: CourseResponse): number => {
    if (!course.curriculum || !course.curriculum.sections || course.curriculum.sections.length === 0) {
      return 0;
    }

    let totalItems = 0;
    let completedItems = 0;

    course.curriculum.sections.forEach(section => {
      if (section.items && section.items.length > 0) {
        totalItems += section.items.length;
        section.items.forEach(item => {
          if (item.published) {
            completedItems++;
          }
        });
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.UserName) {
        console.log("No user email found");
        return;
      }

      console.log("Fetching API courses for user:", user.UserName);
      const apiCoursesData = await courseApiService.getAllCourses();
      console.log("API courses:", apiCoursesData);

      // Transform API data to match the UI structure and filter for Draft courses (status: 1)
      const transformedCourses: ApiCourseDisplayData[] = apiCoursesData
        .filter(course => course.status === STATUS_CONSTANTS.DRAFT) // Filter for Draft courses only
        .map(course => {
          // Convert modifiedDate to Date object if it's a string
          let modifiedDate: Date | null = null;
          if (course.modifiedDate) {
            modifiedDate = course.modifiedDate instanceof Date
              ? course.modifiedDate
              : new Date(course.modifiedDate);
          } else if (course.updatedAt) {
            modifiedDate = new Date(course.updatedAt);
          }

          return {
            ...course,
            // Calculate progress based on course completion
            progress: calculateCourseProgress(course),
            modifiedDate: modifiedDate,
            visibility: course.visibility || 'N/A', // Default visibility
            pricing: course.pricing || 'N/A', // Use API pricing or default
            thumbnail: course.thumbnailUrl,
            description: course.description || null
          };
        });

      console.log("Transformed API courses:", transformedCourses);
      setCourses(transformedCourses);
    } catch (err) {
      console.error("Error fetching API courses:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.UserName]);

  // Fetch courses on component mount
  useEffect(() => {
    if (user?.UserName) {
      fetchCourses();
    }
  }, [user?.UserName, fetchCourses]);

  const handleAddNewCourse = () => {
    console.log('Add new course clicked');
    // Get courseId before clearing it
    const courseId = localStorage.getItem('courseId');
    // Clear any existing course data from localStorage
    localStorage.removeItem('courseId');
    localStorage.removeItem('draftId');
    localStorage.removeItem('addcourseType');
    // Clear any curriculum data from localStorage
    if (courseId) {
      localStorage.removeItem(`curriculum_${courseId}`);
    }
    // Clear global course data state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clearCourseData'));
    }
    // Navigate to course creation
    window.location.hash = '#/instructor/course-title';
  };

  const handleEditCourse = async (course: any) => {
    console.log('Edit course:', course);
    try {
      // Fetch course data from API
      const courseData = await courseApiService.getCourseById(course.id);
      console.log('Fetched course data:', courseData);
      
      // Store the course ID in localStorage for the edit flow
      localStorage.setItem('courseId', course.id.toString());
      localStorage.removeItem('draftId');
      
      // Transform and save curriculum to localStorage if it exists
      if (courseData.curriculum && courseData.curriculum.sections && courseData.curriculum.sections.length > 0) {
        // Sort curriculum by seqNo
        const sortedCurriculum = sortCurriculumBySeqNo(courseData.curriculum);
        
        // Transform API curriculum to form structure
        const transformedCurriculum = transformApiCurriculumToForm(sortedCurriculum);
        
        // Strip files and prepare for localStorage
        const serializableCurriculum = stripFilesFromCurriculumForStorage(transformedCurriculum);
        
        // Save to localStorage
        localStorage.setItem(`curriculum_${course.id}`, JSON.stringify(serializableCurriculum));
        console.log('Saved curriculum to localStorage:', serializableCurriculum);
      } else {
        // Clear any existing curriculum data if course has no curriculum
        localStorage.removeItem(`curriculum_${course.id}`);
      }
      
      // Navigate to course title page
      window.location.hash = '#/instructor/course-title';
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data. Please try again.');
      // Still navigate even if fetch fails, but without curriculum data
      localStorage.setItem('courseId', course.id.toString());
      localStorage.removeItem('draftId');
      window.location.hash = '#/instructor/course-title';
    }
  };

  // Delete course function - temporarily disabled
  // const handleDeleteCourse = async (course: any) => {
  //   if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
  //     try {
  //       // TODO: Add delete API endpoint to courseApiService if needed
  //       // For now, just remove from local state
  //       setCourses(courses.filter((c: any) => c.id !== course.id));
  //       console.log(`Course "${course.title}" removed from list`);
  //       // Note: This only removes from UI. Actual deletion requires API endpoint.
  //     } catch (err) {
  //       console.error("Error deleting course:", err);
  //       alert("Failed to delete course. Please try again.");
  //     }
  //   }
  // };

  return (
    <div className="p-8">
      <h1 className="ins-heading mb-6">Add New Course</h1>

      <div className="grid grid-cols-1 gap-6">
        <CourseCard
          title="Course"
          icon={'Images/icons/Display 1.png'}
          buttonText="Create Course"
        />
        {/* <CourseCard 
          title="Practice Test"
          icon={'Images/icons/Document Align Left 8.png'}
          buttonText="Create Test"
        /> */}
      </div>

      <div className="space-y-4 mt-2">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Drafts</h2>

        {loading ? (
          <div className="flex flex-col gap-2 mt-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-[15px] shadow-md p-2 flex flex-col md:flex-row items-left md:items-center justify-between animate-pulse">
                <div className="flex gap-2 items-center">
                  <div className="w-20 h-[82.29px] bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No course drafts yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first course to see it here.</p>
            <button
              onClick={handleAddNewCourse}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-400 overflow-hidden">
            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-[160px_1fr_140px_120px] bg-gray-50 border-b border-gray-400">
              <div className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thumbnail
              </div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Course Details
              </div>
              {/* <div className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                Progress
              </div> */}
              <div className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                Last Updated
              </div>
              <div className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-400">
              {courses.map((course) => (
                <div key={course.id} className="hover:bg-gray-50 transition-colors">
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-[180px_1fr_120px_120px]">
                    {/* Thumbnail */}
                    <div className="p-4 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/Logos/brand-icon.png';
                            }}
                          />
                        ) : (
                          <img
                            src='/Logos/brand-icon.png'
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-contain rounded-lg p-2"
                          />
                        )}
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="p-4 min-w-0">
                      <div className="flex flex-col gap-2">
                        {/* Title with consistent height */}
                        <div className="h-6 flex items-center">
                          <h3 className="text-sm font-semibold text-gray-900 truncate pr-2" title={course.title}>
                            {course.title}
                          </h3>
                        </div>

                        {/* Description with consistent height */}
                        <div className="h-4 flex items-center">
                          {course.description ? (
                            <div className="text-xs text-gray-600 truncate" title={stripHtmlTags(course.description)}>
                              {stripHtmlTags(course.description)}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No description</span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {/* <span className="px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded">
                            {course.visibility}
                          </span> */}
                          <span className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded">
                            {formatPricing(course.pricing || 'N/A')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {/* <div className="p-4 flex flex-col items-center justify-center">
                      <div className="w-full max-w-[60px] bg-gray-200 rounded-full h-1.5 mb-1">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {course.progress}%
                      </div>
                    </div> */}

                    {/* Last Updated */}
                    <div className="p-4 flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-600">
                        {course.modifiedDate && course.modifiedDate instanceof Date && !isNaN(course.modifiedDate.getTime())
                          ? course.modifiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {course.modifiedDate && course.modifiedDate instanceof Date && !isNaN(course.modifiedDate.getTime())
                          ? course.modifiedDate.toLocaleDateString('en-US', { year: 'numeric' })
                          : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Course"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title} 
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/Logos/brand-icon.png';
                            }}
                          />
                        ) : (
                          <img
                            src='/Logos/brand-icon.png'
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-contain rounded-lg p-2"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate" title={course.title}>
                          {course.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {/* <span className="px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded">
                            {course.visibility}
                          </span> */}
                          <span className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded">
                            {formatPricing(course.pricing)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {course.description && (
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2" title={stripHtmlTags(course.description)}>
                        {stripHtmlTags(course.description)}
                      </div>
                    )}

                    {/* <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{course.progress}%</span>
                    </div> */}

                    <div className="mb-3 text-center">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {course.modifiedDate && course.modifiedDate instanceof Date && !isNaN(course.modifiedDate.getTime())
                            ? course.modifiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Updated</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Course"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownCourseId(openDropdownCourseId === course.id ? null : course.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="More Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openDropdownCourseId === course.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-400 py-1 z-20">
                            <button
                              onClick={() => {
                                handleEditCourse(course);
                                setOpenDropdownCourseId(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-2" />
                              Edit Course
                            </button>
                            {/* Delete Course button hidden temporarily */}
                            {/* <button
                              onClick={() => {
                                handleDeleteCourse(course);
                                setOpenDropdownCourseId(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete Course
                            </button> */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


interface CourseCardProps {
  title: string;
  icon: string;
  buttonText: string;
}

const CourseCard = ({ title, icon, buttonText }: CourseCardProps) => {

  const handleCoursetestSelection = (type: string) => {
    if (type === 'Practice Test') {
      localStorage.setItem('addcourseType', 'practiceTest')
    } else {
      localStorage.removeItem('addcourseType')
    }
    // Get courseId before clearing it
    const courseId = localStorage.getItem('courseId');
    // Clear any existing course data when starting a new course
    localStorage.removeItem('draftId');
    localStorage.removeItem('courseId');
    // Clear any curriculum data from localStorage
    if (courseId) {
      localStorage.removeItem(`curriculum_${courseId}`);
    }
    // Clear global course data state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clearCourseData'));
    }
    window.location.hash = '#/instructor/course-title';
  }
  return (
    <div className="bg-white p-4 md:p-6 border border-gray-200 flex flex-col items-center text-center justify-center">
      <img src={icon} className="h-6" alt={title} />
      <h2 className="text-[#393939] text-[14px] md:text-[22px] font-semibold font-['Raleway'] leading-snug mt-4 mb-2">{title}</h2>
      {/* <p className="text-[#1e1e1e] text-[10px] md:text-sm font-medium font-['Nunito'] mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse laoreet, nulla vitae ultrices iaculis, tortor lorem maximus sem, eu luctus orci dui id sem.
        </p> */}
      <Button className="rounded-none transition-colors" onClick={() => { handleCoursetestSelection(title) }}>
        {buttonText}
      </Button>
    </div>
  );
};

export default CourseSelection