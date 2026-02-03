import apiClient from './axiosInterceptor';
import { API_BASE_URL } from '../lib/api';

export interface InstructorDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  address: string;
  phone: string;
  profilePicture: string;
  rating: number;
  totalStudents: number;
  totalCourses: number;
  isVerified: boolean;
  joinDate: any;
  role: string;
}

interface InstructorApiResponse {
  instructorId: number;
  instructorName: string;
  instructorEmail: string;
  phoneNumber: string | null;
  address: string | null;
  profileImage: string | null;
  createdDate: string | null;
  bio: string;
  publishedCourseCount: number;
  areaOfExpertise: string;
  teachingTopics: string;
  panNo: string;
  aadhaarNo: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIFSCCode: string;
}

export const getInstructorById = async (instructorId: string | number): Promise<InstructorDetails | null> => {
  try {
    // Convert to number if it's a string
    const id = typeof instructorId === 'string' ? parseInt(instructorId, 10) : instructorId;
    
    if (isNaN(id) || id <= 0) {
      console.error("Invalid instructor ID:", instructorId);
      return null;
    }

    const response = await apiClient.get<InstructorApiResponse>(
      `${API_BASE_URL}instructor/details/${id}`
    );

    if (!response.data) {
      console.log("Instructor not found with ID:", instructorId);
      return null;
    }

    const data = response.data;
    
    // Parse instructor name (assuming format: "FirstName LastName" or just "Name")
    const nameParts = (data.instructorName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Build profile image URL if available
    let profilePicture = "";
    if (data.profileImage) {
      // If the path already starts with http, use as-is, otherwise prepend base URL
      if (data.profileImage.startsWith('http')) {
        profilePicture = data.profileImage;
      } else {
        profilePicture = `${API_BASE_URL}/${data.profileImage}`.replace(/([^:]\/)\/+/g, "$1");
      }
    }

    return {
      id: data.instructorId.toString(),
      email: data.instructorEmail || "",
      firstName,
      lastName,
      bio: data.bio || "",
      address: data.address || "",
      phone: data.phoneNumber || "",
      profilePicture,
      rating: 0, // Rating not available in API response
      totalStudents: 0, // Total students not available in API response
      totalCourses: data.publishedCourseCount || 0,
      isVerified: false, // Verification status not available in API response
      joinDate: data.createdDate ? new Date(data.createdDate) : null,
      role: "instructor"
    } as InstructorDetails;
  } catch (error: any) {
    console.error("Error fetching instructor:", error);
    if (error.response?.status === 404) {
      console.log("Instructor not found with ID:", instructorId);
      return null;
    }
    return null;
  }
};


