
import { BellIcon, Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProfileMenu } from "../modals/profileHoverCard";

type InstructorHeaderProps = {
    onMenuClick: () => void;
  };

function InstructorHeader({ onMenuClick }: InstructorHeaderProps) {


    return (
        <header className={` top-0 fixed bg-primary md:bg-white shadow-sm z-99 w-full `} style={{zIndex: 99}}>
              <div className="flex items-center p-2 space-x-1 cursor-pointer md:hidden">
              <button onClick={onMenuClick}>
          <Menu className="text-white" />
        </button>
    </div>
            <div className="hidden mx-auto px-10 py-4 gap-16 md:flex items-center justify-between">
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => window.location.href = '/#'}>
                    <img src="Logos/brand-icon.png" alt="Logo" className="h-[36px] w-[48px]" />
                    <img src="Logos/brand-name-img.png" alt="Logo" className="h-[15px] w-[181px] mt-1" />
                </div>

                <div className="flex items-center">
                    <Button className="px-4 py-2 text-sm rounded-none font-medium text-white hover:opacity-50" onClick={() => window.location.href = '/#/learner/homepage'}>Student</Button>
                    <div className="ml-4 relative">
                        <button className="relative">
                            <BellIcon />
                        </button>
                    </div>
                    <ProfileMenu />
                </div>
            </div>
        </header>
    );
}


export default InstructorHeader;