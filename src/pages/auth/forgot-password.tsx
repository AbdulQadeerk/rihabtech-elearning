// Forgot Password page for forgot password flow
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { toast } from "sonner";
import { API_BASE_URL } from '../../lib/api';

export default function ForgetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const forgotSchema = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is Required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL + 'forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: values.email }),
        });
        let errorMsg = 'Failed to send OTP.';
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (e) {
            data = {};
          }
          errorMsg = data.message || data.error || data.msg || errorMsg;
        } else {
          try {
            data = await response.text();
            if (data && typeof data === 'string') {
              errorMsg = data;
            }
          } catch (e) {}
        }
        if (response.ok) {
          toast.success(errorMsg); // Show the API's message
          window.location.hash = `#/verify-reset-otp?email=${encodeURIComponent(values.email)}`;
        } else {
          toast.error(errorMsg);
        }
      } catch (error) {
        toast.error('Failed to send OTP.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column - Orange Background with Illustration */}
      <div className="hidden md:flex md:w-1/2 App-Gradient-Angular flex-col items-center justify-center px-[110px] relative">
        <div className="bg-white rounded-full p-8 w-4/5 aspect-square flex items-center justify-center">
          <img
            src="Images/5243321.png"
            alt="Woman logging in securely"
            className="max-w-full"
          />
        </div>
        <div className="text-center mt-8 text-white">
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">Ready to Learn Something New?</h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Join a platform where learning is fun, flexible, and pressure-free.
          </p>
        </div>
      </div>

      {/* Right Column - Forgot Password Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Forgot Password</h1>
          </div>

          <form onSubmit={forgotSchema.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-gray-600 block mb-1">
                Email
              </label>
              <Input id="email" type="email"
                value={forgotSchema.values.email}
                onChange={forgotSchema.handleChange}
                onBlur={forgotSchema.handleBlur} placeholder="johndoe@email.com" />
              {forgotSchema.touched.email && forgotSchema.errors.email && (
                <p className="text-red-500 text-sm mt-1">{forgotSchema.errors.email}</p>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2 mt-4">
              <Button type="submit" className="px-8 btn-rouded bg-orange-500 hover:bg-orange-600 mt-4" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </div>
            <div className="text-center text-sm mt-6">
              Own an Account? <a href="/#/login" className="text-blue-600 font-medium">JUMP RIGHT IN</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}