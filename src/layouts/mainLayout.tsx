import { useLocation } from "react-router-dom";
import Header from "./header";
import AdvertiseBanner from "./addbanner";
import { useState } from "react";
import { UserMobileSidebar } from "./sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // hide header on these paths
  const hideHeaderOn = ["/login", "/signup"];
  const shouldHideHeader = hideHeaderOn.includes(location.pathname);
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>{!shouldHideHeader && <AdvertiseBanner />}
      {!shouldHideHeader && <Header  onMenuClick={toggleSidebar}/>}
      <div className="block md:hidden flex-1 relative z-50">
                    <UserMobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <main className="flex-1">{children}</main>
                  </div>
                  <div className="md:block hidden">
        <main>{children}</main>
      </div>
    </>
  );
};

export default MainLayout;