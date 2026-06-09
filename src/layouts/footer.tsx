import { useFrontendSettings } from '../hooks/useFrontendSettings';

const Footer = () => {
  const { settings, loading } = useFrontendSettings();

  const address = settings?.Frontend_Address || 'Spacelance, 204, Sapphire Chambers, Baner Road, Pune, Maharashtra 411045';
  const phone = settings?.Frontend_PhoneNumber || '+91 8956444784';
  const email = settings?.Frontend_ContactEmail || 'connect@zktutorials.com';
  const instagramLink = settings?.Frontend_InstagramLink || 'https://www.instagram.com/zktutorials/';
  const youtubeLink = settings?.Frontend_YoutubeLink || 'https://www.youtube.com/@zafarkarnalkar';
  const facebookLink = settings?.Frontend_FacebookLink || '';
  const twitterLink = settings?.Frontend_TwitterLink || '';
  const linkedinLink = settings?.Frontend_LinkedInLink || '';

  return (
    <footer className="bg-black text-white py-16 font-['Montserrat']">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl mb-2 text-[#FF553E]">Get In Touch</h3>
            <p className="text-gray-400 max-w-sm whitespace-pre-wrap">
              {address}
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-xl font-bold">{phone}</span>
            <a href={`mailto:${email}`} className="text-[#FF553E] hover:underline">{email}</a>
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
            {facebookLink && (
              <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <i className="ri-facebook-fill text-2xl"></i>
              </a>
            )}
            {twitterLink && (
              <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <i className="ri-twitter-fill text-2xl"></i>
              </a>
            )}
            {linkedinLink && (
              <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <i className="ri-linkedin-fill text-2xl"></i>
              </a>
            )}
            {instagramLink && (
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center justify-center">
                <img src="Images/icons/ant-design_instagram-outlined.png" alt="Instagram" className="h-6 w-6" />
              </a>
            )}
            {youtubeLink && (
              <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center justify-center">
                <img src="Images/icons/youtube.png" alt="YouTube" className="h-6 w-6 object-contain" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 