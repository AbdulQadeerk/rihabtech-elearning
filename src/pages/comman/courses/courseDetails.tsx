import { Play } from "lucide-react";
import Divider from "../../../components/ui/divider";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import SuggestedCourses from "./courses";
import Curriculum from "./coursecurriculam";
import CartModal from "../../../modals/cartModal";
import CheckoutModal from "../../../components/ui/CheckoutModal";
import CoursePreviewModal from "../../../modals/coursePreviewModal";
import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { getUserActiveSubscription, Subscription } from "../../../utils/subscriptionService";
import { courseApiService, CourseGetAllResponse, CourseResponse } from "../../../utils/courseApiService";
import { enrollmentApiService } from "../../../utils/enrollmentApiService";
import { getLanguageLabel } from "../../../utils/languages";
import { getLevelLabel } from "../../../utils/levels";
import { CourseCard } from "./courseList";
import instructorApiService from "../../../utils/instructorApiService";
import { reviewApiService, ReviewStats, CourseReview } from "../../../utils/reviewApiService";
import { API_BASE_URL_IMG } from "../../../lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";

// Use CourseResponse interface from API service
type ExtendedCourse = CourseResponse;

// Instructor data interface
interface InstructorData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  areaOfExpertise: string;
  teachingTopics: string;
  publishedCourseCount: number;
  profileImage?: string;
}

export default function CourseDetails() {
  const [isCartModalOpen, setIsCartModalOpen] = React.useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [course, setCourse] = useState<ExtendedCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<CourseGetAllResponse[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [activePlan, setActivePlan] = useState<Subscription | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [myReview, setMyReview] = useState<CourseReview | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const location = useLocation();

  // Get course ID from multiple sources
  const { courseId } = useParams();
  const [sectionIndex, setsectionIndex] = useState<number | null>(null);

  // Function to extract course ID from URL hash or query parameters
  const getCourseIdFromURL = (): string | null => {
    // First try useParams
    if (courseId) return courseId;

    // Try to get from URL hash (e.g., #/courseDetails?courseId=123)
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryString = hash.split('?')[1];
      const courseIdQueryString = queryString.split('/')[0];
      const lectureIndexQueryString = queryString.split('/')[1];
      const urlParams = new URLSearchParams(courseIdQueryString);
      const lectureParams = new URLSearchParams(lectureIndexQueryString);
      const sectionIndexParam = lectureParams.get("sectionIndex");
      setsectionIndex(sectionIndexParam ? parseInt(sectionIndexParam, 10) : null);
      return urlParams.get('courseId');
    }

    // Try to get from URL search params
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
  };

  // Function to fetch available courses for selection
  const fetchAvailableCourses = async () => {
    try {
      const courses = await courseApiService.getAllPublicCourses();
      // Transform the response to match our interface
      const transformedCourses: CourseGetAllResponse[] = courses;
      setAvailableCourses(transformedCourses);
    } catch (error) {
      console.error("Error fetching available courses:", error);
    }
  };

  // Check enrollment status
  const checkEnrollmentStatus = async (courseId: number) => {
    if (!user) return;

    setCheckingEnrollment(true);
    try {
      const result = await enrollmentApiService.checkEnrollment(courseId);
      setIsEnrolled(result.isEnrolled);

      // If user has access but not enrolled, they can enroll
      // If user is enrolled, show "View Course" button
      // If user doesn't have access, show subscription message
      if (!result.hasAccess && !result.isEnrolled) {
        console.warn('User does not have access:', result.message);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        if (user) {
          const sub = await getUserActiveSubscription(user.email || user.uid);
          setActivePlan(sub);
        }

        // remove redirect key (optional: only if we're on the right page)
        localStorage.removeItem("redirectAfterSubscription");

        const extractedCourseId = getCourseIdFromURL();
        if (!extractedCourseId) {
          await fetchAvailableCourses();
          setLoading(false);
          return;
        }
        await fetchAvailableCourses();

        setLoading(true);
        // Use API service to fetch course by ID
        const courseData = await courseApiService.getCourseByIdPublic(parseInt(extractedCourseId));
        setCourse(courseData);

        // Fetch review stats and reviews for the course
        try {
          const [stats, reviewsData] = await Promise.all([
            reviewApiService.getReviewStats(courseData.id),
            reviewApiService.getCourseReviews(courseData.id, true)
          ]);
          setReviewStats(stats);
          setReviews(reviewsData);

          // Check if user has already reviewed this course
          if (user) {
            try {
              const existingReview = await reviewApiService.getMyReview(courseData.id);
              setMyReview(existingReview);
              if (existingReview) {
                setReviewRating(existingReview.rating || 0);
                setReviewComment(existingReview.comment || "");
              }
            } catch (error) {
              // User hasn't reviewed yet, which is fine
              setMyReview(null);
            }
          }
        } catch (error) {
          console.error("Error fetching review stats:", error);
          // Set default stats if fetch fails
          setReviewStats({ averageRating: 0, totalReviews: 0, ratingDistribution: {} });
          setReviews([]);
        }

        if (user) {
          await checkEnrollmentStatus(courseData.id);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [location, user]); // only depend on location + user


  // Function to count students - using enrollment count from API
  const countStudents = (): number => {
    // For now, return a default value since enrollment count is not in the API response
    // This should be updated when enrollment data is available
    return 0;
  };

  // Function to count total lessons from curriculum
  const countTotalLessons = (curriculum?: ExtendedCourse['curriculum']): number => {
    if (!curriculum?.sections) return 0;
    let totalLessons = 0;
    curriculum.sections.forEach(section => {
      if (section.published) {
        totalLessons += section.items.filter(item => item.published).length;
      }
    });
    return totalLessons;
  };

  const getInstructorDetails = async (): Promise<void> => {
    if (!course?.instructorId) return;
    const instructorId = course.instructorId;
    if (instructorId) {
      const instructorData = await instructorApiService.getProfile(parseInt(instructorId));
      setInstructor({
        id: instructorId,
        name: (instructorData as any)?.instructorName || "Unknown Instructor",
        email: (instructorData as any)?.instructorEmail || "",
        role: "Instructor",
        bio: (instructorData as any)?.bio || "",
        areaOfExpertise: (instructorData as any)?.areaOfExpertise || "N/A",
        teachingTopics: (instructorData as any)?.teachingTopics || "N/A",
        publishedCourseCount: (instructorData as any)?.publishedCourseCount || 0,
        profileImage: (instructorData as any)?.profileImage || "",
      });
    }
  };
  useEffect(() => {
    getInstructorDetails();
  }, [course]);

  // Function to get instructor name
  const getInstructorName = (): string => {
    return instructor?.name || "Unknown Instructor";
  };

  // Function to get instructor email
  const getInstructorEmail = (): string => {
    return instructor?.email || "";
  };

  // Function to get course duration with fallback
  const getCourseDuration = (): string => {
    if (!course) return "Duration not available";

    console.log('getCourseDuration called with course:', course);
    console.log('Course curriculum:', course.curriculum);

    // Calculate duration directly from curriculum items
    if (course.curriculum?.sections) {
      console.log('Calculating duration from curriculum items');
      let totalSeconds = 0;

      course.curriculum.sections.forEach((section, sectionIndex) => {
        console.log(`Section ${sectionIndex}: ${section.name} with ${section.items?.length || 0} items`);

        if (section.items) {
          section.items.forEach((item, itemIndex) => {
            console.log(`Item ${itemIndex}: ${item.lectureName}, contentType: ${item.contentType}`);

            if (item.contentFiles && item.contentFiles.length > 0) {
              console.log(`Item ${itemIndex} has ${item.contentFiles.length} content files:`, item.contentFiles);

              item.contentFiles.forEach((file, fileIndex) => {
                if (file.duration !== undefined && file.duration !== null) {
                  let durationValue: number;

                  // Handle both integer and decimal duration values
                  if (typeof file.duration === 'string') {
                    // Check if it's already formatted as "MM:SS" or "HH:MM:SS"
                    const durationStr = file.duration as string;
                    if (durationStr.includes(':')) {
                      const parts = durationStr.split(':');
                      if (parts.length === 2) {
                        // Format: "MM:SS"
                        durationValue = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
                      } else if (parts.length === 3) {
                        // Format: "HH:MM:SS"
                        durationValue = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                      } else {
                        durationValue = parseFloat(durationStr);
                      }
                    } else {
                      // Try to parse as number
                      durationValue = parseFloat(durationStr);
                    }
                  } else {
                    durationValue = file.duration as number;
                  }

                  if (!isNaN(durationValue) && durationValue > 0) {
                    totalSeconds += durationValue; // Don't round, keep decimal precision
                    console.log(`Duration: Adding ${durationValue} seconds from file: ${file.name}`);
                  }
                }
              });
            }
          });
        }
      });

      console.log(`Total duration in seconds: ${totalSeconds}`);

      if (totalSeconds > 0) {
        const hours = totalSeconds / 3600;
        const roundedHours = Math.round(hours * 10) / 10; // Round to 1 decimal place
        console.log(`Total duration in hours: ${roundedHours}`);
        return `${roundedHours} hours`;
      }
    }

    return "Duration not available";
  };

  // Handle Buy Now click (Enroll Now)
  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please log in to enroll in this course');
      window.location.hash = '#/login';
      return;
    }

    if (!course) {
      toast.error('Course information not available');
      return;
    }

    if (isEnrolled) {
      toast.info('You are already enrolled in this course');
      window.location.hash = '#/learner/my-learnings';
      return;
    }

    try {
      // Check enrollment status first
      const checkResult = await enrollmentApiService.checkEnrollment(course.id);

      if (!checkResult.hasAccess) {
        toast.error(checkResult.message || 'You do not have access to enroll in this course. Please subscribe to the appropriate category.');
        // Redirect to pricing if they need subscription
        if (checkResult.message?.includes('subscribe')) {
          localStorage.setItem('redirectAfterSubscription', window.location.hash);
          window.location.hash = '#/pricing';
        }
        return;
      }

      // Enroll the user
      const enrollmentResponse = await enrollmentApiService.enrollInCourse(course.id);

      if (enrollmentResponse.success) {
        setIsEnrolled(true);

        // Show welcome message popup if available
        if (course.welcomeMessage) {
          setShowWelcomeMessage(true);
        } else {
          // If no welcome message, just show toast and redirect
          toast.success('Course Successfully Enrolled');
          window.location.hash = `#/learner/current-course?courseId=${course.id}`;
        }
      } else {
        toast.error(enrollmentResponse.message || 'Failed to enroll in course');
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course. Please try again.');
    }
  };

  // Handle Go to Course (for enrolled users)
  const handleGoToCourse = () => {
    if (!user) {
      toast.error('Please log in to access your courses');
      return;
    }

    window.location.hash = `#/learner/current-course?courseId=${course?.id}`;
  };
  const handleSubscribeNow = async () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      window.location.hash = '#/login';
      return;
    }
    localStorage.setItem('redirectAfterSubscription', window.location.hash ?? `#/courseDetails?courseId=${course?.id}`);
    window.location.hash = '#/pricing';
  };

  // Get button text and action
  const getButtonConfig = () => {
    console.log('activePlan:', activePlan);
    const pricing = course?.pricing?.toLowerCase();
    const hasActivePlanForCourse =
      activePlan && activePlan.categoryId && activePlan.categoryId.toString() === course?.category?.toString();

    if (authLoading) {
      return {
        text: "Loading...",
        action: () => { },
        disabled: true,
        variant: "default" as const
      };
    }

    if (!user) {
      return {
        text: pricing === "free" ? "Login to Enroll" : "Login to Buy",
        action: () => {
          window.location.hash = '#/login';
        },
        disabled: false,
        variant: "default" as const
      };
    }

    if (checkingEnrollment) {
      return {
        text: "Checking...",
        action: () => { },
        disabled: true,
        variant: "default" as const
      };
    }

    if (isEnrolled) {
      return {
        text: "View Course",
        action: handleGoToCourse,
        disabled: false,
        variant: "default" as const
      };
    }

    // If course is free, allow enrollment
    if (pricing === "free") {
      return {
        text: "Enroll Now",
        action: handleBuyNow,
        disabled: false,
        variant: "default" as const,
      };
    }

    // For paid courses, check subscription
    if (!activePlan || (activePlan.categoryId && activePlan.categoryId.toString() !== course?.category?.toString())) {
      return {
        text: "Enroll Now",
        action: handleSubscribeNow,
        disabled: false,
        variant: "default" as const,
      };
    }

    // If activePlan exists and matches course category (or no category restriction)
    return {
      text: "Enroll Now",
      action: handleBuyNow,
      disabled: false,
      variant: "default" as const,
    };
  };



  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state or course selection state
  if (error || (!course && !loading && availableCourses.length > 0)) {
    if (error) {
      return (
        <div className="flex flex-col min-h-screen">
          <div className="container mx-auto px-4 py-10">
            <div className="text-center py-8">
              <p className="text-red-600 text-lg">{error}</p>
              <Button
                className="mt-4"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show course selection interface
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Select a Course</h1>
            <p className="text-gray-600 mb-8">Choose a course from the list below to view its details</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((courseItem) => (
                <CourseCard key={courseItem.id} course={courseItem} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no course and no available courses, show a different message
  if (!course && !loading && availableCourses.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No courses available at the moment</p>
            <Button
              onClick={() => window.history.back()}
              className="bg-primary text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure course exists before rendering the main content
  if (!course) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  const sampleCartItem = {
    id: course.id || 1,
    title: course.title,
    description: course.description || "",
    price: course.pricing === "free" ? 0 : parseFloat(course.pricing || "0") || 0,
    image: course.thumbnailUrl || "",
    students: countStudents(),
    duration: getCourseDuration()
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Welcome Message Modal */}
      <Dialog open={showWelcomeMessage} onOpenChange={setShowWelcomeMessage}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-4xl">👋</span>
              Welcome to the Course!
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {course?.welcomeMessage ? (
              <div
                className="text-gray-700 prose prose-lg max-w-none mt-4"
                dangerouslySetInnerHTML={{ __html: course.welcomeMessage }}
              />
            ) : (
              <p className="text-gray-600 mt-4">
                You've successfully enrolled in <strong>{course?.title}</strong>. Let's get started!
              </p>
            )}
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowWelcomeMessage(false);
                // Redirect to course after closing modal
                window.location.hash = `#/learner/current-course?courseId=${course?.id}`;
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Start Learning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="gradient-header">
        <div className="container mx-auto">
          <div className="w-full md:w-1/2 text-left text-white text-lg md:text-4xl font-bold font-['Spartan'] leading -[30px] md:leading-[50.40px]">
            {course.title}
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mt-2">
            <div className="flex items-center gap-2">
              <img src="Images/icons/user-laptop.png" alt="Star" className="w-4 h-4" />
              <div
                className="text-white text-[15px] font-medium font-['Poppins'] leading-relaxed cursor-pointer hover:underline hover:text-gray-300 transition-all duration-200"
                onClick={() => { window.location.href = '/#/instructorDetails' }}
              >
                By {getInstructorName()}
              </div>
            </div>
            <Divider className="h-0 md:h-4 bg-white" />
            <div className="flex items-center gap-2">
              <img src="Images/icons/Icon (1).png" alt="Star" className="w-4 h-4" />
              <div className="text-white text-[15px] font-medium font-['Poppins'] leading-relaxed">
                {getLevelLabel(course.level)}
              </div>
            </div>
            <Divider className="h-0 md:h-4 bg-white" />
            <div className="flex items-center gap-2">
              <div className="flex justify-left">
                {[...Array(5)].map((_, i) => (
                  <img key={i} src="Images/icons/Container (6).png" alt="Star" className="w-4 h-4" />
                ))}
              </div>
              <div className="text-white text-[15px] font-medium font-['Poppins'] leading-relaxed">
                ({reviewStats?.totalReviews || 0} {reviewStats?.totalReviews === 1 ? 'Review' : 'Reviews'})
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔳 Tabs + Sidebar */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Tabs Section */}
          <div className="w-full lg:w-2/3">
            <Tabs defaultValue={sectionIndex ? "curriculum" : "overview"} className="w-full custom-tabs">
              <TabsList className="custom-tabs-list overflow-x-scroll overflow-y-hidden md:overflow-x-auto">
                <TabsTrigger value="overview" className="custom-tab-trigger">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="custom-tab-trigger">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor" className="custom-tab-trigger">Instructor</TabsTrigger>
                <TabsTrigger value="reviews" className="custom-tab-trigger">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="py-4">
                <h2 className="details-title mb-4">Course Description</h2>
                <div className="mb-6 details-description" dangerouslySetInnerHTML={{ __html: course.description || "No description available for this course." }}>
                </div>

                {course.subtitle && (
                  <p className="mb-6 details-description">
                    {course.subtitle}
                  </p>
                )}

                <h2 className="details-title mb-4">What You'll Learn From This Course</h2>
                {course.learn && course.learn.length > 0 ? (
                  <ul className="list-disc pl-5 mb-6 details-description space-y-2">
                    {course.learn.map((learningPoint, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{learningPoint}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="details-description text-gray-500 text-center">
                      Learning objectives not specified for this course.
                    </p>
                  </div>
                )}

                <h2 className="details-title mb-4">Requirements</h2>
                {course.requirements && course.requirements.length > 0 ? (
                  <ul className="list-disc pl-5 mb-6 details-description space-y-2">
                    {course.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="details-description text-gray-500 text-center">
                      No specific requirements listed for this course.
                    </p>
                  </div>
                )}

                <h2 className="details-title mb-4">Target Audience</h2>
                {course.target && course.target.length > 0 ? (
                  <ul className="list-disc pl-5 mb-6 details-description space-y-2">
                    {course.target.map((target, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{target}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="details-description text-gray-500 text-center">
                      Target audience not specified for this course.
                    </p>
                  </div>
                )}

                <h2 className="details-title mb-4">Course Level & Language</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Difficulty Level</h4>
                    <p className="text-gray-600">{getLevelLabel(course.level)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Language</h4>
                    <p className="text-gray-600 capitalize">{getLanguageLabel(course.language)}</p>
                  </div>
                </div>

                {/* <h2 className="details-title mb-4">Certification</h2>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="details-description text-green-800">
                    No any Certifications available for this course.
                  </div>
                </div> */}
              </TabsContent>

              <TabsContent value="curriculum" className="py-4">
                <Curriculum course={course as any} lectureIndex={sectionIndex ?? undefined} onPreviewCourse={() => setIsPreviewModalOpen(true)} />
              </TabsContent>

              <TabsContent value="instructor" className="py-4">
                <div className="instructor-container">
                  <h2 className="details-title mb-6">About Your Instructor</h2>

                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Instructor Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={instructor?.profileImage ? `${API_BASE_URL_IMG}${instructor.profileImage}` : "Images/users/team-18.jpg.jpg"}
                          alt={getInstructorName()}
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                          onError={(e) => {
                            // Fallback to default image if profile image fails to load
                            (e.target as HTMLImageElement).src = "Images/users/team-18.jpg.jpg";
                          }}
                        />
                      </div>

                      {/* Instructor Info */}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {getInstructorName()}
                        </h3>
                        <p className="text-lg text-gray-600 mb-4">{instructor?.role}</p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{course?.enrollment || 0}</div>
                            <div className="text-sm text-gray-600">Students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{course?.rating ? course.rating.toFixed(1) : '0.0'}</div>
                            <div className="text-sm text-gray-600">Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{instructor?.publishedCourseCount || 0}</div>
                            <div className="text-sm text-gray-600">Courses</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{reviewStats?.totalReviews || 0}</div>
                            <div className="text-sm text-gray-600">Reviews</div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {getInstructorEmail() || "Email not available"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-6">
                    {/* Bio */}
                    {instructor?.bio && (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bio</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {instructor.bio}
                        </p>
                      </div>
                    )}

                    {/* Expertise */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Areas of Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {instructor?.areaOfExpertise.split(',').map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="py-4">
                <div className="reviews-container">
                  <h2 className="details-title mb-6">Student Reviews</h2>

                  {/* Reviews Summary */}
                  {reviewStats && reviewStats.totalReviews > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Overall Rating */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">
                            {reviewStats.averageRating.toFixed(1)}
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => {
                              const fullStars = Math.floor(reviewStats.averageRating);
                              const hasHalfStar = reviewStats.averageRating % 1 >= 0.5;
                              return (
                                <svg
                                  key={i}
                                  className={`w-5 h-5 ${i < fullStars
                                    ? 'text-yellow-400'
                                    : i === fullStars && hasHalfStar
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                    }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              );
                            })}
                          </div>
                          <p className="text-sm text-gray-600">
                            Based on {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                          </p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-3">Rating Breakdown</h3>
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = reviewStats.ratingDistribution[rating] || 0;
                              const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                              return (
                                <div key={rating} className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600 w-8">{rating} stars</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-yellow-400 h-2 rounded-full"
                                      style={{
                                        width: `${percentage}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600 w-12">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => {
                        // Format time ago
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

                        // Get initial from name
                        const getInitial = (name?: string): string => {
                          if (!name) return "?";
                          const parts = name.trim().split(' ');
                          if (parts.length >= 2) {
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          }
                          return name.charAt(0).toUpperCase();
                        };

                        // Get color for avatar
                        const getAvatarColor = (name?: string): string => {
                          if (!name) return 'bg-gray-500';
                          const colors = ['bg-primary', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'];
                          const index = name.charCodeAt(0) % colors.length;
                          return colors[index];
                        };

                        return (
                          <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-start gap-4">
                              {review.userProfileImage ? (
                                <img
                                  src={`${API_BASE_URL_IMG}${review.userProfileImage}`}
                                  alt={review.userName || 'User'}
                                  className="w-12 h-12 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-12 h-12 ${getAvatarColor(review.userName)} text-white rounded-full flex items-center justify-center font-semibold ${review.userProfileImage ? 'hidden' : ''}`}>
                                {getInitial(review.userName)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">
                                    {review.userName || 'Anonymous User'}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                          }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>{formatTimeAgo(review.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                      <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
                    </div>
                  )}

                  {/* Write Review Button */}
                  {user && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setIsReviewModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        {(myReview && myReview.id) ? "Edit Your Review" : "Write a Review"}
                      </button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Add more <TabsContent /> blocks here for other tabs */}
            </Tabs>
          </div>

          {/* Right: Sidebar Card */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-[5px] shadow-[0px_10px_50px_0px_rgba(26,46,85,0.07)] p-4">
              <ReactPlayer
                controls={true}
                url={course.promoVideoUrl || '/courses/video2 - Trim.mp4'}
                light={course.thumbnailUrl || "/Logos/brand-icon.png"}
                className="rounded-md mb-4 z-999"
                height={'220px'}
                width={'320px'}
              />
              {/* <img src="Images/Banners/Background.png" className="rounded-md mb-4" /> */}
              <div className="p-4">
                <h3 className="details-title mb-4">Course Includes:</h3>
                <ul className="text-[#181818] text-[15px] font-medium font-['Spartan'] leading-relaxed space-y-3 text-left">
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/course-Icon.png" className="h-6" /> Price:
                    </span>
                    <span className="text-primary text-lg font-semibold font-['Poppins'] leading-[34.60px] font-semibold">
                      {course.pricing === "free" ?
                        (<span className="badge-free">Free</span>) :
                        (<span className="badge-paid">Paid</span>)
                      }
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/course-Icon-1.png" className="h-6" /> Instructor:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed cursor-pointer" onClick={() => { window.location.href = '/#/instructorDetails' }}>
                      {getInstructorName()}
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/course-Icon-2.png" className="h-6" /> Duration:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
                      {getCourseDuration()}
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/books.svg.png" className="h-6" /> Lessons:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
                      {countTotalLessons(course.curriculum)}
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/course-Icon-3.png" className="h-6" /> Students:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
                      {countStudents()}
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/course-Icon-4.png" className="h-6" /> Language:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
                      {getLanguageLabel(course.language)}
                    </span>
                  </li>
                  <hr className="w-full bg-[#E5E5E5]" />
                  <li className="flex justify-between">
                    <span className="flex items-center gap-4">
                      <img src="Images/icons/Icon-5.png" className="h-6" /> Level:
                    </span>
                    <span className="text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
                      {getLevelLabel(course.level)}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Preview Course Button */}
              <Button
                className="w-full py-4 text-sm font-normal font-['Spartan'] text-primary border-2 border-primary bg-white hover:bg-primary hover:text-white transition-colors mb-3"
                variant="outline"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <Play size={16} className="mr-2" />
                Preview Course
              </Button>

              {(() => {
                const buttonConfig = getButtonConfig();
                return (
                  <Button
                    className="w-full py-6 text-sm font-normal font-['Spartan'] text-white"
                    variant={buttonConfig.variant}
                    onClick={buttonConfig.action}
                    disabled={buttonConfig.disabled}
                    data-enroll-button
                  >
                    {buttonConfig.text}
                  </Button>
                );
              })()}

              <div className="mt-6">
                <p className="details-title mb-2">Share On:</p>
                <div className="flex gap-4">
                  <img src="Images/icons/Item → Link.png" className="h-8" />
                  <img src="Images/icons/Item → Link-1.png" className="h-8" />
                  <img src="Images/icons/Item → Link-2.png" className="h-8" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      <SuggestedCourses currentCourseId={course.id} />
      <CartModal
        isOpen={isCartModalOpen}
        setIsOpen={setIsCartModalOpen}
        cartItem={sampleCartItem}
      />

      {/* Checkout Modal */}
      {course && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          course={{
            id: course.id.toString(),
            title: course.title,
            pricing: course.pricing || "",
            thumbnailUrl: course.thumbnailUrl || "",
            description: course.description || ""
          }}
        />
      )}

      {/* Course Preview Modal */}
      {course && (
        <CoursePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          course={course as any}
        />
      )}

      {/* Write Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{(myReview && myReview.id) ? "Edit Your Review" : "Write a Review"}</DialogTitle>
            <DialogDescription>
              Share your experience with this course. Your review will help other students make informed decisions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Rating Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className={`p-2 rounded transition-colors ${rating <= reviewRating
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                      }`}
                  >
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="text-sm text-gray-600 ml-2">
                    {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                  </span>
                )}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={reviewComment || ""}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about this course..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
                rows={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewComment?.length || 0} characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewModalOpen(false);
                if (!myReview || !myReview.id) {
                  setReviewRating(0);
                  setReviewComment("");
                }
              }}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!course || !reviewRating || !reviewComment || !reviewComment.trim()) {
                  toast.error("Please provide both a rating and a review comment");
                  return;
                }

                setIsSubmittingReview(true);
                try {
                  if (myReview && myReview.id) {
                    // Update existing review
                    await reviewApiService.updateReview(myReview.id, {
                      rating: reviewRating,
                      comment: (reviewComment || "").trim(),
                    });
                    toast.success("Review updated successfully!");
                  } else {
                    // Create new review
                    const newReview = await reviewApiService.createReview({
                      courseId: course.id,
                      rating: reviewRating,
                      comment: (reviewComment || "").trim(),
                    });
                    toast.success("Review submitted successfully!");
                    // Set the newly created review
                    setMyReview(newReview);
                  }

                  // Refresh reviews and stats
                  const [stats, reviewsData] = await Promise.all([
                    reviewApiService.getReviewStats(course.id),
                    reviewApiService.getCourseReviews(course.id, true)
                  ]);
                  setReviewStats(stats);
                  setReviews(reviewsData);

                  // Refresh my review to ensure we have the latest data
                  if (user) {
                    try {
                      const updatedReview = await reviewApiService.getMyReview(course.id);
                      if (updatedReview) {
                        setMyReview(updatedReview);
                        setReviewRating(updatedReview.rating || 0);
                        setReviewComment(updatedReview.comment || "");
                      }
                    } catch (error) {
                      // Review might not exist yet, which is fine
                      console.log("Could not fetch updated review:", error);
                    }
                  }

                  setIsReviewModalOpen(false);
                } catch (error: any) {
                  console.error("Error submitting review:", error);
                  toast.error(error.message || "Failed to submit review. Please try again.");
                } finally {
                  setIsSubmittingReview(false);
                }
              }}
              disabled={isSubmittingReview || !reviewRating || !reviewComment || !reviewComment.trim()}
            >
              {isSubmittingReview ? "Submitting..." : (myReview && myReview.id) ? "Update Review" : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}