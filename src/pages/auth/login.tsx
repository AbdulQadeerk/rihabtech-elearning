import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from 'yup';
import { toast } from "sonner";
import { API_BASE_URL } from '../../lib/api';
import { GoogleAuth } from '../../lib/googleAuth';


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize Google OAuth and handle callback
  useEffect(() => {
    console.log('🔵 LoginPage useEffect running');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Hash:', window.location.hash);

    // Handle path-based redirect from Google (/login?code=...)
    // Convert to hash route if needed for HashRouter compatibility
    if (window.location.pathname === '/login' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (code || error) {
        console.log('✅ OAuth callback detected on /login path');
        // Convert to hash route and preserve query params
        window.location.hash = `/login${window.location.search}`;
        // Continue execution to handle the callback immediately
        // remove return
      }
    }

    // Initialize Google OAuth
    GoogleAuth.init().then(() => {
      console.log('Google OAuth initialized');
    });

    // Handle OAuth 2.0 callback from hash route or after redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');

    const code = urlParams.get('code') || hashParams.get('code');
    const error = urlParams.get('error') || hashParams.get('error');

    console.log('Checking for OAuth callback...');
    console.log('Code from search:', urlParams.get('code'));
    console.log('Code from hash:', hashParams.get('code'));
    console.log('Final code:', code);
    console.log('Final error:', error);

    if (code) {
      console.log('✅ OAuth callback detected, processing...');
      // Set loading state
      setGoogleLoading(true);

      GoogleAuth.handleOAuth2Callback().catch((err) => {
        console.error('❌ Error in OAuth callback handler:', err);
        setGoogleLoading(false);
      });
    } else if (error) {
      console.error('❌ OAuth error detected:', error);
      toast.error('Google authentication failed. Please try again.');
      // Clean up URL
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '/login';
      window.history.replaceState({}, '', url.toString());
    } else {
      console.log('No OAuth callback detected');
    }
  }, []);
  const loginSchema = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is Required'),
      password: Yup.string().required('Password is Required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL + 'login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.email,
            password: values.password,
          }),
        });
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        if (response.ok && data) {
          // If data is a string, parse it (API may return object or stringified object)
          let userObj = typeof data === 'string' ? JSON.parse(data) : data;
          localStorage.setItem('token', JSON.stringify(userObj));
          toast.success('Login Successfully');
          window.location.hash = '/learner/homepage';
          window.location.reload();
        } else {
          const errorMsg = typeof data === 'string'
            ? data
            : data.message || data.error || data.msg || 'Login failed. Please try again.';
          toast.error(errorMsg);
        }
      } catch (error) {
        console.log('error', error);
        toast.error('Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    console.log('Google Sign In button clicked');
    setGoogleLoading(true);
    try {
      console.log('Calling GoogleAuth.signIn()...');
      GoogleAuth.signIn();
      console.log('GoogleAuth.signIn() called successfully');
      toast.success('Redirecting to Google...');
    } catch (error) {
      console.error('Google Sign In Error:', error);
      toast.error('Google Sign In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column - Orange Background with Illustration */}
      <div className="hidden md:flex md:w-1/2 App-Gradient-Angular flex-col items-center justify-center px-[110px] relative">
        <div className="bg-white rounded-full p-8 w-4/5 aspect-square flex items-center justify-center">
          <img
            src="Images/4860253.png"
            alt="Woman logging in securely"
            className="max-w-full"
          />
        </div>
        <div className="text-center mt-8 text-white">
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">An Online Learning Community for Curious Minds?</h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Explore engaging online courses led by expert instructors — no certificates, just pure learning.
          </p>
        </div>
      </div>

      {/* Right Column - Sign Up Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">The Space Where Learners & Teachers Connect</h1>
          </div>

          {/* <div className="flex gap-2 mb-6">
            <Button className="btn-rouded flex-1 hover:bg-orange-600">
              Login As Learner
            </Button>
            <Button variant={'secondary'} className="btn-rouded flex-1">
             Login As Instructor
            </Button>
          </div> */}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={loginSchema.handleSubmit} className="space-y-4">
            {/* <div>
              <label htmlFor="username" className="text-sm text-gray-600 block mb-1">
                Username
              </label>
              <Input id="username" placeholder="johndoe" />
            </div> */}

            <div>
              <label htmlFor="email" className="text-sm text-gray-600 block mb-1">
                Email
              </label>
              <Input id="email" type="email"
                value={loginSchema.values.email}
                onChange={loginSchema.handleChange}
                onBlur={loginSchema.handleBlur}
                placeholder="johndoe@email.com" />
              {loginSchema.touched.email && loginSchema.errors.email && (
                <p className="text-red-500 text-sm mt-1">{loginSchema.errors.email}</p>
              )}
            </div>


            <div>
              <label htmlFor="password" className="text-sm text-gray-600 block mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={loginSchema.values.password}
                  onChange={loginSchema.handleChange}
                  placeholder="••••••••••••"
                />
                {loginSchema.touched.password && loginSchema.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{loginSchema.errors.password}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOffIcon size={16} />
                  ) : (
                    <EyeIcon size={16} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4">
              {/* <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="terms" className="data-[state=checked]:bg-orange-500 border-gray-300" />
              <label htmlFor="terms" className="text-xs text-gray-600">
                I accept the terms & conditions
              </label>
            </div> */}

              <Button type="submit" className="px-8 btn-rouded bg-primary hover:bg-orange-600 mt-4" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>

            <div className="text-center text-sm flex mt-6 justify-between">
              <span>Don’t Own an Account? <a href="/#/sign-up" className="text-blue-600 font-medium">Sign Up</a></span>
              <a href="#/forgot-password" className="text-primary font-bold">Forgot Password</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}