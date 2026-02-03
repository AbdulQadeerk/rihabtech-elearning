import { Star, User } from "lucide-react";
import { useState, useEffect } from "react";
import { getInstructorById, InstructorDetails } from "../../../utils/instructorService";

interface InstructorProps {
  instructorId?: string | number;
  loading?: boolean;
}

export default function Instructor({ instructorId, loading = false }: InstructorProps) {
  const [instructor, setInstructor] = useState<InstructorDetails | null>(null);
  const [instructorLoading, setInstructorLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructor = async () => {
      console.log("Instructor component - instructorId:", instructorId);
      if (!instructorId) {
        setInstructorLoading(false);
        return;
      }

      try {
        setInstructorLoading(true);
        setError(null);
        console.log("Fetching instructor with ID:", instructorId);
        const instructorData = await getInstructorById(instructorId);
        console.log("Instructor data received:", instructorData);
        if (instructorData) {
          setInstructor(instructorData);
        } else {
          setError("Instructor not found");
        }
      } catch (err) {
        console.error("Error fetching instructor:", err);
        setError("Failed to load instructor details");
      } finally {
        setInstructorLoading(false);
      }
    };

    fetchInstructor();
  }, [instructorId]);

  // Show loading state
  if (loading || instructorLoading) {
    return (
      <div className="w-full">
        <div className="mb-12">
          <div className="text-primary text-[15px] font-medium font-['Poppins'] leading-[15px] mb-4">INSTRUCTOR</div>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="flex items-center gap-6 mb-6">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
        <div className="mb-12">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full">
        <div className="mb-12">
          <div className="text-primary text-[15px] font-medium font-['Poppins'] leading-[15px] mb-4">INSTRUCTOR</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Show default state if no instructor data
  if (!instructor) {
    return (
      <div className="w-full">
        <div className="mb-12">
          <div className="text-primary text-[15px] font-medium font-['Poppins'] leading-[15px] mb-4">INSTRUCTOR</div>
          <div className="text-gray-500 text-sm">No instructor information available</div>
        </div>
      </div>
    );
  }
  // Calculate rating display
  const ratingValue = Math.floor(instructor.rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue % 1 >= 0.5;

  return (
    <div className="w-full">
      <div className="mb-12">
        <div className="text-primary text-[15px] font-medium font-['Poppins'] leading-[15px] mb-4">INSTRUCTOR</div>
        <h1 className="text-xl font-semibold text-primary mt-4 hover:underline cursor-pointer" onClick={()=>{window.location.href = `/#/instructorDetails?id=${instructor.id}`}}>
          {instructor.firstName} {instructor.lastName}
        </h1>
        <p className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-relaxed mb-4">
          {instructor.role === 'instructor' ? 'Instructor' : instructor.role}
        </p>
        
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-500" />
            <span className="text-[#181818] text-[12px] md:text-[15px] font-normal font-['Poppins'] leading-relaxed">
              {instructor.totalStudents} Students
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={18} 
                className={`${
                  i < fullStars 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : i === fullStars && hasHalfStar
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`} 
              />
            ))}
            <span className="text-[#181818] text-[12px] md:text-sm font-medium font-['Poppins'] leading-[14px] ml-1">
              ({instructor.rating} Rating{instructor.rating !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </div>
      
      {/* About Me Section */}
      <div className="mb-12">
        <h2 className="details-title mb-4">About Me</h2>
        {instructor.bio ? (
          <p className="details-description">
            {instructor.bio}
          </p>
        ) : (
          <p className="details-description text-gray-500 italic">
            No bio available for this instructor.
          </p>
        )}
      </div>
      
      {/* Contact Information */}
      <div>
        <h2 className="details-title mb-4">Contact Me</h2>
        <div className="space-y-3">
          {instructor.address && (
            <div className="flex gap-2">
              <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">Address:</span>
              <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">{instructor.address}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">Email:</span>
            <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">{instructor.email}</span>
          </div>
          {instructor.phone && (
            <div className="flex gap-2">
              <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">Phone:</span>
              <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">{instructor.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}