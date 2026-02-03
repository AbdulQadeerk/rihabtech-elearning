import { BarChartBig, LucideMessageCircleQuestion, X, DollarSign } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
 
  return (
    <div className="group transition-all duration-300 ease-in-out bg-white shadow-md h-[calc(100vh-2rem)] px-4 overflow-hidden">
      <nav className="mt-6 h-full max-h-[calc(100vh-2rem)] bg-gray-50 rounded-[18px] py-8">
        <SidebarItem icon={<DocumentIcon />} text="Courses" active={true} route='#/instructor/courses'/>
        <SidebarItem icon={<CreditCardIcon />} text="Payment" route='#/instructor/payment' />
        <SidebarItem icon={<ChatIcon />} text="Communications" route='#/instructor/chat' />
        <SidebarItem icon={<BarChartBig />} text="Performance" route='#/instructor/dashboard' />
        <SidebarItem icon={<UsersIcon />} text="Groups" route='#/instructor/groups' />
        <SidebarItem icon={<UserIcon />} text="Students" route='#/instructor/students' />
        <SidebarItem icon={<ProfileIcon />} text="Profile" route='#/profile' />
        <SidebarItem icon={<LucideMessageCircleQuestion />} text="Support" route='#/instructor/support' />
      </nav>
    </div>
  );
  };

  // Sidebar Item Component
interface SidebarItemProps {
    icon: React.ReactNode;
    text: string;
    active?: boolean;
    badge?: number;
    route:string
  }
  
const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, badge, route }) => {
  const [activePath, setActivePath] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setActivePath(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const active = activePath === route;
  return (
    <div 
      className={`flex items-center px-4 py-3 cursor-pointer whitespace-nowrap ${
        active ? 'border-l-4 border-primary text-primary' : 'text-black'
      }`} 
      onClick={() => { window.location.href = route }}
    >
      <div className="w-6 h-6 min-w-[24px]">
        {icon}
      </div>
      <span className="ml-8 text-lg font-bold font-['DM_Sans'] group-hover:opacity-100 transition-opacity duration-300">
        {text}
      </span>
      {badge && (
        <div className="ml-auto bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {badge}
        </div>
      )}
    </div>
  );
};
  
  export default Sidebar;

  

  type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
  };

 export const MobileSidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { logout, user } = useAuth();
    const [initials, setInitials] = useState('U');
  
    useEffect(() => {
      let name = '';
      const cached = localStorage.getItem('token');
      if (cached) {
        const profile = JSON.parse(cached);
        name = profile.Name || profile.name || '';
      }
      if (!name && user?.displayName) name = user.displayName;
      if (!name && user?.email) name = user.email.split('@')[0];
      if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) setInitials(parts[0][0].toUpperCase());
        else setInitials((parts[0][0] + parts[parts.length-1][0]).toUpperCase());
      }
    }, [user]);
    return (
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`} style={{zIndex: 99}}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4 md:hidden">
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
  
        {/* User Info */}
        <div className="px-4 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div>
              <div className="font-semibold">Hi, {user?.displayName}.</div>
              <div className="text-sm text-gray-500">Welcome back</div>
            </div>
          </div>
          <button className="mt-3 text-purple-600 text-sm font-medium" onClick={() => window.location.href = '/#/learner/homepage'}>
            Switch to Learner
          </button>
        </div>
  
        {/* Nav Menu */}
        <nav className="mt-4 px-4 space-y-2 text-sm">
          <MobileSidebarItem text="Courses" route='#/instructor/courses' />
          <MobileSidebarItem text="Chat" route='#/instructor/chat' hasDropdown />
          <MobileSidebarItem text="Performance" route='#/instructor/dashboard' hasDropdown />
          <MobileSidebarItem text="Students" route='#/instructor/students' />
          <MobileSidebarItem text="Groups" route='#/instructor/groups' />
          <MobileSidebarItem text="Profile" route='#/profile' />
        </nav>
      </div>
    );
  };

  type MobileSidebarItemProps = {
    text: string;
    hasDropdown?: boolean;
    route:string;
  };

  const MobileSidebarItem = ({ text, hasDropdown, route }: MobileSidebarItemProps) => {
    return (
      <div className="flex items-center justify-between cursor-pointer hover:text-purple-600" onClick={()=>{window.location.hash = route}}>
        <span>{text}</span>
        {/* {hasDropdown && <span className="text-lg">›</span>} */}
      </div>
    );
  };





// SVG Icons
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165.878-2.388.878-3.7 0-4.42-3.58-8-8-8-1.6 0-3.08.48-4.324 1.305C.072 5.01-.233 7.771 1.2 9.87c.45-1.11 1.417-2.748 2.57-2.748.47 0 .92.28 1.12.73.2.45.28.92.2 1.38-.06.45-.38.8-.78 1.05-.4.25-.8.43-1.22.6-.4.17-.78.36-1.08.6-.3.24-.55.52-.72.83v.04c-.28.53-.33 1.1-.26 1.67.08.55.26 1.1.57 1.6.3.5.7.9 1.18 1.22.48.32 1.07.53 1.66.53.62 0 1.2-.17 1.68-.53.5-.35.92-.83 1.18-1.4.28-.58.4-1.25.38-1.93 0-.7-.18-1.4-.55-2.02-.36-.6-.9-1.07-1.56-1.35-.63-.28-1.3-.37-1.98-.32-.66.06-1.3.3-1.8.68-.44.4-.75.96-.75 1.57 0 .57.26 1.13.68 1.5.42.37.98.6 1.55.6.55 0 1.1-.2 1.5-.6.42-.36.7-.92.7-1.5l-.02-.04z" />
  </svg>
);