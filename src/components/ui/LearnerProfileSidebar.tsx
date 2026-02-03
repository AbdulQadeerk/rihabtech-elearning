import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const sidebarItems = [
  { label: 'Public Profile', path: '/profile' },
  { label: 'Profile', path: '/profile' },
  { label: 'Profile Photo', path: '/profile' },
  { label: 'Account & Security', path: '/profile' },
  { label: 'Payment Method', path: '/profile' },
  { label: 'Terms Of Use', path: '/profile' },
];

const LearnerProfileSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-full md:w-80 max-w-xs mb-2">
      <div className="bg-white rounded-none md:rounded-xl border border-[#E6E6E6] shadow-sm">
        <nav
          className="
            flex w-full
            flex-row md:flex-col
            overflow-x-auto md:overflow-x-hidden
            overflow-y-hidden md:overflow-y-auto
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          "
        >
          {sidebarItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex-shrink-0
                px-4 md:px-6 py-3 md:py-4
                text-base font-barlow transition-colors duration-150
                ${location.pathname === item.path
                  ? 'text-[#ff7700] font-bold bg-[#fff7ef]'
                  : 'text-[#222] font-medium hover:bg-[#f8f8f8]'}
                ${index !== sidebarItems.length - 1 ? 'md:border-b md:border-[#eee]' : ''}
                ${index !== sidebarItems.length - 1 ? 'border-r border-[#eee] md:border-r-0' : ''}
                text-center md:text-left
                min-w-[140px] md:min-w-0
              `}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/profile"
            className="
              flex-shrink-0
              px-4 md:px-6 py-3 md:py-4
              text-base font-barlow font-bold text-[#C30000] hover:bg-[#fff7ef]
              min-w-[140px] md:min-w-0
              text-center md:text-left
            "
          >
            Logout
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default LearnerProfileSidebar;