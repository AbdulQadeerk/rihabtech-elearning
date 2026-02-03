
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../../../context/AuthContext";
import { courseApiService, CourseResponse, UpdateCourseMessageResponse, CourseUpdateRequest } from "../../../../utils/courseApiService";
import { ReviewFeedbackDialog } from "../../../../components/ui/reviewFeedbackDialog";
import { useCourseData, clearCourseData, transformCurriculumForUpdate } from "../../../../hooks/useCourseData";
import { toast } from "sonner";

const CourseTitle = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const { courseData, isLoading, isNewCourse, updateCourseData, refreshCourseData } = useCourseData();

type RejectionBy = {
  name?: string;
  timestamp?: string | number | Date;
  [key: string]: any;
};

type RejectionInfo = {
  rejectionReason?: string;
  rejectionNotes?: string;
  reason?: string;
  rejectedAt?: string | number | Date;
  rejectedBy?: RejectionBy;
  [key: string]: any;
};

const [rejectionInfo, setRejectionInfo] = useState<RejectionInfo | null>(null);

  // Reuse the last known curriculum so title updates don't wipe it
  const getExistingCurriculum = (): CourseUpdateRequest["curriculum"] | undefined => {
    if (courseData?.curriculum && courseData.curriculum.sections?.length) {
      return transformCurriculumForUpdate(courseData.curriculum);
    }
    if (courseData?.id) {
      const localCurriculum = localStorage.getItem(`curriculum_${courseData.id}`);
      if (localCurriculum) {
        try {
          const parsed = JSON.parse(localCurriculum);
          if (parsed?.sections?.length) {
            return transformCurriculumForUpdate(parsed);
          }
        } catch (err) {
          console.warn("Failed to parse local curriculum", err);
        }
      }
    }
    return undefined;
  };
  
  const formik = useFormik({
    initialValues: {
      title: "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Course Title is required"),
    }),
    onSubmit: async(values) => {
      setLoading(true);
      
      // Check if user is logged in
      if (!user) {
        toast.error("Please login to create a course");
        setLoading(false);
        return;
      }
      
      try {
        if (isNewCourse || !courseData?.id) {
          // Create new course using API
          const newCourse = await courseApiService.createCourse({
            title: values.title
          });
          
          // Handle the response - API returns just the ID, so we need to create a course object
          const courseId = typeof newCourse === 'number' ? newCourse : newCourse.id;
          
          // Store the course ID for future updates
          localStorage.setItem("courseId", courseId.toString());
          
          // Create a basic course object for state management
          const courseObject: CourseResponse = {
            id: courseId,
            title: values.title,
            // Set other fields as null/undefined for now
            subtitle: null,
            description: null,
            category: null,
            subCategory: null,
            level: null,
            language: null,
            pricing: null,
            thumbnailUrl: null,
            promoVideoUrl: null,
            welcomeMessage: null,
            congratulationsMessage: null
          };
          
          updateCourseData(courseObject);
          
          toast.success("Course created successfully!");
        } else {
          // Comparison logic: Only call update API if title has changed
          if (courseData.title === values.title) {
            //toast.info("No changes detected in course title. Moving to next step.");
            setLoading(false);
            window.location.hash = "#/instructor/course-category";
            return; // Exit early
          }

          // If title has changed, proceed with update
          const updateResponse: UpdateCourseMessageResponse = await courseApiService.updateCourse({
            id: courseData.id,
            title: values.title,
            subtitle: courseData.subtitle ?? null,
            description: courseData.description ?? null,
            category: courseData.category ?? null,
            subCategory: courseData.subCategory ?? null,
            level: courseData.level ?? null,
            language: courseData.language ?? null,
            pricing: courseData.pricing ?? null,
            thumbnailUrl: courseData.thumbnailUrl ?? null,
            promoVideoUrl: courseData.promoVideoUrl ?? null,
            welcomeMessage: courseData.welcomeMessage ?? null,
            congratulationsMessage: courseData.congratulationsMessage ?? null,
            learn: courseData.learn ?? [],
            requirements: courseData.requirements ?? [],
          target: courseData.target ?? [],
          curriculum: getExistingCurriculum()
          });
          
          // After a successful update, update the shared courseData state with the new title
          updateCourseData({ 
            title: values.title,
            subtitle: courseData.subtitle ?? null,
            description: courseData.description ?? null,
            category: courseData.category ?? null,
            subCategory: courseData.subCategory ?? null,
            level: courseData.level ?? null,
            language: courseData.language ?? null,
            pricing: courseData.pricing ?? null,
            thumbnailUrl: courseData.thumbnailUrl ?? null,
            promoVideoUrl: courseData.promoVideoUrl ?? null,
            welcomeMessage: courseData.welcomeMessage ?? null,
            congratulationsMessage: courseData.congratulationsMessage ?? null,
            learn: courseData.learn ?? [],
            requirements: courseData.requirements ?? [],
          target: courseData.target ?? [],
          curriculum: getExistingCurriculum()
          });
          
          
          toast.success(updateResponse.message || "Course updated successfully!");
          
          // Refresh course data from API to ensure all pages have the latest data
          await refreshCourseData();
        }
        
        setLoading(false);
        window.location.hash = "#/instructor/course-category";
      } catch (error: any) {
        console.error("Failed to save course:", error);
        console.error("Error response:", error.response);
        console.error("Error response data:", error.response?.data);
        console.error("Error response data message:", error.response?.data?.message);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // Extract error message from API response - check ALL possible locations
        let errorMessage = "Failed to save course. Please try again.";
        
        // Priority 1: Check error.message first (apiService sets this from response.data)
        // This is the most reliable since apiService already extracted it
        if (error.message && !error.message.includes('Request failed with status code')) {
          errorMessage = error.message;
          console.log("✅ Using error.message (from apiService):", errorMessage);
        }
        // Priority 2: Check if error.response.data is a string (direct error message)
        else if (typeof error.response?.data === 'string' && error.response.data.trim()) {
          errorMessage = error.response.data;
          console.log("✅ Using error.response.data (string):", errorMessage);
        }
        // Priority 3: Check error.response.data.message (object with message property)
        else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          console.log("✅ Using error.response.data.message:", errorMessage);
        }
        // Priority 4: Check error.response.data.error
        else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
          console.log("✅ Using error.response.data.error:", errorMessage);
        }
        // Priority 5: Check error.response.data.errors array
        else if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors[0];
          console.log("✅ Using error.response.data.errors[0]:", errorMessage);
        }
        // Priority 6: Check for specific error types in message
        else if (error.message) {
          if (error.message.includes('Authentication failed')) {
            errorMessage = "Authentication failed. Please login again.";
          } else if (error.message.includes('Access forbidden')) {
            errorMessage = "You don't have permission to perform this action.";
          } else if (error.message.includes('Server error')) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        
        console.log("Final error message to display:", errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    },
    enableReinitialize: true,
  });


  // Set form values when course data is loaded
  useEffect(() => {
    if (courseData && courseData.title && !isNewCourse) {
      formik.setFieldValue('title', courseData.title);
      
      // Check for rejection info from API - status 3 = NEEDS_REVISION
      if (courseData.status === 3) {
        // Use rejectionInfo if available, otherwise use lockReason
        if (courseData.rejectionInfo) {
          setRejectionInfo({
            ...courseData.rejectionInfo,
            rejectedAt: courseData.rejectionInfo.rejectedAt ? new Date(courseData.rejectionInfo.rejectedAt) : undefined,
            rejectedBy: {
              ...(typeof courseData.rejectionInfo.rejectedBy === 'object' && courseData.rejectionInfo.rejectedBy !== null ? courseData.rejectionInfo.rejectedBy : {}),
              timestamp:
                typeof courseData.rejectionInfo.rejectedBy === 'object' &&
                courseData.rejectionInfo.rejectedBy !== null &&
                (courseData.rejectionInfo.rejectedBy as { timestamp?: string | number | Date }).timestamp
                  ? new Date((courseData.rejectionInfo.rejectedBy as { timestamp?: string | number | Date }).timestamp!)
                  : undefined
            }
          });
        } else if (courseData.lockReason) {
          // Use lockReason if rejectionInfo is not available
          setRejectionInfo({
            rejectionReason: courseData.lockReason,
            rejectionNotes: courseData.lockReason,
            rejectedAt: courseData.lockedAt ? new Date(courseData.lockedAt) : undefined,
            rejectedBy: courseData.lockedBy ? { userId: courseData.lockedBy } : undefined
          });
        }
      }
    }
  }, [courseData]); // Remove formik from dependencies


  // Clear form when it's a new course
  useEffect(() => {
    if (isNewCourse) {
      formik.setFieldValue('title', '');
      setRejectionInfo(null);
    }
  }, [isNewCourse]);

  // Don't render the form while loading course data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course data...</p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col justify-between h-full"
      onSubmit={formik.handleSubmit}
      noValidate
    >
      <div className="p-8">
        {rejectionInfo && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-1">Course Needs Revision</h3>
                    <p className="text-sm text-red-600">
                      Your course has been reviewed and requires changes before it can be approved.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRejectionDialog(true)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                >
                  View Full Details
                </button>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="bg-white rounded-md p-4 border border-red-200">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">Rejection Reason:</h4>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">
                    {rejectionInfo.rejectionReason || rejectionInfo.reason || 'No reason provided'}
                  </p>
                </div>
                
                {rejectionInfo.rejectionNotes && rejectionInfo.rejectionNotes !== rejectionInfo.rejectionReason && (
                  <div className="bg-white rounded-md p-4 border border-red-200">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Additional Feedback:</h4>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                      {rejectionInfo.rejectionNotes}
                    </p>
                  </div>
                )}
                
                {rejectionInfo.rejectedAt && (
                  <div className="text-xs text-red-600 mt-2">
                    Rejected on: {new Date(rejectionInfo.rejectedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <h1 className="ins-heading mb-3">What's the Course Tittle?</h1>
        <p className="justify-start text-[#1e1e1e] text-sm font-medium font-['Nunito']">
          Set a title of your course
        </p>
        <div className="mt-8">
          <Input
            className="ins-control-border"
            placeholder="Type Course Title Here"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.title && formik.errors.title && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.title}</div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between w-full items-center rounded-md border border-gray p-4">
        <Button
          variant={"outline"}
          className="rounded-none"
          type="button"
          onClick={() => {
            // Clear course data when going back to course test selection
            clearCourseData();
            window.location.hash = "#/instructor/course-test-selection";
          }}
        >
          Previous
        </Button>
        <Button className="rounded-none" type="submit" disabled={loading || !formik.dirty || !formik.isValid}>
          {loading ? 'Saving...' : (isNewCourse ? 'Create Course' : 'Update Course')}
        </Button>
      </div>
      
<ReviewFeedbackDialog
  open={showRejectionDialog}
  onOpenChange={setShowRejectionDialog}
  rejectionInfo={rejectionInfo ?? undefined}
/>
    </form>
  );
};

export default CourseTitle;

