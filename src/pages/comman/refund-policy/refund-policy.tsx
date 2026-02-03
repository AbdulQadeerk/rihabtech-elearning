import React from 'react';
import CommanLayout from '../layout';

const refundPoints = [
  {
    title: 'Returns and Refunds Policy',
    content: [
      'Thank you for shopping at zafarkarnalkar6142.ongraphy.com'
    ]
  },
  {
    title: 'Non-tangible irrevocable goods ("Digital products")',
    content: [
      'We do not issue refunds for non-tangible irrevocable goods ("digital products") once the order is confirmed and the product is sent.',
      'We recommend contacting us for assistance if you experience any issues receiving or downloading our products.'
    ]
  },
  {
    title: 'Contact us for any issues',
    content: [
      'If you have any questions about our Returns and Refunds Policy, please contact us:',
      'By email: zafar.karnalkar@gmail.com'
    ]
  }
];

const RefundPolicy = () => {
  return (
    <section className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">Refund <span className="text-primary">Policy</span></h1>
        <p className="text-lg text-gray-700 mb-10 text-center mx-auto">
          Please read this Refund Policy carefully to understand our terms regarding returns and refunds.
        </p>
        <div className="space-y-10">
          {refundPoints.map((point, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-semibold text-[#181818] mb-3 flex items-center">
                <span className="inline-block w-6 h-6 bg-primary rounded-full text-sm text-white flex items-center justify-center mr-2 font-bold">{idx + 1}</span>
                {point.title}
              </h2>
              <ul className="list-disc pl-10 text-gray-700 space-y-2">
                {point.content.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RefundPolicy; 