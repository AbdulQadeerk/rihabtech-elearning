import { Button } from "../../../components/ui/button";
import GradientHeader from "../../../components/ui/GradientHeader";
import { CourseCard } from "../../comman/courses/courseList";

export const LearnerProfile = () => {

    const myLearningCourses = [
        {
          id: 1,
          title: "Introduction LearnPress - LMS Plugin",
          description: "A WordPress LMS Plugin to create WordPress Learning Management System.",
          students: 76,
          duration: 10,
          progress: 90,
          image: "Images/courses/Link.jpg"
        },
        {
          id: 2,
          title: "Create An LMS Website With WordPress",
          description: "Lorem ipsum dolor sit amet. Qui mollitia dolores non voluptas.",
          students: 25,
          duration: 12,
          progress: 50,
          image: "Images/courses/create-an-lms-website-with-learnpress 4.jpg"
        },
        {
          id: 3,
          title: "How To Sell In-Person Course With LearnPress",
          description: "This course is a detailed and easy roadmap to get you all setup and...",
          students: 5,
          duration: 8,
          progress: 30,
          image: "Images/courses/course-offline-01.jpg"
        },
      ];
      
  
    return (
      <div className="public-profile-root min-h-screen bg-white">
        <GradientHeader subtitle="Learner" title={`Manas Agrawal`} />
        <div className="public-profile-content">
        <div className="public-profile-card-wrapper">
          <div className="public-profile-card">
            <div className="public-profile-initials">MA</div>
            <Button className="rounded-none">Send Message</Button>
          </div>
        </div>
        
      </div>
      <div className="p-4">
      <div className="justify-start text-[#383e49] text-[25px] font-semibold font-['Inter'] leading-[37.50px] mt-12">Courses Enrolled</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {myLearningCourses.map((course, index) => (
              <CourseCard key={index} course={course} progress={true} />
            ))}
          </div>
          </div>
      </div>
    );
  };