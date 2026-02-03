import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { courseApiService, Category, UpdateCourseMessageResponse, CourseUpdateRequest } from "../../../../utils/courseApiService";
import { useAuth } from "../../../../context/AuthContext";
import { useCourseData, transformCurriculumForUpdate } from "../../../../hooks/useCourseData";
import { toast } from "sonner";

const CourseCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { courseData, isLoading, isNewCourse, updateCourseData, refreshCourseData } = useCourseData();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await courseApiService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories. Please try again.");
      }
    };
    
    fetchCategories();
  }, []);

  // Keep existing curriculum when updating category to avoid wiping it
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
      category: "",
    },
    validationSchema: Yup.object({
      category: Yup.string().required("Category is required"),
    }),
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

        // Comparison logic: Only call update API if category has changed
        const currentCategoryId = courseData.category ? courseData.category.toString() : "";
        if (currentCategoryId === values.category) {
          //toast.info("No changes detected in course category. Moving to next step.");
          setLoading(false);
          window.location.hash = "#/instructor/course-sections";
          return; // Exit early
        }

        // If category has changed, proceed with update
        const updateResponse: UpdateCourseMessageResponse = await courseApiService.updateCourse({
          id: courseData.id,
          title: courseData.title,
          subtitle: courseData.subtitle ?? null,
          description: courseData.description ?? null,
          category: parseInt(values.category),
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
        
        // After a successful update, update the shared courseData state with the new category
        updateCourseData({ 
          title: courseData.title,
          subtitle: courseData.subtitle ?? null,
          description: courseData.description ?? null,
          category: parseInt(values.category),
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
        
        
        toast.success(updateResponse.message || "Course category updated successfully!");
        
        // Refresh course data from API to ensure all pages have the latest data
        await refreshCourseData();
        
        setLoading(false);
        window.location.hash = "#/instructor/course-sections";
      } catch (error: any) {
        console.error("Failed to save course category:", error);
        
        // Handle specific error messages
        if (error.message?.includes('Authentication failed')) {
          toast.error("Authentication failed. Please login again.");
        } else if (error.message?.includes('Access forbidden')) {
          toast.error("You don't have permission to perform this action.");
        } else if (error.message?.includes('Server error')) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to save course category. Please try again.");
        }
        
        setLoading(false);
      }
    },
    enableReinitialize: true,
  });

  // Set form values when course data is loaded
  useEffect(() => {
    if (courseData && courseData.category && categories.length > 0) {
      formik.setFieldValue('category', courseData.category.toString());
    }
  }, [courseData, categories]); // Wait for both courseData and categories to be loaded

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
    <form className="flex flex-col justify-between h-full" onSubmit={formik.handleSubmit} noValidate>
      <div className="p-8">
        <h1 className="ins-heading mb-3">Select your course Category</h1>
        <div className="mt-8">
          <Select
            value={formik.values.category}
            onValueChange={value => formik.setFieldValue("category", value)}
          >
            <SelectTrigger
              className="ins-control-border rounded-none"
              onBlur={() => formik.setFieldTouched("category", true)}
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formik.touched.category && formik.errors.category && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.category}</div>
          )}
        </div>
      </div>
      <div className="flex justify-between w-full items-center rounded-md border border-gray p-4">
        <Button
          variant={"outline"}
          className="rounded-none"
          type="button"
          onClick={() => {
            window.location.hash = "#/instructor/course-title";
          }}
        >
          Previous
        </Button>
        <Button className="rounded-none" type="submit" disabled={loading || !formik.dirty || !formik.isValid}>
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};

export default CourseCategory;