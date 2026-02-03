import { PlusIcon, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { courseApiService, UpdateCourseMessageResponse, CourseUpdateRequest } from "../../../../utils/courseApiService";
import { useAuth } from "../../../../context/AuthContext";
import { useCourseData, transformCurriculumForUpdate } from "../../../../hooks/useCourseData";
import { toast } from "sonner";

export function IntendentLearners({ onSubmit }: any) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { courseData, isLoading, isNewCourse, updateCourseData, refreshCourseData } = useCourseData();

  const initialValues = {
    learn: [""],
    requirements: [""],
    target: [""],
  };

  const [formInitialValues, setFormInitialValues] = useState(initialValues);

  // Reuse the last known curriculum when updating intended learners so we don't overwrite it
  const getExistingCurriculum = (): CourseUpdateRequest["curriculum"] | undefined => {
    // Prefer the in-memory course data
    if (courseData?.curriculum && courseData.curriculum.sections?.length) {
      return transformCurriculumForUpdate(courseData.curriculum);
    }

    // Fallback to any curriculum saved locally (unsaved changes)
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

  useEffect(() => {
    // Set form values when course data is loaded
    if (courseData) {
      setFormInitialValues({
        learn: courseData.learn && courseData.learn.length > 0 ? courseData.learn : [""],
        requirements: courseData.requirements && courseData.requirements.length > 0 ? courseData.requirements : [""],
        target: courseData.target && courseData.target.length > 0 ? courseData.target : [""],
      });
    }
  }, [courseData]);

  const validationSchema = Yup.object({
    learn: Yup.array()
      .of(Yup.string().trim().required("This field is required"))
      .min(1, "At least one item is required"),
    requirements: Yup.array()
      .of(Yup.string().trim().required("This field is required"))
      .min(1, "At least one item is required"),
    target: Yup.array()
      .of(Yup.string().trim().required("This field is required"))
      .min(1, "At least one item is required"),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: formInitialValues,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      
      // Check if user is logged in
      if (!user) {
        toast.error("Please login to update course");
        setLoading(false);
        return;
      }
      
      try {
        if (isNewCourse || !courseData?.id) {
          // For new courses, we need to create the course first
          toast.error("Please create a course first by setting the title");
          setLoading(false);
          return;
        }

        // Comparison logic: Only call update API if intended learners data has changed
        const currentLearn = courseData.learn || [];
        const currentRequirements = courseData.requirements || [];
        const currentTarget = courseData.target || [];
        
        // Filter out empty strings for comparison
        const filteredCurrentLearn = currentLearn.filter(item => item.trim() !== "");
        const filteredCurrentRequirements = currentRequirements.filter(item => item.trim() !== "");
        const filteredCurrentTarget = currentTarget.filter(item => item.trim() !== "");
        
        const filteredValuesLearn = values.learn.filter(item => item.trim() !== "");
        const filteredValuesRequirements = values.requirements.filter(item => item.trim() !== "");
        const filteredValuesTarget = values.target.filter(item => item.trim() !== "");
        
        const learnChanged = JSON.stringify(filteredCurrentLearn) !== JSON.stringify(filteredValuesLearn);
        const requirementsChanged = JSON.stringify(filteredCurrentRequirements) !== JSON.stringify(filteredValuesRequirements);
        const targetChanged = JSON.stringify(filteredCurrentTarget) !== JSON.stringify(filteredValuesTarget);
        
        if (!learnChanged && !requirementsChanged && !targetChanged) {
          //toast.info("No changes detected in intended learners. Moving to next step.");
          setLoading(false);
          onSubmit && onSubmit();
          return; // Exit early
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
          welcomeMessage: courseData.welcomeMessage ?? null,
          congratulationsMessage: courseData.congratulationsMessage ?? null,
          learn: filteredValuesLearn,
          requirements: filteredValuesRequirements,
          target: filteredValuesTarget,
          curriculum: getExistingCurriculum() // keep curriculum intact
        });
        
        // After a successful update, update the shared courseData state with the new data
        updateCourseData({ 
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
          welcomeMessage: courseData.welcomeMessage ?? null,
          congratulationsMessage: courseData.congratulationsMessage ?? null,
          learn: filteredValuesLearn,
          requirements: filteredValuesRequirements,
          target: filteredValuesTarget,
          curriculum: getExistingCurriculum()
        });
        
        toast.success(updateResponse.message || "Course intended learners updated successfully!");
        
        // Refresh course data from API to ensure all pages have the latest data
        await refreshCourseData();
        
        setLoading(false);
        onSubmit && onSubmit();
      } catch (error: any) {
        console.error("Failed to save course intended learners:", error);
        
        // Handle specific error messages
        if (error.message?.includes('Authentication failed')) {
          toast.error("Authentication failed. Please login again.");
        } else if (error.message?.includes('Access forbidden')) {
          toast.error("You don't have permission to perform this action.");
        } else if (error.message?.includes('Server error')) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to save course intended learners. Please try again.");
        }
        
        setLoading(false);
      }
    },
  });

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
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} className="space-y-8">
        {/* What will students learn */}
        <div className="mb-3">
          <h3 className="course-sectional-question mb-2">What will students learn in your course?<span className="text-[#ff0000]"> *</span></h3>
          <p className="course-sectional-descrption mb-4">
            The following descriptions will be publicly visible on your Course Landing Page and will have a direct impact on your course performance. These descriptions will help learners decide if your course is right for them.
          </p>
          <FieldArray name="learn">
            {({ push, remove }) => (
              <div className="mt-8 gap-2 flex flex-col">
                {formik.values.learn.map((val, idx) => (
                  <div
                    key={idx}
                    className={`relative flex items-center${Array.isArray(formik.touched.learn) && formik.touched.learn[idx] && formik.errors.learn && (formik.errors.learn as any)[idx] ? " mb-6" : ""}`}
                  >
                    <Input
                      className="ins-control-border"
                      placeholder="Example: Define Roles and Responsibility of a Project Manager"
                      name={`learn[${idx}]`}
                      value={val}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.learn.length > 1 && (
                      <Button
                        variant="outline"
                        className="rounded-none border-primary absolute right-3"
                        type="button"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    {Array.isArray(formik.touched.learn) && formik.touched.learn[idx] && formik.errors.learn && (formik.errors.learn as any)[idx] && (
                      <div className="text-red-500 text-xs absolute left-0 -bottom-5">{(formik.errors.learn as any)[idx]}</div>
                    )}
                  </div>
                ))}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => push("")}
                  className="mt-2 w-fit"
                >
                  <PlusIcon /> Add More
                </Button>
                {typeof formik.errors.learn === "string" && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.learn}</div>
                )}
              </div>
            )}
          </FieldArray>
        </div>

        {/* Requirements */}
        <div className="mb-3">
          <h3 className="course-sectional-question mb-2">Are there any course requirements or prerequisites?<span className="text-[#ff0000]"> *</span></h3>
          <p className="course-sectional-descrption mb-4">
            List any required skills, experience, tools or equipment learners should have prior to taking your course.
          </p>
          <FieldArray name="requirements">
            {({ push, remove }) => (
              <div className="mt-8 gap-2 flex flex-col">
                {formik.values.requirements.map((val, idx) => (
                  <div
                    key={idx}
                    className={`relative flex items-center${Array.isArray(formik.touched.requirements) && formik.touched.requirements[idx] && formik.errors.requirements && (formik.errors.requirements as any)[idx] ? " mb-6" : ""}`}
                  >
                    <Input
                      className="ins-control-border"
                      placeholder="Example: No experience needed. You will learn everything you need to know"
                      name={`requirements[${idx}]`}
                      value={val}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.requirements.length > 1 && (
                      <Button
                        variant="outline"
                        className="rounded-none border-primary absolute right-3"
                        type="button"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    {Array.isArray(formik.touched.requirements) && formik.touched.requirements[idx] && formik.errors.requirements && (formik.errors.requirements as any)[idx] && (
                      <div className="text-red-500 text-xs absolute left-0 -bottom-5">{(formik.errors.requirements as any)[idx]}</div>
                    )}
                  </div>
                ))}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => push("")}
                  className="mt-2 w-fit"
                >
                  <PlusIcon /> Add More
                </Button>
                {typeof formik.errors.requirements === "string" && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.requirements}</div>
                )}
              </div>
            )}
          </FieldArray>
        </div>

        {/* Target Learners */}
        <div className="mb-3">
          <h3 className="course-sectional-question mb-2">Who is this course for?<span className="text-[#ff0000]"> *</span></h3>
          <p className="course-sectional-descrption mb-4">
            Write a clear description of the intended learners for your course.
          </p>
          <FieldArray name="target">
            {({ push, remove }) => (
              <div className="mt-8 gap-2 flex flex-col">
                {formik.values.target.map((val, idx) => (
<div
  key={idx}
  className={`relative flex items-center${Array.isArray(formik.touched.target) && formik.touched.target[idx] && formik.errors.target && (formik.errors.target as any)[idx] ? " mb-6" : ""}`}
>
                    <Input
                      className="ins-control-border"
                      placeholder="Example: Beginners, Project Managers, etc."
                      name={`target[${idx}]`}
                      value={val}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.values.target.length > 1 && (
                      <Button
                        variant="outline"
                        className="rounded-none border-primary absolute right-3"
                        type="button"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    {Array.isArray(formik.touched.target) && formik.touched.target[idx] && formik.errors.target && (formik.errors.target as any)[idx] && (
                      <div className="text-red-500 text-xs absolute left-0 -bottom-5">{(formik.errors.target as any)[idx]}</div>
                    )}
                  </div>
                ))}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => push("")}
                  className="mt-2 w-fit"
                >
                  <PlusIcon /> Add More
                </Button>
                {typeof formik.errors.target === "string" && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.target}</div>
                )}
              </div>
            )}
          </FieldArray>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="rounded-none" 
            disabled={loading || !formik.isValid}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </FormikProvider>
  );
}