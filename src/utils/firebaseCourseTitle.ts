import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { COURSE_STATUS, Course } from "./firebaseCourses";
import { CourseWorkflowService } from "./courseWorkflowService";

export const createNewCourseDraft = async (title: string, instructorId?: string): Promise<string> => {
  try {
    const courseData = {
      instructorId:instructorId,
      title: title,
      createdAt: new Date(),
      status: COURSE_STATUS.DRAFT,
      progress: 0
    };

    const docRef = await addDoc(collection(db, "courseDrafts"), courseData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating course draft:", error);
    throw error;
  }
};

export const saveCourseTitle = async (courseId: string, title: string, instructorId?: string) => {
  if (!courseId) {
    throw new Error("Course ID is required");
  }

  // Get current course data to check status
  const courseRef = doc(db, "courseDrafts", courseId);
  const courseSnap = await getDoc(courseRef);
  
  if (!courseSnap.exists()) {
    throw new Error("Course not found");
  }

  const courseData = courseSnap.data() as Course;
  
  // If course is approved/published and title is being changed, use workflow service
  if ((courseData.status === COURSE_STATUS.APPROVED || courseData.status === COURSE_STATUS.PUBLISHED) && 
      courseData.title !== title) {
    
    if (!instructorId) {
      throw new Error("Instructor ID is required for workflow updates");
    }

    // Use workflow service to handle the update properly
    await CourseWorkflowService.updateCourse(
      courseId,
      { title },
      instructorId,
      courseData.instructorName || 'Unknown',
      courseData.instructorEmail || ''
    );
  } else {
    // Simple update for draft courses
    await setDoc(courseRef, { title, instructorId }, { merge: true });
  }
};

export const getCourseTitle = async (courseId: string) => {
  if (!courseId) {
    return "";
  }
  const courseRef = doc(db, "courseDrafts", courseId);
  const docSnap = await getDoc(courseRef);
  if (docSnap.exists()) {
    return (docSnap.data() as any).title || "";
  } else {
    return "";
  }
};
