import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";

export const MyCartMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    setTimeout(() => {
      window.location.href = '/#/learner/shopping-cart';
    }, 100);
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
      <HoverCardContent className="w-96 md:w-[500px] bg-white rounded-md shadow-2xl p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={handleCheckout}
            className="w-full py-2 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-50 transition"
          >
            View Cart
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
