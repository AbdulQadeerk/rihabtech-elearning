// Service to map Firestore export data to application data structures
import { InstructorData, CourseData, StudentData, StudentEnrollment } from './firebaseInstructorData';

// Parse Firestore export data
export const parseFirestoreData = (firestoreData: any) => {
  const data = JSON.parse(firestoreData);
  
  return {
    users: data.users || [],
    courseDrafts: data.courseDrafts || [],
    studentEnrollments: data.studentEnrollments || [],
    coursePricing: data.coursePricing || [],
    categories: data.categories || [],
    watchTimeData: data.watchTimeData || [],
    monthlyRevenue: data.monthlyRevenue || [],
    payoutRequests: data.payoutRequests || []
  };
};

// Map Firestore user data to InstructorData
export const mapToInstructorData = (userData: any): InstructorData => {
  return {
    id: userData.id || userData.email || '',
    email: userData.email || '',
    userName: userData.userName || userData.email || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    role: userData.role || 'instructor',
    totalStudents: userData.totalStudents || 0,
    totalCourses: userData.totalCourses || 0,
    rating: userData.rating || 0,
    isVerified: userData.isVerified || false,
    joinDate: userData.joinDate?.toDate ? userData.joinDate.toDate() : new Date(userData.joinDate?._seconds * 1000) || new Date(),
    profilePicture: userData.profilePicture || '',
    address: userData.address || '',
    phone: userData.phone || '',
    bio: userData.bio || '',
    updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : new Date(userData.updatedAt?._seconds * 1000) || new Date(),
    status: userData.status || 'active'
  };
};

// Map Firestore course draft data to CourseData
export const mapToCourseData = (courseData: any, instructorId: string): CourseData => {
  return {
    id: courseData.id || '',
    title: courseData.title || 'Untitled Course',
    description: courseData.description || '',
    status: courseData.status || 'draft',
    visibility: courseData.visibility || 'private',
    progress: courseData.progress || 0,
    lastModified: courseData.lastModified?.toDate ? courseData.lastModified.toDate() : new Date(courseData.lastModified?._seconds * 1000) || new Date(),
    createdAt: courseData.createdAt?.toDate ? courseData.createdAt.toDate() : new Date(courseData.createdAt?._seconds * 1000) || new Date(),
    instructorId: instructorId,
    thumbnail: courseData.thumbnailUrl || courseData.thumbnail || courseData.thumbnailImage || null,
    category: courseData.category || '',
    subcategory: courseData.subcategory || '',
    level: courseData.level || '',
    language: courseData.language || '',
    pricing: courseData.pricing || '',
    isPublished: courseData.isPublished || courseData.status === 'published' || courseData.status === 'approved',
    featured: courseData.featured || false,
    members: courseData.members || [],
    curriculum: courseData.curriculum || {
      sections: []
    }
  };
};

// Map Firestore student enrollment data to StudentEnrollment
export const mapToStudentEnrollment = (enrollmentData: any): StudentEnrollment => {
  return {
    id: enrollmentData.id || '',
    studentId: enrollmentData.studentId || '',
    courseId: enrollmentData.courseId || '',
    enrolledAt: enrollmentData.enrolledAt?.toDate ? enrollmentData.enrolledAt.toDate() : new Date(enrollmentData.enrolledAt?._seconds * 1000) || new Date(),
    isActive: enrollmentData.isActive || false,
    lastAccessedAt: enrollmentData.lastAccessedAt?.toDate ? enrollmentData.lastAccessedAt.toDate() : new Date(enrollmentData.lastAccessedAt?._seconds * 1000) || new Date(),
    progress: enrollmentData.progress || 0,
    totalWatchTime: enrollmentData.totalWatchTime || 0,
    completedModules: enrollmentData.completedModules || [],
    currentModuleId: enrollmentData.currentModuleId || '',
    currentPosition: enrollmentData.currentPosition || 0
  };
};

// Map Firestore user data to StudentData
export const mapToStudentData = (userData: any): StudentData => {
  return {
    id: userData.id || userData.email || '',
    email: userData.email || '',
    userName: userData.userName || userData.email || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    role: userData.role || 'learner',
    profilePicture: userData.profilePicture || '',
    bio: userData.bio || '',
    joinDate: userData.joinDate?.toDate ? userData.joinDate.toDate() : new Date(userData.joinDate?._seconds * 1000) || new Date(),
    status: userData.status || 'active'
  };
};

// Get instructor data from Firestore export
export const getInstructorFromExport = (firestoreData: any, instructorId: string): InstructorData | null => {
  const data = parseFirestoreData(firestoreData);
  
  const instructor = data.users.find((user: any) => 
    (user.email === instructorId || user.userName === instructorId) && user.role === 'instructor'
  );
  
  return instructor ? mapToInstructorData(instructor) : null;
};

// Get courses for instructor from Firestore export
export const getCoursesForInstructorFromExport = (firestoreData: any, instructorId: string): CourseData[] => {
  const data = parseFirestoreData(firestoreData);
  
  // Since courseDrafts don't have instructorId, we'll return all courses
  // In production, you should add instructorId when creating courses
  return data.courseDrafts.map((course: any) => mapToCourseData(course, instructorId));
};

// Get student enrollments from Firestore export
export const getStudentEnrollmentsFromExport = (firestoreData: any): StudentEnrollment[] => {
  const data = parseFirestoreData(firestoreData);
  
  return data.studentEnrollments.map((enrollment: any) => mapToStudentEnrollment(enrollment));
};

// Get students data from Firestore export
export const getStudentsFromExport = (firestoreData: any, studentIds: string[]): StudentData[] => {
  const data = parseFirestoreData(firestoreData);
  
  return data.users
    .filter((user: any) => user.role === 'learner' && studentIds.includes(user.email))
    .map((user: any) => mapToStudentData(user));
};

// Calculate instructor statistics from Firestore export
export const calculateInstructorStats = (firestoreData: any, instructorId: string) => {
  const data = parseFirestoreData(firestoreData);
  
  const courses = getCoursesForInstructorFromExport(firestoreData, instructorId);
  const enrollments = getStudentEnrollmentsFromExport(firestoreData);
  
  // Filter enrollments for instructor's courses
  const courseIds = courses.map(c => c.id);
  const relevantEnrollments = enrollments.filter(e => courseIds.includes(e.courseId));
  
  const uniqueStudentIds = Array.from(new Set(relevantEnrollments.map(e => e.studentId)));
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthEnrollments = relevantEnrollments.filter(e => {
    const enrollmentDate = e.enrolledAt;
    return enrollmentDate.getMonth() === currentMonth && enrollmentDate.getFullYear() === currentYear;
  }).length;
  
  const totalWatchTime = relevantEnrollments.reduce((sum, e) => sum + e.totalWatchTime, 0);
  const averageProgress = relevantEnrollments.length > 0 
    ? Math.round(relevantEnrollments.reduce((sum, e) => sum + e.progress, 0) / relevantEnrollments.length)
    : 0;
  
  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.isPublished).length,
    draftCourses: courses.filter(c => c.status === 'draft').length,
    totalStudents: uniqueStudentIds.length,
    totalEnrollments: relevantEnrollments.length,
    totalWatchTime,
    averageProgress,
    currentMonthEnrollments
  };
};
