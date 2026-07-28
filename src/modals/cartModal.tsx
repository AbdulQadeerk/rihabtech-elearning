import { Dialog, DialogContent, DialogOverlay } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

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
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="md:w-1/3">
              <img
                src={cartItem.image || "/Logos/brand-icon.png"}
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
            <Button
              variant={'outline'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
