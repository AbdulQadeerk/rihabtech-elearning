// import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

import { Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 font-['Montserrat']">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Company Info</h3>
            <ul className="space-y-2">
              <li><a href="#/aboutUs" className="hover:text-gray-300">About Us</a></li>
              <li><a href="/carrier" className="hover:text-gray-300">Carrier</a></li>
              <li><a href="/hiring" className="hover:text-gray-300">We are hiring</a></li>
              <li><a href="/blog" className="hover:text-gray-300">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#/terms-of-use" className="hover:text-gray-300">Terms and Conditions</a></li>
              <li><a href="#/privacy-policy" className="hover:text-gray-300">Privacy Policies</a></li>
              <li><a href="#/refund-policy" className="hover:text-gray-300">Refund Policies</a></li>
              <li><a href="#/contactUs" className="hover:text-gray-300">Contact Us</a></li>
              <li><a href="/carrier" className="hover:text-gray-300">Carrier</a></li>
              <li><a href="/hiring" className="hover:text-gray-300">We are hiring</a></li>
              <li><a href="/blog" className="hover:text-gray-300">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              <li><a href="/business" className="hover:text-gray-300">Business Marketing</a></li>
              <li><a href="/analytics" className="hover:text-gray-300">User Analytic</a></li>
              <li><a href="/chat" className="hover:text-gray-300">Live Chat</a></li>
              <li><a href="/support" className="hover:text-gray-300">Unlimited Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/ios-android" className="hover:text-gray-300">IOS & Android</a></li>
              <li><a href="/demo" className="hover:text-gray-300">Watch a Demo</a></li>
              <li><a href="/customers" className="hover:text-gray-300">Customers</a></li>
              <li><a href="/api" className="hover:text-gray-300">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Get In Touch</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-lg">(480) 555-0103</span>
              </li>
              <li className="flex items-center gap-2">
                <span>4517 Washington Ave. Manchester, Kentucky</span>
              </li>
              <li className="flex items-center gap-2">
                <span>debra.holt@example.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4">
          <a href="#" className="text-[#FF553E] hover:text-[#ff553e]/80">
            <img src="Images/icons/facebook sec-.png" alt="Logo" className="h-8 w-8" />
          </a>
          <a href="#" className="text-[#FF553E] hover:text-[#ff553e]/80">
            <img src="Images/icons/ant-design_instagram-outlined.png" alt="Logo" className="h-8 w-8" />
          </a>
          <a href="#" className="text-[#FF553E] hover:text-[#ff553e]/80">
            <img src="Images/icons/twitter sec-.png" alt="Logo" className="h-8 w-8" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 