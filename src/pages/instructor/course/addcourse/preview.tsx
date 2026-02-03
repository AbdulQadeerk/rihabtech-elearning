
import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Button } from '../../../../components/ui/button';
import LoadingIcon from '../../../../components/ui/LoadingIcon';
import { getFullCourseData } from '../../../../utils/firebaseCoursePreview';
import {
  getCourseCurriculum,
  getCourseLandingPage,
  getCourseIntendedLearners,
  getCourseStructure
} from '../../../../utils/firebaseCoursePreviewHelpers';
import { courseApiService, Category, SubCategory, CourseSubmitForReviewResponse } from '../../../../utils/courseApiService';
import { BookOpen, Users, Info, DollarSign, MessageSquare, Eye, Loader2 } from 'lucide-react';
import { SubmitRequirementsDialog } from '../../../../components/ui/submitrequiremntdialog';
import { COURSE_STATUS } from '../../../../utils/firebaseCourses';
import { CourseWorkflowService } from '../../../../utils/courseWorkflowService';
import { useAuth } from '../../../../context/AuthContext';
import { useCourseData } from '../../../../hooks/useCourseData';
import { toast } from 'sonner';
import { getLanguageLabel } from '../../../../utils/languages';
import { getLevelLabel } from '../../../../utils/levels';
import ReactPlayer from 'react-player';

// Helper function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
};

const PreviewCourse = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [landingPage, setLandingPage] = useState<any>({});
  const [intendedLearners, setIntendedLearners] = useState<any[]>([]);
  const [structure, setStructure] = useState<any[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<Record<string, string[]>>({});
  const [categoryName, setCategoryName] = useState<string>('');
  const [subcategoryName, setSubcategoryName] = useState<string>('');
  const draftId = useRef<string>(localStorage.getItem('draftId') || '');
  const { user } = useAuth();
  const { courseData, isLoading: courseDataLoading } = useCourseData();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Use courseData from useCourseData hook if available, otherwise fallback to Firebase
      if (courseData) {
        setCourse(courseData);

        // Fetch category and subcategory names for API data
        if (courseData.category || courseData.subCategory) {
          const [categories, subcategories] = await Promise.all([
            courseApiService.getAllCategories(),
            courseApiService.getAllSubCategories()
          ]);

          if (courseData.category) {
            const category = categories.find((cat: any) => cat.id === courseData.category);
            setCategoryName((category as any)?.title || courseData.category);
          }

          if (courseData.subCategory) {
            const subcategory = subcategories.find((sub: any) => sub.id === courseData.subCategory);
            setSubcategoryName((subcategory as any)?.name || (subcategory as any)?.title || (subcategory as any)?.subCategoryName || courseData.subCategory);
          }
        }
      } else {
        // Fallback to Firebase data
        const data = await getFullCourseData(draftId.current);
        setCourse(data);
        setCurriculum(await getCourseCurriculum(draftId.current));
        setLandingPage(await getCourseLandingPage(draftId.current));
        setIntendedLearners(await getCourseIntendedLearners(draftId.current));
        setStructure(await getCourseStructure(draftId.current));

        // Fetch category and subcategory names for Firebase data
        if (data && (data.category || data.subcategory)) {
          const [categories, subcategories] = await Promise.all([
            courseApiService.getAllCategories(),
            courseApiService.getAllSubCategories()
          ]);

          if (data.category) {
            const category = categories.find((cat: any) => cat.id === data.category);
            setCategoryName((category as any)?.title || data.category);
          }

          if (data.subcategory) {
            const subcategory = subcategories.find((sub: any) => sub.id === data.subcategory);
            setSubcategoryName((subcategory as any)?.name || data.subcategory);
          }
        }
      }

      setLoading(false);
    };

    if (!courseDataLoading) {
      fetchData();
    }
  }, [courseData, courseDataLoading]);


  const goToDashboard = () => {
    window.location.hash = '#/instructor/course-test-selection';
  };

  // Submit for Review handler
  const handleSubmitForReview = async () => {
    // Use courseData from API if available, otherwise fallback to Firebase
    const courseId = courseData?.id || draftId.current;

    if (!courseId) {
      alert('Course ID not found. Please try again.');
      return;
    }

    // compute validations one more time before actually submitting
    const { canSubmit, missing } = computeMissingAndCanSubmit();
    if (!canSubmit) {
      setMissingRequirements(missing);
      setShowMissingDialog(true);
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting course for review...', {
        courseId: courseId,
        instructorId: user?.UserName,
        instructorName: user?.displayName || user?.UserName,
        instructorEmail: user?.email
      });

      if (courseData?.id) {
        // Use API endpoint for course submission
        const response: CourseSubmitForReviewResponse = await courseApiService.submitCourseForReview(courseData.id);
        console.log('Course submitted successfully via API:', response);
        setSubmitted(true);
      } else {
        // Fallback to Firebase workflow service
        await CourseWorkflowService.submitCourseForReview(
          draftId.current,
          user?.UserName || '',
          user?.displayName || user?.UserName || '',
          user?.email || ''
        );

        // Update progress to 100%
        const draftRef = doc(db, 'courseDrafts', draftId.current);
        await updateDoc(draftRef, { progress: 100 });

        console.log('Course submitted successfully via Firebase');
        setSubmitted(true);
      }
    } catch (error: any) {
      console.error('Error submitting course for review:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);

      // Extract the actual error message from the API response
      let errorMessage = 'Failed to submit course for review. Please try again.';

      if (error?.response?.data?.message) {
        // API returned a specific error message
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        // Alternative error field
        errorMessage = error.response.data.error;
      } else if (error?.response?.data) {
        // If data is a string, use it directly
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error?.message) {
        // Generic error message
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const computeMissingAndCanSubmit = () => {
    const missing: Record<string, string[]> = {};

    // Curriculum checks
    const sections = course?.curriculum?.sections || [];
    // Count video seconds
    let totalVideoSeconds = 0;
    let lectureCount = 0;
    let lecturesWithoutContent: string[] = [];
    sections.forEach((s: any, sIdx: number) => {
      (s.items || []).forEach((it: any, iIdx: number) => {
        if (it.type === 'lecture') {
          lectureCount += 1;
          const duration = it.duration || (it.contentFiles && it.contentFiles.reduce((acc: number, f: any) => acc + (f.duration || 0), 0)) || 0;
          totalVideoSeconds += duration;
          const hasContent = (it.contentFiles && it.contentFiles.length > 0) || it.contentType || it.url;
          if (!hasContent) {
            lecturesWithoutContent.push(`Section ${sIdx + 1} - ${it.lectureName || it.title || 'Lecture ' + (iIdx + 1)}`);
          }
        }
      });
    });

    // if (totalVideoSeconds < 30 * 1) {
    //   missing['Curriculum'] = missing['Curriculum'] || [];
    //   missing['Curriculum'].push('Have at least 30 minutes of video content');
    // }
    // if (lectureCount < 1) {
    //   missing['Curriculum'] = missing['Curriculum'] || [];
    //   missing['Curriculum'].push('Have at least 2 lectures');
    // }
    if (lecturesWithoutContent.length > 0) {
      missing['Curriculum'] = missing['Curriculum'] || [];
      missing['Curriculum'].push('Have content for all lectures');
      // add small summary
      lecturesWithoutContent.slice(0, 6).forEach((t) => missing['Curriculum']!.push(`Missing content: ${t}`));
    }
    // Landing page checks
    const landing = course.landingPage || course || {};
    const landingMissing: string[] = [];
    const description = course.description || landing.description || '';
    const desc = description.replace(/<[^>]*>/g, '').trim();
    const wordCount = desc ? desc.split(/\s+/).filter(Boolean).length : 0;
    console.log('wordCount', wordCount)
    if (course.learn.length == 0) landingMissing.push('Have a course `What will students learn in your course` with at least 1 item');
    if (course.requirements.length == 0) landingMissing.push('Have a course `Are there any course requirements or prerequisites` with at least 1 item');
    if (course.target.length == 0) landingMissing.push('Have a course `Who is this course for` with at least 1 item');
    if (wordCount < 50) landingMissing.push('Have a course description with at least 50 words');
    if (!landing.subtitle && !course.subtitle) landingMissing.push('Have a course subtitle');
    // if (!course.instructorDescription && !(landing.instructorDescription)) landingMissing.push('Have an instructor description with at least 50 words');
    if (!course.category && !landing.category) landingMissing.push('Select the category of your course');
    if (!course.level && !landing.level) landingMissing.push('Select the level of your course');
    if (!course.subCategory && !landing.subCategory) landingMissing.push('Select the subcategory of your course');
    if (!course.learn && course.learn.length <= 0) landingMissing.push('Select what is primarily taught in your course');
    if (!course.thumbnailUrl && !landing.thumbnailUrl) landingMissing.push('Upload a course image');
    if (landingMissing.length > 0) missing['Course landing page'] = landingMissing;

    // Pricing checks
    const pricingMissing: string[] = [];
    if (!course.pricing) pricingMissing.push('Select a price for your course');
    if (pricingMissing.length > 0) missing['Pricing'] = pricingMissing;

    const canSubmit = Object.keys(missing).length === 0;
    setMissingRequirements(missing);
    return { missing, canSubmit };
  };

  // compute missing once when course/landing/curriculum load
  useEffect(() => {
    if (!loading && course) {
      computeMissingAndCanSubmit();
    }
  }, [loading, course, landingPage, curriculum]);

  if (submitted) {
    // Check if this is a re-approval (course was previously published/approved)
    const isReApproval = course.status === COURSE_STATUS.DRAFT_UPDATE ||
      (course.isPublished && course.status === COURSE_STATUS.PENDING_REVIEW);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="bg-gradient-to-br from-green-200 via-green-100 to-white border border-green-400 text-green-800 px-8 py-8 rounded-2xl shadow-lg mt-16 mb-8 w-full max-w-xl text-center animate-fade-in">
          <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2l4-4" /></svg>
          <h2 className="text-2xl font-bold mb-2">
            {isReApproval ? 'Course Resubmitted for Re-approval!' : 'Course Submitted for Review!'}
          </h2>
          <p className="mb-4 text-lg">
            {isReApproval
              ? 'Thank you for resubmitting your course with modifications. Our admin team will review the changes and re-approve your course soon.'
              : 'Thank you for submitting your course. Our admin team will review your course soon.'
            }
          </p>
          <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-3">
            <span className="font-semibold">What happens next?</span>
            <ul className="list-disc ml-6 mt-2 text-left text-green-800">
              <li>You will receive a notification and email once your course is approved or if any changes are required.</li>
              <li>While under review, you can still edit your course but cannot publish it until approved.</li>
              {isReApproval && (
                <li className="text-orange-700 font-medium">Your previous published version remains live until the changes are approved and made live.</li>
              )}
            </ul>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow" onClick={goToDashboard}>
            Go to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (loading || courseDataLoading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingIcon /></div>;
  }

  if (!course) {
    return <div className="text-center py-16 text-lg text-red-500">Course not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Course Preview</h1>
      {/* Course Title & Category */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2"><BookOpen className="inline-block text-orange-500" /> Course Title</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xl font-semibold">{course.title || 'Course Title'}</span>
            {categoryName && (
              <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full ml-4 text-sm">{categoryName}</span>
            )}
          </div>
          {/* <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400">Course ID</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{draftId.current}</span>
          </div> */}
        </div>
      </div>

      {/* Intended Learners */}
      <div className="mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Users className="inline-block text-blue-500" /> Intended Learners</h3>
        {(course.learn && Array.isArray(course.learn) && course.learn.length > 0) || (course.requirements && Array.isArray(course.requirements) && course.requirements.length > 0) || (course.target && Array.isArray(course.target) && course.target.length > 0) ? (
          <div>
            {course.learn && course.learn.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold">What will students learn in your course?</div>
                <ul className="list-disc ml-6 text-gray-700">
                  {course.learn.map((l: any, i: number) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}
            {course.requirements && course.requirements.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold">Course Requirements / Prerequisites</div>
                <ul className="list-disc ml-6 text-gray-700">
                  {course.requirements.map((r: any, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {course.target && course.target.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold">Who is this course for?</div>
                <ul className="list-disc ml-6 text-gray-700">
                  {course.target.map((t: any, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : <div className="text-gray-400">No intended learners specified.</div>}
      </div>



      {/* Curriculum */}
      <div className="mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Info className="inline-block text-purple-500" /> Curriculum</h3>
        {course.curriculum && course.curriculum.sections && course.curriculum.sections.length > 0 ? (
          <div className="space-y-6">
            {course.curriculum.sections.map((section: any, sectionIdx: number) => (
              <div key={sectionIdx} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg text-primary">Section {sectionIdx + 1}:</span>
                  <span className="font-semibold text-gray-700">{section.name}</span>
                  {(section.published !== false) ? (
                    <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded text-xs">Published</span>
                  ) : (
                    <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">Unpublished</span>
                  )}
                </div>
                {section.description && <div className="mb-2 text-gray-600">{section.description}</div>}
                <div className="ml-4">
                  {section.items && section.items.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {section.items.map((item: any, itemIdx: number) => (
                        <li key={itemIdx} className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-gray-800 capitalize">{item.type === 'lecture' ? 'Lecture' : item.type === 'quiz' ? 'Quiz' : item.type === 'assignment' ? 'Assignment' : 'Item'}: {item.lectureName || item.quizTitle || item.title || ''}</div>
                            {(item.published !== false) ? (
                              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Published</span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-200 text-orange-700 rounded text-xs">Unpublished</span>
                            )}
                            {item.type === 'lecture' && item.contentType === 'video' && item.isPromotional && (
                              <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">Free Preview</span>
                            )}
                          </div>
                          {item.type === 'lecture' && (
                            <div className="text-gray-600">
                              {item.description && <div>Description: {item.description}</div>}
                              {item.contentType && <div>Type: {item.contentType}</div>}
                              {item.duration && <div>Duration: {Math.round(item.duration)} sec</div>}
                              {/* Show video preview for uploaded videos */}
                              {item.contentFiles && item.contentFiles.length > 0 && (
                                <div className="mt-2">
                                  <div className="font-semibold">Files:</div>
                                  <ul className="ml-4">
                                    {item.contentFiles.map((f: any, i: number) => (
                                      <li key={i} className="mb-2">
                                        {f.contentType === 'video' || item.contentType === 'video' ? (
                                          <div className="rounded overflow-hidden mt-2" style={{ maxWidth: 320 }}>
                                            <ReactPlayer
                                              url={f.url || item.url}
                                              controls={true}
                                              width="320px"
                                              height="180px"
                                              light={item.thumbnailUrl || false}
                                            />
                                          </div>
                                        ) : null}
                                        {f.contentType === 'article' || item.contentType === 'article' || f.name?.toLowerCase().endsWith('.pdf') ? (
                                          <div>
                                            <a href={f.url || item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-2">
                                              <span role="img" aria-label="document">📄</span> {f.name || 'Document'}
                                            </a>

                                          </div>
                                        ) : null}
                                        {!f.contentType && !f.name?.toLowerCase().endsWith('.pdf') && !f.url?.endsWith('.pdf') && !f.url?.endsWith('.mp4') && (
                                          <span>{f.name || f.url || 'File'}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}



                              {/* Show YouTube video preview for linked videos */}
                              {item.contentType === 'video' && item.videoSource === 'link' && item.contentUrl && (
                                <div className="mt-2">
                                  <div className="font-semibold">YouTube Video:</div>
                                  <div className="mt-2">
                                    <iframe
                                      width="320"
                                      height="180"
                                      src={`https://www.youtube.com/embed/${extractYouTubeVideoId(item.contentUrl)}`}
                                      title={item.lectureName || 'YouTube Video'}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      style={{ maxWidth: 320, maxHeight: 180 }}
                                    ></iframe>
                                    <div className="mt-1 text-sm text-gray-600">
                                      <a
                                        href={item.contentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View on YouTube
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(item.contentType === 'article' && item.contentText) && <div dangerouslySetInnerHTML={{ __html: item.contentText }}>

                              </div>}

                              {item.contentType === 'article' && item.articleSource === 'link' && item.contentUrl && (
                                <div className="mt-2">
                                  <div className="font-semibold">Article Link:</div>
                                  <a className='text-blue-600 underline' target='_blank' href={item.contentUrl}>{item.contentUrl}</a>
                                </div>
                              )}
                            </div>
                          )}
                          {item.type === 'quiz' && (
                            <div className="text-gray-600">
                              {item.quizDescription && <div>Description: {item.quizDescription}</div>}
                              {item.questions && item.questions.length > 0 && (
                                <div>
                                  <div>Questions:</div>
                                  <ol className="list-decimal ml-6">
                                    {item.questions.map((q: any, qIdx: number) => (
                                      <li key={qIdx} className="mb-1">
                                        <div>Q: {q.question}</div>
                                        <div>Options: {q.options && q.options.join(', ')}</div>
                                        <div>Correct: {Array.isArray(q.correctOption) ? q.correctOption.map((idx: number) => q.options[idx]).join(', ') : q.options[q.correctOption]}</div>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          )}
                          {item.type === 'assignment' && (
                            <div className="text-gray-600">
                              {item.description && <div>Description: {item.description}</div>}
                              {item.duration && <div>Duration: {item.duration} min</div>}
                              {item.totalMarks && <div>Total Marks: {item.totalMarks}</div>}
                              {item.questions && item.questions.length > 0 && (
                                <div>
                                  <div>Questions:</div>
                                  <ol className="list-decimal ml-6">
                                    {item.questions.map((q: any, qIdx: number) => (
                                      <li key={qIdx} className="mb-1">
                                        <div>Q: {q.question}</div>
                                        <div>Marks: {q.marks}</div>
                                        {q.answer && <div>Answer: {q.answer}</div>}
                                        {q.maxWordLimit && <div>Word Limit: {q.maxWordLimit}</div>}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-gray-400 ml-4">No items in this section.</div>}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-gray-400">No curriculum specified.</div>}
      </div>

      {/* Course Landing Page */}
      <div className="mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Info className="inline-block text-pink-500" /> Course Landing Page</h3>
        {(course.landingPage && Object.keys(course.landingPage).length > 0) ? (
          <div className="bg-gray-50 border rounded p-4">
            {Object.entries(course.landingPage).map(([key, value]) => (
              <div key={key} className="mb-2"><span className="font-semibold capitalize">{key}:</span> <span className="text-gray-700">{String(value)}</span></div>
            ))}
          </div>
        ) : (
          // Show course data (works for both API and Firebase data)
          (course.title || course.subtitle || course.description || course.language || course.level || categoryName || subcategoryName || course.thumbnailUrl || course.promoVideoUrl) ? (
            <div className="bg-gray-50 border rounded p-4">
              {course.title && <div className="mb-2"><span className="font-semibold">Title:</span> <span className="text-gray-700">{course.title}</span></div>}
              {course.subtitle && <div className="mb-2"><span className="font-semibold">Subtitle:</span> <span className="text-gray-700">{course.subtitle}</span></div>}
              {course.description && <div className="mb-2"><span className="font-semibold">Description:</span> <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: course.description }}></div></div>}
              {course.language && <div className="mb-2"><span className="font-semibold">Language:</span> <span className="text-gray-700">{getLanguageLabel(course.language)}</span></div>}
              {course.level && <div className="mb-2"><span className="font-semibold">Level:</span> <span className="text-gray-700">{getLevelLabel(course.level)}</span></div>}
              {categoryName && <div className="mb-2"><span className="font-semibold">Category:</span> <span className="text-gray-700">{categoryName}</span></div>}
              {subcategoryName && <div className="mb-2"><span className="font-semibold">Subcategory:</span> <span className="text-gray-700">{subcategoryName}</span></div>}
              {course.thumbnailUrl && (
                <div className="mb-2">
                  <span className="font-semibold">Course Image:</span><br />
                  <img src={course.thumbnailUrl} alt="Course Thumbnail" style={{ maxWidth: 200, marginTop: 4 }} />
                </div>
              )}
              {course.promoVideoUrl && (
                <div className="mb-2">
                  <span className="font-semibold">Promotional Video:</span><br />
                  <div className="rounded overflow-hidden mt-2" style={{ maxWidth: 320 }}>
                    <ReactPlayer
                      url={course.promoVideoUrl}
                      controls={true}
                      width="320px"
                      height="180px"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : <div className="text-gray-400">No landing page data.</div>
        )}
      </div>

      {/* Pricing & Access */}
      <div className="mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><div className="inline-block text-yellow-500" >₹</div> Pricing & Access</h3>
        <div className="mb-2"><strong>Pricing:</strong> {course.pricing ? course.pricing.charAt(0).toUpperCase() + course.pricing.slice(1) : 'N/A'}</div>
        <div className="mb-2">
          <strong>Access Platforms:</strong>
          <ul className="list-disc ml-6">
            {course.access?.website && <li>Website</li>}
            {/* {course.access?.app && <li>Mobile App</li>} */}
            {course.access?.private && <li>Private (Members Only)</li>}
          </ul>
        </div>
        {course.members && course.members.length > 0 && (
          <div className="mb-2">
            <strong>Private Members:</strong>
            <div className="flex items-center gap-2">
              <span>{course.members.length} member{course.members.length > 1 ? 's' : ''}</span>
              <button
                onClick={() => setShowMembersModal(true)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                title="View members"
              >
                <Eye size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Course Messages */}
      <div className="mb-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><MessageSquare className="inline-block text-indigo-500" /> Course Messages</h3>
        {course.welcomeMessage && (
          <div className="mb-2">
            <strong>Welcome Message:</strong>
            <div className="bg-gray-50 border rounded p-2 mt-1" dangerouslySetInnerHTML={{ __html: course.welcomeMessage }}></div>
          </div>
        )}
        {course.congratulationsMessage && (
          <div className="mb-2">
            <strong>Congratulations Message:</strong>
            <div className="bg-gray-50 border rounded p-2 mt-1" dangerouslySetInnerHTML={{ __html: course.congratulationsMessage }}></div>
          </div>
        )}
        {(!course.welcomeMessage && !course.congratulationsMessage) && <div className="text-gray-400">No course messages.</div>}
      </div>

      <div className="mt-8 flex flex-col items-end gap-3">
        {/* Validation warning commented out for now */}
        {Object.keys(missingRequirements).length > 0 && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded px-3 py-2">
            You cannot submit yet. {Object.keys(missingRequirements).length} sections have missing items. Click "Submit for Review" to see details.
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary text-white px-6 py-2 rounded shadow-lg flex items-center gap-2"
            onClick={handleSubmitForReview}
            disabled={submitting}
          >
            {submitting && <Loader2 className="animate-spin w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>

      <SubmitRequirementsDialog open={showMissingDialog} onOpenChange={setShowMissingDialog} missing={missingRequirements} />

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Private Members</h3>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {course.members?.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{m.email}</span>
                  <span className="text-sm text-gray-600 capitalize px-2 py-1 bg-gray-200 rounded">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewCourse;