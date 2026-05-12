const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 font-['Montserrat']">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl mb-2 text-[#FF553E]">Get In Touch</h3>
            <p className="text-gray-400 max-w-sm">
              Spacelance, 204, Sapphire Chambers, Baner Road, Pune, Maharashtra 411045
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-xl font-bold">+91 8956444784</span>
            <a href="mailto:connect@zktutorials.com" className="text-[#FF553E] hover:underline">connect@zktutorials.com</a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <ul className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm font-medium">
            <li><a href="#/privacy-policy" className="hover:text-[#FF553E] transition-colors">Privacy policy</a></li>
            <li><a href="#/terms-of-use" className="hover:text-[#FF553E] transition-colors">Terms of use</a></li>
            <li><a href="#/contactUs" className="hover:text-[#FF553E] transition-colors">Contact us</a></li>
            <li><a href="#/refund-policy" className="hover:text-[#FF553E] transition-colors">Refund policy</a></li>
          </ul>

          <div className="flex gap-4">
            <a href="https://www.instagram.com/zktutorials/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="Images/icons/ant-design_instagram-outlined.png" alt="Instagram" className="h-6 w-6" />
            </a>
            <a href="https://www.youtube.com/@zafarkarnalkar" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="Images/icons/youtube.png" alt="YouTube" className="h-6 w-6 object-contain" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 