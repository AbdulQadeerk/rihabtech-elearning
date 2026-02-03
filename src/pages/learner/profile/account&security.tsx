import { useState } from 'react';
import GradientHeader from '../../../components/ui/GradientHeader';
import LearnerProfileSidebar from '../../../components/ui/LearnerProfileSidebar';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const AccountSecurity = () => {
  const [firstName] = useState('Manas');
  const [lastName] = useState('Agrawal');

  // Password Change Formik
  const passwordFormik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
    onSubmit: (values, { resetForm }) => {
      // Handle password change logic here
      console.log('Password changed:', values);
      resetForm();
    },
  });

  // Email Change Formik
  const emailFormik = useFormik({
    initialValues: {
      email: 'manasuiux@icloud.com',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: (values) => {
      // Handle email change logic here
      console.log('Email changed:', values);
    },
  });

  return (
    
        <div className="flex flex-col flex-1 gap-4 mt-[32px] items-center w-full mb-2">
          {/* Password Card */}
          <div className="w-full">
            <div className="bg-white border border-[#E6E6E6] shadow-md flex flex-col gap-6 py-4 px-8">
              <div className="font-semibold text-[#ff7700] text-lg mb-2 border-b-2 border-[#ff7700] pb-1 w-fit mb-[24px]">Change Password</div>
              <form onSubmit={passwordFormik.handleSubmit}>
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Enter New Password"
                      value={passwordFormik.values.newPassword}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      className="profile-input"
                    />
                    {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                      <div className="text-red-500 text-xs mt-1">{passwordFormik.errors.newPassword}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Enter Confirmed Password"
                      value={passwordFormik.values.confirmPassword}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      className="profile-input"
                    />
                    {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                      <div className="text-red-500 text-xs mt-1">{passwordFormik.errors.confirmPassword}</div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#ff7700] text-white py-2 px-8 font-semibold text-base hover:bg-[#e55e00] transition-colors self-start"
                >
                  Change Password
                </button>
              </form>
            </div>
          </div>
          {/* Email Card */}
          {/* <div className="w-full">
            <div className="bg-white border border-[#E6E6E6] shadow-md flex flex-col gap-6 py-4 px-8">
              <div className="font-semibold text-[#ff7700] text-lg mb-2 border-b-2 border-[#ff7700] pb-1 w-fit mb-[24px]">Change Email</div>
              <form onSubmit={emailFormik.handleSubmit}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={emailFormik.values.email}
                  onChange={emailFormik.handleChange}
                  onBlur={emailFormik.handleBlur}
                  className="profile-input mb-4"
                />
                {emailFormik.touched.email && emailFormik.errors.email && (
                  <div className="text-red-500 text-xs mt-1">{emailFormik.errors.email}</div>
                )}
                <button
                  type="submit"
                  className="bg-[#ff7700] text-white py-2 px-8 font-semibold text-base hover:bg-[#e55e00] transition-colors self-start"
                >
                  Change Email
                </button>
              </form>
            </div>
          </div> */}
        </div>
  );
};

export default AccountSecurity;