import React from 'react';
import { ChevronRight, Star, Users, Clock, BookOpen, List, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import Header from '../../../layouts/header';
import BannerSection from './banner';

const EducationLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header/Navigation */}

      {/* Hero Section */}
      <BannerSection></BannerSection>

      {/* Top-Rated Courses Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-[#000927] text-[32px] font-bold font-[' text-center mb-8">Top most interesting Certification</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12">
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-lg mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-center">Web Development</p>
              <p className="text-xs text-gray-500 mt-1 text-center">120+ Courses</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col items-center">
              <div className="bg-purple-100 p-3 rounded-lg mb-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-center">Data Science</p>
              <p className="text-xs text-gray-500 mt-1 text-center">90+ Courses</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col items-center">
              <div className="bg-yellow-100 p-3 rounded-lg mb-3">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-center">Business</p>
              <p className="text-xs text-gray-500 mt-1 text-center">100+ Courses</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-lg mb-3">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-center">Marketing</p>
              <p className="text-xs text-gray-500 mt-1 text-center">85+ Courses</p>
            </div>
          </div>
          
          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "UI/UX Design Masterclass",
                instructor: "Sarah Johnson",
                rating: 4.9,
                students: 1245,
                hours: 24,
                        price: "₹89.99",
        originalPrice: "₹129.99",
                color: "blue"
              },
              {
                title: "Advanced JavaScript",
                instructor: "Michael Chen",
                rating: 4.8,
                students: 985,
                hours: 18,
                        price: "₹69.99",
        originalPrice: "₹99.99",
                color: "purple"
              },
              {
                title: "Digital Marketing 101",
                instructor: "Emily Parker",
                rating: 4.7,
                students: 1540,
                hours: 16,
                        price: "₹59.99",
        originalPrice: "₹89.99",
                color: "green"
              }
            ].map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden">
                <div className="relative">
                  <img 
                    src={`/api/placeholder/400/200`}
                    alt={course.title} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-semibold">
                    Featured
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-2">
                    <span className={`inline-block w-8 h-8 rounded-full bg-${course.color}-100 text-${course.color}-600 flex items-center justify-center mr-2`}>
                      {course.instructor.charAt(0)}
                    </span>
                    <span className="text-sm text-gray-600">{course.instructor}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center text-yellow-500 mr-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-sm font-medium">{course.rating}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{course.students}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm ml-3">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{course.hours}h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-bold text-lg">{course.price}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">{course.originalPrice}</span>
                    </div>
                    <button className={`text-${course.color}-600 hover:text-${course.color}-700 text-sm font-medium flex items-center`}>
                      View Details <ChevronRight className="ml-1 w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-gray-700">
              Explore All Courses
            </button>
          </div>
        </div>
      </section>
      
      {/* Get Best Education Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Get Best Education</h2>
              <p className="text-gray-600 mb-6">
                Our platform provides high-quality education from industry experts that helps you advance your career and achieve your goals.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Access to 10,000+ online courses",
                  "Learn from industry experts",
                  "Flexible learning schedule",
                  "Certification on completion"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Get Started Now
              </button>
            </div>
            <div className="md:w-1/2">
              <img 
                src="/api/placeholder/500/400" 
                alt="Student with books" 
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Student Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What Our Students Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "The courses were comprehensive and well-structured. I've learned skills that I'm now using daily in my job. The instructors were knowledgeable and supportive."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 mr-4">
                    <img 
                      src="/api/placeholder/48/48" 
                      alt="Student" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">Alex Thompson</h4>
                    <p className="text-sm text-gray-500">Web Developer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Certification Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">Courses Aligned For Industry-Ready Skills Improvement</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {[
              {
                title: "Certified Programs",
                icon: "BookOpen",
                description: "Industry recognized certification"
              },
              {
                title: "Expert Instructors",
                icon: "Users",
                description: "Learn from professionals"
              },
              {
                title: "Flexible Learning",
                icon: "Clock",
                description: "Study at your own pace"
              },
              {
                title: "Career Support",
                icon: "Star",
                description: "Job placement assistance"
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated With EduLearn</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Subscribe to our newsletter for the latest course updates, learning tips, and special offers.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full md:flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full md:w-auto px-6 py-3 bg-white text-blue-600 rounded-md hover:bg-blue-50 font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="font-bold text-white">E</span>
                </div>
                <span className="font-bold text-lg">EduLearn</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Providing high-quality online education to help you learn new skills and advance your career.
              </p>
              <div className="flex space-x-4">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map((social, index) => (
                  <a key={index} href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                {['About Us', 'Features', 'Our Pricing', 'Latest News'].map((item, index) => (
                  <li key={index}><a href="#" className="hover:text-white">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                {['FAQ', 'Help Center', 'Contact Us', 'Privacy Policy'].map((item, index) => (
                  <li key={index}><a href="#" className="hover:text-white">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Get In Touch</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <span className="mr-3">📍</span>
                  <span>123 Street Name, City, Country</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">📧</span>
                  <span>support@edulearn.com</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">📞</span>
                  <span>+1 234 567 8900</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 EduLearn. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EducationLandingPage;