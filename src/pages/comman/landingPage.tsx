import React from 'react';
import {  CheckCircle2Icon, List, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Certifications from './landingPage/certifications';
import Courses from './landingPage/courses';
import TrustAndEducationSections from './landingPage/trustedcustomers';
import BestEducationSections from './landingPage/besteducation';
import NewCourses from './landingPage/new-courses';
import TestimonialsSection from './landingPage/testimonials';
import CareerSkillsSections from './landingPage/skillsForGrowth';
import { Fade } from 'react-awesome-reveal';
import { useEffect } from 'react';
import { Alert, AlertTitle } from '../../components/ui/alert';
import BannerSection from './landingPage/banner';

const EducationLandingPage: React.FC = () => {
  const [logoutSuccess, setLogoutSuccess] = React.useState(false);

  useEffect(() => {
    // Only check and clear the flag on mount
    const flag = localStorage.getItem("logoutSuccess");
    if (flag === "true") {
      setLogoutSuccess(true);
      //localStorage.removeItem("logoutSuccess"); // Remove immediately to prevent re-showing
    }
  }, []);

  useEffect(() => {
    if (logoutSuccess) {
      const timer = setTimeout(() => {
        setLogoutSuccess(false);
      }, 5000);
      localStorage.removeItem("logoutSuccess");
      return () => clearTimeout(timer);
    }
  }, [logoutSuccess]);
  return (
    <div className="min-h-screen bg-white font-sans">
      {logoutSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded relative mt-6 mb-6 w-full max-w-2xl mx-auto text-center text-lg font-semibold flex items-center justify-center" style={{gap: '8px'}}>
          <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          You’ve successfully logged out. Come back soon!
        </div>
        // <div className='w-full max-w-2xl mx-auto'>
        //   <Alert variant="success">
        //     <CheckCircle2Icon />
        //     <AlertTitle>You’ve successfully logged out. Come back soon!</AlertTitle>

        //   </Alert>
        // </div>
      )}

      {/* Hero Section */}
      {/* <section className="landing-gradient py-12 md:py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="flex flex-col gap-6 md:w-1/2">
          
            <h1 className="banner-section-title">
            Master New Skills with Certified Online Courses
            </h1>

            <p className="banner-section-subtitle">
            Unlock your potential with expert-led courses, flexible learning, and official certifications — all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="px-6 py-3 rounded-none h-auto text-white hover:bg-blue-700 font-medium">
             <List/> Categories
              </Button>
              <div className='relative w-full'>
              <input placeholder='What do you want to learn?' className='outline outline-1 outline-offset-[-1px] outline-[#ff7700] px-4 py-3 w-full' />
              <Search className='absolute top-1/4 right-4'/>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <img 
                src="Images/Banners/col-md-6.png" 
                alt="Happy student learning" 
              />
            </div>
          </div>
        </div>
      </section> */}
      <BannerSection/>

      {/* Top-Rated Courses Section */}
      <Fade delay={500}>
      <Certifications/>
      </Fade>
      
      {/* Get Best Education Section */}
      <Courses/>
      
      {/* Trusted Customers */}
      <TrustAndEducationSections/>
      
      {/* Certification Section */}
      <BestEducationSections/>
      
      {/* New Course */}
      <NewCourses/>
      {/* Newsletter Section */}
     <CareerSkillsSections/>
     <Fade delay={500}>
    <TestimonialsSection/>
    </Fade>
      
    </div>
  );
};

export default EducationLandingPage;