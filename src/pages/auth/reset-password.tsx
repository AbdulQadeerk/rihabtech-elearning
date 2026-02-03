// Reset Password page for forgot password flow
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { toast } from "sonner";
import { API_BASE_URL } from '../../lib/api';

function getQueryParam(param: string) {
  const hash = window.location.hash;
  const match = hash.match(new RegExp(param + '=([^&]+)'));
  return match ? decodeURIComponent(match[1]) : '';
}

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const email = getQueryParam('email');
  const token = getQueryParam('token');
  const resetSchema = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
      confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), ''], 'Passwords must match').required('Confirm your password'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL + 'reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            otp: token,
            newPassword: values.newPassword,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success('Password reset successful. Please login.');
          window.location.hash = '#/login';
        } else {
          toast.error(data.message || 'Failed to reset password.');
        }
      } catch (error) {
        toast.error('Failed to reset password.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex md:w-1/2 App-Gradient-Angular flex-col items-center justify-center px-[110px] relative">
        <div className="bg-white rounded-full p-8 w-4/5 aspect-square flex items-center justify-center">
          <img
            src="Images/5243321.png"
            alt="Reset Password"
            className="max-w-full"
          />
        </div>
        <div className="text-center mt-8 text-white">
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">Reset Password</h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Enter your new password to complete the reset process.
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Reset Password</h1>
          </div>
          <form onSubmit={resetSchema.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="text-sm text-gray-600 block mb-1">
                New Password
              </label>
              <Input id="newPassword" type="password"
                value={resetSchema.values.newPassword}
                onChange={resetSchema.handleChange}
                onBlur={resetSchema.handleBlur} placeholder="Enter new password" name="newPassword" />
              {resetSchema.touched.newPassword && resetSchema.errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{resetSchema.errors.newPassword}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm text-gray-600 block mb-1">
                Confirm Password
              </label>
              <Input id="confirmPassword" type="password"
                value={resetSchema.values.confirmPassword}
                onChange={resetSchema.handleChange}
                onBlur={resetSchema.handleBlur} placeholder="Confirm new password" name="confirmPassword" />
              {resetSchema.touched.confirmPassword && resetSchema.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{resetSchema.errors.confirmPassword}</p>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2 mt-4">
              <Button type="submit" className="px-8 btn-rouded bg-orange-500 hover:bg-orange-600 mt-4" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
            <div className="text-center text-sm mt-6">
              <a href="/#/login" className="text-blue-600 font-medium">Back to Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 