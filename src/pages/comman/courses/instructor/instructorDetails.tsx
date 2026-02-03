import { useState, useEffect } from "react";
import { Facebook, Linkedin, Share2, Star, Twitter, User, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InstructorCourses from "./courses";
import {
  getInstructorById,
  InstructorDetails,
} from "../../../../utils/instructorService";
import { chatService } from "../../../../utils/chatService";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";
import { testFirebaseConnection, testChatConversationWrite } from "../../../../utils/firebaseTest";

export default function InstructorDetailsPage() {
  const [instructor, setInstructor] = useState<InstructorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get instructor ID from URL (handle hash-based routing)
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const instructorId = urlParams.get("id") || ""; // Demo Instructor
        
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
        setLoading(false);
      }
    };

    fetchInstructor();
  }, []);

  const handleMessageInstructor = async () => {
    if (!user || !instructor) {
      toast.error("Please login to message the instructor");
      return;
    }

    if (!user.UserName) {
      toast.error("User information is incomplete. Please login again.");
      return;
    }

    try {
      setIsCreatingConversation(true);
      console.log("Creating conversation with instructor:", instructor.id);
      console.log("User info:", user);

      // Test Firebase connectivity first (optional - we'll still try to create conversation)
      try {
        const connectionTest = await testFirebaseConnection();
        if (!connectionTest) {
          console.warn("Firebase connection test failed, but continuing with conversation creation");
        }

        const writeTest = await testChatConversationWrite();
        if (!writeTest) {
          console.warn("Firestore write test failed, but continuing with conversation creation");
        }

        console.log("Firebase tests completed");
      } catch (firebaseError) {
        console.warn("Firebase connection test failed, but continuing:", firebaseError);
      }

      // Get URL parameters for course context (handle hash-based routing)
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.split('?')[1] || '');
      const courseId = urlParams.get("courseId");
      const courseName = urlParams.get("courseName");

      console.log("URL parameters:", { courseId, courseName });

        // Check if conversation already exists using the dedicated method
        console.log('Searching for existing conversation with:', {
          instructorId: instructor.id,
          learnerId: user.UserName,
          courseId: courseId || undefined
        });
        const existingConversation = await chatService.findExistingConversation(
          instructor.id,
          user.UserName,
          courseId || undefined
        );
        console.log('Existing conversation found:', existingConversation);

      console.log("Found existing conversation:", existingConversation);

      if (existingConversation) {
        // Navigate to existing conversation
        console.log("Using existing conversation:", existingConversation.id);
        navigate(`/learner/chat?conversationId=${existingConversation.id}`);
        toast.success("Redirecting to existing conversation");
      } else {
        // Create new conversation
        console.log("No existing conversation found, creating new one");

        const conversationData = {
          participants: [instructor.id, user.UserName],
          participantNames: [instructor.firstName + " " + instructor.lastName, user.UserName],
          lastMessage: "",
          lastMessageTime: new Date(),
          unreadCount: 0,
          isActive: true,
          // Only include courseId and courseName if they have values
          ...(courseId && courseId.trim() !== "" && { courseId: courseId.trim() }),
          ...(courseName && courseName.trim() !== "" && { courseName: courseName.trim() })
        };

        console.log("Creating new conversation with data:", conversationData);
        const newConversation = await chatService.createConversation(conversationData);
        console.log("Conversation created successfully:", newConversation);

        // Navigate to new conversation
        navigate(`/learner/chat?conversationId=${newConversation.id}`);
        toast.success("Conversation created! You can now message the instructor.");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        user: user,
        instructor: instructor
      });
      toast.error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="gradient-header">
          <div className="container mx-auto w-full flex justify-center">
            <div className="text-left text-white text-4xl font-bold font-['Spartan'] leading-[50.40px]">
              Instructor Details
            </div>
          </div>
        </section>
        <div className="max-w-4xl mx-auto p-6 bg-white">
          <div className="animate-pulse">
            <div className="flex flex-col md:flex-row gap-20">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="rounded-full bg-gray-200 w-[330px] h-[330px] mb-6"></div>
                <div className="flex gap-3 items-center justify-center mt-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gray-200"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="flex items-center gap-6 mb-6">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="gradient-header">
          <div className="container mx-auto w-full flex justify-center">
            <div className="text-left text-white text-4xl font-bold font-['Spartan'] leading-[50.40px]">
              Instructor Details
            </div>
          </div>
        </section>
        <div className="max-w-4xl mx-auto p-6 bg-white">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  // Show default state if no instructor data
  if (!instructor) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="gradient-header">
          <div className="container mx-auto w-full flex justify-center">
            <div className="text-left text-white text-4xl font-bold font-['Spartan'] leading-[50.40px]">
              Instructor Details
            </div>
          </div>
        </section>
        <div className="max-w-4xl mx-auto p-6 bg-white">
          <div className="text-gray-500 text-center">
            No instructor information available
          </div>
        </div>
      </div>
    );
  }
  // Calculate rating display
  const ratingValue = Math.floor(instructor.rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue % 1 >= 0.5;

  // Debug logging
  console.log("Rendering instructor details page:", {
    instructor: instructor,
    user: user,
    loading: loading,
    error: error,
    isCreatingConversation: isCreatingConversation
  });

  // Check if user is logged in
  if (!user) {
    console.log("User not logged in - Send Message button will not work");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="gradient-header">
        <div className="container mx-auto w-full flex justify-center">
          <div className="text-left text-white text-4xl font-bold font-['Spartan'] leading-[50.40px]">
            Instructor Details
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="flex flex-col md:flex-row gap-20">
          {/* Left column - Profile Image */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="rounded-full overflow-hidden w-[330px] h-[330px] mb-6">
              {instructor.profilePicture ? (
                <img
                  src={instructor.profilePicture}
                  alt={`${instructor.firstName} ${instructor.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl font-bold">
                  {instructor.firstName.charAt(0)}
                  {instructor.lastName.charAt(0)}
                </div>
              )}
            </div>

            {/* Message Button - Prominent like Udemy */}
            <div className="w-full mt-6">
              {user ? (
                <button
                  onClick={handleMessageInstructor}
                  disabled={isCreatingConversation}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle size={20} />
                  {isCreatingConversation ? "Creating..." : "Send Message"}
                </button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                  <MessageCircle size={20} />
                  Please login to send message
                </div>
              )}
            </div>

            <div className="flex gap-3 items-center justify-center mt-4">
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Share2 size={18} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Facebook size={18} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Twitter size={18} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
                <Linkedin size={18} />
              </button>
            </div>
          </div>

          {/* Right column - Instructor details */}
          <div className="w-full md:w-2/3">
            <div className="mb-12">
              <div className="text-primary text-[15px] font-medium font-['Poppins'] leading-[15px] mb-4">
                INSTRUCTOR
              </div>
              <h1 className="text-[#181818] text-[28px] font-bold font-['Spartan'] leading-7 mb-2">
                {instructor.firstName} {instructor.lastName}
              </h1>
              <p className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-relaxed mb-4">
                {instructor.role === "instructor"
                  ? "Instructor"
                  : instructor.role}
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
                      className={`${i < fullStars
                          ? "fill-yellow-400 text-yellow-400"
                          : i === fullStars && hasHalfStar
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                    />
                  ))}
                  <span className="text-[#181818] text-[12px] md:text-sm font-medium font-['Poppins'] leading-[14px] ml-1">
                    ({instructor.rating} Rating
                    {instructor.rating !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            </div>

            {/* About Me Section */}
            <div className="mb-12">
              <h2 className="details-title mb-4">About Me</h2>
              {instructor.bio ? (
                <p className="details-description">{instructor.bio}</p>
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
                    <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">
                      Address:
                    </span>
                    <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">
                      {instructor.address}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">
                    Email:
                  </span>
                  <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">
                    {instructor.email}
                  </span>
                </div>
                {instructor.phone && (
                  <div className="flex gap-2">
                    <span className="text-[#181818] text-[15px] font-semibold font-['Spartan'] leading-9">
                      Phone:
                    </span>
                    <span className="text-[#808080] text-[15px] font-normal font-['Poppins'] leading-9">
                      {instructor.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <InstructorCourses />
    </div>
  );
}
