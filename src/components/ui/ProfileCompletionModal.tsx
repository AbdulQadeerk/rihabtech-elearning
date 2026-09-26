import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import axiosClient from '../../utils/axiosClient';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

interface ProfileCompletionModalProps {
  userName: string;
  userEmail: string;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ userName, userEmail, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('IN');

  const formik = useFormik({
    initialValues: {
      name: userName || '',
      phone: '',
      address: '',
      gender: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Full Name is required')
        .max(50, 'Name can be a maximum of 50 characters'),
      phone: Yup.string()
        .test('is-valid-phone', 'Invalid phone number for selected country.', function (value) {
          if (!value) return false;
          try {
            const phoneNumber = parsePhoneNumberFromString('+' + value, phoneCountry as CountryCode);
            return phoneNumber && phoneNumber.isValid();
          } catch {
            return false;
          }
        })
        .required('Phone Number is required'),
      address: Yup.string()
        .required('Address is required')
        .max(250, 'Address can be a maximum of 250 characters'),
      gender: Yup.string()
        .oneOf(['Male', 'Female', 'Other'], 'Select a valid gender')
        .required('Gender is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axiosClient.post('/update-profile', {
          name: values.name,
          emailId: userEmail,
          phoneNumber: values.phone,
          address: values.address,
          gender: values.gender,
        });

        // Update token in localStorage to mark profile as complete
        const tokenData = localStorage.getItem('token');
        if (tokenData) {
          try {
            const parsed = JSON.parse(tokenData);
            parsed.IsProfileComplete = true;
            localStorage.setItem('token', JSON.stringify(parsed));
          } catch (e) {
            // Ignore parse errors
          }
        }

        toast.success('Profile completed successfully! Welcome aboard!');
        onComplete();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className="App-Gradient-Angular px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-barlow">Complete Your Profile</h2>
              <p className="text-white/80 text-sm">Just a few details to get you started</p>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="flex gap-1.5 mt-3">
            <div className="h-1 flex-1 bg-white/90 rounded-full"></div>
            <div className="h-1 flex-1 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="px-8 py-6 space-y-5">
          <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="font-semibold text-amber-700">👋 Welcome!</span>{' '}
            Please fill in your details below to complete your registration. Fields marked with <span className="text-red-500">*</span> are required.
          </p>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your full name"
              className="border-gray-300 focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700]/20"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              country={'in'}
              countryCodeEditable={false}
              value={formik.values.phone}
              onChange={(value, country) => {
                formik.setFieldValue('phone', value);
                const c = country as { iso2?: string };
                if (c && c.iso2) {
                  setPhoneCountry(c.iso2.toUpperCase());
                }
              }}
              inputClass="!h-[42px] !pl-[60px] !w-full !border !border-gray-300 !rounded-md !text-sm focus:!border-[#ff7700]"
              buttonClass="!border !border-gray-300 !rounded-l-md !rounded-r-none"
              containerClass="!w-full"
              inputProps={{
                name: 'phone',
                required: true,
                placeholder: 'Enter your phone number',
              }}
              enableSearch={true}
              searchPlaceholder="Search country..."
              searchNotFound="No country found"
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.phone}</p>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="e.g. Mumbai, India"
              className="border-gray-300 focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700]/20"
            />
            {formik.touched.address && formik.errors.address && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.address}</p>
            )}
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <Select
              value={formik.values.gender}
              onValueChange={(value) => formik.setFieldValue('gender', value)}
            >
              <SelectTrigger
                className="border-gray-300 focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700]/20"
                onBlur={() => formik.setFieldTouched('gender', true)}
              >
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.gender}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff7700] hover:bg-[#e56600] text-white font-semibold text-base py-3 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              'Complete Profile & Continue'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
