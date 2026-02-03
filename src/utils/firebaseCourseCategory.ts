import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const saveCourseCategory = async (courseId: string, category: string) => {
  if (!courseId) {
    throw new Error("Course ID is required");
  }
  const courseRef = doc(db, "courseDrafts", courseId);
  await setDoc(courseRef, { category }, { merge: true });
};

export const getCourseCategory = async (courseId: string) => {
  if (!courseId) {
    return "";
  }
  const courseRef = doc(db, "courseDrafts", courseId);
  const docSnap = await getDoc(courseRef);
  if (docSnap.exists()) {
    return (docSnap.data() as any).category || "";
  } else {
    return "";
  }
};
