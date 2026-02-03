import React, { useState, useRef, useEffect, use } from 'react';
import { Play, Pause, SkipBack, SkipForward, Fullscreen, FileText, CheckCircle, Clock, LockIcon, ChevronRight, HelpCircle } from "lucide-react";
import Divider from "../../../components/ui/divider";
import Overview from './overview';
import Notes from './notes';
import Instructor from './instructure';
import CourseReviews from './reviews';
import LearningTools from './learningtools';
import Announcements from './announcements';
import ReactPlayer from 'react-player';
import QNA from './qna';
import { CourseDetails, extractQuizData } from '../../../utils/courseDetailsInterface';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { progressApiService, StudentProgress, LectureProgress } from '../../../utils/progressApiService';
import { courseApiService, CourseResponse, CourseDetailsResponse } from '../../../utils/courseApiService';
import { getLevelLabel } from '../../../utils/levels';
import { reviewApiService, ReviewStats } from '../../../utils/reviewApiService';
import { certificateApiService, Certificate } from '../../../utils/certificateApiService';
import { instructorPayoutApiService } from '../../../utils/instructorPayoutApiService';

// Helper function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
};

// Helper function to convert YouTube URL to proper format
const convertYouTubeUrl = (url: string): string => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }
  return url;
};

export default function CourseDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [apiCourseData, setApiCourseData] = useState<CourseDetailsResponse | null>(null);
  const [enrichedCourseData, setEnrichedCourseData] = useState<any>(courseData);
  const [activeModule, setActiveModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ courseId, setCourseId ] = useState<string | null>(null);
  const {  user } = useAuth();
    const [progress, setProgress] = useState<StudentProgress | null>(null);
    const [currentLectureProgress, setCurrentLectureProgress] = useState<LectureProgress | null>(null);
    const [currentWatchSessionId, setCurrentWatchSessionId] = useState<number | null>(null);
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);

  

    const getCourseIdFromURL = (): string | null => {
    // First try useParams
    if (courseId) return courseId;

    // Try to get from URL hash (e.g., #/courseDetails?courseId=123)
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryString = hash.split('?')[1];
      const urlParams = new URLSearchParams(queryString);
      return urlParams.get('courseId');
    }

    // Try to get from URL search params
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
  };


  useEffect(() => {
    const id = getCourseIdFromURL();
    if (id) {
      // If courseId is found in URL, set it in state
      setCourseId(id);
    } else {
      setError("Course ID not found in URL");
      setLoading(false);
    }
  }, []);



  // Get course ID from URL params or use a default for testing
  // In a real app, you'd get this from React Router or props
  // const courseId = "8NjLqdGGeNuJKtjLFzxo"; // Using the ID from your Firebase data

  // Fetch course data from API
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!courseId) {
          setError("Course ID is missing");
          setLoading(false);
          return;
        }
        
        // Fetch from API
        const apiData = await courseApiService.getCourseDetails(parseInt(courseId));
        console.log('API Course data:', apiData);
        setApiCourseData(apiData);
        
        // Convert API data to the expected format
        const convertedData: CourseDetails = {
          id: apiData.id.toString(),
          title: apiData.title,
          subtitle: apiData.subtitle || '',
          description: apiData.description || '',
          level: apiData.level || '',
          language: apiData.language || '',
          pricing: apiData.pricing || '',
          thumbnailUrl: apiData.thumbnailUrl || '',
          promoVideoUrl: apiData.promoVideoUrl || '',
          welcomeMessage: apiData.welcomeMessage || '',
          congratulationsMessage: apiData.congratulationsMessage || '',
          learn: apiData.learn || [],
          requirements: apiData.requirements || [],
          target: apiData.target || [],
          curriculum: apiData.curriculum ? {
            sections: apiData.curriculum.sections.map((section: any, sectionIndex: number) => ({
              id: section.id || section.name || `section-${sectionIndex}`,
              sectionId: section.id,
              name: section.name,
              published: section.published,
              seqNo: section.seqNo,
              items: section.items.map((item: any, itemIndex: number) => {
                // Determine contentType from type if contentType is not provided
                let contentType = item.contentType;
                if (!contentType && item.type) {
                  contentType = item.type === 'quiz' ? 'quiz' : 
                               item.type === 'assignment' ? 'assignment' : 
                               item.type === 'lecture' && item.articleSource === 'write' ? 'article' :
                               item.type === 'lecture' ? 'video' : 'video';
                }
                if (!contentType) {
                  // Fallback: determine from available fields
                  if (item.quizTitle || item.questions) {
                    contentType = 'quiz';
                  } else if (item.title && item.questions) {
                    contentType = 'assignment';
                  } else if (item.contentText && item.articleSource === 'write') {
                    contentType = 'article';
                  } else if (item.contentFiles && item.contentFiles.length > 0) {
                    contentType = 'video';
                  } else {
                    contentType = 'video'; // Default fallback
                  }
                }
                
                return {
                id: item.id || item.lectureName || item.quizTitle || item.title || `item-${itemIndex}`,
                sectionId: section.id,
                contentType: contentType,
                lectureName: item.lectureName || item.quizTitle || item.title || 'Untitled',
                description: item.description || '',
                published: item.published,
                isPromotional: item.isPromotional,
                contentFiles: item.contentFiles || [],
                contentText: item.contentText,
                articleSource: item.articleSource,
                type: item.type,
                videoSource: item.videoSource,
                contentUrl: item.contentUrl,
                duration: item.duration,
                resources: item.resources,
                quizTitle: item.quizTitle,
                quizDescription: item.quizDescription,
                title: item.title,
                questions: item.questions,
                totalMarks: item.totalMarks,
                marks: item.marks,
                maxWordLimit: item.maxWordLimit,
                answer: item.answer,
                seqNo: item.seqNo,
              };
              })
            }))
          } : { sections: [] },
          isPublished: apiData.isPublished || false,
          hasUnpublishedChanges: apiData.hasUnpublishedChanges || false,
          status: apiData.status || 0,
          members: [],
          editSummary: undefined,
          featured: apiData.is_featured || apiData.IsFeatured || false,
          category: apiData.category?.toString() || '',
          subCategory: apiData.subCategory?.toString() || '',
          submittedAt: apiData.submittedAt || '',
          instructorId: (apiData.instructorId || apiData.InstructorId)?.toString() || '',
          instructorName: apiData.instructorName || apiData.InstructorName || '',
          enrollment: apiData.enrollment || 0,
          rating: apiData.rating || 0,
        };
        
        setCourseData(convertedData);
        // Initialize enrichedCourseData with courseData (before progress is loaded)
        setEnrichedCourseData(convertedData);
        
        // Note: Certificate check will be done after progress is loaded
        
        // Load review stats
        if (apiData.id) {
          try {
            const stats = await reviewApiService.getReviewStats(apiData.id);
            setReviewStats(stats);
          } catch (err) {
            console.error('Error loading review stats:', err);
          }
        }
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Re-merge progress when courseData changes (to fix persistence on reload)
  useEffect(() => {
    if (courseData && progress) {
      const enrichedCourse = mergeProgressWithCourse(courseData, progress);
      setEnrichedCourseData(enrichedCourse);
    }
  }, [courseData, progress]);

  // Auto-select first module when course data is loaded (before progress loads)
  useEffect(() => {
    if (courseData?.curriculum?.sections?.[0]?.items?.[0] && !activeModule) {
      const firstModule: any = {
        ...courseData.curriculum.sections[0].items[0],
        sectionIndex: 0,
        itemIndex: 0,
      };
      // Add sectionId if available
      if ((courseData.curriculum.sections[0] as any).id) {
        firstModule.sectionId = (courseData.curriculum.sections[0] as any).id;
      }
      setActiveModule(firstModule);
      // Expand all sections by default
      const allSectionsExpanded: Record<string, boolean> = {};
      courseData.curriculum.sections.forEach((section: any, index: number) => {
        const sectionId = section.id || index.toString();
        allSectionsExpanded[sectionId] = true;
      });
      setExpandedSections(allSectionsExpanded);
      console.log("Auto-selected first module:", firstModule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseData]); // Only depend on courseData, not activeModule to avoid loops

  // Set active module when course data is loaded (removed - handled in loadProgress)
//     if (enrichedCourseData) {
//   const nextLecture = findNextLecture(enrichedCourseData, progress);
//   if (nextLecture) {
//     console.log("Setting active module:", nextLecture);
//     setActiveModule(nextLecture);
//   }
// }
  
     const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);    
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  // Watch time tracking states
  const [totalWatched, setTotalWatched] = useState(0); // in seconds
  type WatchSession = {
    start: number;
    startedAt: string;
    end?: number;
    endedAt?: string;
    duration?: number;
  };
  const [watchSessions, setWatchSessions] = useState<WatchSession[]>([]); // track all watch sessions
  type WatchedSegment = { start: number; end: number };
  const [watchedSegments, setWatchedSegments] = useState<WatchedSegment[]>([]); // track watched video segments
const playerContainerRef = useRef<HTMLDivElement>(null);  
  // Refs for tracking
  const playerRef = useRef<ReactPlayer>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastPlayTimeRef = useRef<number | null>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoCompletedRef = useRef<boolean>(false);
  const lastReportTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(0); // Separate ref for tracking last update time
  const lastPayoutWatchTimeRef = useRef<number>(0); // Track last recorded watch time for payout
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Use a ref to track if progress is being loaded to prevent infinite loops
  const progressLoadingRef = useRef(false);

  // Course info (for demonstration)
  const instructorId = courseData?.instructorId || "instructor-456";
  const studentId = user?.email || user?.uid || "student-123"; // Replace with actual logged-in user ID

useEffect(() => {
  const loadProgress = async () => {
    if (!courseId || !courseData) {
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (progressLoadingRef.current) {
      return;
    }
    progressLoadingRef.current = true;

    try {
      const courseIdNum = parseInt(courseId);
      if (isNaN(courseIdNum)) {
        console.error('Invalid course ID:', courseId);
        return;
      }

      const totalLectures = courseData.curriculum?.sections.reduce(
        (count, sec) => count + (sec.items?.length || 0),
        0
      ) ?? 0;

      // Get or initialize progress
      let prog = await progressApiService.getProgress(courseIdNum);

      if (!prog) {
        // Initialize progress if it doesn't exist
        // Only initialize if we have course data with curriculum
        if (totalLectures > 0) {
          await progressApiService.initializeProgress(courseIdNum, totalLectures);
          prog = await progressApiService.getProgress(courseIdNum);
        } else {
          console.warn('Cannot initialize progress: totalLectures is 0 or courseData not loaded yet');
          return; // Exit early if we can't initialize
        }
      }
      
      // Progress exists - use it as-is (don't reset)
      // The backend should calculate progress based on lecture progress
      if (prog) {
        console.log('Loaded progress:', prog.progress, '%');
      }

      if (prog) {
        setProgress(prog);
        
        // Merge progress into courseData
        const enrichedCourse = mergeProgressWithCourse(courseData, prog);
        setEnrichedCourseData(enrichedCourse);

        // Check for certificate if course is completed
        if (prog.progress >= 100 && courseIdNum) {
          try {
            const existingCert = await certificateApiService.getCertificateByCourse(courseIdNum);
            if (existingCert && existingCert.id) {
              console.log('Found existing certificate with ID:', existingCert.id);
              setCertificate(existingCert);
            } else {
              console.log('No certificate found for completed course, will generate on demand');
            }
          } catch (err: any) {
            // Certificate doesn't exist yet, which is fine
            if (err.response?.status !== 404) {
              console.error('Error checking for certificate:', err);
            } else {
              console.log('Certificate not found (404), will generate on demand');
            }
          }
        }

        // Show completion message if course is already completed
        if (prog.progress >= 100 && !showCompletionMessage) {
          // Only show if we haven't shown it before in this session
          // Check localStorage to avoid showing repeatedly
          const completionShownKey = `completion_shown_${courseIdNum}`;
          const hasShownCompletion = localStorage.getItem(completionShownKey);
          if (!hasShownCompletion) {
            setShowCompletionMessage(true);
            localStorage.setItem(completionShownKey, 'true');
          }
        }

        // Find and set the current lecture based on progress
        let selectedModule: any = null;

        // Try to find lecture by currentLectureId first (more reliable)
        if (prog && prog.currentLectureId && courseData.curriculum?.sections) {
          const currentLectureId = prog.currentLectureId; // Store in local variable to avoid null check issues
          for (let s = 0; s < courseData.curriculum.sections.length; s++) {
            const section = courseData.curriculum.sections[s];
            const lectureIndex = section.items?.findIndex((item: any) => item.id === currentLectureId);
            if (lectureIndex !== undefined && lectureIndex >= 0) {
              selectedModule = {
                ...section.items[lectureIndex],
                sectionIndex: s,
                itemIndex: lectureIndex,
              };
              setExpandedSections((prev) => ({ ...prev, [s]: true }));
              break;
            }
          }
        }

        // Fallback to sectionIndex/lectureIndex if currentLectureId not found
        if (!selectedModule && prog &&
            prog.sectionIndex !== undefined &&
            prog.lectureIndex !== undefined &&
            courseData.curriculum?.sections?.[prog.sectionIndex]?.items?.[prog.lectureIndex]) {
          const sectionIdx = prog.sectionIndex;
          selectedModule = {
            ...courseData.curriculum.sections[sectionIdx].items[prog.lectureIndex],
            sectionIndex: sectionIdx,
            itemIndex: prog.lectureIndex,
          };
          setExpandedSections((prev) => ({ ...prev, [sectionIdx]: true }));
        }

        // Final fallback to first lecture (only if course is not completed)
        if (!selectedModule && courseData.curriculum?.sections?.[0]?.items?.[0] && prog.progress < 100) {
          selectedModule = {
            ...courseData.curriculum.sections[0].items[0],
            sectionIndex: 0,
            itemIndex: 0,
          };
          setExpandedSections((prev) => ({ ...prev, 0: true }));
        }

        // Only set active module if it's different from current one to prevent loops
        // If course is 100% complete, don't auto-select a module - let user choose
        if (prog.progress < 100 && selectedModule && (!activeModule || activeModule.id !== selectedModule.id)) {
          console.log("Setting active module:", selectedModule);
          setActiveModule(selectedModule);
          
          // Load lecture progress for resume functionality
          if (selectedModule.id && selectedModule.contentType === 'video') {
            const lectureId = typeof selectedModule.id === 'string' 
              ? parseInt(selectedModule.id) 
              : selectedModule.id;
            if (!isNaN(lectureId)) {
              const lectureProg = await progressApiService.getLectureProgress(courseIdNum, lectureId);
              if (lectureProg && lectureProg.lastPosition > 0) {
                setCurrentLectureProgress(lectureProg);
                setCurrentTime(lectureProg.lastPosition);
              }
            }
          }
        } else if (prog.progress >= 100 && selectedModule && (!activeModule || activeModule.id !== selectedModule.id)) {
          // If course is completed, set the last completed lecture as active module
          setActiveModule(selectedModule);
          if (selectedModule && typeof selectedModule.sectionIndex === 'number') {
            setExpandedSections((prev) => ({ ...prev, [selectedModule.sectionIndex]: true }));
          }
        } else if (!selectedModule && prog.progress < 100) {
          // Only set first module if course is not completed
          if (courseData.curriculum?.sections?.[0]?.items?.[0] && !activeModule) {
            const firstModule = {
              ...courseData.curriculum.sections[0].items[0],
              sectionIndex: 0,
              itemIndex: 0,
            };
            setActiveModule(firstModule);
            setExpandedSections((prev) => ({ ...prev, 0: true }));
          }
        } else if (prog.progress >= 100 && !activeModule) {
          // If course is completed and no module selected, set first module as fallback
          if (courseData.curriculum?.sections?.[0]?.items?.[0]) {
            const firstModule = {
              ...courseData.curriculum.sections[0].items[0],
              sectionIndex: 0,
              itemIndex: 0,
            };
            setActiveModule(firstModule);
            setExpandedSections((prev) => ({ ...prev, 0: true }));
          }
        }
      } else {
        // If progress loading failed, still try to set first module
        if (courseData.curriculum?.sections?.[0]?.items?.[0] && !activeModule) {
          const firstModule = {
            ...courseData.curriculum.sections[0].items[0],
            sectionIndex: 0,
            itemIndex: 0,
          };
          setActiveModule(firstModule);
          setExpandedSections((prev) => ({ ...prev, 0: true }));
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      // On error, still try to set first module as fallback
      if (courseData?.curriculum?.sections?.[0]?.items?.[0] && !activeModule) {
        const firstModule = {
          ...courseData.curriculum.sections[0].items[0],
          sectionIndex: 0,
          itemIndex: 0,
        };
        setActiveModule(firstModule);
        setExpandedSections({ 0: true });
      }
    } finally {
      progressLoadingRef.current = false;
    }
  };

  loadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [courseId, courseData]); // Depend on both courseId and courseData to ensure progress loads when courseData is available

  // Save progress on browser close/unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (courseId && activeModule?.id && !isPlaying) {
        try {
          const courseIdNum = parseInt(courseId);
          const lectureId = typeof activeModule.id === 'string' ? parseInt(activeModule.id) : activeModule.id;
          const sectionId = typeof activeModule.sectionId === 'string' ? parseInt(activeModule.sectionId) : activeModule.sectionId;
          const currentPosition = playerRef.current?.getCurrentTime() || currentTime || 0;
          if (!isNaN(courseIdNum) && !isNaN(lectureId) && sectionId) {
            // Use sendBeacon for reliable delivery on page unload
            await progressApiService.updateLectureProgress({
              courseId: courseIdNum,
              sectionId: sectionId,
              lectureId: lectureId,
              currentPosition: currentPosition,
              watchTime: totalWatched,
              isCompleted: false
            });
          }
        } catch (error) {
          console.error('Error saving progress on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [courseId, activeModule, isPlaying, currentTime, totalWatched]);

  const findNextModule = (currentSectionIndex: number, currentItemIndex: number) => {
    if (!enrichedCourseData?.curriculum?.sections) return null;

    const sections = enrichedCourseData.curriculum.sections;
    
    // First, try to find next item in current section
    const currentSection = sections[currentSectionIndex];
    if (currentSection && currentSection.items) {
      for (let i = currentItemIndex + 1; i < currentSection.items.length; i++) {
        const item = currentSection.items[i];
        // Only return video/lecture items for auto-play
        if (item.contentType === 'video' || item.contentType === 'lecture' || item.type === 'lecture') {
          return {
            module: item,
            sectionIndex: currentSectionIndex,
            itemIndex: i
          };
        }
      }
    }

    // If no next item in current section, find first item in next section
    for (let s = currentSectionIndex + 1; s < sections.length; s++) {
      const section = sections[s];
      if (section.items && section.items.length > 0) {
        for (let i = 0; i < section.items.length; i++) {
          const item = section.items[i];
          // Only return video/lecture items for auto-play
          if (item.contentType === 'video' || item.contentType === 'lecture' || item.type === 'lecture') {
            return {
              module: item,
              sectionIndex: s,
              itemIndex: i
            };
          }
        }
      }
    }

    return null; // No next video found
  };

  function mergeProgressWithCourse(courseData: any, progress: StudentProgress | null) {
    if (!progress) return courseData;

    // Convert completedLectures from array of IDs to a Set for quick lookup
    // Normalize all IDs to numbers for consistent comparison
    const completedLectureIds = new Set(
      (progress.completedLectures || []).map((id: any) => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
        return isNaN(numId) ? id : numId; // Keep original if not a valid number
      })
    );
    const completedSectionIds = new Set(
      (progress.completedSections || []).map((id: any) => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
        return isNaN(numId) ? id : numId;
      })
    );

    return {
      ...courseData,
      curriculum: {
        sections: courseData.curriculum.sections.map(
          (section: any, sectionIndex: number) => {
            // Check if section is completed (by section ID or index)
            const isSectionCompleted = section.id 
              ? completedSectionIds.has(section.id)
              : completedSectionIds.has(sectionIndex);

            // Map items and mark them as completed
            const itemsWithProgress = section.items.map((lecture: any, lectureIndex: number) => {
              // Check if lecture is completed (by lecture ID)
              // Try multiple ID fields that might exist
              const lectureId = lecture.id || lecture.lectureId || lecture.quizId || lecture.assignmentId;
              let isLectureCompleted = false;
              
              if (lectureId) {
                // Normalize the lecture ID to number for comparison
                const idAsNumber = typeof lectureId === 'string' ? parseInt(lectureId, 10) : Number(lectureId);
                
                // Check if the normalized ID exists in the completed set
                if (!isNaN(idAsNumber)) {
                  isLectureCompleted = completedLectureIds.has(idAsNumber) || completedLectureIds.has(lectureId);
                } else {
                  // Fallback for non-numeric IDs
                  isLectureCompleted = completedLectureIds.has(lectureId);
                }
              }

              return {
                ...lecture,
                completed: isLectureCompleted,
              };
            });

            // Calculate completion counts
            const totalItems = itemsWithProgress.length;
            const completedItemsCount = itemsWithProgress.filter((item: any) => item.completed).length;
            const sectionCompletionPercentage = totalItems > 0 
              ? Math.round((completedItemsCount / totalItems) * 100) 
              : 0;

            return {
              ...section,
              completed: isSectionCompleted,
              completedItemsCount,
              totalItemsCount: totalItems,
              sectionCompletionPercentage,
              items: itemsWithProgress,
            };
          }
        ),
      },
    };
  }
  
  // Debug logging
  console.log("Course data:", courseData);
  console.log("Instructor ID from course:", instructorId);



  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const selectModule = (sectionIndex:number,itemIndex: number, module: any) => {
    // Reset video completed flag when selecting a new module
    videoCompletedRef.current = false;
    setActiveModule({ ...module,sectionIndex, itemIndex,  });
    // Reset video state when switching modules
    if (module.contentType === 'video' || module.contentType === 'lecture') {
      handleLectureClick(sectionIndex, itemIndex, module);
      setIsPlaying(false);
      setCurrentTime(0);

    }
  };

  const handleLectureClick = async (sectionIndex: number, itemIndex: number, module: any) => {
    setActiveModule({ ...module, sectionIndex, itemIndex });

    if (!courseId) return;

    try {
      const courseIdNum = parseInt(courseId);
      if (isNaN(courseIdNum)) return;

      // Get section and item seqNo (API expects seqNo, not array index)
      const section = enrichedCourseData?.curriculum?.sections?.[sectionIndex];
      const item = section?.items?.[itemIndex];
      const sectionSeqNo = section?.seqNo ?? (sectionIndex + 1); // Default to index + 1 if seqNo not available
      const itemSeqNo = item?.seqNo ?? (itemIndex + 1); // Default to index + 1 if seqNo not available

      // Update overall progress
      await progressApiService.updateProgress({
        courseId: courseIdNum,
        sectionIndex: sectionSeqNo, // Use seqNo instead of array index
        lectureIndex: itemSeqNo, // Use seqNo instead of array index
        isCompleted: false // Just navigating, not completing
      });

      // Reload progress
      const updated = await progressApiService.getProgress(courseIdNum);
      if (updated) {
        setProgress(updated);
      }

      // If it's a video lecture, load its progress for resume
      if (module.id && module.contentType === 'video') {
        const lectureProg = await progressApiService.getLectureProgress(courseIdNum, module.id);
        if (lectureProg) {
          setCurrentLectureProgress(lectureProg);
          if (lectureProg.lastPosition > 0) {
            setCurrentTime(lectureProg.lastPosition);
          }
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Format time to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize watch session tracking
  useEffect(() => {
    // Load any previously saved watch data from localStorage or your backend
    const savedWatchTime = localStorage.getItem(`watchTime-${courseId}-${studentId}`);
    if (savedWatchTime) {
      setTotalWatched(parseFloat(savedWatchTime));
    }
    
    // Set up periodic reporting of watch time
    const reportInterval = setInterval(() => {
      reportWatchTimeToServer();
    }, 60000); // Report every minute
    
    return () => {
      clearInterval(reportInterval);
      // Save watch time when component unmounts
      saveWatchTime();
    };
  }, []);

  // Save watch time to localStorage and potentially to your server
  const saveWatchTime = () => {
    // Save to localStorage as a backup
    localStorage.setItem(`watchTime-${courseId}-${studentId}`, totalWatched.toString());
    
    // Report final time to server
    reportWatchTimeToServer(true);
  };

  // Report watch time to server
  const reportWatchTimeToServer = (isFinal = false) => {
    // Only report if there's new watch time to report
    if (totalWatched > lastReportTimeRef.current) {
      console.log(`Reporting watch time: ${formatTime(totalWatched)} ${isFinal ? '(final report)' : ''}`);
      
      // Here you would make an API call to your backend
      const watchTimeData = {
        courseId,
        instructorId,
        studentId,
        watchTime: totalWatched,
        watchedSegments: watchedSegments,
        completionPercentage: (totalWatched / duration) * 100,
        timestamp: new Date().toISOString(),
        isFinal
      };
      
      // Example API call (replace with your actual implementation)
      // fetch('your-api-endpoint/report-watch-time', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(watchTimeData)
      // });
      
      console.log("Watch data to send:", watchTimeData);
      
      // Update last report time
      lastReportTimeRef.current = totalWatched;
    }
  };

  // Track which segments of the video have been watched
  const addWatchedSegment = (start: number, end: number) => {
    if (end <= start) return; // Prevent invalid segments
    
    const newSegment = { start, end };
    
    setWatchedSegments(prev => {
      // Merge overlapping segments for efficiency
      const merged = [...prev];
      let added = false;
      
      for (let i = 0; i < merged.length; i++) {
        const segment = merged[i];
        
        // Check for overlap
        if (newSegment.start <= segment.end && newSegment.end >= segment.start) {
          // Merge segments
          segment.start = Math.min(segment.start, newSegment.start);
          segment.end = Math.max(segment.end, newSegment.end);
          added = true;
          break;
        }
      }
      
      if (!added) {
        merged.push(newSegment);
      }
      
      return merged;
    });
  };

  // Start tracking watch time with precision
  const startWatchTimeTracking = async () => {
    if (watchIntervalRef.current) return; // Prevent multiple intervals
    
    if (!activeModule?.id || !courseId) return;
    
    const startTime = playerRef.current?.getCurrentTime() || currentTime || 0;
    lastPlayTimeRef.current = startTime;
    lastPayoutWatchTimeRef.current = 0; // Reset payout watch time tracking when starting new session
    
    try {
      const courseIdNum = parseInt(courseId);
      if (!isNaN(courseIdNum) && activeModule.sectionId) {
        // Start watch session via API
        const sessionId = await progressApiService.startWatchSession({
          courseId: courseIdNum,
          sectionId: activeModule.sectionId,
          lectureId: activeModule.id,
          startPosition: startTime
        });
        setCurrentWatchSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error starting watch session:', error);
    }
    
    // Record start of a new watch session locally
    const newSession = {
      start: startTime,
      startedAt: new Date().toISOString()
    };
    
    setWatchSessions(prev => [...prev, newSession]);
    
    // Update every 5 seconds while playing (reduced frequency for API calls)
    watchIntervalRef.current = setInterval(async () => {
      if (!playerRef.current || !activeModule?.id || !courseId) return;
      
      const currentPosition = playerRef.current.getCurrentTime();
      
      // Add to watched segments (for analytics on which parts were watched)
      if (lastPlayTimeRef.current !== null) {
        addWatchedSegment(lastPlayTimeRef.current, currentPosition);
      }
      
      // Update total watched time based on actual position difference
      // Don't increment blindly - use the actual position change
      if (lastPlayTimeRef.current !== null) {
        const timeDiff = currentPosition - lastPlayTimeRef.current;
        if (timeDiff > 0 && timeDiff < 2) { // Only count forward progress, max 2 seconds per update
          setTotalWatched(prev => {
            const newTotal = prev + timeDiff;
            // Cap at video duration
            return duration > 0 ? Math.min(newTotal, duration) : newTotal;
          });
        }
      }
      lastPlayTimeRef.current = currentPosition;
      
      // Update lecture progress every 10 seconds (reduced from 30 for short videos)
      // This ensures watch time is recorded even for videos shorter than 30 seconds
      const now = Date.now();
      const lastUpdate = lastUpdateTimeRef.current;
      if (now - lastUpdate >= 10000) { // Changed from 30000 to 10000 (10 seconds)
        lastUpdateTimeRef.current = now;
        try {
          const courseIdNum = parseInt(courseId);
          const lectureId = typeof activeModule.id === 'string' 
            ? parseInt(activeModule.id) 
            : activeModule.id;
          const sectionId = typeof activeModule.sectionId === 'string'
            ? parseInt(activeModule.sectionId)
            : activeModule.sectionId;
          
          if (!isNaN(courseIdNum) && sectionId && !isNaN(lectureId)) {
            // Calculate incremental watch time since last payout recording
            const incrementalWatchTime = Math.floor(totalWatched - lastPayoutWatchTimeRef.current);
            
            try {
              await progressApiService.updateLectureProgress({
                courseId: courseIdNum,
                sectionId: sectionId,
                lectureId: lectureId,
                currentPosition: currentPosition,
                watchTime: totalWatched,
                isCompleted: false
              });
              
              // Record incremental watch time for instructor payout (only for paid courses)
              // Record any watch time > 0 seconds (removed 30-second threshold to capture all watch time, including short videos)
              const isPaidCourse = courseData?.pricing && courseData.pricing.toLowerCase() !== 'free';
              
              console.log('🔍 Watch Time Recording Check:', {
                incrementalWatchTime,
                coursePricing: courseData?.pricing,
                isFree: courseData?.pricing?.toLowerCase() === 'free',
                isPaidCourse,
                courseId: courseIdNum,
                lectureId: lectureId,
                totalWatched,
                lastPayoutWatchTime: lastPayoutWatchTimeRef.current,
                shouldRecord: incrementalWatchTime > 0 && isPaidCourse
              });
              
              // Record watch time if there's any incremental watch time and course is paid
              if (incrementalWatchTime > 0 && isPaidCourse) {
                try {
                  console.log('✅ Recording watch time for payout:', {
                    courseId: courseIdNum,
                    lectureId: lectureId,
                    watchTimeSeconds: incrementalWatchTime
                  });
                  await instructorPayoutApiService.recordWatchTime(courseIdNum, lectureId, incrementalWatchTime);
                  lastPayoutWatchTimeRef.current = totalWatched; // Update last recorded watch time for payout
                  console.log('✅ Watch time recorded successfully');
                } catch (watchTimeError) {
                  // Don't fail the progress update if watch time recording fails
                  console.error('❌ Error recording watch time for payout:', watchTimeError);
                }
              } else {
                console.log('⏭️ Skipping watch time recording:', {
                  reason: incrementalWatchTime <= 0 ? 'No incremental watch time' : 
                          !courseData?.pricing ? 'No pricing data' : 
                          courseData.pricing.toLowerCase() === 'free' ? 'Course is free' : 'Unknown reason'
                });
              }
              
              // After updating lecture progress, refresh overall progress to ensure it's up to date
              // This ensures progress percentage is recalculated based on watch time
              const updatedProgress = await progressApiService.getProgress(courseIdNum);
              if (updatedProgress) {
                setProgress(updatedProgress);
                // Merge progress into courseData to update UI
                const baseData = courseData || enrichedCourseData;
                if (baseData) {
                  const enrichedCourse = mergeProgressWithCourse(baseData, updatedProgress);
                  setEnrichedCourseData(enrichedCourse);
                }
              }
            } catch (error) {
              console.error('Error updating lecture progress:', error);
            }
          }
        } catch (error) {
          console.error('Error in watch time tracking interval:', error);
        }
      }
    }, 1000); // Check every second, but only update API every 30 seconds (optimized)
  };

  // Stop tracking watch time
  const stopWatchTimeTracking = async () => {
    if (!watchIntervalRef.current) return;
    
    clearInterval(watchIntervalRef.current);
    watchIntervalRef.current = null;
    
    // Complete the current watch session
    if (lastPlayTimeRef.current !== null && currentWatchSessionId) {
      const currentPosition = playerRef.current?.getCurrentTime() || lastPlayTimeRef.current;
      const watchTime = Math.floor(currentPosition - (watchSessions[watchSessions.length - 1]?.start || 0));
      
      try {
        // End watch session via API
        await progressApiService.endWatchSession({
          sessionId: currentWatchSessionId,
          endPosition: currentPosition,
          watchTime: watchTime
        });
        setCurrentWatchSessionId(null);
      } catch (error) {
        console.error('Error ending watch session:', error);
      }
      
      setWatchSessions(prev => {
        const sessions = [...prev];
        const lastSession = sessions[sessions.length - 1];
        if (lastSession && !lastSession.end) {
          lastSession.end = currentPosition;
          lastSession.endedAt = new Date().toISOString();
          lastSession.duration = currentPosition - lastSession.start;
        }
        return sessions;
      });
    }
  };



  // Handle play/pause
  const handlePlay = () => {
    setIsPlaying(true);
    startWatchTimeTracking();
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopWatchTimeTracking();
    // Persist current position on pause for resume
    try {
      if (courseId && activeModule?.id) {
        const courseIdNum = parseInt(courseId);
        const lectureId = typeof activeModule.id === 'string' ? parseInt(activeModule.id) : activeModule.id;
        const sectionId = typeof activeModule.sectionId === 'string' ? parseInt(activeModule.sectionId) : activeModule.sectionId;
        const currentPosition = playerRef.current?.getCurrentTime() || currentTime || 0;
        if (!isNaN(courseIdNum) && !isNaN(lectureId) && sectionId) {
          progressApiService.updateLectureProgress({
            courseId: courseIdNum,
            sectionId: sectionId,
            lectureId: lectureId,
            currentPosition: currentPosition,
            watchTime: 0,
            isCompleted: false
          });
        }
      }
    } catch {}
  };

  const handleEnded = async () => {
    console.log('🎬 Video ended - handleEnded called', {
      totalWatched,
      courseData: courseData?.pricing,
      activeModule: activeModule?.id,
      courseId
    });
    
    // Prevent multiple calls
    if (videoCompletedRef.current) {
      console.log('⏭️ Video already marked as completed, skipping');
      return;
    }
    videoCompletedRef.current = true;
    
    setIsPlaying(false);
    await stopWatchTimeTracking();
    
    // Mark lecture as completed
    if (activeModule?.id && courseId && activeModule.sectionId) {
      try {
        const courseIdNum = parseInt(courseId);
        const lectureId = typeof activeModule.id === 'string' 
          ? parseInt(activeModule.id) 
          : activeModule.id;
        const sectionId = typeof activeModule.sectionId === 'string'
          ? parseInt(activeModule.sectionId)
          : activeModule.sectionId;
        
        if (!isNaN(courseIdNum) && sectionId && !isNaN(lectureId)) {
          // Update lecture progress as completed
          await progressApiService.updateLectureProgress({
            courseId: courseIdNum,
            sectionId: sectionId,
            lectureId: lectureId,
            currentPosition: duration || 0,
            watchTime: totalWatched,
            isCompleted: true
          });

          // Record final incremental watch time for instructor payout (only for paid courses)
          // Always record any remaining watch time when video ends, even if less than 30 seconds
          // Use the actual video duration or totalWatched, whichever is higher
          const finalWatchTime = Math.max(totalWatched, duration || 0);
          const finalIncrementalWatchTime = Math.floor(finalWatchTime - lastPayoutWatchTimeRef.current);
          
          // Get course pricing from courseData or enrichedCourseData
          const currentCourseData = courseData || enrichedCourseData;
          const coursePricing = currentCourseData?.pricing;
          const isPaidCourse = coursePricing && coursePricing.toLowerCase() !== 'free';
          
          console.log('🔍 Final Watch Time Recording Check (on video end):', {
            finalIncrementalWatchTime,
            totalWatched,
            duration,
            finalWatchTime,
            coursePricing: coursePricing,
            isFree: coursePricing?.toLowerCase() === 'free',
            isPaidCourse,
            courseId: courseIdNum,
            lectureId: lectureId,
            lastPayoutWatchTime: lastPayoutWatchTimeRef.current,
            shouldRecord: finalIncrementalWatchTime > 0 && isPaidCourse,
            courseDataExists: !!courseData,
            enrichedCourseDataExists: !!enrichedCourseData
          });
          
          // Record any remaining watch time when video ends (no minimum threshold)
          // For very short videos, record the full duration if no incremental time was recorded
          const watchTimeToRecord = finalIncrementalWatchTime > 0 ? finalIncrementalWatchTime : Math.floor(finalWatchTime);
          
          if (watchTimeToRecord > 0 && isPaidCourse) {
            try {
              console.log('✅ Recording final watch time for payout:', {
                courseId: courseIdNum,
                lectureId: lectureId,
                watchTimeSeconds: watchTimeToRecord,
                source: finalIncrementalWatchTime > 0 ? 'incremental' : 'full duration'
              });
              await instructorPayoutApiService.recordWatchTime(courseIdNum, lectureId, watchTimeToRecord);
              lastPayoutWatchTimeRef.current = finalWatchTime; // Update last recorded watch time
              console.log('✅ Final watch time recorded successfully');
            } catch (watchTimeError) {
              console.error('❌ Error recording final watch time for payout:', watchTimeError);
            }
          } else {
            console.log('⏭️ Skipping final watch time recording:', {
              reason: watchTimeToRecord <= 0 ? 'No watch time to record' : 
                      !coursePricing ? 'No pricing data' : 
                      coursePricing.toLowerCase() === 'free' ? 'Course is free' : 'Unknown reason',
              watchTimeToRecord,
              isPaidCourse
            });
          }

          // Get section and item seqNo for progress update
          const section = enrichedCourseData?.curriculum?.sections?.[activeModule.sectionIndex || 0];
          const item = section?.items?.[activeModule.itemIndex || 0];
          const sectionSeqNo = section?.seqNo ?? ((activeModule.sectionIndex || 0) + 1);
          const itemSeqNo = item?.seqNo ?? ((activeModule.itemIndex || 0) + 1);

          // Update overall progress
          await progressApiService.updateProgress({
            courseId: courseIdNum,
            sectionIndex: sectionSeqNo, // Use seqNo instead of array index
            lectureIndex: itemSeqNo, // Use seqNo instead of array index
            isCompleted: true
          });

          // Reload progress and update UI
          const updated = await progressApiService.getProgress(courseIdNum);
          if (updated) {
            setProgress(updated);
            const baseData = courseData || enrichedCourseData;
            const enriched = mergeProgressWithCourse(baseData, updated);
            setEnrichedCourseData(enriched);
            
            // Check if course is 100% completed
            if (updated.progress >= 100) {
              setShowCompletionMessage(true);
              // Generate certificate if not already exists
              try {
                const courseIdNum = parseInt(courseId);
                if (!isNaN(courseIdNum)) {
                  const existingCert = await certificateApiService.getCertificateByCourse(courseIdNum);
                  if (!existingCert || !existingCert.id) {
                    // Generate new certificate
                    const newCert = await certificateApiService.generateCertificate({ courseId: courseIdNum });
                    if (newCert && newCert.id) {
                      console.log('Generated new certificate with ID:', newCert.id);
                      setCertificate(newCert);
                    } else {
                      console.error('Failed to generate certificate: missing ID');
                    }
                  } else {
                    console.log('Using existing certificate with ID:', existingCert.id);
                    setCertificate(existingCert);
                  }
                }
              } catch (error) {
                console.error('Error generating certificate:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error marking lecture as completed:', error);
      }
    }
    
    console.log("Video completed");
  };

  const handleSeek = (seconds:number) => {
    if (isPlaying) {
      // If seeking while playing, stop current tracking and start a new session
      stopWatchTimeTracking();
      
      // Small delay to ensure the player has actually moved to the new position
      setTimeout(() => {
        if (isPlaying) {
          startWatchTimeTracking();
        }
      }, 100);
    }
    
    // Update current time for UI
    setCurrentTime(seconds);
  };

  // Handle seeking on progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTo = clickPosition * duration;
    
    playerRef.current?.seekTo(seekTo, 'seconds');
    handleSeek(seekTo);
  };

  const handleFullscreen = () => {
  const elem = playerContainerRef.current;
  if (!elem) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    elem.requestFullscreen();
  }
};

    const seekForward = () => {
        playerRef!.current!.seekTo(playerRef!.current!.getCurrentTime() + 10);
    };

    const seekBackward = () => {
        playerRef!.current!.seekTo(playerRef!.current!.getCurrentTime() - 10);
    };

         const increaseSpeed = () => {
    setPlaybackRate(prev => Math.min(prev + 0.25, 2)); // max speed 2x
  };

  const decreaseSpeed = () => {
    setPlaybackRate(prev => Math.max(prev - 0.25, 0.25)); // min speed 0.25x
  };

  // Generate watch time analytics

    
    // return {
    //   totalWatchTime: totalWatched,
    //   uniqueSecondsWatched,
    //   completionPercentage: duration > 0 ? (uniqueSecondsWatched / duration) * 100 : 0,
    //   watchSessions: watchSessions.length,
    //   averageSessionLength: watchSessions.length > 0 
    //     ? watchSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / watchSessions.length 
    //     : 0,
    //   watchedSegments: mergedSegments
    // };
  // Format analytics times to MM:SS
  const formatSegment = (segment: WatchedSegment) => ({
    play: formatTime(segment.start),
    pause: formatTime(segment.end),
    duration: formatTime(segment.end - segment.start),
  });

    const renderVideoPlayer = (module:any) => {
      const videoUrl = convertYouTubeUrl(module.contentUrl || module.contentFiles?.[0]?.url || "");
      console.log('Video Player Debug:', {
        module: module,
        contentUrl: module.contentUrl,
        contentFiles: module.contentFiles,
        finalUrl: videoUrl,
        isYouTube: videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
      });
      
      return (
    <div className="relative overflow-hidden mb-6 border-b rounded-lg pb-4"
              onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}>
              <div   ref={playerContainerRef}
  className={`relative h-[450px]`}>
                  <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            playbackRate={playbackRate}
            controls={false}
            width="100%"
            height={document.fullscreenEnabled ? "100%" : "450px"} // Fullscreen height if enabled
            volume={isMuted ? 0 : volume}
            onProgress={({ playedSeconds }) => {
              setCurrentTime(playedSeconds);
              // Update watch time based on actual video position, not just incrementing
              if (isPlaying && lastPlayTimeRef.current !== null) {
                const timeDiff = playedSeconds - lastPlayTimeRef.current;
                if (timeDiff > 0 && timeDiff < 2) { // Only count forward progress, max 2 seconds per update
                  setTotalWatched(prev => Math.min(prev + timeDiff, duration || Infinity));
                }
              }
              lastPlayTimeRef.current = playedSeconds;
            }}
            onDuration={(dur) => {
              setDuration(dur);
              // Reset total watched when duration changes (new video)
              setTotalWatched(0);
              // Reset video completed flag when duration changes (new video)
              videoCompletedRef.current = false;
            }}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={(seconds) => handleSeek(seconds)}
            onEnded={handleEnded}
            onError={(error) => {
              console.error('ReactPlayer Error:', error);
              console.error('Video URL that failed:', videoUrl);
            }}
            light={!isPlaying && currentTime === 0 ? (courseData?.thumbnailUrl || "Images/Banners/Person.jpg") : false}
            playIcon={
              !isPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                  <div
                    className="bg-white bg-opacity-80 rounded-full p-3 cursor-pointer pointer-events-auto"
                    onClick={handlePlay}
                  >
                    <Play size={32} className="text-primary" />
                  </div>
                </div>
              ) : undefined
            }
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0
                }
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  onContextMenu: (e: any) => e.preventDefault()
                }
              }
            }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
        {/* Video Controls Overlay */}
       {isHovered && ( <div className="absolute bottom-0 left-0 right-0 rounded-lg bg-black bg-opacity-60 p-4 text-white">
          {/* Progress Bar */}
          <div 
                ref={progressBarRef}
                className="w-full h-2 bg-white rounded-full mb-2 cursor-pointer"
                onClick={handleProgressBarClick}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                
                {/* Watched segments indicator */}
                <div className="relative h-full w-full -mt-2">
                  {watchedSegments.map((segment, idx) => (
                    <div 
                      key={idx}
                      className="absolute h-full bg-primary rounded-full"
                      style={{ 
                        left: `${(segment.start / duration) * 100}%`,
                        width: `${((segment.end - segment.start) / duration) * 100}%`
                      }}
                    />
                  ))}
                </div>
              </div>
          {/* <div 
            ref={progressBarRef}
            className="w-full h-2 bg-gray-700 rounded-full mb-2 cursor-pointer"
            onClick={handleProgressBarClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div> */}

          <div className="flex justify-between items-center">
            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
    onClick={seekBackward}
    className="focus:outline-none ml-2"
    title="Backword 10s"
  >
    {/* Fast Forward Icon */}
    <SkipBack size={24} />
  </button>
  {/* <button
    onClick={decreaseSpeed}
    className="focus:outline-none ml-2"
    title="Fast Forward 10s"
  >
    <Rewind size={24} />
  </button> */}
              <button 
                onClick={isPlaying ? handlePause : handlePlay}
                className="focus:outline-none"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              {/* <button
    onClick={increaseSpeed}
    className="focus:outline-none ml-2"
    title="Forward 10s"
  >
    <FastForwardIcon size={24} />
  </button> */}
              <button
    onClick={seekForward}
    className="focus:outline-none ml-2"
    title="Forward 10s"
  >
    {/* Fast Forward Icon */}
    <SkipForward size={24} />
  </button>
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <select value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} className="bg-gray-700 text-white rounded px-2 py-1">
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1" selected>1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
              {/* <span>{playbackRate}x</span> */}
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  setVolume(isMuted ? 1 : 0);
                }}
                className="focus:outline-none"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <button
                onClick={() => {
                  const newVolume = Math.max(0, volume - 0.1);
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                }}
                className="focus:outline-none text-white"
                title="Decrease Volume"
              >
                −
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                }}
                className="w-24"
              />
              <button
                onClick={() => {
                  const newVolume = Math.min(1, volume + 0.1);
                  setVolume(newVolume);
                  setIsMuted(false);
                }}
                className="focus:outline-none text-white"
                title="Increase Volume"
              >
                +
              </button>
              <button
                onClick={handleFullscreen}
                className="focus:outline-none ml-2"
                title="Fullscreen"
              >
                <Fullscreen size={24} />
              </button>
            </div>
          </div>
        </div>)}
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center">
                  <span className="mr-1">●</span> {formatTime(playerRef.current?.getCurrentTime()??0)}
                </div>
                {(isPlaying && isHovered) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div
                      className="bg-white bg-opacity-80 rounded-full p-3 cursor-pointer pointer-events-auto"
                      onClick={handlePause}
                    >
                      <Pause size={32} className="text-primary" />
                    </div>
                  </div>
                )}
              </div>
              {/* Watch Time Stats (for demonstration) */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-semibold mb-2">Watch Time Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">Total Watch Time</p>
              <p className="font-bold text-lg">{formatTime(Math.min(totalWatched, duration || 0))}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">Completion</p>
              <p className="font-bold text-lg">
                {duration > 0 ? Math.round((Math.min(currentTime, duration) / duration) * 100) : 0}%
              </p>
            </div>
          </div>
          {/* Next Video Button - Show when video ends */}
          {!isPlaying && currentTime > 0 && duration > 0 && Math.abs(currentTime - duration) < 1 && (() => {
            const nextModule = findNextModule(activeModule?.sectionIndex || 0, activeModule?.itemIndex || 0);
            return nextModule ? (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    selectModule(nextModule.sectionIndex, nextModule.itemIndex, {
                      ...nextModule.module,
                      sectionId: enrichedCourseData?.curriculum?.sections?.[nextModule.sectionIndex]?.id
                    });
                    setCurrentTime(0);
                    setTotalWatched(0);
                    setIsPlaying(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                >
                  <span>Next: {nextModule.module.title || nextModule.module.lectureName || 'Next Video'}</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : null;
          })()}
          {module?.resources?.length > 0 && (
  <div className="bg-white border rounded-lg p-4 mt-4">
    <h3 className="text-lg font-semibold mb-3">Resources</h3>

    <ul className="space-y-2">
      {module.resources.map((res:any, index:number) => (
        <li key={res.id || index} className="flex items-center justify-between border p-2 rounded">
          
          <span className="text-sm font-medium text-gray-700">
            {res.name}
          </span>

          <button
            onClick={async () => {
              try {
                // For Cloudinary URLs, we need to download them properly
                const response = await fetch(res.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = res.name || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Error downloading resource:', error);
                // Fallback to opening in new tab if download fails
                window.open(res.url, "_blank");
              }
            }}
            className="px-3 py-1 border rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Download
          </button>
        </li>
      ))}
    </ul>
  </div>
)}
          {/* <div className="mt-4">
            <button 
              onClick={downloadAnalytics}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Download Watch Analytics
            </button>
          </div> */}
        </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between">
                <h1 className="text-[#181818] text-2xl font-medium font-['Kumbh_Sans'] leading-[30px]">
                  {module.lectureName || courseData?.title || "Loading..."}
                </h1>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <img src="/Images/icons/Container (6).png" key={i} className="h-4" />
                    ))}
                  </div>
                  <span className="ml-2 text-primary text-[15px] font-medium font-['Poppins'] leading-relaxed">
                    ({reviewStats?.totalReviews || 0} {reviewStats?.totalReviews === 1 ? 'Review' : 'Reviews'})
                  </span>
                </div>
                </div>
                
                <div className="flex items-center mt-4 space-x-6">
                  <div className="flex gap-3 cursor-pointer items-center text-primary text-[15px] font-medium font-['Poppins'] leading-relaxed" 
                  onClick={() => setActiveTab('Instructor')}>
                    <img src="Images/icons/orange-user-laptop.png" className="h-[20px]" />
                    <span>By {courseData?.instructorName || "Instructor"}</span>
                  </div>
                  <Divider className="h-4 bg-[#DBDBDB]" />
                  <div className="flex gap-3 cursor-pointer items-center text-primary text-[15px] font-medium font-['Poppins'] leading-relaxed">
                  <img src="Images/icons/orange-world.png" className="h-[20px]" />
                    <span>{getLevelLabel(courseData?.level) || "Course"}</span>
                  </div>
                  <div className="ml-auto hidden md:flex items-center gap-2">
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-orange-500 rounded-full"
                        style={{ width: `${progress?.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {Math.round(progress?.progress ?? 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
      );
    };

  const renderQuiz = (module: any) => {
    console.log('renderQuiz called with module:', module);
    
    // Extract quiz data from the module using helper function
    const quizData = extractQuizData(module);
    
    console.log('Extracted quiz data:', quizData);
    
    if (!quizData) {
      console.log('No quiz data extracted, showing error');
      return (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Invalid quiz data</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <HelpCircle className="text-blue-500 mr-3" size={32} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{quizData.quizTitle}</h2>
            <p className="text-gray-600 text-sm">{quizData.quizDescription}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-600">Questions</p>
            <p className="font-bold text-lg">{quizData.questions.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-green-600">Time Limit</p>
            <p className="font-bold text-lg">{quizData.duration} minutes</p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-sm text-purple-600">Passing Score</p>
            <p className="font-bold text-lg">80%</p>
          </div>
        </div>

        <button 
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors" 
          onClick={() => {
            console.log('Start Quiz button clicked, quiz data:', quizData);
            const encodedData = encodeURIComponent(JSON.stringify(quizData));
            console.log('Encoded data:', encodedData);
            
            // Get courseId from URL or state
            const courseIdFromUrl = getCourseIdFromURL();
            const courseIdNum = courseIdFromUrl ? parseInt(courseIdFromUrl, 10) : null;
            
            // Get sectionId and item ID from module
            const sectionId = module.sectionId || (enrichedCourseData?.curriculum?.sections?.find((s: any) => 
              s.items?.some((item: any) => item.id === module.id || item.quizId === module.id || item.assignmentId === module.id)
            )?.id);
            
            // Determine if it's a quiz or assignment and get the appropriate ID
            const isAssignment = quizData.isAssignment || module.type === 'assignment' || module.contentType === 'assignment';
            const quizId = !isAssignment ? (module.id || module.quizId) : null;
            const assignmentId = isAssignment ? (module.id || module.assignmentId) : null;
            const lectureId = module.lectureId;
            
            let url = `#/learner/quiz?data=${encodedData}`;
            if (courseIdNum) url += `&courseId=${courseIdNum}`;
            if (sectionId) url += `&sectionId=${sectionId}`;
            if (quizId) url += `&quizId=${quizId}`;
            if (assignmentId) url += `&assignmentId=${assignmentId}`;
            if (lectureId) url += `&lectureId=${lectureId}`;
            
            console.log('Navigating to:', url, { isAssignment, quizId, assignmentId });
            // Navigate to quiz page with quiz data
            window.location.hash = url;
          }}
        >
          {module.published ? `Retake ${quizData.isAssignment ? 'Assignment' : 'Quiz'}` : `Start ${quizData.isAssignment ? 'Assignment' : 'Quiz'}`}
        </button>
      </div>
    );
  };

  const renderDocument = (module:any) => (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <FileText className="text-green-500 mr-3" size={32} />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{module.title}</h2>
          <p className="text-gray-600 text-sm">{module.description}</p>
        </div>
      </div>
      {module.contentFiles?.map((file: any, index: number) => (
      <div key={index} className="mb-6">
        <h3 className="text-lg font-medium mb-2">{file.name}</h3>

        {renderPreview(file)}

        <button
          className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
          onClick={() => window.open(file.url, "_blank")}
        >
          Download
        </button>
      </div>
    ))}

      <div className="mt-4 flex justify-end">
        <button
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded"
          onClick={async () => {
            try {
              if (!courseId || activeModule == null) return;
              const courseIdNum = parseInt(courseId);
              if (isNaN(courseIdNum)) return;

              // Use seqNo (1-based) when available, otherwise fall back to index + 1
              const section = enrichedCourseData?.curriculum?.sections?.[activeModule.sectionIndex || 0];
              const item = section?.items?.[activeModule.itemIndex || 0];
              const sectionSeqNo = section?.seqNo ?? ((activeModule.sectionIndex || 0) + 1);
              const itemSeqNo = item?.seqNo ?? ((activeModule.itemIndex || 0) + 1);

              await progressApiService.updateProgress({
                courseId: courseIdNum,
                sectionIndex: sectionSeqNo,
                lectureIndex: itemSeqNo,
                isCompleted: true,
              });

              // Refresh progress/UI
              const updated = await progressApiService.getProgress(courseIdNum);
              if (updated) {
                setProgress(updated);
                // Use courseData as base to ensure we have all curriculum items
                const baseData = courseData || enrichedCourseData;
                const enriched = mergeProgressWithCourse(baseData, updated);
                setEnrichedCourseData(enriched);
              }
            } catch (e) {
              console.error('Error marking document as complete:', e);
            }
          }}
        >
          Mark as Completed
        </button>
      </div>
    </div>
  );

    const renderWrittenContent = (module:any) => (
    <div className="bg-white border rounded-lg p-6 mb-6">
        <p dangerouslySetInnerHTML={{__html: module.contentText||""}}>
        </p>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded"
            onClick={async () => {
              try {
                if (!courseId || activeModule == null) return;
                const courseIdNum = parseInt(courseId);
                if (isNaN(courseIdNum)) return;

                const section = enrichedCourseData?.curriculum?.sections?.[activeModule.sectionIndex || 0];
                const item = section?.items?.[activeModule.itemIndex || 0];
                const sectionSeqNo = section?.seqNo ?? ((activeModule.sectionIndex || 0) + 1);
                const itemSeqNo = item?.seqNo ?? ((activeModule.itemIndex || 0) + 1);

                await progressApiService.updateProgress({
                  courseId: courseIdNum,
                  sectionIndex: sectionSeqNo,
                  lectureIndex: itemSeqNo,
                  isCompleted: true,
                });

                const updated = await progressApiService.getProgress(courseIdNum);
                if (updated) {
                  setProgress(updated);
                  // Use courseData as base to ensure we have all curriculum items
                  const baseData = courseData || enrichedCourseData;
                  const enriched = mergeProgressWithCourse(baseData, updated);
                  setEnrichedCourseData(enriched);
                }
              } catch (e) {
                console.error('Error marking article as complete:', e);
              }
            }}
          >
            Mark as Completed
          </button>
        </div>
    </div>
  );

  const renderModuleContent = () => {
    if (!activeModule) {
      return (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Select a module to view content</p>
          </div>
        </div>
      );
    }




    console.log('Rendering module content for:', activeModule);

    // Check if this module has questions (for assignments with questions)
    const hasQuestions = (activeModule as any).questions && (activeModule as any).questions.length > 0;
    const isQuiz = activeModule.contentType === 'quiz' || (activeModule as any).type === 'quiz';
    const isAssignment = activeModule.contentType === 'assignment' || (activeModule as any).type === 'assignment';
        const isWrittenDoc = (activeModule.contentType === 'article' || (activeModule as any).type === 'lecture') && activeModule.articleSource=="write";
    
    console.log('Module analysis:', { hasQuestions, isQuiz, isAssignment, contentType: activeModule.contentType, type: (activeModule as any).type });

    switch (activeModule.contentType) {
      case 'video':
      case 'lecture':
        return renderVideoPlayer(activeModule);
      case 'quiz':
        return renderQuiz(activeModule);
      case 'article':
        if(isWrittenDoc){
          return renderWrittenContent(activeModule);
        }
        else{
          return renderDocument(activeModule);
        }
      case 'assignment':
        // If assignment has questions, render as quiz, otherwise as document
        if (hasQuestions) {
          return renderQuiz(activeModule);
        } else {
          return renderDocument(activeModule);
        }
      default:
        // Check if it's an unsupported type but has questions
        if (hasQuestions) {
          return renderQuiz(activeModule);
        }
        return (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Unsupported module type: {activeModule.contentType}</p>
            </div>
          </div>
        );
    }
  };


      const getFileType = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext;
};

const renderPreview = (file: any) => {
  const ext = getFileType(file.name);

  if (!file.url) return null;

  switch (ext) {
    case "pdf":
      return (
        <iframe
          src={file.url}
          className="w-full h-[600px] border rounded"
          title="PDF Preview"
        />
      );

    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-auto rounded border"
        />
      );

    case "txt":
      return (
        <iframe
          src={file.url}
          className="w-full h-[500px] border rounded"
        />
      );

    case "doc":
    case "docx":
    case "xls":
    case "xlsx":
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${file.url}`}
          className="w-full h-[600px] border rounded"
        />
      );

    default:
      return (
        <p className="text-gray-600">Preview not available for this file type.</p>
      );
  }
};

  const getModuleIcon = (type: any, completed: any, module: any = null) => {
    const iconProps = { size: 12, className: `${completed ? 'text-white' : 'text-orange-500'} ml-0.5` };
    
    // Check if this module has questions (for assignments with questions)
    const hasQuestions = module && module.questions && module.questions.length > 0;
    const moduleType = module?.type || type;
    
    switch (moduleType) {
      case 'video':
      case 'lecture':
        return <Play {...iconProps} />;
      case 'quiz':
        return <HelpCircle {...iconProps} />;
      case 'document':
        return <FileText {...iconProps} />;
      case 'assignment':
        // If assignment has questions, show quiz icon, otherwise document icon
        return hasQuestions ? <HelpCircle {...iconProps} /> : <FileText {...iconProps} />;
      default:
        // If it's an unsupported type but has questions, show quiz icon
        return hasQuestions ? <HelpCircle {...iconProps} /> : <Play {...iconProps} />;
    }
  };

    const renderCourseContent = () => {
      // Fallback to courseData if enrichedCourseData doesn't have curriculum
      const curriculumData = enrichedCourseData?.curriculum || courseData?.curriculum;
      
      if (!curriculumData?.sections || curriculumData.sections.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No course content available</p>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {curriculumData.sections.map((section: any, sectionIndex: number) => {
            const sectionId = section.id || sectionIndex.toString();
            const isExpanded = expandedSections[sectionId] !== undefined ? expandedSections[sectionId] : true; // Default to expanded
            
            // Calculate section progress (use pre-calculated values if available, otherwise calculate)
            const totalItems = section.totalItemsCount ?? (section.items?.length || 0);
            const completedItems = section.completedItemsCount ?? (section.items?.filter((item: any) => item.completed).length || 0);
            const sectionProgress = section.sectionCompletionPercentage ?? (totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);
            
            // Calculate total duration for section
            const sectionDuration = section.items?.reduce((total: number, item: any) => {
              const duration = item.contentFiles?.[0]?.duration || 0;
              return total + (typeof duration === 'number' ? duration : 0);
            }, 0) || 0;
            const sectionMinutes = Math.floor(sectionDuration / 60);
            
            return (
              <div key={sectionId} className="border-b border-gray-200 last:border-b-0">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(sectionId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{section.name}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {completedItems} / {totalItems}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {sectionMinutes > 0 && (
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {sectionMinutes}min
                        </span>
                      )}
                      {sectionProgress > 0 && (
                        <span className="text-green-600 font-medium">{sectionProgress}% complete</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 ml-3 text-lg font-light">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="bg-gray-50">
                    {section.items?.map((module: any, itemIndex: number) => {
                      const isActive = activeModule?.sectionIndex === sectionIndex && activeModule?.itemIndex === itemIndex;
                      const moduleType = (module as any).type || module.contentType;
                      const hasQuestions = (module as any).questions && (module as any).questions.length > 0;
                      
                      // Get duration
                      const duration = module.contentFiles?.[0]?.duration || 0;
                      const durationMinutes = typeof duration === 'number' 
                        ? Math.floor(duration / 60)
                        : 0;
                      const durationSeconds = typeof duration === 'number' 
                        ? Math.floor(duration % 60)
                        : 0;
                      const durationText = durationMinutes > 0 
                        ? `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                        : durationSeconds > 0 ? `0:${durationSeconds.toString().padStart(2, '0')}` : '';
                      
                      return (
                        <div
                          key={module.id || itemIndex}
                          onClick={() => selectModule(sectionIndex, itemIndex, module)}
                          className={`relative pl-12 pr-4 py-3 cursor-pointer transition-colors border-l-2 ${
                            isActive 
                              ? 'bg-orange-50 border-orange-500' 
                              : 'border-transparent hover:bg-gray-100'
                          } ${module.completed ? 'bg-green-50' : ''}`}
                        >
                          {/* Module icon and completion indicator */}
                          <div className="absolute left-4 top-4 flex items-center">
                            {module.completed ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                {getModuleIcon(module.contentType, module.published, module)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm mb-1 ${
                                isActive ? 'text-orange-600' : 'text-gray-800'
                              }`}>
                                {(module as any).lectureName || (module as any).quizTitle || (module as any).title || 'Untitled Module'}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="capitalize">
                                  {moduleType === 'assignment' && hasQuestions 
                                    ? 'Assignment' 
                                    : moduleType === 'quiz' 
                                    ? 'Quiz' 
                                    : moduleType === 'lecture' || moduleType === 'video'
                                    ? 'Lecture'
                                    : moduleType}
                                </span>
                                {durationText && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <Clock size={10} className="mr-1" />
                                      {durationText}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {!module.published && (
                              <LockIcon size={14} className="text-gray-400 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    const renderTabContent = () => {
    switch (activeTab) {
      case 'Course Content':
        return renderCourseContent();
      case 'Overview':
        return (
          <Overview courseData={courseData} loading={loading} />
        );
      case 'Notes':
        return (
          <Notes courseId={courseId??""} loading={loading} />
        );
      case 'Instructor':
        return (
          <Instructor instructorId={courseData?.instructorId} loading={loading} />
        );
      case 'Reviews':
        return (
          <CourseReviews courseId={courseId ?? undefined} loading={loading} />
        );
      case 'Learning Tools':
        return (
          <LearningTools courseId={courseId ?? ""} instructorId={courseData?.instructorId?.toString()}/>
        );
      case 'Announcements':
        return (
          <Announcements courseId={courseId ?? ""} loading={loading}/>
        );
      case 'QNA':
        return (
          <QNA courseId={courseId ?? undefined} />
        );
      default:
        return <div>Select a tab</div>;
    }
  };

    const generateWatchTimeAnalytics = () => {
    // Calculate unique seconds watched (accounting for rewatching segments)
    let uniqueSecondsWatched = 0;
    const sortedSegments = [...watchedSegments].sort((a, b) => a.start - b.start);
    
    // Merge overlapping segments
    const mergedSegments = [];
    let currentSegment = null;
    
    for (const segment of sortedSegments) {
      if (!currentSegment) {
        currentSegment = {...segment};
        continue;
      }
      
      if (segment.start <= currentSegment.end) {
        // Segments overlap, merge them
        currentSegment.end = Math.max(currentSegment.end, segment.end);
      } else {
        // No overlap, add current segment and start a new one
        mergedSegments.push(currentSegment);
        uniqueSecondsWatched += currentSegment.end - currentSegment.start;
        currentSegment = {...segment};
      }
    }
    
    // Add the last segment
    if (currentSegment) {
      mergedSegments.push(currentSegment);
      uniqueSecondsWatched += currentSegment.end - currentSegment.start;
    }

  return {
    totalWatchTime: formatTime(totalWatched),
    uniqueSecondsWatched: formatTime(uniqueSecondsWatched),
    completionPercentage: duration > 0 ? (uniqueSecondsWatched / duration) * 100 : 0,
    watchSessions: watchSessions.length,
    averageSessionLength: formatTime(
    watchSessions.length > 0
      ? watchSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / watchSessions.length
      : 0
    ),
    watchedSegments: mergedSegments.map(formatSegment),
  };
}

  // Example of downloading analytics (for testing)
  const downloadAnalytics = () => {
    const analytics = generateWatchTimeAnalytics();
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `watch-analytics-${courseId}-${studentId}.json`);
    linkElement.click();
  };



  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
      {/* Course Completion Message Modal */}
      {showCompletionMessage && progress && progress.progress >= 100 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-4 text-center max-h-[90vh] overflow-y-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Congratulations!</h2>
            {courseData?.congratulationsMessage ? (
              <div 
                className="text-lg text-gray-700 mb-6 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: courseData.congratulationsMessage }}
              />
            ) : (
              <p className="text-lg text-gray-600 mb-6">
                You've successfully completed <strong>{courseData?.title}</strong>
              </p>
            )}
            {certificateLoading ? (
              <div className="text-gray-500">Generating certificate...</div>
            ) : (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={async () => {
                    try {
                      setCertificateLoading(true);
                      const courseIdNum = parseInt(courseId || '0');
                      
                      if (!certificate) {
                        // Generate certificate if not exists
                        if (!isNaN(courseIdNum) && courseIdNum > 0) {
                          try {
                            const newCert = await certificateApiService.generateCertificate({ courseId: courseIdNum });
                            setCertificate(newCert);
                            
                            // Download certificate
                            if (newCert.id) {
                              const downloadedCert = await certificateApiService.downloadCertificate(newCert.id);
                              // Open certificate PDF if available, otherwise show success message
                              if (downloadedCert.pdfUrl) {
                                window.open(downloadedCert.pdfUrl, '_blank');
                              } else {
                                alert('Certificate generated successfully! PDF will be available soon.');
                              }
                            } else {
                              alert('Certificate generated but download is not yet available.');
                            }
                          } catch (genError: any) {
                            console.error('Error generating certificate:', genError);
                            alert(genError.response?.data?.message || 'Failed to generate certificate. Please try again.');
                          }
                        } else {
                          alert('Invalid course ID. Cannot generate certificate.');
                        }
                      } else {
                        // Download existing certificate
                        if (certificate && certificate.id) {
                          try {
                            const downloadedCert = await certificateApiService.downloadCertificate(certificate.id);
                            if (downloadedCert.pdfUrl) {
                              window.open(downloadedCert.pdfUrl, '_blank');
                            } else {
                              alert('Certificate download initiated! PDF will be available soon.');
                            }
                          } catch (downloadError: any) {
                            console.error('Error downloading certificate:', downloadError);
                            alert(downloadError.response?.data?.message || 'Failed to download certificate. Please try again.');
                          }
                        } else {
                          // Certificate exists but ID is missing - try to regenerate
                          console.warn('Certificate object exists but ID is missing:', certificate);
                          try {
                            const newCert = await certificateApiService.generateCertificate({ courseId: courseIdNum });
                            if (newCert && newCert.id) {
                              setCertificate(newCert);
                              const downloadedCert = await certificateApiService.downloadCertificate(newCert.id);
                              if (downloadedCert.pdfUrl) {
                                window.open(downloadedCert.pdfUrl, '_blank');
                              } else {
                                alert('Certificate generated successfully! PDF will be available soon.');
                              }
                            } else {
                              alert('Failed to generate certificate. Please try again.');
                            }
                          } catch (genError: any) {
                            console.error('Error regenerating certificate:', genError);
                            alert(genError.response?.data?.message || 'Failed to generate certificate. Please try again.');
                          }
                        }
                      }
                    } catch (error: any) {
                      console.error('Error downloading certificate:', error);
                      alert(error.response?.data?.message || 'Failed to download certificate. Please try again.');
                    } finally {
                      setCertificateLoading(false);
                    }
                  }}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                  disabled={certificateLoading}
                >
                  {certificate ? 'Download Certificate' : 'Generate & Download Certificate'}
                </button>
                <button
                  onClick={() => setShowCompletionMessage(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  disabled={certificateLoading}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Video/Content Section */}
            {renderModuleContent()}
            
            {/* Tabs - Mobile: includes Course Content, Desktop: excludes it */}
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {/* Mobile tabs (includes Course Content) */}
                <div className="lg:hidden flex space-x-2">
                  {["Course Content", "Overview", "Notes", "Instructor", "Reviews", "Learning Tools", "Announcements", "QNA"].map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm border whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-orange-500 text-white border-orange-500"
                          : "text-gray-600 border-orange-500 bg-white hover:bg-orange-50"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                {/* Desktop tabs (excludes Course Content) */}
                <div className="hidden lg:flex space-x-2">
                  {["Overview", "Notes", "Instructor", "Reviews", "Learning Tools", "Announcements", "QNA"].map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm border whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-orange-500 text-white border-orange-500"
                          : "text-gray-600 border-orange-500 bg-white hover:bg-orange-50"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="mb-6">
              {renderTabContent()}
            </div>
          </div>
          
          {/* Sticky Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-8 w-80 bg-white rounded-lg shadow-lg max-h-[calc(100vh-4rem)] flex flex-col overscroll-contain">
              <div className="p-4 border-b bg-white rounded-t-lg">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-gray-800 flex-1">Course Content</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-orange-500 rounded-full"
                        style={{ width: `${progress?.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{Math.round(progress?.progress ?? 0)}%</span>
                  </div>
                </div>
                {/* Certificate Download Button - Show when course is completed */}
                {progress && progress.progress >= 100 && (
                  <button
                    onClick={async () => {
                      try {
                        setCertificateLoading(true);
                        const courseIdNum = parseInt(courseId || '0');
                        
                        if (!certificate) {
                          // Generate certificate if not exists
                          if (!isNaN(courseIdNum) && courseIdNum > 0) {
                            try {
                              const newCert = await certificateApiService.generateCertificate({ courseId: courseIdNum });
                              setCertificate(newCert);
                              
                              // Download certificate
                              if (newCert.id) {
                                const downloadedCert = await certificateApiService.downloadCertificate(newCert.id);
                                if (downloadedCert.pdfUrl) {
                                  window.open(downloadedCert.pdfUrl, '_blank');
                                } else {
                                  alert('Certificate generated successfully! PDF will be available soon.');
                                }
                              }
                            } catch (genError: any) {
                              console.error('Error generating certificate:', genError);
                              alert(genError.response?.data?.message || 'Failed to generate certificate. Please try again.');
                            }
                          }
                        } else {
                          // Download existing certificate
                          if (certificate && certificate.id) {
                            try {
                              const downloadedCert = await certificateApiService.downloadCertificate(certificate.id);
                              if (downloadedCert.pdfUrl) {
                                window.open(downloadedCert.pdfUrl, '_blank');
                              } else {
                                alert('Certificate download initiated! PDF will be available soon.');
                              }
                            } catch (downloadError: any) {
                              console.error('Error downloading certificate:', downloadError);
                              alert(downloadError.response?.data?.message || 'Failed to download certificate. Please try again.');
                            }
                          } else {
                            // Certificate exists but ID is missing - try to regenerate
                            console.warn('Certificate object exists but ID is missing:', certificate);
                            try {
                              const newCert = await certificateApiService.generateCertificate({ courseId: courseIdNum });
                              if (newCert && newCert.id) {
                                setCertificate(newCert);
                                const downloadedCert = await certificateApiService.downloadCertificate(newCert.id);
                                if (downloadedCert.pdfUrl) {
                                  window.open(downloadedCert.pdfUrl, '_blank');
                                } else {
                                  alert('Certificate generated successfully! PDF will be available soon.');
                                }
                              } else {
                                alert('Failed to generate certificate. Please try again.');
                              }
                            } catch (genError: any) {
                              console.error('Error regenerating certificate:', genError);
                              alert(genError.response?.data?.message || 'Failed to generate certificate. Please try again.');
                            }
                          }
                        }
                      } catch (error: any) {
                        console.error('Error downloading certificate:', error);
                        alert(error.response?.data?.message || 'Failed to download certificate. Please try again.');
                      } finally {
                        setCertificateLoading(false);
                      }
                    }}
                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={certificateLoading}
                  >
                    {certificateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {certificate ? 'Downloading...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        🎓 {certificate ? 'Download Certificate' : 'Generate Certificate'}
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {renderCourseContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}