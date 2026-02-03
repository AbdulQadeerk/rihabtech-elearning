import LearnerProfileSidebar from '../../../components/ui/LearnerProfileSidebar';
import LoadingIcon from '../../../components/ui/LoadingIcon';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import React, { useEffect, useState } from 'react';
import GradientHeader from '../../../components/ui/GradientHeader';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PhoneInput from 'react-phone-input-2';
import { API_BASE_URL } from '../../../lib/api';
import { toast } from 'sonner';
import axiosClient from '../../../utils/axiosClient';

const EditProfile: React.FC<{ profile: any, loading: boolean, error: string, onProfileUpdate: (profile: any) => void }> = ({ profile, loading, error, onProfileUpdate }) => {
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const formik = useFormik({
    initialValues: {
      id: profile?.id || '',
      name: profile?.name || '',
      email: profile?.emailId || '',
      phone: profile?.phoneNumber || '',
      gender: profile?.gender || '',
      address: profile?.address || '',
    },
    enableReinitialize: false, // Disable auto-reinitialize to prevent form clearing
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
        const response = await axiosClient.post('/update-profile', {
          name: values.name,
          emailId: values.email,
          phoneNumber: values.phone,
          gender: values.gender,
          address: values.address
        });
        const data = response.data;
        toast.success('Profile updated successfully');
        setSuccess('Profile updated successfully!');
        
        // Update formik values directly first to prevent form clearing
        formik.setValues({
          id: values.id,
          name: values.name,
          email: values.email,
          phone: values.phone,
          gender: values.gender,
          address: values.address
        });
        
        // Ensure the updated profile data has all required fields in the correct format
        const updatedProfileData = {
          ...profile, // Preserve existing profile data
          ...data, // Override with API response
          id: data.id || profile?.id || values.id,
          name: data.name || values.name,
          emailId: data.emailId || values.email,
          phoneNumber: data.phoneNumber || values.phone,
          gender: data.gender || values.gender,
          address: data.address || values.address
        };
        
        // Update parent state with properly formatted data
        onProfileUpdate(updatedProfileData);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Profile update failed');
        setSuccess('');
      } finally {
        setIsUpdating(false);
      }
    },
  });

  // Sync formik values when profile changes (only on initial load, not during updates)
  useEffect(() => {
    if (profile && !isUpdating) {
      formik.setValues({
        id: profile.id || '',
        name: profile.name || '',
        email: profile.emailId || '',
        phone: profile.phoneNumber || '',
        gender: profile.gender || '',
        address: profile.address || '',
      });
    }
  }, [profile?.id, profile?.name, profile?.emailId, profile?.phoneNumber, profile?.gender, profile?.address]); // Only sync when profile data actually changes

  if (loading) return <LoadingIcon />;
  if (error && typeof error === 'string') return <div className="text-red-500 text-center py-8">{error}</div>;

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
                  {/* <Input
                    type="text"
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="profile-input bg-white border border-[#E6E6E6] rounded-md font-bold focus:border-[#ff7700] focus:ring-2 focus:ring-[#ff7700] font-barlow"
                  /> */}
                  {/* <div className="relative"> */}
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
                    value={formik.values.gender}
                    onValueChange={value => formik.setFieldValue('gender', value)}
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
                  className="w-full bg-[#ff7700] hover:bg-[#e55e00] text-white font-barlow font-semibold text-lg py-3  shadow-md transition"
                >
                  Update Profile Changes
                </Button>
              </div>
            </form>
          </div>
  );
};

export default EditProfile;