import React, { useState } from 'react';
import { Star, Users, BookOpen, MessageCircle } from 'lucide-react';

interface InstructorDetailsProps {
  imageUrl: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
  shortBio: string;
  fullBio: string;
}

const InstructorDetails: React.FC<InstructorDetailsProps> = ({
  imageUrl,
  name,
  title,
  rating,
  reviews,
  students,
  courses,
  shortBio,
  fullBio,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800">Instructor</h2>
      <h3 className="text-xl font-semibold text-primary mt-4 hover:underline cursor-pointer" onClick={()=>{window.location.href = '/#/instructorDetails'}}>{name}</h3>
      <p className="text-gray-600">{title}</p>

      <div className="flex items-start gap-4 mt-4">
        <img
          src={imageUrl}
          alt={name}
          className="w-24 h-24 rounded-full object-cover border border-gray-300"
        />
        <div className="flex flex-col gap-2 text-[#181818] text-[15px] font-medium font-['Poppins'] leading-relaxed">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            <span>{rating} Instructor Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-primary" />
            <span>{reviews.toLocaleString()} Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span>{students.toLocaleString()} Students</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span>{courses} Courses</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700 leading-relaxed">
        {showMore ? fullBio : shortBio}
        <button
          className="text-primary font-semibold mt-2 flex items-center gap-1"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Show less' : 'Show more'}
          <svg
            className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InstructorDetails;
