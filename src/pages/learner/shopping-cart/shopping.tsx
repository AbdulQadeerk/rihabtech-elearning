import React from 'react';
import { Button } from '../../../components/ui/button';
// import './App.css';

function ShoppingCart() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-5xl text-[#ff7700] font-semibold font-['Poppins'] leading-[60px]">Your Shopping Cart</h1>

            <div className="flex flex-col lg:flex-row gap-8 mt-8">
                {/* Left side - Cart Items */}
                <div className="w-full lg:w-2/3">
                    <div className="mb-4">
                        <h2 className="section-title text-2xl mb-1">Shopping cart</h2>
                        <p className="text-[#1e1e1e] text-sm font-medium font-['Nunito']">You have 3 item in your cart</p>
                    </div>

                    {/* Cart Items */}
                    {[1, 2, 3].map((item, index) => (
                        <div key={index} className="shadow-md border border-gray-200 bg-white rounded-[15px] p-4 mb-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <img src="/Images/icons/Rectangle.png" alt="Design Course" className="w-24 h-24 object-cover mr-4" />
                                <div>
                                    <h3 className="text-[#1e1e1e] text-lg font-medium font-['Poppins']">Design Course</h3>
                                    <p className="text-[#1e1e1e] text-sm font-medium font-['Nunito']">Lorem ipsum</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <div className="flex items-center border border-gray-300 rounded mr-8">
                                    <button className="px-3 py-1">-</button>
                                    <span className="px-3 py-1">1</span>
                                    <button className="px-3 py-1">+</button>
                                </div>

                                <div className="flex items-center">
                                    <p className="text-[#ff7700] text-2xl font-medium font-['Poppins'] mr-4">₹681</p>
                                    <button >
                                        <img src="Images/icons/Trash.png" alt="Logo" className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Discount Code */}
                    <div className="mt-8 flex">
                        <input
                            type="text"
                            placeholder="Add voucher discount"
                            className="flex-grow p-4 border border-gray-300 rounded-l-lg focus:outline-none"
                        />
                        <button className="btn-rouded bg-orange-500 text-white px-6 rounded-r-lg">
                            Apply Code
                        </button>
                    </div>
                </div>

                {/* Right side - Order Summary */}
                <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-[#181818] text-2xl font-medium font-['Kumbh_Sans'] leading-[30px] mb-6">Order Summary</h2>

                        <div className="flex justify-between mb-4 text-[#181818] text-base font-semibold font-['Kumbh_Sans'] leading-relaxed">
                            <span className="">Subtotal</span>
                            <span className="">-₹80.00</span>
                        </div>

                        <div className="flex justify-between mb-4 text-[#181818] text-base font-semibold font-['Kumbh_Sans'] leading-relaxed">
                            <span className="">Discounts</span>
                            <span className="">-₹80.00</span>
                        </div>

                        <div className="flex justify-between mb-4 text-[#181818] text-base font-semibold font-['Kumbh_Sans'] leading-relaxed">
                            <span className="">Shipping</span>
                            <div className="flex items-center">
                                <input type="radio" checked className="mr-2" id="free-shipping" name="shipping" />
                                <label htmlFor="free-shipping" className="text-[#181818] text-base font-normal font-['Kumbh_Sans'] leading-relaxed">Free Shipping</label>
                                <span className=" ml-6">₹0.00</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 my-6"></div>

                        <div className="flex justify-between mb-6">
                            <span className="text-[#181818] text-2xl font-medium font-['Kumbh_Sans'] leading-[30px]">Total</span>
                            <span className="text-primary text-2xl font-medium font-['Kumbh_Sans'] leading-[30px]" >₹186.99</span>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center">
                                <input type="checkbox" id="terms" className="mr-2" />
                                <label htmlFor="terms">I agree with the <a href="/#/terms-of-use" className="underline">Terms And Conditions</a></label>
                            </div>
                        </div>

                        <Button className="w-full text-white mb-4 rounded-none py-3"
                        onClick={() => {
                            window.location.href = '/#/learner/payment';
                          }}>
                            Process To Checkout
                        </Button>



                        <div className="text-center">
                            <a href="#" className="text-blue-600 underline">Or continue shopping</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShoppingCart;