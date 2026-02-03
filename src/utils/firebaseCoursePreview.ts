import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface CourseDetails {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  promoVideoUrl?: string;
  featured: boolean;
  isPublished: boolean;
  status: number;
  category: string;
  subcategory?: string;
  level: string;
  language: string;
  progress?: number;
  pricing: string;
  submittedAt: string;
  approvedAt?: string;
  createdAt?: string;
  instructorId: string;
  instructorName: string;
  learn?: string[];
  requirements?: string[];
  target?: string[];
  welcomeMessage?: string;
  congratulationsMessage?: string;
  rejectionInfo?: {
    rejectionReason?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionNotes?: string;
  };
  curriculum?: {
    sections: Array<{
      id?: string;
      name: string;
      published: boolean;
      items: Array<{
        id?: string;
        contentType: string;
        lectureName: string;
        description: string;
        published: boolean;
        isPromotional?: boolean;
        contentFiles?: Array<{
          duration?: number | string;
          name: string;
          url: string;
        }>;
        contentText?: string;
        articleSource?: string;
        resources?: Array<{
          name: string;
          url?: string;
          cloudinaryUrl?: string;
          cloudinaryPublicId?: string;
          type: string;
        }>;
      }>;
    }>;
  };
  members?: Array<{
    id: string;
    email: string;
    role: string;
  }>;
  
  // New fields for tracking edited vs published content
  hasUnpublishedChanges?: boolean; // Flag to indicate if there are changes not yet published
  editSummary?: {
    newContent: string[]; // List of new content added
    editedContent: string[]; // List of content that was edited
    removedContent: string[]; // List of content that was removed
  };
}

export const getFullCourseData = async (courseId: string): Promise<CourseDetails | null> => {
  if (!courseId) {
    return null;
  }
  try {
    const draftRef = doc(db, "courseDrafts", courseId);
    const docSnap = await getDoc(draftRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      return {
        id: docSnap.id,
        ...data
      } as CourseDetails;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching course data:", error);
    return null;
  }
};

// Helper function to extract quiz data from course module
export const extractQuizData = (module: any) => {
  console.log('Extracting quiz data from module:', module);
  
  // Check if it's a quiz type OR if it has questions (for assignments with questions)
  const isQuiz = module.type === 'quiz' || module.contentType === 'quiz';
  const isAssignment = module.type === 'assignment' || module.contentType === 'assignment';
  const hasQuestions = module.questions && module.questions.length > 0;
  
  console.log('isQuiz:', isQuiz, 'isAssignment:', isAssignment, 'hasQuestions:', hasQuestions);
  
  if (!isQuiz && !hasQuestions) {
    console.log('Module is not a quiz and has no questions, returning null');
    return null;
  }

  // Transform questions to match quiz format
  const transformedQuestions = (module.questions || []).map((q: any, index: number) => {
    console.log(`Transforming question ${index + 1}:`, q);
    
    // If it's already in quiz format (has options and correctOption)
    if (q.options && q.correctOption) {
      console.log(`Question ${index + 1} is already in quiz format`);
      return {
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        type: 'multiple_choice'
      };
    }
    
    // If it's an assignment question (essay type), keep as essay format
    if (q.question && q.answer) {
      console.log(`Question ${index + 1} is assignment format, keeping as essay`);
      return {
        question: q.question,
        answer: q.answer,
        marks: q.marks || 100,
        maxWordLimit: q.maxWordLimit || 500,
        type: 'essay'
      };
    }
    
    // Fallback for any other format
    console.log(`Question ${index + 1} using fallback format`);
    return {
      question: q.question || `Question ${index + 1}`,
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctOption: [0],
      type: 'multiple_choice'
    };
  });

  const result = {
    quizTitle: module.quizTitle || module.title || module.lectureName || "Quiz",
    quizDescription: module.quizDescription || module.description || "Test your knowledge with this quiz.",
    duration: module.duration || 15,
    questions: transformedQuestions,
    totalMarks: module.totalMarks || 100,
    isAssignment: isAssignment
  };
  
  console.log('Final quiz data result:', result);
  return result;
};
