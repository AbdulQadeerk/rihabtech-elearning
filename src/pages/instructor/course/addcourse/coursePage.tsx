import { useRef, useState, useEffect } from 'react';
import { courseApiService, Category, SubCategory, UpdateCourseMessageResponse, CourseUpdateRequest } from '../../../../utils/courseApiService';
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import QuillEditor from "../../../../components/ui/quill-editor-default";
import { Combobox } from "../../../../components/ui/combobox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../../../context/AuthContext";
import { useCourseData } from "../../../../hooks/useCourseData";
import { toast } from "sonner";
import { LANGUAGES } from "../../../../utils/languages";
import { LEVELS } from "../../../../utils/levels";

import { uploadToBunny } from '../../../../lib/bunny';

// Helper to upload image to Bunny Storage
async function uploadToCloudinaryImage(file: File) {
  const result = await uploadToBunny(file, 'image');
  return result.url;
}

// Helper to upload video to Bunny Stream
async function uploadToCloudinaryVideo(file: File) {
  const result = await uploadToBunny(file, 'video');
  return result.url;
}

export function CourseLandingPage({ onSubmit }: any) {
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [promoVideo, setPromoVideo] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [promoVideoFile, setPromoVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showImageGuidelines, setShowImageGuidelines] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { courseData, isLoading, isNewCourse, updateCourseData, refreshCourseData } = useCourseData();

  // Check if course is published (status = 5) or has pending changes (status = 7)
  const isPublishedCourse = courseData?.status === 5 || courseData?.status === 7;
  const hasPendingChanges = courseData?.hasUnpublishedChanges || courseData?.status === 7;

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const validationSchema = Yup.object({
    title: Yup.string().required("Course title is required"),
    subtitle: Yup.string().required("Course subtitle is required"),
    description: Yup.string()
      .required("Course description is required")
      .test('min-words', 'Description should have minimum 200 words', function (value) {
        if (!value) return false;
        const plainText = stripHtmlTags(value);
        const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
        return wordCount >= 10;
      }),
    language: Yup.string().required("Language is required"),
    level: Yup.string().required("Level is required"),
    category: Yup.string().required("Category is required"),
    subcategory: Yup.string().required("Subcategory is required"),
    primaryTopic: Yup.string(),
    thumbnail: Yup.mixed().nullable()
      .test('thumbnail-required', 'Course image is required', function (value) {
        // if thumbnailUrl exists, treat as valid
        if (this.parent && this.parent.thumbnailUrl) return true;
        // otherwise require a file
        return !!value;
      })
      .test('thumbnail-size', 'File size must be less than 5 MB', function (value) {
        if (!value) return true; // no file -> handled by required test
        // value may be a File (browser) or something else. Protect with instanceof.
        if (!(value instanceof File)) {
          // if it's a string (url), allow it (handled by thumbnailUrl check), otherwise fail
          return typeof value === 'string' ? true : false;
        }
        return value.size <= 5 * 1024 * 1024;
      })
      .test('thumbnail-type', 'Unsupported file type', function (value) {
        if (!value) return true;
        if (!(value instanceof File)) return true;
        return /^(image\/jpeg|image\/jpg|image\/png|image\/gif)$/.test(value.type);
      }),
    promoVideo: Yup.mixed().nullable()
      .test("fileSize", "Video must be less than 100 MB", function (value) {
        if (!value) return true; // ⬅️ IMPORTANT: do NOT trigger required error

        // Narrow type
        const file = value as File;
        if (!(file instanceof File)) return true;

        return file.size <= 100 * 1024 * 1024;
      }),
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  // Helper functions to get display names for selected values
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.title : '';
  };

  const getSubCategoryName = (subcategoryId: string) => {
    const subcategory = subCategories.find(sub => sub.id.toString() === subcategoryId);
    if (subcategory) {
      // Try different property names in case the API uses a different structure
      return subcategory.name || subcategory.title || subcategory.subCategoryName || 'Unknown';
    }
    return '';
  };

  useEffect(() => {
    courseApiService.getAllCategories().then((data) => {
      console.log("Categories loaded:", data);
      setCategories(data);
    });
    courseApiService.getAllSubCategories().then((data) => {
      console.log("SubCategories loaded:", data);
      setSubCategories(data);
    }).catch((error) => {
      console.error("Error loading subcategories:", error);
    });
  }, []);

  const formik = useFormik({
    initialValues: {
      title: courseData?.title || "",
      subtitle: courseData?.subtitle || "",
      description: courseData?.description || "",
      language: courseData?.language || "",
      level: courseData?.level || "",
      category: courseData?.category?.toString() || "",
      subcategory: courseData?.subCategory?.toString() || "",
      primaryTopic: "",
      thumbnail: undefined,
      promoVideo: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setUploadError(null);

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

        // Upload thumbnail to Cloudinary
        let thumbnailUrl = thumbnailImage;
        if (thumbnailFile) {
          setUploading(true);
          thumbnailUrl = await uploadToCloudinaryImage(thumbnailFile);
          setUploading(false);
        }

        // Upload promo video to Cloudinary
        let promoVideoUrl = promoVideo;
        if (promoVideoFile) {
          setUploading(true);
          promoVideoUrl = await uploadToCloudinaryVideo(promoVideoFile);
          setUploading(false);
        }

        // Comparison logic: Only call update API if data has changed
        const currentTitle = courseData.title || "";
        const currentSubtitle = courseData.subtitle || "";
        const currentDescription = courseData.description || "";
        const currentLanguage = courseData.language || "";
        const currentLevel = courseData.level || "";
        const currentCategory = courseData.category ? courseData.category.toString() : "";
        const currentSubCategory = courseData.subCategory ? courseData.subCategory.toString() : "";
        const currentThumbnailUrl = courseData.thumbnailUrl || "";
        const currentPromoVideoUrl = courseData.promoVideoUrl || "";

        const titleChanged = currentTitle !== values.title;
        const subtitleChanged = currentSubtitle !== values.subtitle;
        const descriptionChanged = currentDescription !== values.description;
        const languageChanged = currentLanguage !== values.language;
        const levelChanged = currentLevel !== values.level;
        const categoryChanged = currentCategory !== values.category;
        const subCategoryChanged = currentSubCategory !== values.subcategory;
        const thumbnailChanged = currentThumbnailUrl !== thumbnailUrl;
        const promoVideoChanged = currentPromoVideoUrl !== promoVideoUrl;

        if (!titleChanged && !subtitleChanged && !descriptionChanged &&
          !languageChanged && !levelChanged && !categoryChanged &&
          !subCategoryChanged && !thumbnailChanged && !promoVideoChanged) {
          //toast.info("No changes detected in course landing page. Moving to next step.");
          setLoading(false);
          onSubmit && onSubmit();
          return; // Exit early
        }

        // If data has changed, proceed with update
        const updateResponse: UpdateCourseMessageResponse = await courseApiService.updateCourse({
          id: courseData.id,
          title: values.title,
          subtitle: values.subtitle,
          description: values.description,
          category: values.category ? parseInt(values.category) : null,
          subCategory: values.subcategory ? parseInt(values.subcategory) : null,
          level: values.level,
          language: values.language,
          pricing: courseData.pricing ?? null,
          thumbnailUrl: thumbnailUrl,
          promoVideoUrl: promoVideoUrl,
          welcomeMessage: courseData.welcomeMessage ?? null,
          congratulationsMessage: courseData.congratulationsMessage ?? null,
          learn: courseData.learn ?? [],
          requirements: courseData.requirements ?? [],
          target: courseData.target ?? [],
          curriculum: courseData.curriculum as CourseUpdateRequest['curriculum'] ?? undefined // Include curriculum data
        });

        // After a successful update, update the shared courseData state with the new data
        updateCourseData({
          title: values.title,
          subtitle: values.subtitle,
          description: values.description,
          category: values.category ? parseInt(values.category) : null,
          subCategory: values.subcategory ? parseInt(values.subcategory) : null,
          level: values.level,
          language: values.language,
          pricing: courseData.pricing ?? null,
          thumbnailUrl: thumbnailUrl,
          promoVideoUrl: promoVideoUrl,
          welcomeMessage: courseData.welcomeMessage ?? null,
          congratulationsMessage: courseData.congratulationsMessage ?? null,
          learn: courseData.learn ?? [],
          requirements: courseData.requirements ?? [],
          target: courseData.target ?? [],
          curriculum: courseData.curriculum ?? undefined // Include curriculum data
        });

        toast.success(updateResponse.message || "Course landing page updated successfully!");

        // Refresh course data from API to ensure all pages have the latest data
        await refreshCourseData();

        setLoading(false);
        onSubmit && onSubmit();
      } catch (error: any) {
        console.error("Failed to save course landing page:", error);

        // Handle specific error messages
        if (error.message?.includes('Authentication failed')) {
          toast.error("Authentication failed. Please login again.");
        } else if (error.message?.includes('Access forbidden')) {
          toast.error("You don't have permission to perform this action.");
        } else if (error.message?.includes('Server error')) {
          toast.error("Server error. Please try again later.");
        } else {
          // Check if the error has validation errors from API response
          if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            // Show the first validation error to the user
            const firstError = error.response.data.errors[0];
            toast.error(firstError);
          } else if (error.response?.data?.message) {
            // Show the API error message
            toast.error(error.response.data.message);
          } else {
            // Fallback to generic error message
            toast.error("Failed to save course landing page. Please try again.");
          }
        }

        setLoading(false);
        setUploading(false);
      }
    },
    enableReinitialize: true,
  });

  // Set form values when course data is loaded
  useEffect(() => {
    if (courseData) {
      if (courseData.title) formik.setFieldValue('title', courseData.title);
      if (courseData.subtitle) formik.setFieldValue('subtitle', courseData.subtitle);
      if (courseData.description) formik.setFieldValue('description', courseData.description);
      if (courseData.language) formik.setFieldValue('language', courseData.language);
      if (courseData.level) formik.setFieldValue('level', courseData.level);

      // Set images and videos
      if (courseData.thumbnailUrl) {
        setThumbnailImage(courseData.thumbnailUrl);
        formik.setFieldValue('thumbnail', courseData.thumbnailUrl);
      } else {
        setThumbnailImage('/Images/icons/image_3748512.png');
      }

      if (courseData.promoVideoUrl) {
        setPromoVideo(courseData.promoVideoUrl);
        formik.setFieldValue('promoVideo', courseData.promoVideoUrl);
      }
    }
  }, [courseData]);

  // Set category and subcategory when both courseData and categories are loaded
  useEffect(() => {
    if (courseData && categories.length > 0) {
      // Set category if not already set
      if (courseData.category && !formik.values.category) {
        formik.setFieldValue('category', courseData.category.toString());
      }
      // Set subcategory if not already set
      if (courseData.subCategory && !formik.values.subcategory) {
        formik.setFieldValue('subcategory', courseData.subCategory.toString());
      }
    }
  }, [courseData, categories]);

  // Handlers for file/image/video
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      // no file chosen
      formik.setFieldValue('thumbnail', null);
      formik.setFieldError('thumbnail', undefined);
      setThumbnailImage(null);
      return;
    }

    // QUICK FRONT-END GUARD: reject >5MB early and show error immediately
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      formik.setFieldValue('thumbnail', null);
      formik.setFieldError('thumbnail', 'File size must be less than 5 MB');
      setThumbnailImage(null);
      e.target.value = ''; // reset input so user can re-select
      return;
    }

    // Accept file: clear previous form error and set value
    formik.setFieldError('thumbnail', undefined);
    formik.setFieldValue('thumbnail', file);
    setThumbnailFile(file);
    setThumbnailImage(URL.createObjectURL(file));

    // Trigger validation if you need immediate validation run:
    // formik.validateField('thumbnail');
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    formik.setFieldTouched("promoVideo", true, true);

    if (!file) {
      formik.setFieldValue("promoVideo", null);
      return;
    }

    formik.setFieldValue("promoVideo", file);

    // Preview
    setPromoVideo(URL.createObjectURL(file));
    setPromoVideoFile(file);
  };

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
      <div className="mb-3">
        <h2 className="form-title">Course landing page</h2>

        {/* Course Title */}
        <div className="mt-8 gap-2 flex flex-col">
          <label className="ins-label">Course Title<span className="text-[#ff0000]"> *</span></label>
          <Input
            className={`ins-control-border ${formik.touched.title && formik.errors.title ? '!border-red-500' : ''}`}
            placeholder="Photoshop"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.title && formik.errors.title && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.title}</div>
          )}
        </div>

        {/* Course Subtitle */}
        <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">Course Subtitle<span className="text-[#ff0000]"> *</span></label>
          <Input
            className={`ins-control-border ${formik.touched.subtitle && formik.errors.subtitle ? '!border-red-500' : ''}`}
            placeholder="Insert your course subtitle"
            name="subtitle"
            value={formik.values.subtitle}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.subtitle && formik.errors.subtitle && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.subtitle}</div>
          )}
        </div>

        {/* Course Description */}
        <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">Course Description<span className="text-[#ff0000]"> *</span></label>
          <QuillEditor
            value={formik.values.description}
            onChange={(content) => formik.setFieldValue('description', content)}
            placeholder="Insert your course Description"
            height="300px"
            error={formik.touched.description && !!formik.errors.description}
          />
          {/* <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {formik.values.description ? 
                `${stripHtmlTags(formik.values.description).trim().split(/\s+/).filter(word => word.length > 0).length} words` : 
                '0 words'
              }
            </div>
            <div className="text-xs text-gray-500">
              Minimum 200 words required
            </div>
          </div> */}
          {formik.touched.description && formik.errors.description && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.description}</div>
          )}
        </div>

        {/* Basic Info */}
        <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">Basic Info<span className="text-[#ff0000]"> *</span></label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="flex flex-col overflow-visible">
              <Combobox
                options={LANGUAGES.map(lang => ({ value: lang.value, label: lang.label }))}
                value={formik.values.language}
                onValueChange={value => formik.setFieldValue("language", value)}
                placeholder="Choose a language"
                searchPlaceholder="Search language..."
                className={`ins-control-border rounded-none w-full ${formik.touched.language && formik.errors.language ? '!border-red-500' : ''}`}
                onBlur={() => formik.setFieldTouched("language", true)}
              />
              {formik.touched.language && formik.errors.language && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.language}</div>
              )}
            </div>
            <div className="flex flex-col overflow-visible">
              <Combobox
                options={LEVELS.map(level => ({ value: level.value, label: level.label }))}
                value={formik.values.level}
                onValueChange={value => formik.setFieldValue("level", value)}
                placeholder="Select Level"
                searchPlaceholder="Search level..."
                className={`ins-control-border rounded-none w-full ${formik.touched.level && formik.errors.level ? '!border-red-500' : ''}`}
                onBlur={() => formik.setFieldTouched("level", true)}
              />
              {formik.touched.level && formik.errors.level && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.level}</div>
              )}
            </div>
            <div className="flex flex-col overflow-visible">
              <Combobox
                options={categories.map(cat => ({ value: cat.id.toString(), label: cat.title }))}
                value={formik.values.category}
                onValueChange={value => {
                  formik.setFieldValue("category", value);
                  // Reset subcategory when category changes
                  formik.setFieldValue("subcategory", "");
                }}
                placeholder="Choose a Category"
                searchPlaceholder="Search category..."
                className={`ins-control-border rounded-none w-full ${formik.touched.category && formik.errors.category ? '!border-red-500' : ''}`}
                onBlur={() => formik.setFieldTouched("category", true)}
              />
              {formik.touched.category && formik.errors.category && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.category}</div>
              )}
            </div>
            <div className="flex flex-col overflow-visible">
              <Combobox
                options={(() => {
                  const filteredSubs = subCategories.filter(sub => {
                    return sub.categoryId.toString() === formik.values.category;
                  });

                  return filteredSubs.map(sub => {
                    // Try different property names in case the API uses a different structure
                    const displayName = sub.name || sub.title || sub.subCategoryName || 'Unknown';
                    return {
                      value: sub.id.toString(),
                      label: displayName
                    };
                  });
                })()}
                value={formik.values.subcategory}
                onValueChange={value => formik.setFieldValue("subcategory", value)}
                placeholder="Choose a SubCategory"
                searchPlaceholder="Search subcategory..."
                disabled={!formik.values.category}
                className={`ins-control-border rounded-none w-full ${formik.touched.subcategory && formik.errors.subcategory ? '!border-red-500' : ''}`}
                onBlur={() => formik.setFieldTouched("subcategory", true)}
              />
              {formik.touched.subcategory && formik.errors.subcategory && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.subcategory}</div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Topic */}
        {/* <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">What is primarily taught in your course?</label>
          <Input
            className="ins-control-border"
            placeholder="eg Landscape Photography"
            name="primaryTopic"
            value={formik.values.primaryTopic}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.primaryTopic && formik.errors.primaryTopic && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.primaryTopic}</div>
          )}
        </div> */}

        {/* Course Image */}
        <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">Course Image<span className="text-[#ff0000]"> *</span></label>
          <div className={`ins-control-border gap-3 items-center justify-center flex flex-col ${formik.touched.thumbnail && formik.errors.thumbnail ? '!border-red-500' : ''}`}>
            {thumbnailImage ? (
              <img
                src={thumbnailImage}
                alt="Uploaded course"
                className="rounded-lg w-80 h-48 object-cover"
              />
            ) : (
              <img
                src="/Images/icons/image_3748512.png"
                alt="Placeholder course"
                className="rounded-lg w-80 h-48"
              />
            )}
            <div className="text-primary text-sm text-center font-medium font-['Nunito']">
              Upload your course image here. It must meet our{' '}
              <button
                type="button"
                onClick={() => setShowImageGuidelines(true)}
                className="text-blue-500 underline"
              >
                course image quality standards
              </button>{' '}
              to be accepted. Important guidelines: Below 5MB 750x422 pixels; .jpg, .jpeg, .gif, or .png. No text on the image.
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
              id="thumbnail-upload"
              ref={thumbnailInputRef}
            />
            <label htmlFor="thumbnail-upload" className='z-10 rounded-none bg-primary p-2 text-white cursor-pointer hover:opacity-90'>
              Upload File
            </label>
            {formik.touched.thumbnail && formik.errors.thumbnail && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.thumbnail as string}</div>
            )}
          </div>
        </div>

        {/* Promotional Video Upload */}
        <div className="mt-4 gap-2 flex flex-col">
          <label className="ins-label">Promotional Video</label>
          <div className={`ins-control-border gap-3 items-center justify-center flex flex-col ${formik.touched.promoVideo && formik.errors.promoVideo ? '!border-red-500' : ''}`}>
            {promoVideo ? (
              <video
                src={promoVideo}
                controls
                className="rounded-lg w-80 h-48 object-cover"
              />
            ) : (
              <img
                src="/Images/icons/multimedia.png"
                alt="Placeholder promo"
                className="rounded-lg w-80 h-48"
              />
            )}
            <div className="text-primary text-sm text-center font-medium font-['Nunito']">
              Upload your promotional video here. Supported formats: .mp4, .mov, etc. Make sure it's high quality and aligns with guidelines.
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
              id="video-upload"
              ref={videoInputRef}
            />
            <label htmlFor="video-upload" className='z-10 rounded-none bg-primary p-2 text-white cursor-pointer hover:opacity-90'>
              Upload File
            </label>
            {formik.touched.promoVideo && formik.errors.promoVideo && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.promoVideo as string}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <Button className="rounded-none" type="submit" disabled={loading || uploading}>
            {loading ? 'Saving...' : uploading ? 'Uploading...' : 'Save & Continue'}
          </Button>
        </div>
        {uploadError && <div className="text-red-500 text-xs mt-2">{uploadError}</div>}
      </div>
      {showImageGuidelines && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md shadow-xl relative">
            <h2 className="text-lg font-semibold mb-3">Course Image Quality Standards</h2>

            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>File size must be below <strong>5MB</strong></li>
              <li>Resolution should be <strong>750 × 422 px</strong> (This resolution is best fit for your thumbnail Image)</li>
              <li>Accepted formats: <strong>.jpg, .jpeg, .gif, .png</strong></li>
              <li>No text, watermarks, or logos on the image</li>
              <li>Use high-contrast, clean, and professional visuals</li>
            </ul>

            <button
              onClick={() => setShowImageGuidelines(false)}
              className="mt-6 bg-primary text-white px-4 py-2 rounded hover:opacity-90 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </form>
  );
}