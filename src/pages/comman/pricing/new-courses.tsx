import { Clock, MapPin, } from "lucide-react";
import Divider from "../../../components/ui/divider";
import { Button } from "../../../components/ui/button";

export default function NewCourses() {
    const  courses = [
        {
          id: 1,
          title: "Autumn Science Lectures",
          description: "Morbi accumsan ipsum velit. Nam nec tellus a odio tincidunt auctor a...",
          location: 'Venice, Italy',
          duration: '8:00 am - 5:00 pm',
          price: 0,
          image: "/Images/courses/event 7.png"
        },
        {
          id: 2,
          title: "Build Education Website Using WordPress",
          description: "Tech you how to build a complete Learning Management System with WordPress...",
          location: 'Chicago, US',
          duration: '8:00 am - 5:00 pm',
          price: 0,
          image: "/Images/courses/event 4.png"
        },
        {
          id: 3,
          title: "Elegant Light Box Paper Cut Dioramas",
          description: "Morbi accumsan ipsum velit. Nam nec tellus a odio tincidunt auctor a...",
          location: 'Vancouver, Canada',
          duration: '8:00 am - 5:00 pm',
          price: 129.00,
          image: "/Images/courses/Link (3).png"
        },
      ];


      return(
  <section className="py-16">
           
            <div className="container mx-auto px-8">
            <div className="flex justify-between items-center mb-8">
            <h2 className="section-title">What’s New on Rihab Technologies</h2>
            <Button variant={'outline'} className="px-6 py-3 rounded-none border-black h-auto text-black hover:bg-primary font-medium" onClick={() => {
                      window.location.href = '/#/courselist';
                    }}>
            View all Events
              </Button>
           </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                {courses.map((course,index)=>(
                  <div key={index} className="overflow-hidden cursor-pointer hover:opacity-50" onClick={() => {
                    window.location.href = '/#/courseDetails';
                  }}>
                  <div className="relative">
                    <img src={course.image} alt={course.title} className="w-full h-45 object-cover" />
                    
                  </div>
                  <div className="py-4 flex flex-col gap-2">
                    <h3 className="text-[#000927] text-lg font-bold font-['Archivo'] capitalize leading-normal mb-2">{course.title}</h3>
                    <div className="flex gap-3 items-center text-[#666666] text-sm font-normal font-['Barlow'] leading-snug">
                      <div className=" px-1 py-0.5 flex gap-2 items-center">
                        
  
                        <Clock size={16}/>
                        <span>{course.duration}</span>
                      </div>
                      <Divider/>
                      <div className="px-1 py-0.5 flex items-center gap-2">
                      <MapPin size={16}/>
                      <span>{course.location}</span>
                      </div>
                    </div>
                    <p className=" text-[#666666] text-base font-normal font-['Barlow'] leading-relaxed max-lines-2">{course.description}</p>
                  
                    
                    <a className="text-primary font-medium">Read More</a>
                  </div>
                </div>
              ))}
              </div>
             
            </div>
          </section>
  )
  }