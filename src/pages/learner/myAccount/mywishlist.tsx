import { useState, useEffect } from 'react';
import "../../../styles/temp.css";
import Divider from '../../../components/ui/divider';
import { Clock, User2, Heart, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { learnerService, LearnerCourse } from '../../../utils/learnerService';
import { useAuth } from '../../../context/AuthContext';

// Course categories from Firebase or static data
const coursecategories = [
  {'id': 0, 'title': 'All Courses'},
  {'id': 1, 'title': 'Data Science'},
  {'id': 2, 'title': 'IT Certifications'},
  {'id': 3, 'title': 'Communication'},
  {'id': 4, 'title': 'Deep Learning'},
  {'id': 5, 'title': 'Chat GPT'},
  {'id': 6, 'title': 'Development'},
  {'id': 7, 'title': 'Cloud Computing'},
  {'id': 8, 'title': 'Mathematics'}
];

function CourseCard({ course }: { course: LearnerCourse }) {
  const isFree = course.price === 0;
  
  return (
    <div
      className="course-card-alt"
      onClick={() => {
        window.location.href = '/#/courseDetails';
      }}
    >
      <div className="relative">
        <img src={course.image} alt={course.title} />
        <div className="absolute top-2 right-2">
          <Heart className="h-5 w-5 text-red-500 fill-current" />
        </div>
      </div>
      <div className="course-body">
        <h3 className="course-title">{course.title}</h3>
        <div className="course-meta">
          <div className="flex items-center gap-2">
            <User2 size={16} />
            <span>{course.students} Students</span>
          </div>
          <Divider />
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{course.duration} Hrs</span>
          </div>
        </div>
        <p className="course-description">{course.description}</p>

        {course.price !== undefined && (
          <div className="course-pricing flex-col gap-2">
            {isFree ? (
              <span className="badge-free">
                Free
              </span>
            ) : (
              <span className="badge-paid">
                Paid
              </span>
            )}
            <Button className='rounded-none w-full'>Start learning</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyWishlist() {
  const [wishlist, setWishlist] = useState<LearnerCourse[]>([]);
  const [filteredWishlist, setFilteredWishlist] = useState<LearnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'learnings' | 'wishlist'>('wishlist');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    wishlistCount: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchWishlistData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const [wishlistCourses, learnerStats] = await Promise.all([
          learnerService.getMyWishlist(user.uid),
          learnerService.getLearnerStats(user.uid)
        ]);
        
        setWishlist(wishlistCourses);
        setFilteredWishlist(wishlistCourses);
        setStats(learnerStats);
      } catch (error) {
        console.error('Error fetching wishlist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistData();
  }, [user]);

  // Filter wishlist based on selected category
  useEffect(() => {
    if (selectedCategory === 0) {
      setFilteredWishlist(wishlist);
    } else {
      const categoryTitle = coursecategories.find(cat => cat.id === selectedCategory)?.title.toLowerCase();
      const filtered = wishlist.filter(course => 
        course.category?.toLowerCase().includes(categoryTitle || '') ||
        course.title.toLowerCase().includes(categoryTitle || '')
      );
      setFilteredWishlist(filtered);
    }
  }, [selectedCategory, wishlist]);

  const freeCourses = filteredWishlist.filter(course => course.price === 0).length;
  const paidCourses = filteredWishlist.filter(course => course.price && course.price > 0).length;

  return (
    <div className="wishlist-bg">
      <section className="gradient-header">
        <div className="container mx-auto px-6">
          <h1 className="text-white text-4xl font-bold mb-6 text-left">My Account</h1>
          <div className="flex gap-4">
            <button
              className="px-6 py-2 rounded-full text-lg bg-orange-300 text-white font-medium border border-orange-300"
              onClick={() => (window.location.href = '/#/learner/my-learnings')}
            >
              My Learnings ({stats.totalCourses})
            </button>
            <button
              className="px-6 py-2 rounded-full text-lg bg-white text-orange-500 font-medium"
              onClick={() => setActiveTab('wishlist')}
            >
              Wishlist ({stats.wishlistCount})
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <h1 className="wishlist-title">My Wishlist</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading your wishlist...</span>
          </div>
        ) : (
          <>
            {/* Statistics */}
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
                <Heart className="mr-2" color="#666666" size={16} />
                <span>{filteredWishlist.length} Items in Wishlist</span>
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2 justify-start mb-8">
              {coursecategories.map((category, index) => (
                <div 
                  key={index} 
                  className={`rounded-[35px] px-2 md:px-4 py-2 flex items-center justify-center cursor-pointer transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white text-orange-500 hover:bg-orange-50'
                  }`} 
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <h2 className="text-center text-sm md:text-md font-medium font-['Archivo'] capitalize">
                    {category.title}
                  </h2>
                </div>
              ))}
            </div>

            {filteredWishlist.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCategory === 0 ? 'Your wishlist is empty' : 'No courses found in this category'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 0 
                    ? 'Add courses to your wishlist to keep track of what you want to learn next.' 
                    : 'Try selecting a different category or browse all courses.'
                  }
                </p>
                <div className="flex gap-4 justify-center">
                  {selectedCategory !== 0 && (
                    <button 
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      onClick={() => setSelectedCategory(0)}
                    >
                      Show All
                    </button>
                  )}
                  <button 
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    onClick={() => window.location.href = '/#/courselist'}
                  >
                    Browse Courses
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWishlist.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}