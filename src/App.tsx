import "./App.css";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import SignUpPage from "./pages/auth/signup";
import LoginPage from "./pages/auth/login";
import EducationLandingPage from "./pages/comman/landingPage";
import CommanLayout from "./pages/comman/layout";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import CourseList from "./pages/comman/courses/courseList";
import LearnerRoutes from "./pages/learner/LearnerRoutes";
import AboutUs from "./pages/comman/aboutUs/about-us";
import Pricing from "./pages/comman/pricing/pricing";
import ContactUs from "./pages/comman/contactUs/contactUs";
import CourseDetails from "./pages/comman/courses/courseDetails";
import InstructorDetailsPage from "./pages/comman/courses/instructor/instructorDetails";
import ScrollToTop from "./lib/utils";
import InstructorLayout from "./pages/instructor/layout";
import InstructorRoutes from "./pages/instructor/instructorRoutes";
import TermsOfUse from "./pages/comman/terms-and-condition/terms-of-use";
import PrivacyPolicy from "./pages/comman/privacy-policy/privacy-policy";
import RefundPolicy from "./pages/comman/refund-policy/refund-policy";
import InstructorSignupPage from "./pages/auth/instructorSignup";
import ForgetPasswordPage from "./pages/auth/forgot-password";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import InstructorSignupSuccess from "./pages/auth/instructorSignupSuccess";
import VerifyResetOtpPage from "./pages/auth/verify-reset-otp";
import ResetPasswordPage from "./pages/auth/reset-password";
import { SubscriptionProvider } from "./context/subscriptionContext";
import Profile from "./pages/learner/profile/page";

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000, // Global animation duration
      once: false, // Only once animation
      offset: 100,
      easing: "ease-in-out",
      mirror: true,
    });
    
    // Handle OAuth callback on app load (before routing)
    // This catches path-based redirects from Google (/login?code=...)
    if (window.location.pathname === '/login' && window.location.search.includes('code=')) {
      console.log('🔵 App-level: Detected OAuth callback on /login path');
      // Convert to hash route for HashRouter
      const search = window.location.search;
      window.location.hash = `/login${search}`;
    }
  }, []);
  return (
    <SubscriptionProvider>
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgetPasswordPage />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/instructor-signup" element={<InstructorSignupPage />} />
        <Route
          path="/instructor-signup-success"
          element={<InstructorSignupSuccess />}
        />
        <Route
          path="/"
          element={
            <CommanLayout>
              <EducationLandingPage />
            </CommanLayout>
          }
        />
        <Route
          path="/aboutUs"
          element={
            <CommanLayout>
              <AboutUs />
            </CommanLayout>
          }
        />
        <Route
          path="/contactUs"
          element={
            <CommanLayout>
              <ContactUs />
            </CommanLayout>
          }
        />
        <Route
          path="/pricing"
          element={
            <CommanLayout>
              <Pricing />
            </CommanLayout>
          }
        />
        <Route
          path="/terms-of-use"
          element={
            <CommanLayout>
              <TermsOfUse />
            </CommanLayout>
          }
        />
        <Route
          path="/terms-of-use"
          element={
            <CommanLayout>
              <TermsOfUse />
            </CommanLayout>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <CommanLayout>
              <PrivacyPolicy />
            </CommanLayout>
          }
        />
        <Route
          path="/refund-policy"
          element={
            <CommanLayout>
              <RefundPolicy />
            </CommanLayout>
          }
        />
        <Route
          path="/courselist"
          element={
            <CommanLayout>
              <CourseList />
            </CommanLayout>
          }
        />
        <Route
  path="/courselist/:categoryId"
  element={
    <CommanLayout>
      <CourseList />
    </CommanLayout>
  }
/>
        <Route
          path="/courseDetails"
          element={
            <CommanLayout>
              <CourseDetails />
            </CommanLayout>
          }
        />
        <Route
          path="/instructorDetails"
          element={
            <CommanLayout>
              <InstructorDetailsPage />
            </CommanLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CommanLayout>
                <Profile />
              </CommanLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learner/*"
          element={
            <ProtectedRoute>
              <CommanLayout>
                <LearnerRoutes />
              </CommanLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/*"
          element={
            <ProtectedRoute>
              <InstructorLayout>
                <InstructorRoutes />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </SubscriptionProvider>
  );
}

export default App;
