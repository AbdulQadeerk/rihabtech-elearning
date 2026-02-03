import React from 'react';

// This component contains just the two sections shown in the image
const TestimonialsSection: React.FC = () => {
  return (
    <>
     
      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">
            Why Students Love US?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 border border-gray-200 rounded-lg">
            <div className="text-center mb-6 flex justify-center">
            <span className="text-gray-300 text-center font-serif"><img src='Images/icons/SVG.png' alt='"'className='h-[48px] w-[48px]' /></span>
              </div>
              <p className="text-gray-600 text-center mb-8">
                "Taking courses here was a game-changer. The lessons are clear, actionable, and the certificates helped me to get my dream job for which I was waiting from a long time!"
              </p>
              <div className="flex items-center justify-center">
                <div className="mr-4">
                  <img 
                    src="Images/users/team 2.jpg" 
                    alt="DeVeor R" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Mahi Kukreja</h4>
                  <p className="text-gray-500 text-sm">Learner</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white p-8 border border-gray-200 rounded-lg">
              <div className="text-center mb-6 flex justify-center">
                <span className="text-gray-300 text-center font-serif"><img src='Images/icons/SVG.png' alt='"'className='h-[48px] w-[48px]' /></span>
              </div>
              <p className="text-gray-600 text-center mb-8">
                "The instructors are top-notch, and the platform is so easy to use. I built my first app after completing a Developer course here. Which even got publish on Play Store!"
              </p>
              <div className="flex items-center justify-center">
                <div className="mr-4">
                  <img 
                    src="Images/users/Container.jpg" 
                    alt="Tony Chester" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Raunak Khurana</h4>
                  <p className="text-gray-500 text-sm">Learner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TestimonialsSection;