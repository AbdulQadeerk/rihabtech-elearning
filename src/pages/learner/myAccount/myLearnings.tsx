import { useState, useEffect } from 'react';
import { BookOpen, User2, Clock, TrendingUp } from "lucide-react";
import { CourseCard } from '../../comman/courses/courseList';
import { learnerService, LearnerCourse } from '../../../utils/learnerService';
import { useAuth } from '../../../context/AuthContext';

export default function MyLearnings() {
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    wishlistCount: 0
  });
  const [activeTab, setActiveTab] = useState<'learnings' | 'wishlist'>('learnings');
  const { user } = useAuth();

  useEffect(() => {
    const fetchLearnerData = async () => {
      console.log('🔍 MyLearnings useEffect triggered');
      console.log('🔍 User object:', user);
      console.log('🔍 User UID:', user?.uid);
      
      if (!user?.uid) {
        console.log('❌ No user UID found, returning early');
        return;
      }
      
      setLoading(true);
      try {
        // Get email directly from localStorage since that's what the service expects
        const userData = localStorage.getItem('key');
        let userEmail = user.email || '';
        
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            userEmail = parsedUser.UserName || user.email || '';
          } catch (e) {
            console.log('Could not parse user data from localStorage');
          }
        }
        
        if (!userEmail) {
          console.error('❌ No valid email found');
          return;
        }
        
        console.log('🚀 Calling learnerService.getMyLearnings with email:', userEmail);
        const [learningCourses, learnerStats] = await Promise.all([
          learnerService.getMyLearnings(userEmail),
          learnerService.getLearnerStats(userEmail)
        ]);
        
        console.log('✅ Received courses:', learningCourses.length);
        console.log('✅ Received stats:', learnerStats);
        
        setCourses(learningCourses);
        setStats(learnerStats);
      } catch (error) {
        console.error('❌ Error fetching learner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnerData();
  }, [user]);

  // Calculate free courses count
  const freeCourses = courses.filter(course => course.price === 0).length;
  const paidCourses = courses.filter(course => course.price && course.price > 0).length;

  return (
    <div>
      <section className="gradient-header">
        <div className="container mx-auto px-6">
          <h1 className="text-white text-4xl font-bold mb-6 text-left">My Account</h1>
          <div className="flex gap-4">
            <button
              className={`px-6 py-2 rounded-full text-lg bg-white text-orange-500 font-medium'
                  
                }`}
              onClick={() => setActiveTab('learnings')}
            >
              My Learnings
            </button>
            {/* <button
              className="px-6 py-2 rounded-full text-lg bg-orange-300 text-white font-medium border border-orange-300"
              onClick={() => (window.location.href = '/#/learner/my-wishlist')}
            >
              Wishlist
            </button> */}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <h1 className="wishlist-title">My Learnings</h1>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading your courses...</span>
          </div>
        ) : (
          <>
            {/* Statistics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Courses</p>
                    <p className="text-2xl font-bold text-orange-500">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-500">{stats.completedCourses}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.inProgressCourses}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Wishlist</p>
                    <p className="text-2xl font-bold text-purple-500">{stats.wishlistCount}</p>
                  </div>
                  <User2 className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Course Type Statistics */}
            <div className="flex items-center space-x-8 mb-6">
              <div className="flex items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                <BookOpen className="mr-2" color="#666666" size={16} />
                <span>{freeCourses} Free Courses</span>
              </div>
              <div className="flex items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                <User2 className="mr-2" color="#666666" size={16} />
                <span>{paidCourses} Paid Courses</span>
              </div>
              <div className="flex items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                <TrendingUp className="mr-2" color="#666666" size={16} />
                <span>{Math.round((stats.completedCourses / Math.max(stats.totalCourses, 1)) * 100)}% Completion Rate</span>
              </div>
            </div>

            <p className="text-[#666666] text-base font-normal font-['Barlow'] leading-relaxed mb-8">
              Track your learning journey with our comprehensive dashboard. Monitor your progress across all enrolled courses, view completion statistics, and continue where you left off. Your personalized learning experience is designed to help you achieve your educational goals efficiently.
            </p>

            {courses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses enrolled yet</h3>
                <p className="text-gray-600 mb-4">Start your learning journey by enrolling in courses that interest you.</p>
                <button 
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  onClick={() => window.location.href = '/#/courselist'}
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} progress={true} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}




