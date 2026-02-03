import LearnerProfileSidebar from "../../../components/ui/LearnerProfileSidebar";
import GradientHeader from "../../../components/ui/GradientHeader";
import PublicProfile from "./public-profile";
import EditProfile from "./profile";
import { useState, useEffect, useMemo } from "react";
import LoadingIcon from "../../../components/ui/LoadingIcon";
import ProfilePhoto from "./profile-photo";
import AccountSecurity from "./account&security";
import ProfilePaymentMethod from "./payment-method";
import SubscriptionManagement from "./subscription-management";
import EnrolledCourses from "./enrolled-courses";
import PaymentHistory from "./payment-history";
import Overview from "./overview";
// import TermsOfUse from './terms-of-use';
import { Logs } from "lucide-react";
import Logout from "./logout";
import PrivacyPolicy from "../../comman/privacy-policy/privacy-policy";
import RefundPolicy from "../../comman/refund-policy/refund-policy";
import TermsOfUse from "../../comman/terms-and-condition/terms-of-use";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog"; // adjust import path if needed
import { Button } from "../../../components/ui/button";
import axiosClient from "../../../utils/axiosClient";
import { useAuth } from "../../../context/AuthContext";
import BankDetails from "../../instructor/profile/bankDetails";
import InstructorApplication from "../../instructor/profile/instructorApplication";
import InstructorEditProfile from "../../instructor/profile/editProfile";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout, user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosClient.get("/user-profile");
        setProfile(res.data);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogOutClick = async () => {
    localStorage.setItem("logoutSuccess", "true");
    await logout();
    window.location.href = "/";
  };

  // Base sidebar items for all users
  const baseSidebarItems = [
    { label: "Overview", tab: "overview" },
    { label: "Profile", tab: "profile" },
    { label: "Profile Photo", tab: "profile-photo" },
    { label: "Account & Security", tab: "account&security" },
  ];

  // Student-only items (Role 4) - These are required for students
  const studentSidebarItems = [
    { label: "Enrolled Courses", tab: "enrolled-courses" },
    { label: "Subscription Management", tab: "subscription-management" },
    { label: "Payment History", tab: "payment-history" },
  ];

  // Instructor-only items (Role 5) - Only shown to instructors
  const instructorSidebarItems: Array<{ label: string; tab: string }> = [
    { label: "Instructor Application", tab: "instructor-application" },
    { label: "Bank Details", tab: "bank-details" },
  ];

  // Get user role (Role 4 = Student/Learner, Role 5 = Instructor)
  // Default to 4 (Student) if user is null or Role is undefined
  const userRole = useMemo(() => {
    // First try to get role from profile API response
    if (profile?.roleId !== undefined && profile?.roleId !== null) {
      return profile.roleId;
    }
    // Fallback to user object
    if (!user) return 4; // Default to student
    return (user.Role !== undefined && user.Role !== null) ? user.Role : 4;
  }, [user, profile]);

  const isInstructor = userRole === 5;
  const isStudent = !isInstructor; // Default to student if not instructor

  // Build sidebar items based on role:
  // - Role 4 (Student): Show base items + student items only
  // - Role 5 (Instructor): Show base items + student items + instructor items (all combined, deduplicated)
  const sidebarItems = useMemo(() => {
    let items;
    if (userRole === 5) {
      // Instructor (Role 5): Show base + student + instructor items (all combined)
      // Combine all items and remove duplicates based on tab value
      const allItems = [...baseSidebarItems, ...studentSidebarItems, ...instructorSidebarItems];
      const uniqueItems = allItems.filter((item, index, self) => 
        index === self.findIndex((t) => t.tab === item.tab)
      );
      items = uniqueItems;
    } else {
      // Student (Role 4) or default: Show only base + student items
      items = [...baseSidebarItems, ...studentSidebarItems];
    }
    
    console.log('Building sidebar items:', {
      userRole,
      isInstructor,
      isStudent,
      userRoleValue: user?.Role,
      itemsCount: items.length,
      items: items.map(item => item.label),
      studentItems: studentSidebarItems.map(item => item.label),
      instructorItems: instructorSidebarItems.map(item => item.label)
    });
    
    return items;
  }, [isInstructor, isStudent, userRole, user]);

  // Debug: Log sidebar items to verify they're being set correctly
  useEffect(() => {
    console.log('Profile Sidebar Debug:', {
      userRole,
      isInstructor,
      isStudent,
      userExists: !!user,
      userRoleValue: user?.Role,
      sidebarItemsCount: sidebarItems.length,
      sidebarItems: sidebarItems.map(item => item.label)
    });
  }, [user, userRole, isInstructor, isStudent, sidebarItems]);

  return (
    <div className="public-profile-root min-h-screen">
      <GradientHeader
        subtitle={`My Profile / ${isInstructor ? "Instructor" : "Learner"}`}
        title={
          loading ? (
            <LoadingIcon className="inline-block" />
          ) : (
            profile?.name || user?.name || user?.displayName || "My Profile"
          )
        }
      />
      {error && <div className="text-red-500 text-center my-2">{error}</div>}
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
                {sidebarItems && sidebarItems.length > 0 ? (
                  sidebarItems.map((item, index) => (
                    <a
                      key={`${item.tab}-${index}`}
                      onClick={() => setActiveTab(item.tab)}
                      className={`
                  flex-shrink-0
                  px-4 md:px-6 py-3 md:py-4
                  text-base font-barlow transition-colors duration-150
                  ${
                    activeTab === item.tab
                      ? "text-primary font-bold bg-[#fff7ef]"
                      : "text-[#222] font-medium hover:bg-[#f8f8f8]"
                  }
                  ${
                    index !== sidebarItems.length - 1
                      ? "md:border-b md:border-[#eee]"
                      : ""
                  }
                  ${
                    index !== sidebarItems.length - 1
                      ? "border-r border-[#eee] md:border-r-0"
                      : ""
                  }
                  text-center md:text-left
                  min-w-[140px] md:min-w-0
                  cursor-pointer
                `}
                    >
                      {item.label}
                    </a>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">Loading menu...</div>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <a
                      className={`
                  flex-shrink-0
                  px-4 md:px-6 py-3 md:py-4
                  text-base font-barlow transition-colors duration-150
                  text-[#222] font-medium hover:bg-[#f8f8f8]
                  border-r border-[#eee] md:border-r-0
                  text-center md:text-left
                  min-w-[140px] md:min-w-0
                  cursor-pointer
                `}
                    >
                      Log Out
                    </a>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Logout</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to log out?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        className="btn btn-primary"
                        onClick={() => handleLogOutClick()}
                      >
                        Yes, Log Out
                      </Button>
                      <DialogClose asChild>
                        <Button className="btn btn-secondary" type="button">
                          Cancel
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </nav>
            </div>
          </aside>
        </div>
        <div className="flex flex-col flex-1 gap-2 items-center w-full mb-2 relative overflow-x-hidden">
          {activeTab == "public-Profile" && <PublicProfile />}
          {/* Profile Card */}
          <div className="w-full max-w-full overflow-x-hidden">
            {activeTab == "overview" && profile && (
              <Overview profile={profile} />
            )}
            {activeTab == "profile" && (
              <>
                {isInstructor && user ? (
                  profile ? (
                    <InstructorEditProfile user={user} profile={profile} />
                  ) : loading ? (
                    <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm px-0 py-0 mt-[32px] mb-2">
                      <div className="px-8 py-8 flex flex-col items-center justify-center">
                        <LoadingIcon className="inline-block" />
                        <p className="text-gray-600 mt-4">Loading profile...</p>
                      </div>
                    </div>
                  ) : null
                ) : (
                  profile ? (
                    <EditProfile
                      profile={profile}
                      loading={loading}
                      error={error}
                      onProfileUpdate={setProfile}
                    />
                  ) : loading ? (
                    <LoadingIcon className="inline-block" />
                  ) : null
                )}
              </>
            )}
            {activeTab == "profile-photo" && <ProfilePhoto />}
            {activeTab === 'bank-details' && <BankDetails profile={profile} />}
            {activeTab === 'instructor-application' && user && <InstructorApplication user={user} profile={profile} />}
            {activeTab == "account&security" && <AccountSecurity />}
            {activeTab == "enrolled-courses" && profile && (
              <EnrolledCourses profile={profile} />
            )}
            {activeTab == "subscription-management" && profile && (
              <SubscriptionManagement profile={profile} />
            )}
            {activeTab == "payment-history" && profile && (
              <PaymentHistory profile={profile} />
            )}
            {activeTab == "payment-method" && <ProfilePaymentMethod />}
            {activeTab == "terms-of-use" && <TermsOfUse />}
            {activeTab == "privacy-policy" && <PrivacyPolicy />}
            {activeTab == "refund-policy" && <RefundPolicy />}
            {activeTab == "logout" && <Logout />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
