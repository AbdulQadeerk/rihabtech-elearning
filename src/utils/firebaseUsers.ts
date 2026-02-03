import { db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { InstructorDetails } from "./instructorService";

export const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return { id: doc.id, ...data };
  });
};

export const getInstructorById = async (
  instructorId: string
): Promise<InstructorDetails | null> => {
  try {
    const instructorRef = doc(db, "users", instructorId);
    const instructorSnap = await getDoc(instructorRef);

    if (instructorSnap.exists()) {
      const data = instructorSnap.data() as any;
      return {
        id: instructorSnap.id,
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        bio: data.bio || "",
        address: data.address || "",
        phone: data.phone || "",
        profilePicture: data.profilePicture || "",
        rating: data.rating || 0,
        totalStudents: data.totalStudents || 0,
        totalCourses: data.totalCourses || 0,
        isVerified: data.isVerified || false,
        joinDate: data.joinDate,
        role: data.role || "instructor",
      } as InstructorDetails;
    } else {
      console.log("Instructor not found with ID:", instructorId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching instructor:", error);
    return null;
  }
};
