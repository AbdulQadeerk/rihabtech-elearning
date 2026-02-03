import { Button } from "../../../../components/ui/button";
import QuillEditor from "../../../../components/ui/quill-editor-default";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { courseApiService, CourseUpdateRequest, UpdateCourseMessageResponse } from "../../../../utils/courseApiService";
import { useAuth } from "../../../../context/AuthContext";
import { useCourseData } from "../../../../hooks/useCourseData";
import { toast } from "sonner";

// Define the form values interface
interface CourseMessagesForm {
  welcomeMessage: string;
  congratulationsMessage: string;
}

export function CourseMessages({ onSubmit }: { onSubmit?: any }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { courseData, isLoading, isNewCourse, updateCourseData, refreshCourseData } = useCourseData();

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    // Trim whitespace to match API behavior
    return text.trim();
  };

  // Helper to get plain-text length (for min-length validation)
  const getPlainLength = (html: string) => {
    const plainText = stripHtmlTags(html || '');
    return plainText.length;
  };

  // Helper to get HTML string length (for max-length validation - API counts HTML string)
  const getHtmlLength = (html: string) => {
    return (html || '').length;
  };

  const formik = useFormik<CourseMessagesForm>({
    initialValues: {
      welcomeMessage: courseData?.welcomeMessage || "",
      congratulationsMessage: courseData?.congratulationsMessage || "",
    },
    validationSchema: Yup.object({
      welcomeMessage: Yup.string()
        .test('min-length', 'Welcome message should be at least 10 characters', function (value) {
          if (!value) return true; // Allow empty values
          const plainText = getPlainLength(value);
          return plainText >= 10;
        })
        .test('max-length', 'Max 1000 characters allowed in welcome message', function (value) {
          if (!value) return true; // Allow empty values
          // API's MaxLength(1000) validates the HTML string length, not plain text
          const htmlLength = getHtmlLength(value);
          return htmlLength <= 1000;
        }),
      congratulationsMessage: Yup.string()
        .test('min-length', 'Congratulations message should be at least 10 characters', function (value) {
          if (!value) return true; // Allow empty values
          const plainText = getPlainLength(value);
          return plainText >= 10;
        })
        .test('max-length', 'Max 1000 characters allowed in congratulations message', function (value) {
          if (!value) return true; // Allow empty values
          // API's MaxLength(1000) validates the HTML string length, not plain text
          const htmlLength = getHtmlLength(value);
          return htmlLength <= 1000;
        }),
    }),
    onSubmit: async (values) => {
      // Validate form before proceeding
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched({
          welcomeMessage: true,
          congratulationsMessage: true,
        });
        toast.error("Please fix validation errors before submitting");
        setLoading(false);
        return;
      }

      setLoading(true);

      // Check if user is logged in
      if (!user) {
        toast.error("Please login to update course");
        setLoading(false);
        return;
      }

      try {
        if (isNewCourse || !courseData?.id) {
          toast.error("Please create a course first by setting the title");
          setLoading(false);
          return;
        }

        // Enforce API limit: HTML string must be <= 1000 characters (API's MaxLength validates HTML string)
        const welcomeHtmlLength = getHtmlLength(values.welcomeMessage);
        const congratsHtmlLength = getHtmlLength(values.congratulationsMessage);

        if (welcomeHtmlLength > 1000) {
          formik.setFieldError('welcomeMessage', `Max 1000 characters allowed in welcome message (current: ${welcomeHtmlLength} characters including HTML tags)`);
          toast.error(`Welcome message exceeds 1000 characters (${welcomeHtmlLength} characters including HTML tags)`);
          setLoading(false);
          return;
        }

        if (congratsHtmlLength > 1000) {
          formik.setFieldError('congratulationsMessage', `Max 1000 characters allowed in congratulations message (current: ${congratsHtmlLength} characters including HTML tags)`);
          toast.error(`Congratulations message exceeds 1000 characters (${congratsHtmlLength} characters including HTML tags)`);
          setLoading(false);
          return;
        }

        // Comparison logic: Only call update API if messages have changed
        const currentWelcomeMessage = courseData.welcomeMessage || "";
        const currentCongratulationsMessage = courseData.congratulationsMessage || "";

        const welcomeMessageChanged = currentWelcomeMessage !== values.welcomeMessage;
        const congratulationsMessageChanged = currentCongratulationsMessage !== values.congratulationsMessage;

        if (!welcomeMessageChanged && !congratulationsMessageChanged) {
          setLoading(false);
          // No changes detected, go directly to course preview page
          window.location.href = "/#/instructor/course-preview";
          return; // Exit early
        }

        // Final validation check right before API call (safety net)
        const finalWelcomeHtmlLength = getHtmlLength(values.welcomeMessage);
        const finalCongratsHtmlLength = getHtmlLength(values.congratulationsMessage);
        const finalWelcomePlainLength = getPlainLength(values.welcomeMessage);
        const finalCongratsPlainLength = getPlainLength(values.congratulationsMessage);
        
        console.log('Final validation before API call:', {
          welcomeHtmlLength: finalWelcomeHtmlLength,
          congratsHtmlLength: finalCongratsHtmlLength,
          welcomePlainLength: finalWelcomePlainLength,
          congratsPlainLength: finalCongratsPlainLength,
          welcomeHTML: values.welcomeMessage?.substring(0, 100) + '...',
          congratsHTML: values.congratulationsMessage?.substring(0, 100) + '...'
        });

        if (finalWelcomeHtmlLength > 1000) {
          formik.setFieldError('welcomeMessage', `Max 1000 characters allowed in welcome message (current: ${finalWelcomeHtmlLength} characters including HTML tags)`);
          toast.error(`Welcome message exceeds 1000 characters (${finalWelcomeHtmlLength} characters including HTML tags)`);
          setLoading(false);
          return;
        }

        if (finalCongratsHtmlLength > 1000) {
          formik.setFieldError('congratulationsMessage', `Max 1000 characters allowed in congratulations message (current: ${finalCongratsHtmlLength} characters including HTML tags)`);
          toast.error(`Congratulations message exceeds 1000 characters (${finalCongratsHtmlLength} characters including HTML tags)`);
          setLoading(false);
          return;
        }

        // If data has changed, proceed with update
        const updateResponse: UpdateCourseMessageResponse = await courseApiService.updateCourse({
          id: courseData.id,
          title: courseData.title,
          subtitle: courseData.subtitle ?? null,
          description: courseData.description ?? null,
          category: courseData.category ?? null,
          subCategory: courseData.subCategory ?? null,
          level: courseData.level ?? null,
          language: courseData.language ?? null,
          pricing: courseData.pricing ?? null,
          thumbnailUrl: courseData.thumbnailUrl ?? null,
          promoVideoUrl: courseData.promoVideoUrl ?? null,
          welcomeMessage: values.welcomeMessage,
          congratulationsMessage: values.congratulationsMessage,
          learn: courseData.learn ?? [],
          requirements: courseData.requirements ?? [],
          target: courseData.target ?? [],
          curriculum: courseData.curriculum as CourseUpdateRequest['curriculum'] ?? undefined // Include curriculum data
        });

        // After a successful update, update the shared courseData state
        updateCourseData({
          ...courseData,
          welcomeMessage: values.welcomeMessage,
          congratulationsMessage: values.congratulationsMessage,
          curriculum: courseData.curriculum ?? undefined // Include curriculum data
        });

        toast.success(updateResponse.message || "Course messages updated successfully!");

        // Refresh course data from API to ensure all pages have the latest data
        await refreshCourseData();

        setLoading(false);
        // Navigate to course preview page
        window.location.href = "/#/instructor/course-preview";
      } catch (error: any) {
        console.error("Failed to save course messages:", error);

        // Handle specific error messages
        if (error.message?.includes('Authentication failed')) {
          toast.error("Authentication failed. Please login again.");
        } else if (error.message?.includes('Access forbidden')) {
          toast.error("You don't have permission to perform this action.");
        } else if (error.message?.includes('Server error')) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to save course messages. Please try again.");
        }

        setLoading(false);
      }
    },
    enableReinitialize: true,
  });

  // Update form values when courseData changes
  useEffect(() => {
    if (courseData) {
      formik.setValues({
        welcomeMessage: courseData.welcomeMessage || "",
        congratulationsMessage: courseData.congratulationsMessage || "",
      });
    }
  }, [courseData]);

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
    <form onSubmit={formik.handleSubmit}>
      <div>
        <div className="mb-3">
          <h2 className="form-title">Course messages</h2>
          <p className="course-sectional-descrption mb-4">
            Write messages to your students (optional) that will be sent
            automatically when they join or complete your course to encourage
            students to engage with course content. If you do not wish to send a
            welcome or congratulations message, leave the text box blank.
          </p>

          <div className="mt-8 gap-2 flex flex-col">
            <label className="ins-label">Welcome Message</label>
            <QuillEditor
              value={formik.values.welcomeMessage}
              onChange={(content) => formik.setFieldValue('welcomeMessage', content)}
              placeholder="Write a welcome message for your students..."
              error={formik.touched.welcomeMessage && !!formik.errors.welcomeMessage}
              maxLength={1000}
            />
            {formik.touched.welcomeMessage && formik.errors.welcomeMessage && (
              <div className="text-red-500 text-sm">
                {formik.errors.welcomeMessage}
              </div>
            )}
          </div>

          <div className="mt-4 gap-2 flex flex-col">
            <label className="ins-label">Congratulations Message</label>
            <QuillEditor
              value={formik.values.congratulationsMessage}
              onChange={(content) => formik.setFieldValue('congratulationsMessage', content)}
              placeholder="Write a congratulations message for course completion..."
              error={formik.touched.congratulationsMessage && !!formik.errors.congratulationsMessage}
              maxLength={1000}
            />
            {formik.touched.congratulationsMessage &&
              formik.errors.congratulationsMessage && (
                <div className="text-red-500 text-sm">
                  {formik.errors.congratulationsMessage}
                </div>
              )}
          </div>

          <div className="flex justify-end mt-8">
            <Button type="submit" className="rounded-none" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Preview Course'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}