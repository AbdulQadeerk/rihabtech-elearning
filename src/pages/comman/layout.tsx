
import Header from "../../layouts/header";
import AdvertiseBanner from "../../layouts/addbanner";
import Footer from "../../layouts/footer";
import { useState } from "react";
import { UserMobileSidebar } from "../../layouts/sidebar";

const CommanLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>
    <AdvertiseBanner />
       <Header onMenuClick={toggleSidebar}/>
      <div className="block md:hidden flex-1 relative z-50">
              <UserMobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <main className="flex-1">{children}</main>
            </div>
            <div className="md:block hidden">
        <main>{children}</main>
      </div>
      <Footer/>
    </>
  );
};

export default CommanLayout;