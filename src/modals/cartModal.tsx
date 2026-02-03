import { X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "../components/ui/dialog";
import { CourseCard } from "../pages/comman/courses/courseList";
import { Button } from "../components/ui/button";

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
    ];
  
  // Main Cart Modal Component
  interface CartItem {
    id: number;
    title: string;
    description: string;
    students: number;
    duration: string;
    price: number;
    originalPrice?: number;
    image: string;
  }

  interface CartModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    cartItem: CartItem | null;
  }

  const CartModal: React.FC<CartModalProps> = ({ isOpen, setIsOpen, cartItem }) => {
    if (!cartItem) {
      return null;
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="sm:max-w-3xl bg-white p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-primary text-3xl font-semibold font-['Poppins'] leading-[60px]">Added To Cart</h2>
              {/* <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button> */}
            </div>
  
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="md:w-1/3">
                <img 
                  src={cartItem.image || "/api/placeholder/300/200"} 
                  alt={cartItem.title} 
                  className="w-full h-42 object-cover rounded-lg"
                />
              </div>
              <div className="md:w-2/3 flex flex-col justify-between">
                <div>
                  <h3 className="text-[#1e1e1e] text-lg font-medium font-['Poppins'] mb-2">{cartItem.title}</h3>
                  <p className="text-[#1e1e1e] text-sm font-medium font-['Nunito'] mb-4">{cartItem.description}</p>
                </div>
                <div className="flex justify-end">
                  <span className="text-primary font-['Kumbh_Sans'] font-bold text-2xl">₹{cartItem.price}</span>
                </div>
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Button variant={'outline'}
                className="px-6 py-5 border-primary text-primary font-medium rounded-none hover:bg-orange-50 focus:outline-none transition-colors"
                onClick={() => {
                    window.location.href = '/#/learner/payment';
                  }}
              >
                Proceed To Checkout
              </Button>
              <Button 
                className="px-6 py-5 bg-primary text-white font-medium rounded-none hover:bg-primary-600 focus:outline-none transition-colors"
                onClick={() => {
                    window.location.href = '/#/learner/shopping-cart';
                  }}
              >
                Go To Cart
              </Button>
            </div>
  
            <div className="border-t pt-4">
            <div className="mb-6 text-[#ff7700] text-xl font-semibold font-['Poppins'] leading-[60px]">You May Like</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course, index) => (
              <CourseCard key={index} course={course} />
            ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  export default CartModal;