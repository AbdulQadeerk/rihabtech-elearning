// services/StudentProgressService.ts
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export const StudentProgressService = {
  async getProgress(studentId: string, courseId: string) {
    const ref = doc(db, "studentProgress", `${studentId}_${courseId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  async initProgress(studentId: string, courseId: string, totalLectures: number) {
    const ref = doc(db, "studentProgress", `${studentId}_${courseId}`);
    await setDoc(ref, {
      studentId,
      courseId,
      progress: 0,
      sectionIndex: 0,
      lectureIndex: 0,
      completedSections: [],
      completedLectures: {},
      totalLectures,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  async markLectureComplete(
    studentId: string,
    courseId: string,
    sectionIndex: number,
    lectureIndex: number
  ) {
    const ref = doc(db, "studentProgress", `${studentId}_${courseId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("Progress document not found");
    }

    const data: any = snap.data();

    const updatedLectures = { ...data.completedLectures };
    if (!updatedLectures[sectionIndex]) {
      updatedLectures[sectionIndex] = [];
    }
    if (!updatedLectures[sectionIndex].includes(lectureIndex)) {
      updatedLectures[sectionIndex].push(lectureIndex);
    }

    const completedCount = Object.values(updatedLectures).flat().length;
    const progressPercent = data.totalLectures
      ? Math.round((completedCount / data.totalLectures) * 100)
      : 0;

    await updateDoc(ref, {
      completedLectures: updatedLectures,
      lectureIndex,
      sectionIndex,
      progress: progressPercent,
      updatedAt: new Date().toISOString(),
    });

    return {
      ...data,
      completedLectures: updatedLectures,
      progress: progressPercent,
      lectureIndex,
      sectionIndex,
    };
  },
};
