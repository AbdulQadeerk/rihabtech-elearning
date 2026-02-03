import React, { useState } from 'react';

type PaymentMethodType = 'google' | 'debit' | null;
type CardType = 'axim' | 'hdfc' | null;

function PaymentMethod() {
    const [expandedMethod, setExpandedMethod] = useState<PaymentMethodType>('debit');
    const [selectedCard, setSelectedCard] = useState<CardType>('axim');

    const toggleMethod = (method: PaymentMethodType) => {
        setExpandedMethod(expandedMethod === method ? null : method);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8 mt-8">
                <div className="w-full lg:w-2/3">
                    <h1 className="section-title font-[inter] mb-6">Payment Method</h1>
                    <div
                        className="border border-gray-300 rounded-lg p-4 mb-4 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleMethod('google')}
                    >
                        <div className="flex items-center font-[inter] ">
                            <span className="text-lg">Google Pay</span>
                        </div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>

                    <div
                        className={`border border-gray-300 rounded-lg p-4 mb-4 flex justify-between items-center cursor-pointer ${expandedMethod === 'debit' ? 'rounded-b-none' : ''}`}
                        onClick={() => toggleMethod('debit')}
                    >
                        <div className="flex items-center">
                            <span className="text-lg">Debit Card</span>
                        </div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 text-gray-500 transform ${expandedMethod === 'debit' ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>

                    {expandedMethod === 'debit' && (
                        <div className="border border-gray-300 border-t-0 rounded-b-lg p-4 mb-4">
                            <div className="mb-4">
                                <div
                                    className={`flex items-center justify-between p-3 rounded-lg border mb-3 ${selectedCard === 'axim' ? 'border-primary-color' : 'border-gray-300'}`}
                                    onClick={() => setSelectedCard('axim')}
                                >
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <div className="flex">
                                                <img src="Images/icons/axim.png" alt="Logo" className="h-8 w-18" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium">Axim Bank</span>
                                            <div className="text-gray-500 text-sm">**** **** **** 4578</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`w-5 h-5 rounded-full border-2 ${selectedCard === 'axim' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {selectedCard === 'axim' && <div className="w-3 h-3 bg-blue-500 rounded-full m-auto mt-0.5"></div>}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center justify-between p-3 rounded-lg border ${selectedCard === 'hdfc' ? 'border-primary-color' : 'border-gray-300'}`}
                                    onClick={() => setSelectedCard('hdfc')}
                                >
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <img src="Images/icons/Visa.png" alt="Logo" className="h-6 w-14" />

                                        </div>
                                        <div>
                                            <span className="font-medium">HDFC Bank</span>
                                            <div className="text-gray-500 text-sm">**** **** **** 4521</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`w-5 h-5 rounded-full border-2 ${selectedCard === 'hdfc' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {selectedCard === 'hdfc' && <div className="w-3 h-3 bg-blue-500 rounded-full m-auto mt-0.5"></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="flex items-center text-gray-600 p-2 rounded-lg">
                                <img
                                    src="\Images\icons\add.png" // Replace with your actual image path
                                    alt="Add Icon"
                                    className="h-5 w-5 mr-2 object-contain"
                                />
                                
                                Add New Cards
                            </button>
                        </div>
                    )}

                    <div className="border border-gray-300 rounded-lg p-4 flex justify-center items-center cursor-pointer">
                        <img
                            src="\Images\icons\add.png" // Replace with your actual image path
                            alt="Add Icon"
                            className="h-5 w-5 mr-2 object-contain"
                        />
                        <span className="text-gray-600">Add New Method</span>
                    </div>

                </div>

                <div className="w-full ml-0 md:ml-16 mt-16 lg:w-1/3 ">
                    <div className="bg-gray-100 p-6 rounded-lg">
                        <h2 className="section-title font-[Kumbh Sans] text-xl mb-6">Order Summary</h2>

                        <div className="flex justify-between mb-4">
                            <span className="text-gray-700">Subtotal</span>
                            <span>-₹80.00</span>
                        </div>

                        <div className="flex justify-between mb-4">
                            <span className="text-gray-700">Discounts</span>
                            <span>-₹80.00</span>
                        </div>

                        <div className="flex justify-between mb-4">
                            <span className="text-gray-700">Shipping</span>
                            <div className="flex items-center">
                                <input type="radio" checked className="mr-2" id="free-shipping" name="shipping" />
                                <label htmlFor="free-shipping">Free Shipping</label>
                                <span className="ml-2">₹0.00</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 my-6"></div>

                        <div className="flex justify-between mb-6">
                            <span className="text-xl font-bold">Total</span>
                            <span className="text-xl font-bold" style={{ color: '#FF7700' }}>₹186.99</span>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="hidden peer" id="terms" />
                                <div className="w-4 h-4 rounded-full border border-gray-400 peer-checked:bg-gray-600 peer-checked:border-blue-600 mr-2 mt-1 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white hidden peer-checked:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>
                                    I agree with the <a href="#/terms-of-use" className="underline font-bold">Terms And Conditions</a>
                                </span>
                            </label>
                        </div>


                        <button className="p-2 w-full bg-orange-500 text-white mb-4">
                            Process To Checkout
                        </button>

                        <div className="text-center">
                            <a href="#" className="text-gray-600 font-bold">Or continue shopping</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentMethod;