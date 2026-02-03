import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";

export const MyCartMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false); // close the popover
    setTimeout(() => {
      window.location.href = '/#/learner/payment'; // redirect after closing
    }, 100); // short delay ensures popover closes smoothly
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div className="ml-0 md:ml-4 relative">
          <button className="relative" onClick={() => setIsOpen(!isOpen)}>
            <ShoppingCart />
          </button>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className=" w-96 md:w-[500px] bg-white rounded-md shadow-2xl p-4">
        {mycartlist.map((course, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 mb-1 bg-white rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                  <div className="text-xl font-bold text-orange-500">{course.price}</div>
                </div>
                <p className="text-gray-600 text-sm mt-1">{course.description}</p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-2 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 transition"
            >
              Proceed To Checkout
            </button>
            <div className="border-b mt-2 border-gray-300"></div>
          </div>
        ))}
      </HoverCardContent>
    </HoverCard>
  );
};

const mycartlist = [
  {
    title: 'Design Course',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam placerat ac augue ac sagittis.',
    imageUrl: 'Images/courses/Rectangle 24.png',
    price: '₹186,99',
  },
  {
    title: 'Design Course',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam placerat ac augue ac sagittis.',
    imageUrl: 'Images/courses/Rectangle 24.png',
    price: '₹186,99',
  },
  {
    title: 'Design Course',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam placerat ac augue ac sagittis.',
    imageUrl: 'Images/courses/Rectangle 24.png',
    price: '₹186,99',
  },
];
