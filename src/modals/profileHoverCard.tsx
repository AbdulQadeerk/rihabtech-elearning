import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";
import { BarChart3, LayoutGrid, User, Settings, FileText } from "lucide-react";
import { title } from "process";
import path from "path";
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { API_BASE_URL_IMG } from "../lib/api";

const profileMenuList = [
  {
    title: "Profile",
    description: "Learner's Profile",
    icon: <User className="w-6 h-6 text-orange-500" />,
    path: "/#/profile",
  },
  // {
  //   title: "Terms",
  //   description: "View terms and conditions",
  //   icon: <FileText className="w-6 h-6 text-orange-500" />,
  //   path: "/#/terms-of-use",
  // },

  // {
  //   title: "Privacy Policy",
  //   description: "Read our privacy policy",
  //   icon: <FileText className="w-6 h-6 text-orange-500" />,
  //   path: "/#/privacy-policy",
  // },
  // {
  //   title: "Refund Policy",
  //   description: "Read our privacy policy",
  //   icon: <FileText className="w-6 h-6 text-orange-500" />,
  //   path: "/#/refund-policy",
  // },
  // {
  //   title: "Analytics",
  //   description: "Your analytics dashboard",
  //   icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
  //   path: "/#/learner/analytics",
  // },
  {
    title: "Courses",
    description: "View all enrolled courses",
    icon: <LayoutGrid className="w-6 h-6 text-orange-500" />,
    path: "#/learner/my-learnings",
  },
  // {
  //   title: "Settings",
  //   description: "Manage your account settings",
  //   icon: <Settings className="w-6 h-6 text-orange-500" />,
  //   path: "/#/learner/settings",
  // },
  {
    title: "Logout",
    description: "Sign out of your account",
    icon: <User className="w-6 h-6 text-orange-500" />,
    path: "/#/",
  }

];

export const ProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleItemClick = async (item: typeof profileMenuList[0]) => {
    setIsOpen(false); // close popover
    if (item.title === 'Logout') {
      localStorage.setItem('logoutSuccess', 'true');
      await logout();
      window.location.href = '/'; // Redirect to landing page
    } else {
      setTimeout(() => {
        window.location.href = item.path;
      }, 100);
    }
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div className="ml-0 md:ml-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {(user?.ProfileImage==null)?(<div className="w-7 md:w-10 h-7 md:h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            {initials}
          </div>):(<div className="w-7 md:w-10 h-7 md:h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            <img src={API_BASE_URL_IMG+user?.ProfileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>)}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="hover-card bg-white rounded-2xl shadow-xl p-6 h-auto w-96">
        <div className="flex flex-col gap-2 justify-between">
          {profileMenuList.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              <div>{item.icon}</div>
              <div>
                <div className="font-semibold text-lg text-[#1e1e1e]">{item.title}</div>
                <div className="text-[#677489] text-sm font-medium">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
