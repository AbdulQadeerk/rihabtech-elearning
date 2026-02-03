import { useState, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useFormik } from "formik";
import * as Yup from 'yup';
import { toast } from "sonner";
import { setDoc, doc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../lib/api';
// import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function InstructorSignupPage() {
  const [aadharImage, setAadharImage] = useState<string | null>(null);
  const [panImage, setPanImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();
  // const storage = getStorage();

  // Check if user is logged in and if they already applied
  useEffect(() => {
    const checkUserAndApplicationStatus = async () => {
      try {
        // Get user info from localStorage
        const tokenData = localStorage.getItem('token');
        if (!tokenData) {
          toast.error('Please login first to apply as instructor');
          navigate('/login');
          return;
        }

        const userData = JSON.parse(tokenData);
        console.log('User data found:', userData);
        setUserInfo(userData);

        // Check if user already applied
        const userEmail = userData.UserName || userData.email;
        console.log('Checking for existing applications with email:', userEmail);

        if (userEmail) {
          // Check both possible field names (userEmail and instructorId)
          const q1 = query(
            collection(db, 'instructor_requests'),
            where('userEmail', '==', userEmail)
          );
          const q2 = query(
            collection(db, 'instructor_requests'),
            where('instructorId', '==', userEmail)
          );

          const [querySnapshot1, querySnapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
          ]);

          console.log('Query results:', {
            userEmailQuery: querySnapshot1.size,
            instructorIdQuery: querySnapshot2.size
          });

          if (!querySnapshot1.empty || !querySnapshot2.empty) {
            // User already applied, redirect to success page
            const existingApplication = (!querySnapshot1.empty
              ? querySnapshot1.docs[0].data()
              : querySnapshot2.docs[0].data()) as any;

            console.log('Existing application found:', existingApplication);

            // Store application status in localStorage
            localStorage.setItem('instructorApplicationStatus', JSON.stringify({
              status: existingApplication?.status,
              appliedAt: existingApplication?.createdAt,
              email: userEmail,
              applicationId: existingApplication?.applicationId || 'unknown'
            }));

            toast.info('You have already applied to become an instructor');
            setTimeout(() => {
              navigate('/instructor-signup-success');
            }, 1000);
            return;
          }
        }

        console.log('No existing application found, showing signup form');
      } catch (error) {
        console.error('Error checking application status:', error);
        toast.error('Error checking application status');
      }
    };

    checkUserAndApplicationStatus();
  }, [navigate]);

  // const uploadImageAndGetUrl = async (fileString: string, path: string) => {
  //   const storageRef = ref(storage, path);
  //   await uploadString(storageRef, fileString, 'data_url');
  //   return await getDownloadURL(storageRef);
  // };

  const signupSchema = useFormik({
    initialValues: {
      experties: '',
      topic: '',
      bio: '',
      adhaarnumber: '',
      PANnumber: '',
    },
    validationSchema: Yup.object({
      experties: Yup.string()
        .required('Area of Expertise is required')
        .max(250, 'Max 250 characters allowed in area of expertise'),
      topic: Yup.string()
        .required('Teaching Topics are required')
        .max(250, 'Max 250 characters allowed in teaching topics'),
      bio: Yup.string()
        .max(1000, 'Max 1000 characters allowed in bio'),
      adhaarnumber: Yup.string()
        .matches(/^\d{12}$/, 'Aadhaar Number must be 12 digits')
        .max(12, 'Max 12 characters allowed in aadhaar no')
        .required('Aadhaar Number is required'),
      PANnumber: Yup.string()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN Number must be 10 characters (e.g. ABCDE1234F)')
        .max(10, 'Max 10 characters allowed in pan no')
        .required('PAN Number is required'),
      // bankName: Yup.string()
      //   .max(50, 'Max 50 characters allowed in bank name'),
      // bankBranch: Yup.string()
      //   .max(150, 'Max 150 characters allowed in bank branch'),
      // bankAccountNo: Yup.string()
      //   .max(20, 'Max 20 characters allowed in bank account no'),
      // bankIFSCCode: Yup.string()
      //   .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC Code must be in correct format (e.g. SBIN0123456)')
      //   .max(11, 'Max 11 characters allowed in bank ifsc code'),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      if (!aadharImage || !panImage) {
        const errors: Record<string, string> = {};
        if (!aadharImage) errors.aadharImage = "Aadhaar Card Image is required";
        if (!panImage) errors.panImage = "PAN Card Image is required";
        setErrors(errors);
        setSubmitting(false);
        return;
      }

      if (!userInfo) {
        toast.error('User information not found. Please login again.');
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const userEmail = userInfo.UserName || userInfo.email;
        const userId = userInfo.Id || userInfo.id || 0;

        // Create FormData for multipart/form-data submission
        const formData = new FormData();

        // Add form fields
        formData.append('areaOfExpertise', values.experties);
        formData.append('teachingTopics', values.topic);
        formData.append('bio', values.bio);
        formData.append('panNo', values.PANnumber);
        formData.append('aadhaarNo', values.adhaarnumber);
        formData.append('bankName', "");
        formData.append('bankBranch', "");
        formData.append('bankAccountNo', "");
        formData.append('bankIFSCCode', "");
        formData.append('id', "");

        // Convert base64 images to files and append
        if (aadharImage) {
          const aadharBlob = await fetch(aadharImage).then(r => r.blob());
          formData.append('aadhaarNoFile', aadharBlob, 'aadhaar.jpg');
        }

        if (panImage) {
          const panBlob = await fetch(panImage).then(r => r.blob());
          formData.append('panNoFile', panBlob, 'pan.jpg');
        }

        // Get token for authorization
        const token = userInfo.AccessToken;
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}instructor/register`, {
          method: 'POST',
          headers,
          body: formData,
        });

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.ok) {
          toast.success('Your instructor registration has been submitted successfully!');

          // Store application status in localStorage
          localStorage.setItem('instructorApplicationStatus', JSON.stringify({
            status: 'pending',
            appliedAt: new Date().toISOString(),
            email: userEmail,
            applicationId: `instructor_${userId}_${Date.now()}`
          }));

          navigate('/instructor-signup-success');
        } else {
          // Handle API validation errors
          let errorMsg = 'Registration failed. Please try again.';
          
          if (typeof data === 'string') {
            errorMsg = data;
          } else if (data) {
            // Check if there are specific validation errors
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
              // Show all validation errors
              data.errors.forEach((error: string) => {
                toast.error(error);
              });
              return; // Don't show generic error message
            } else {
              errorMsg = data.message || data.error || data.msg || errorMsg;
            }
          }
          
          toast.error(errorMsg);
        }
      } catch (error: any) {
        console.error('Submission error:', error);
        toast.error(error.message || 'Submission failed. Please try again.');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  // Show loading if user info is not loaded yet
  if (!userInfo) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">
            Share What You Love. Help Others Grow.
          </h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Turn your passion into purpose by teaching online with ZK Tutorials.
          </p>
        </div>
      </div>

      {/* Right Column - Sign Up Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create. Teach. Connect.</h1>
            <h1 className="text-2xl font-bold">as a Instructor</h1>
            <p className="text-sm text-gray-600 mt-2">
              Welcome, <strong>{userInfo.Name}</strong>! Complete your instructor application below.
            </p>
            <p className="text-sm text-gray-600 mt-1">Fields marked (<span className="text-[#ff0000]">*</span>) are mandatory.</p>
          </div>

          <form onSubmit={signupSchema.handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="experties" className="text-sm text-gray-600">
                    Area Of Expertise<span className="text-[#ff0000]"> *</span>
                  </label>
                  <span className={`text-xs ${signupSchema.values.experties.length >= 250 ? 'text-red-500' : 'text-gray-400'}`}>
                    {signupSchema.values.experties.length}/250
                  </span>
                </div>
                <Input
                  id="experties"
                  name="experties"
                  type="text"
                  placeholder="e.g. Design"
                  value={signupSchema.values.experties}
                  onChange={signupSchema.handleChange}
                  onBlur={signupSchema.handleBlur}
                  maxLength={250}
                />
                {signupSchema.touched.experties && signupSchema.errors.experties && (
                  <div className="text-red-500 text-xs mt-1">{signupSchema.errors.experties}</div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="topic" className="text-sm text-gray-600">
                    Teaching Topics<span className="text-[#ff0000]"> *</span>
                  </label>
                  <span className={`text-xs ${signupSchema.values.topic.length >= 250 ? 'text-red-500' : 'text-gray-400'}`}>
                    {signupSchema.values.topic.length}/250
                  </span>
                </div>
                <Input
                  id="topic"
                  name="topic"
                  type="text"
                  placeholder="e.g. Photoshop"
                  value={signupSchema.values.topic}
                  onChange={signupSchema.handleChange}
                  onBlur={signupSchema.handleBlur}
                  maxLength={250}
                />
                {signupSchema.touched.topic && signupSchema.errors.topic && (
                  <div className="text-red-500 text-xs mt-1">{signupSchema.errors.topic}</div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="bio" className="text-sm text-gray-600">
                  Bio
                </label>
                <span className={`text-xs ${signupSchema.values.bio.length >= 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                  {signupSchema.values.bio.length}/1000
                </span>
              </div>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="Tell us about yourself, your experience, and what makes you a great instructor..."
                value={signupSchema.values.bio}
                onChange={signupSchema.handleChange}
                onBlur={signupSchema.handleBlur}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
              />
              {signupSchema.touched.bio && signupSchema.errors.bio && (
                <div className="text-red-500 text-xs mt-1">{signupSchema.errors.bio}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between gap-2">
              <div>
                <label htmlFor="aadharImage" className="text-sm text-gray-600 block mb-1">
                  Aadhaar Card Image<span className="text-[#ff0000]"> *</span>
                </label>
                {!aadharImage ? (
                  <div>
                    <input
                      id="aadharImage"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setAadharImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      placeholder="Upload Your Aadhaar Card For KYC"
                    />
                    {(signupSchema.errors as any).aadharImage && (
                      <div className="text-red-500 text-xs mt-1">{(signupSchema.errors as any).aadharImage}</div>
                    )}
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <div className="w-full h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={aadharImage}
                        alt="Aadhaar Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      onClick={() => setAadharImage(null)}
                      title="Remove Image"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="panImage" className="text-sm text-gray-600 block mb-1">
                  PAN Card Image<span className="text-[#ff0000]"> *</span>
                </label>
                {!panImage ? (
                  <div>
                    <input
                      id="panImage"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      placeholder="Upload Your PAN Card For KYC"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setPanImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {(signupSchema.errors as any).panImage && (
                      <div className="text-red-500 text-xs mt-1">{(signupSchema.errors as any).panImage}</div>
                    )}
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <div className="w-full h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={panImage}
                        alt="PAN Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      onClick={() => setPanImage(null)}
                      title="Remove Image"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="adhaarnumber" className="text-sm text-gray-600">
                    Enter Your Aadhaar Card No<span className="text-[#ff0000]"> *</span>
                  </label>
                  <span className={`text-xs ${signupSchema.values.adhaarnumber.length >= 12 ? 'text-red-500' : 'text-gray-400'}`}>
                    {signupSchema.values.adhaarnumber.length}/12
                  </span>
                </div>
                <Input
                  id="adhaarnumber"
                  name="adhaarnumber"
                  type="text"
                  placeholder="e.g. 123456789012"
                  value={signupSchema.values.adhaarnumber}
                  onChange={signupSchema.handleChange}
                  onBlur={signupSchema.handleBlur}
                  maxLength={12}
                />
                {signupSchema.touched.adhaarnumber && signupSchema.errors.adhaarnumber && (
                  <div className="text-red-500 text-xs mt-1">{signupSchema.errors.adhaarnumber}</div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="PANnumber" className="text-sm text-gray-600">
                    Enter Your PAN Card No<span className="text-[#ff0000]"> *</span>
                  </label>
                  <span className={`text-xs ${signupSchema.values.PANnumber.length >= 10 ? 'text-red-500' : 'text-gray-400'}`}>
                    {signupSchema.values.PANnumber.length}/10
                  </span>
                </div>
                <Input
                  id="PANnumber"
                  name="PANnumber"
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={signupSchema.values.PANnumber}
                  onChange={signupSchema.handleChange}
                  onBlur={signupSchema.handleBlur}
                  maxLength={10}
                />
                {signupSchema.touched.PANnumber && signupSchema.errors.PANnumber && (
                  <div className="text-red-500 text-xs mt-1">{signupSchema.errors.PANnumber}</div>
                )}
              </div>
            </div>

            <Button
              className="px-8 btn-rouded bg-primary hover:bg-orange-600 mt-4"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}