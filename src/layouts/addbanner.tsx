import { useFrontendSettings } from '../hooks/useFrontendSettings';

function AdvertiseBanner() {
    const { settings, loading } = useFrontendSettings();
    
    // Only show the message from the API. Hide the banner if no message is set or if loading.
    const message = settings?.Frontend_WelcomeMessage;

    if (loading || !message) {
        return null;
    }

    return (
        <header id="advertisebanner" className="sticky top-0 z-50 bg-black shadow-sm">
        <div className="container mx-auto px-2 py-2 flex items-center justify-center">
          <div className="justify-center text-white text-base font-normal font-['Barlow'] leading-relaxed">
            {message}
          </div>
        </div>
      </header>
    );
  }
  
  export default AdvertiseBanner;