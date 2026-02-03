import React, { useState } from 'react';
import InstructorHeader from '../../layouts/instructorHeader';
import Footer from '../../layouts/footer';
import Sidebar, { MobileSidebar } from '../../layouts/instructorSidebar';

const InstructorLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Header */}
      <InstructorHeader onMenuClick={toggleSidebar} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 pt-20">
        {/* Sidebar fixed to left */}
        <div className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-[82px] hover:w-64 transition-all duration-300 ease-in-out bg-white shadow-md z-30">
          <Sidebar />
        </div>

        {/* Main content with padding-left for sidebar */}
        <main className="flex-1 overflow-y-auto min-h-0 pl-[82px] transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden flex-1 relative z-50 mt-12">
        <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default InstructorLayout;
