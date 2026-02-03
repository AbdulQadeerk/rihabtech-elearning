import { Clock, User2 } from "lucide-react";
import Divider from "../../../../components/ui/divider";
import { Button } from "../../../../components/ui/button";
import { CourseCard } from "../courseList";

export default function InstructorCourses() {
    const  courses = [
      {
        id: 1,
        title: "Introduction LearnPress - LMS Plugin",
        description: "A WordPress LMS Plugin to create WordPress Learning Management System.",
        students: 76,
        duration: 10,
        price: 0,
        image: "Images/courses/Link.jpg"
      },
      {
        id: 2,
        title: "Create An LMS Website With WordPress",
        description: "Lorem ipsum dolor sit amet. Qui mollitia dolores non voluptas.",
        students: 25,
        duration: 12,
        price: 0,
        image: "Images/courses/create-an-lms-website-with-learnpress 4.jpg"
      },
      {
        id: 3,
        title: "How To Sell In-Person Course With LearnPress",
        description: "This course is a detailed and easy roadmap to get you all setup and...",
        students: 5,
        duration: 8,
        price: 129.00,
        image: "Images/courses/course-offline-01.jpg"
      },
      {
        id: 4,
        title: "How To Teach An Online Course",
        description: "This tutorial will introduce you to PHP, a server-side scripting...",
        students: 28,
        duration: 10,
        price: 79.00,
        image: "Images/courses/eduma-learnpress-lms 4.jpg"
      },
      {
        id: 5,
        title: "How To Create An Online Course",
        description: "The iStudy team knows all about cross-browser issues, and they're...",
        students: 76,
        duration: 10,
        price: 70.00,
        originalPrice: 115.99,
        image: "Images/courses/course 4.jpg"
      },
      {
        id: 6,
        title: "The Complete Online Teaching Masterclass",
        description: "In this course, We'll learn how to create websites by structuring and...",
        students: 28,
        duration: 12,
        price: 80.00,
        originalPrice: 125.00,
        image: "Images/courses/course 5.jpg"
      },
      {
        id: 7,
        title: "Online Course Creation Secrets",
        description: "Many of the most powerful, memorable and effective...",
        students: 27,
        duration: 10,
        price: 65.00,
        image: "Images/courses/course 6.jpg"
      },
      {
        id: 8,
        title: "Launch Your Own Online School And Increase Your Income",
        description: "Photography Masterclass: Your Complete Guide to Photography...",
        students: 81,
        duration: 10,
        price: 50.00,
        image: "Images/courses/course 7.jpg"
      },
      ];

      return(
  <section className="py-16">
    
          <div className="container mx-auto px-4">
          <div className="section-title text-center py-12">Instructor Popular Courses</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2 mb-6">
            {courses.map((course, index) => (
              <CourseCard key={index} course={course} />
            ))}
          </div>
            <div className="w-full flex justify-center">
                <Button variant={'outline'} className="border-black text-black rounded-none px-4 py-2 text-sm font-medium hover:bg-blue-50">
                    View All Courses
                </Button>
            </div>
           
          </div>
        </section>
  )
  }