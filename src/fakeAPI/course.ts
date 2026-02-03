import { db } from "../lib/firebase"; // your initialized firebase config
import { doc, setDoc, getDoc } from "firebase/firestore";
import { CourseWorkflowService } from "../utils/courseWorkflowService";
import { COURSE_STATUS, Course } from "../utils/firebaseCourses";

export const saveCourseDraft = async (
  draftId: string,
  data: Partial<CourseDraft>
) => {
  // Always save these fields if present
  const {
    id,
    title,
    subtitle,
    description,
    language,
    level,
    ...rest
  } = data;
  
  const ref = doc(db, "courseDrafts", draftId);
  
  // Get current course data to check status
  const courseSnap = await getDoc(ref);
  let courseData: Course | null = null;
  
  if (courseSnap.exists()) {
    courseData = courseSnap.data() as Course;
  }
  
  const updateData: any = {
    ...(title !== undefined && { title }),
    ...(subtitle !== undefined && { subtitle }),
    ...(description !== undefined && { description }),
    ...(language !== undefined && { language }),
    ...(level !== undefined && { level }),
    ...rest,
  };
  
  // Only set id if it's explicitly provided and different from draftId
  if (id !== undefined && id !== draftId) {
    updateData.id = id;
  }
  
  // If course is approved/published, use workflow service
  if (courseData && (courseData.status === COURSE_STATUS.APPROVED || courseData.status === COURSE_STATUS.PUBLISHED)) {
    if (!courseData.instructorId) {
      throw new Error("Instructor ID is required for workflow updates");
    }

    // Use workflow service to handle the update properly
    await CourseWorkflowService.updateCourse(
      draftId,
      updateData,
      courseData.instructorId,
      courseData.instructorName || 'Unknown',
      courseData.instructorEmail || ''
    );
  } else {
    // Simple update for draft courses
    await setDoc(ref, updateData, { merge: true });
  }
};

export const getCourseDraft = async (draftId: string): Promise<CourseDraft | null> => {
  const ref = doc(db, "courseDrafts", draftId);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as CourseDraft) : null;
};


type CourseDraft = {
  id: string; // Firestore doc ID or a UUID
  title?: string;
  subtitle?: string;
  description?: string;
  language?: string;
  level?: string;
  category?: string;
  subcategory?: string;
  sections?: {
    title: string;
    content: string;
  }[];
  progress: number; // percentage or steps completed
  learn?: string[];
  requirements?: string[];
  target?: string[];
  isIntendedLearnersFinal?: boolean;
  curriculum?: any; // CurriculumFormValues type, but use any for now for compatibility
  isCurriculumFinal?: boolean;
  thumbnailUrl?: string; // Course image URL from Cloudinary
  promoVideoUrl?: string; // Promotional video URL from Cloudinary
};