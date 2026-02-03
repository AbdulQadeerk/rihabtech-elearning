import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../../lib/api';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

interface BankDetailsFormData {
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIFSCCode: string;
}

interface UserData {
  AccessToken: string;
  bankDetails?: {
    bankName: string;
    bankBranch: string;
    bankAccountNo: string;
    bankIFSCCode: string;
  }
}

interface BankDetailsProps {
  profile?: any; // Optional profile prop with instructorProfile data
}

const BankDetails: React.FC<BankDetailsProps> = ({ profile }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankDetailsData, setBankDetailsData] = useState<BankDetailsFormData | null>(null);

  const bankDetailsSchema = useFormik({
    initialValues: {
      bankName: '',
      bankBranch: '',
      bankAccountNo: '',
      bankIFSCCode: '',
    },
    validationSchema: Yup.object({
      bankName: Yup.string().required('Bank Name is required'),
      bankBranch: Yup.string().required('Bank Branch is required'),
      bankAccountNo: Yup.string()
        .matches(/^[0-9]+$/, 'Bank Account Number must contain only numbers')
        .min(9, 'Bank Account Number must be at least 9 digits')
        .max(18, 'Bank Account Number must not exceed 18 digits')
        .required('Bank Account Number is required'),
      bankIFSCCode: Yup.string()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC Code must be in correct format (e.g. SBIN0123456)')
        .required('Bank IFSC Code is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (!user || !user.AccessToken) {
        toast.error('Please login to update bank details');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}instructor/update-bank-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.AccessToken}`,
          },
          body: JSON.stringify({
            bankName: values.bankName.trim(),
            bankBranch: values.bankBranch.trim(),
            bankAccountNo: values.bankAccountNo.trim(),
            bankIFSCCode: values.bankIFSCCode.toUpperCase().trim(),
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
          toast.success('Bank details updated successfully!');
          setHasBankDetails(true);
          setIsEditMode(false);
          
          // Update user data in localStorage with new bank details
          const token = localStorage.getItem('token');
          if (token) {
            const userData = JSON.parse(token);
            userData.bankDetails = values;
            localStorage.setItem('token', JSON.stringify(userData));
            setUser(userData);
          }
        } else {
          const errorMsg = typeof data === 'string'
            ? data
            : data.message || data.error || data.msg || 'Failed to update bank details. Please try again.';
          toast.error(errorMsg);
        }
      } catch (error: any) {
        console.error('Error updating bank details:', error);
        toast.error(error.message || 'Failed to update bank details. Please try again.');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    // First, try to load from API profile data
    if (profile?.instructorProfile) {
      const instructorData = profile.instructorProfile;
      console.log('Loading bank details from API:', instructorData);
      
      // Check if instructor has bank details
      const hasBankInfo = !!(instructorData.bankName || instructorData.bankAccountNo);
      
      if (hasBankInfo) {
        const bankData: BankDetailsFormData = {
          bankName: instructorData.bankName || '',
          bankBranch: instructorData.bankBranch || '',
          bankAccountNo: instructorData.bankAccountNo || '',
          bankIFSCCode: instructorData.bankIFSCCode || '',
        };
        
        setBankDetailsData(bankData);
        setHasBankDetails(true);
        
        // Set form initial values
        bankDetailsSchema.setValues(bankData);
      }
    }
    
    // Get user data from localStorage for token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(token) as UserData;
        setUser(userData);
        
        // Only use localStorage bank details if API data is not available
        if (!profile?.instructorProfile?.bankName) {
          const hasBankInfo = !!(userData.bankDetails && userData.bankDetails.bankName);
          setHasBankDetails(hasBankInfo);
          
          // Set form initial values if bank details exist
          if (hasBankInfo) {
            bankDetailsSchema.setValues({
              bankName: userData.bankDetails?.bankName || '',
              bankBranch: userData.bankDetails?.bankBranch || '',
              bankAccountNo: userData.bankDetails?.bankAccountNo || '',
              bankIFSCCode: userData.bankDetails?.bankIFSCCode || '',
            });
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        toast.error('Failed to load user information');
      }
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to access bank details.</p>
          <Button
            onClick={() => window.location.href = '/#/login'}
            className="bg-primary text-white hover:bg-orange-600"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6E6E6] shadow-sm p-6 mt-[32px]">
      {!isEditMode ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Bank Details</h3>
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              className="border-[#ff7700] text-[#ff7700] hover:bg-[#fff7ef]"
            >
              {hasBankDetails ? 'Edit' : 'Add Bank Details'}
            </Button>
          </div>

          {hasBankDetails ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <p className="text-gray-900 font-medium">{bankDetailsData?.bankName || user.bankDetails?.bankName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                  <p className="text-gray-900 font-medium">{bankDetailsData?.bankBranch || user.bankDetails?.bankBranch || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <p className="text-gray-900 font-medium">
                    {(bankDetailsData?.bankAccountNo || user.bankDetails?.bankAccountNo)
                      ? `****-****-${(bankDetailsData?.bankAccountNo || user.bankDetails?.bankAccountNo || '').slice(-4)}` 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <p className="text-gray-900 font-medium">{bankDetailsData?.bankIFSCCode || user.bankDetails?.bankIFSCCode || 'N/A'}</p>
                </div>
              </div>

              {profile?.instructorProfile?.isBankDetailsApproved && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    <strong>Bank details are approved!</strong> Your payment information is set up and ready for receiving course sales payments.
                  </p>
                </div>
              )}
              {!profile?.instructorProfile?.isBankDetailsApproved && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    <strong>Bank details pending approval.</strong> Your bank details are submitted and awaiting admin approval.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Set Up Your Bank Account</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    You haven't added your bank details yet. Please add your bank account information to receive payments for your course sales.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {hasBankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
            </h3>
            <Button
              onClick={() => setIsEditMode(false)}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
          
          <form onSubmit={bankDetailsSchema.handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="bankName"
                  name="bankName"
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankDetailsSchema.values.bankName}
                  onChange={bankDetailsSchema.handleChange}
                  onBlur={bankDetailsSchema.handleBlur}
                  className="w-full"
                />
                {bankDetailsSchema.touched.bankName && bankDetailsSchema.errors.bankName && (
                  <div className="text-red-500 text-sm mt-1">{bankDetailsSchema.errors.bankName}</div>
                )}
              </div>

              <div>
                <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Branch <span className="text-red-500">*</span>
                </label>
                <Input
                  id="bankBranch"
                  name="bankBranch"
                  type="text"
                  placeholder="e.g. Main Branch, Delhi"
                  value={bankDetailsSchema.values.bankBranch}
                  onChange={bankDetailsSchema.handleChange}
                  onBlur={bankDetailsSchema.handleBlur}
                  className="w-full"
                />
                {bankDetailsSchema.touched.bankBranch && bankDetailsSchema.errors.bankBranch && (
                  <div className="text-red-500 text-sm mt-1">{bankDetailsSchema.errors.bankBranch}</div>
                )}
              </div>

              <div>
                <label htmlFor="bankAccountNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="bankAccountNo"
                  name="bankAccountNo"
                  type="text"
                  placeholder="e.g. 1234567890123456"
                  value={bankDetailsSchema.values.bankAccountNo}
                  onChange={bankDetailsSchema.handleChange}
                  onBlur={bankDetailsSchema.handleBlur}
                  className="w-full"
                />
                {bankDetailsSchema.touched.bankAccountNo && bankDetailsSchema.errors.bankAccountNo && (
                  <div className="text-red-500 text-sm mt-1">{bankDetailsSchema.errors.bankAccountNo}</div>
                )}
                <p className="text-xs text-gray-500 mt-1">Enter your account number (9-18 digits)</p>
              </div>

              <div>
                <label htmlFor="bankIFSCCode" className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <Input
                  id="bankIFSCCode"
                  name="bankIFSCCode"
                  type="text"
                  placeholder="e.g. SBIN0123456"
                  value={bankDetailsSchema.values.bankIFSCCode}
                  onChange={(e) => {
                    // Convert to uppercase automatically
                    bankDetailsSchema.setFieldValue('bankIFSCCode', e.target.value.toUpperCase());
                  }}
                  onBlur={bankDetailsSchema.handleBlur}
                  className="w-full"
                  maxLength={11}
                />
                {bankDetailsSchema.touched.bankIFSCCode && bankDetailsSchema.errors.bankIFSCCode && (
                  <div className="text-red-500 text-sm mt-1">{bankDetailsSchema.errors.bankIFSCCode}</div>
                )}
                <p className="text-xs text-gray-500 mt-1">Format: ABCD0123456 (Bank code + 0 + Branch code)</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure all bank details are accurate to avoid payment delays</li>
                      <li>Account holder name should match your instructor profile name</li>
                      <li>Double-check your IFSC code for correct branch identification</li>
                      <li>Changes may take 24-48 hours to reflect in our system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || bankDetailsSchema.isSubmitting}
                  className="bg-primary text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading || bankDetailsSchema.isSubmitting 
                    ? (hasBankDetails ? 'Updating...' : 'Adding...') 
                    : (hasBankDetails ? 'Update Bank Details' : 'Add Bank Details')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BankDetails;