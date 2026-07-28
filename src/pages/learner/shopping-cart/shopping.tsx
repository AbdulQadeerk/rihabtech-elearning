import React from 'react';
import { Button } from '../../../components/ui/button';

function ShoppingCart() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-5xl text-[#ff7700] font-semibold font-['Poppins'] leading-[60px]">Your Shopping Cart</h1>

            <div className="flex flex-col items-center justify-center py-16 mt-8 bg-gray-50 rounded-lg">
                <h2 className="section-title text-2xl mb-2">Your cart is empty</h2>
                <p className="text-[#1e1e1e] text-sm font-medium font-['Nunito'] mb-6">
                    Browse courses and add them to your cart to get started.
                </p>
                <Button
                    className="rounded-none"
                    onClick={() => {
                        window.location.href = '/#/courselist';
                    }}
                >
                    Browse Courses
                </Button>
            </div>
        </div>
    );
}

export default ShoppingCart;
