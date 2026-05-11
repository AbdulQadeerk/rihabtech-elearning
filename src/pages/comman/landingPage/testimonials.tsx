import React, { useState, useEffect } from 'react';
import { testimonialApiService, Testimonial } from '../../../utils/testimonialApiService';

// This component contains just the two sections shown in the image
const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialApiService.getActiveTestimonials();
        setTestimonials(data);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading testimonials...</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Or show nothing if no testimonials
  }

  return (
    <>
      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">
            Why Students Love US?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-8 border border-gray-200 rounded-lg">
                <div className="text-center mb-6 flex justify-center">
                  <span className="text-gray-300 text-center font-serif">
                    <img src='Images/icons/SVG.png' alt='"' className='h-[48px] w-[48px]' />
                  </span>
                </div>
                <p className="text-gray-600 text-center mb-8">
                  "{testimonial.message}"
                </p>
                <div className="flex items-center justify-center">
                  <div className="mr-4">
                    <img 
                      src={testimonial.authorImagePath || "Images/users/team 2.jpg"} 
                      alt={testimonial.authorName} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.authorName}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.designation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default TestimonialsSection;