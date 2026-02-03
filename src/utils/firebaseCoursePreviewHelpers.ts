
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const getDraftRef = (courseId: string) => {
  if (!courseId) {
    throw new Error("Course ID is required");
  }
  return doc(db, "courseDrafts", courseId);
};

export const getFullCourseData = async (courseId: string) => {
  if (!courseId) {
    return null;
  }
  try {
    const draftRef = getDraftRef(courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      return docSnap.data() as any;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting full course data:", error);
    return null;
  }
};

export const getCourseCurriculum = async (courseId: string) => {
  if (!courseId) {
    return [];
  }
  try {
    const draftRef = getDraftRef(courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      return (docSnap.data() as any).curriculum || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting course curriculum:", error);
    return [];
  }
};

export const getCourseLandingPage = async (courseId: string) => {
  if (!courseId) {
    return {};
  }
  try {
    const draftRef = getDraftRef(courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      return (docSnap.data() as any).landingPage || {};
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error getting course landing page:", error);
    return {};
  }
};

export const getCourseIntendedLearners = async (courseId: string) => {
  if (!courseId) {
    return [];
  }
  try {
    const draftRef = getDraftRef(courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      return (docSnap.data() as any).intendedLearners || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting course intended learners:", error);
    return [];
  }
};

export const getCourseStructure = async (courseId: string) => {
  if (!courseId) {
    return [];
  }
  try {
    const draftRef = getDraftRef(courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      return (docSnap.data() as any).structure || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting course structure:", error);
    return [];
  }
};
