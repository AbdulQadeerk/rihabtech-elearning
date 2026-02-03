import {  X } from 'lucide-react';


  

  type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
  };

 export const UserMobileSidebar = ({ isOpen, onClose }: SidebarProps) => {
      const isLearnerPath = window.location.hash.includes("learner");
    return (
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4 md:hidden">
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
  
        {/* User Info */}
       {isLearnerPath && <div className="px-4 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              PB
            </div>
            <div>
              <div className="font-semibold">Hi, Manan A.</div>
              <div className="text-sm text-gray-500">Welcome back</div>
            </div>
          </div>
          <button className="mt-3 text-purple-600 text-sm font-medium" onClick={() => window.location.href = '/#/instructor/course-test-selection'}>
            Switch to Instructor
          </button>
        </div>}
  
        {/* Nav Menu */}
       {isLearnerPath && <nav className="mt-4 px-4 space-y-2 text-sm">
  <MobileSidebarItem text="Profile" route='#/profile' onClose={onClose} />
  <MobileSidebarItem text="My Learnings" route='#/learner/my-learnings' hasDropdown onClose={onClose} />
</nav>}

{!isLearnerPath && <div className="mt-4 px-4 space-y-2 text-sm">
  <MobileSidebarItem text="Login" route='#/login' onClose={onClose} />
  <MobileSidebarItem text="Sign Up" route='#/sign-up' hasDropdown onClose={onClose} />
</div>}
      </div>
    );
  };

  type MobileSidebarItemProps = {
  text: string;
  hasDropdown?: boolean;
  route: string;
  onClose: () => void;  // Add this line
};

  const MobileSidebarItem = ({ text, hasDropdown, route, onClose }: MobileSidebarItemProps) => {
      const handleClick = () => {
    window.location.hash = route;
    onClose();  // Close sidebar after navigation
  };
    return (
      <div className="flex items-center justify-between cursor-pointer hover:text-purple-600" onClick={handleClick}>
        <span>{text}</span>
        {/* {hasDropdown && <span className="text-lg">›</span>} */}
      </div>
    );
  };
