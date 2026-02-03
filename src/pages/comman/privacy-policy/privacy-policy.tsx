import React from 'react';
import CommanLayout from '../layout';

const privacyPoints = [
  {
    title: 'Introduction',
    content: [
      'By visiting this Website you agree to be bound by the terms and conditions of this Privacy Policy. If you do not agree please do not use or access our Website.',
      'By mere use of the Website, you expressly consent to our use and disclosure of your personal information in accordance with this Privacy Policy. This Privacy Policy is incorporated into and subject to the Terms of Use.'
    ]
  },
  {
    title: 'Information Collection',
    content: [
      'When you use our Website, we collect and store your personal information which is provided by you from time to time. Our primary goal in doing so is to provide you a safe, efficient, smooth and customized experience. This allows us to provide services and features that most likely meet your needs, and to customize our Website to make your experience safer and easier.',
      'In general, you can browse the Website without telling us who you are or revealing any personal information about yourself. Once you give us your personal information, you are not anonymous to us. Where possible, we indicate which fields are required and which fields are optional.',
      'We may automatically track certain information about you based upon your behaviour on our Website. We use this information to do internal research on our users\' demographics, interests, and behaviour to better understand, protect and serve our users.'
    ]
  },
  {
    title: 'Use of Cookies',
    content: [
      'We use data collection devices such as "cookies" on certain pages of the Website to help analyse our web page flow, measure promotional effectiveness, and promote trust and safety. "Cookies" are small files placed on your hard drive that assist us in providing our services.',
      'We offer certain features that are only available through the use of a "cookie". We also use cookies to allow you to enter your password less frequently during a session. Cookies can also help us provide information that is targeted to your interests.',
      'Most cookies are "session cookies," meaning that they are automatically deleted from your hard drive at the end of a session. You are always free to decline our cookies if your browser permits, although in that case you may not be able to use certain features on the Website.'
    ]
  },
  {
    title: 'Information Use',
    content: [
      'We use personal information to provide the services you request. To the extent we use your personal information to market to you, we will provide you the ability to opt-out of such uses.',
      'We use your personal information to resolve disputes; troubleshoot problems; help promote a safe service; collect money; measure consumer interest in our products and services, inform you about online and offline offers, products, services, and updates; customize your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions.'
    ]
  },
  {
    title: 'Information Sharing',
    content: [
      'We may share personal information with our other corporate entities and affiliates to help detect and prevent identity theft, fraud and other potentially illegal acts; correlate related or multiple accounts to prevent abuse of our services.',
      'We may disclose personal information if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process.',
      'We and our affiliates will share / sell some or all of your personal information with another business entity should we (or our assets) plan to merge with, or be acquired by that business entity, or re-organization, amalgamation, restructuring of business.'
    ]
  },
  {
    title: 'External Links',
    content: [
      'Our Website links to other websites that may collect personally identifiable information about you. SimpliLearnings is not responsible for the privacy practices or the content of those linked websites.'
    ]
  }
];

const PrivacyPolicy = () => {
  return (
    <section className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-center">Privacy <span className="text-primary">Policy</span></h1>
        <p className="text-lg text-gray-700 mb-10 text-center  mx-auto">
          Please read this Privacy Policy carefully to understand how we collect, use, and protect your personal information.
        </p>
        <div className="space-y-10">
          {privacyPoints.map((point, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-semibold text-[#181818] mb-3 flex items-center">
                <span className="inline-block w-6 h-6 bg-primary text-sm rounded-full text-white flex items-center justify-center mr-2 font-bold">{idx + 1}</span>
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

export default PrivacyPolicy; 