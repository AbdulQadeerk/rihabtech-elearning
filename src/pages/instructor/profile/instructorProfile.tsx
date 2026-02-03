import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../lib/api';
import GradientHeader from '../../../components/ui/GradientHeader';
import LoadingIcon from '../../../components/ui/LoadingIcon';
import BankDetails from './bankDetails';
import ProfilePhoto from './profilePhoto';
import AccountSettings from './accountSettings';
import InstructorEditProfile from './editProfile';
import InstructorApplication from './instructorApplication';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "../../../components/ui/dialog";
import { Button } from '../../../components/ui/button';

const InstructorProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      // Get user data from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = JSON.parse(token);
          setUser(userData);

          // Try to fetch profile data from API first
          if (userData?.AccessToken) {
            try {
              const response = await fetch(`${API_BASE_URL}user-profile`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${userData.AccessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const profileData = await response.json();
                console.log('Profile data fetched in main component:', profileData);
                setProfile(profileData);
              } else {
                console.error('Failed to fetch profile data, using user data as fallback');
                setProfile(userData);
                localStorage.removeItem('token');
      localStorage.setItem('logoutSuccess', 'true');
      // Optionally, clear any other user state here
      // Redirect to sign-in page
      window.location.replace('/#/login');
              }
            } catch (err) {
              console.error('Error fetching profile:', err);
              // Use user data as fallback
              setProfile(userData);
            }
          } else {
            // Use user data as fallback
            setProfile(userData);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      setLoading(false);
    };

    fetchUserAndProfile();
  }, []);



  const handleLogOutClick = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('instructorApplicationStatus');
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const sidebarItems = [
    { label: 'Profile', tab: 'profile' },
    { label: 'Profile Photo', tab: 'profile-photo' },
    { label: 'Bank Details', tab: 'bank-details' },
    { label: 'Instructor Application', tab: 'instructor-application' },
    { label: 'Account & Security', tab: 'account&security' },
  ];



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to access the instructor profile.</p>
          <button
            onClick={() => window.location.href = '/#/login'}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-root min-h-screen">
      <GradientHeader subtitle="My Profile / Instructor" title={loading ? <LoadingIcon className="inline-block" /> : (profile?.name || user?.Name || "Instructor Profile")} />
      <div className="container flex flex-col md:flex-row">
        <div className="public-profile-content">
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
                  <a
                    key={item.label}
                    onClick={() => setActiveTab(item.tab)}
                    className={`
                      flex-shrink-0
                      px-4 md:px-6 py-3 md:py-4
                      text-base font-barlow transition-colors duration-150
                      ${activeTab === item.tab
                        ? 'text-primary font-bold bg-[#fff7ef]'
                        : 'text-[#222] font-medium hover:bg-[#f8f8f8]'}
                      ${index !== sidebarItems.length - 1 ? 'md:border-b md:border-[#eee]' : ''}
                      ${index !== sidebarItems.length - 1 ? 'border-r border-[#eee] md:border-r-0' : ''}
                      text-center md:text-left
                      min-w-[140px] md:min-w-0
                      cursor-pointer
                    `}
                  >
                    {item.label}
                  </a>
                ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <a
                      className="
                        flex-shrink-0
                        px-4 md:px-6 py-3 md:py-4
                        text-base font-barlow transition-colors duration-150
                        text-[#222] font-medium hover:bg-[#f8f8f8]
                        text-center md:text-left
                        min-w-[140px] md:min-w-0
                        cursor-pointer
                      "
                    >
                      Log Out
                    </a>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Logout</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to log out? You will need to log in again to access your account.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleLogOutClick} className="bg-red-600 hover:bg-red-700 text-white">
                        Log Out
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </nav>
            </div>
          </aside>
        </div>
        <div className="flex flex-col flex-1 gap-2 items-center w-full mb-2 relative">
          <div className='w-full'>
            {activeTab === 'profile' && user && <InstructorEditProfile user={user} />}
            {activeTab === 'profile-photo' && <ProfilePhoto />}
            {activeTab === 'bank-details' && <BankDetails />}
            {activeTab === 'instructor-application' && user && <InstructorApplication user={user} />}
            {activeTab === 'account&security' && <AccountSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;
