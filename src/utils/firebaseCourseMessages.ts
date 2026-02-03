import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface CourseMessagesData {
  draftId: string;
  welcomeMessage: string;
  congratulationsMessage: string;
}

export const saveCourseMessages = async (data: CourseMessagesData) => {
  if (!data.draftId) {
    throw new Error("Draft ID is required");
  }
  const courseRef = doc(db, "courseDrafts", data.draftId);
  await setDoc(courseRef, {
    welcomeMessage: data.welcomeMessage,
    congratulationsMessage: data.congratulationsMessage,
  }, { merge: true });
};

export const getCourseMessages = async (draftId: string) => {
  if (!draftId) {
    return {
      welcomeMessage: "",
      congratulationsMessage: "",
    };
  }
  const courseRef = doc(db, "courseDrafts", draftId);
  const docSnap = await getDoc(courseRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as any;
    return {
      welcomeMessage: data.welcomeMessage || "",
      congratulationsMessage: data.congratulationsMessage || "",
    };
  } else {
    return {
      welcomeMessage: "",
      congratulationsMessage: "",
    };
  }
};
