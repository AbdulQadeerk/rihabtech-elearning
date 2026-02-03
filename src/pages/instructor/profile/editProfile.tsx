import React, { useEffect, useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PhoneInput from 'react-phone-input-2';
import { API_BASE_URL } from '../../../lib/api';
import { toast } from 'sonner';
import 'react-phone-input-2/lib/style.css';

interface InstructorEditProfileProps {
  user: any;
  profile?: any; // Optional profile prop - if provided, skip API call
}

const InstructorEditProfile: React.FC<InstructorEditProfileProps> = ({ user, profile: initialProfile }) => {
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile); // Only loading if profile not provided
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update form values when profile data is loaded (but not when updating from form submission)
  useEffect(() => {
    if (profile && !isUpdating) {
      console.log('Setting form values from profile:', profile);
      console.log('Gender value being set:', profile.gender);
      formik.setValues({
        name: profile.name || '',
        email: profile.emailId || '',
        phone: profile.phoneNumber || '',
        gender: profile.gender || '',
        address: profile.address || '',
      });
      
      // Log values after setting
      setTimeout(() => {
        console.log('Form values after setting:', formik.values);
        console.log('Gender in form after setting:', formik.values.gender);
      }, 100);
    }
  }, [profile, isUpdating]);

  // Fetch profile data from API only if not provided as prop
  useEffect(() => {
    // If profile is already provided, skip API call
    if (initialProfile) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = user?.AccessToken;
        if (!token) {
          setError('Please login to view profile');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}user-profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('Profile data fetched:', profileData);
          console.log('Gender from API:', profileData.gender);
          setProfile(profileData);
        } else {
          const errorData = await response.text();
          setError(errorData || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user?.AccessToken) {
      fetchProfile();
    }
  }, [user, initialProfile]); // Add initialProfile to dependencies

  const formik = useFormik({
    initialValues: {
      name: profile?.name || '',
      email: profile?.emailId || '',
      phone: profile?.phoneNumber || '',
      gender: profile?.gender || 'Male',
      address: profile?.address || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required('Full Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      phone: Yup.string().required('Phone No. is Required'),
      address: Yup.string().required('Address is Required'),
      gender: Yup.string().oneOf(['Male', 'Female', 'Other', ''], 'Select a valid gender').required('Gender is required'),
    }),
    onSubmit: async (values) => {
      try {
        setIsUpdating(true);
        const token = user?.AccessToken;
        if (!token) {
          toast.error('Please login to update profile');
          setIsUpdating(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: values.name,
            emailId: values.email,
            phoneNumber: values.phone,
            gender: values.gender,
            address: values.address
          }),
        });

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.ok) {
          toast.success('Profile updated successfully');
          setSuccess('Profile updated successfully!');
          
          // Update formik values directly first to prevent form clearing
          formik.setValues({
            name: values.name,
            email: values.email,
            phone: values.phone,
            gender: values.gender,
            address: values.address
          });
          
          // Update local profile state with new data (preserve all existing fields)
          const updatedProfile = {
            ...profile,
            name: values.name,
            emailId: values.email, // Preserve email
            phoneNumber: values.phone,
            gender: values.gender,
            address: values.address
          };
          setProfile(updatedProfile);
          
          // Update localStorage with new data
          const updatedUser = { ...user, Name: values.name, PhoneNumber: values.phone, Gender: values.gender, Address: values.address };
          localStorage.setItem('token', JSON.stringify(updatedUser));
        } else {
          const errorMsg = typeof data === 'string'
            ? data
            : data.message || data.error || data.msg || 'Profile update failed';
          toast.error(errorMsg);
          setSuccess('');
        }
      } catch (error: any) {
        console.error('Profile update error:', error);
        toast.error(error.message || 'Profile update failed');
        setSuccess('');
      } finally {
        setIsUpdating(false);
      }
    },
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm px-0 py-0 mt-[32px] mb-2">
        <div className="px-8 py-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm px-0 py-0 mt-[32px] mb-2">
        <div className="px-8 py-8 flex flex-col items-center justify-center">
          <div className="text-red-500 text-center">
            <p className="mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary text-white hover:bg-orange-600"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm px-0 py-0 mt-[32px] mb-2">
        <div className="px-8 py-8 flex flex-col items-center justify-center">
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm px-0 py-0 mt-[32px] mb-2">
      <form className="px-8 py-8 flex flex-col gap-8" onSubmit={formik.handleSubmit} noValidate>
        {success && (
          <div className="text-green-600 text-center font-semibold mb-2">{success}</div>
        )}
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-xl font-bold text-[#ff7700] font-barlow">Edit Profile</span>
          </div>
          <div className="flex-1 border-b-2 border-[#ff7700] rounded" style={{ height: 3, minWidth: 60 }}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-medium text-[#888] mb-1 font-barlow">Full Name</label>
            <Input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="profile-input bg-white border border-[#E6E6E6] rounded-md focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
            />
            {formik.touched.name && typeof formik.errors.name === 'string' && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.name}</div>
            )}
          </div>
         
          <div>
            <label className="block text-base font-medium text-[#888] mb-1 font-barlow">Email</label>
            <Input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              readOnly
              className="profile-input bg-white border border-[#E6E6E6] rounded-md font-bold focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
            />
            {formik.touched.email && typeof formik.errors.email === 'string' && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.email}</div>
            )}
          </div>
          <div>
            <label className="block text-base font-medium text-[#888] mb-1 font-barlow">Phone No.</label>
            <PhoneInput
              country={'in'}
              value={formik.values.phone}
              onChange={(value, country) => {
                formik.setFieldValue('phone', value);
                const c = country as { iso2?: string };
                if (c && c.iso2) {
                  setPhoneCountry(c.iso2.toUpperCase());
                }
              }}
              inputClass="profile-input bg-white border border-[#E6E6E6] rounded-md font-bold focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
              buttonClass="!border !border-gray-300 !rounded-l-md !rounded-r-none"
              containerClass="!w-full"
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: false,
                placeholder: false,
              }}
              enableSearch={true}
              searchPlaceholder="Search country..."
              searchNotFound="No country found"
            />
            {formik.touched.phone && typeof formik.errors.phone === 'string' && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.phone}</div>
            )}
          </div>
          <div>
            <label className="block text-base font-medium text-[#888] mb-1 font-barlow">Address</label>
            <Input
              type="text"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="profile-input bg-white border border-[#E6E6E6] rounded-md focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
            />
            {formik.touched.address && typeof formik.errors.address === 'string' && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.address}</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:w-1/2">
          <div>
            <label className="block text-base font-medium text-[#888] mb-1 font-barlow">Gender</label>
            <Select
              key={profile?.id || 'no-profile'}
              value={formik.values.gender || undefined}
              onValueChange={value => {
                console.log('Gender selected:', value);
                formik.setFieldValue('gender', value);
              }}
            >
              <SelectTrigger
                className="profile-input bg-white border border-[#E6E6E6] rounded-md focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
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
            {formik.touched.gender && typeof formik.errors.gender === 'string' && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.gender}</div>
            )}
          </div>
        </div>
        <div className="flex">
          <Button
            type="submit"
            className="w-full bg-[#ff7700] hover:bg-[#e55e00] text-white font-barlow font-semibold text-lg py-3 shadow-md transition"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Updating...' : 'Update Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InstructorEditProfile;
