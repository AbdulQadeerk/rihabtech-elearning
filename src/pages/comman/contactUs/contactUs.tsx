import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { useFrontendSettings } from '../../../hooks/useFrontendSettings';

export default function ContactUs() {
    const { settings, loading } = useFrontendSettings();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
          ...prevState,
          [name]: value
        }));
      };
    
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
        // Reset form after submission
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      };

      const address = settings?.Frontend_Address || 'Spacelance, 204, First Floor, Sapphire Chambers,\nBaner Road, Baner, Pune,\nMaharashtra, India 411045';
      const phone = settings?.Frontend_PhoneNumber || '+91 8956444784';
      const email = settings?.Frontend_ContactEmail || 'connect@zktutorials.com';
      const facebookLink = settings?.Frontend_FacebookLink || '';
      const twitterLink = settings?.Frontend_TwitterLink || '';
      const linkedinLink = settings?.Frontend_LinkedInLink || '';
      const instagramLink = settings?.Frontend_InstagramLink || '';
      const youtubeLink = settings?.Frontend_YoutubeLink || '';

    return(
<div className="flex flex-col min-h-screen">
<section className="gradient-header">
                <div className="container mx-auto">
                    <h1 className="header-title">Contact Us</h1>
                </div>
            </section>
            <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column - Company Info */}
        <div className="lg:w-1/2">
          <h2 className="text-[#181818] text-[28px] font-bold font-['Spartan'] leading-10 mb-6">
            We're Always Eager to<br />Hear From You!
          </h2>
          
          <div className="mb-8">
            <h3 className=" text-[#181818] text-lg font-semibold font-['Spartan'] leading-relaxed mb-2">Address</h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {address}
            </p>
          </div>
          
          <div className="mb-8">
            <h3 className=" text-[#181818] text-lg font-semibold font-['Spartan'] leading-relaxed mb-2">Email</h3>
            <p className="text-[#181818] text-[15px] font-normal font-['Poppins'] leading-relaxed">{email}</p>
          </div>
          
          <div className="mb-8">
            <h3 className=" text-[#181818] text-lg font-semibold font-['Spartan'] leading-relaxed mb-2">Phone</h3>
            <p className="text-[#181818] text-[15px] font-normal font-['Poppins'] leading-relaxed">{phone}</p>
          </div>
          
          <div className="flex space-x-4 mt-8">
            <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <Share2 size={16} className="text-gray-600" />
            </button>
            {facebookLink && (
              <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors inline-block">
                <Facebook size={16} className="text-gray-600" />
              </a>
            )}
            {twitterLink && (
              <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors inline-block">
                <Twitter size={16} className="text-gray-600" />
              </a>
            )}
            {linkedinLink && (
              <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors inline-block">
                <Linkedin size={16} className="text-gray-600" />
              </a>
            )}
            {instagramLink && (
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors inline-flex items-center justify-center">
                <img src="Images/icons/ant-design_instagram-outlined.png" alt="Instagram" className="h-4 w-4" />
              </a>
            )}
            {youtubeLink && (
              <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors inline-flex items-center justify-center">
                <img src="Images/icons/youtube.png" alt="YouTube" className="h-4 w-4 object-contain" />
              </a>
            )}
          </div>
        </div>
        
        {/* Right Column - Contact Form */}
        <div className="lg:w-1/2 bg-white/0 rounded-[5px] shadow-[0px_0px_50px_0px_rgba(26,46,85,0.10)] p-12">
          <h2 className="text-[#181818] text-xl font-semibold font-['Spartan'] leading-7 mb-2">Get In Touch</h2>
          <p className="text-gray-600 mb-6">
            Fill out this form for booking a consultant advising session.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              
              <Input 
                  type="text" 
                  placeholder="Your name *"
                />
            </div>
            
            <div className="mb-4">
            <Input 
                  type="text" 
                  placeholder="Enter your email *"
                />
            </div>
            
            <div className="mb-4">
            <Input 
                  type="text" 
                  placeholder="Subject"
                />
            </div>
            
            <div className="mb-6">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className=" w-full rounded-none border border-input bg-transparent px-3 py-1 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                placeholder="Your Message"
              ></textarea>
            </div>
            
            <Button
              type="submit"
              className="px-6 py-4 font-medium flex items-center"
            >
              <span>Submit Message</span>
              <ArrowRight size={12} />
            </Button>
          </form>
        </div>
      </div>
      

    </div>
          {/* Map Section */}
      <div className="mt-12 h-96 w-full rounded-lg overflow-hidden">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.5426385770856!2d-0.12174568439216706!3d51.50330061882345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604b900d26973%3A0x4291f3172409ea92!2sLondon%20Eye!5e0!3m2!1sen!2sus!4v1619456763201!5m2!1sen!2sus" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy"
          title="Company Location"
        ></iframe>
      </div>
</div>
    )
}