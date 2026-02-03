import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { LoginModeDialog } from "./loginMode";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { toast } from "sonner";
import { API_BASE_URL } from '../../lib/api';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('IN'); // Default to India
  const signupSchema = useFormik({
    initialValues: {
      name:'',
      email: '',
      password: '',
      confirmPassword: '',
      number: '',
      address: '',
      termsconditions: false,
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is Required')
        .max(50, 'Name can be a maximum of 50 characters'),
      email: Yup.string()
        .email('Invalid email')
        .required('Email is Required')
        .max(100, 'Email can be a maximum of 100 characters'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .max(25, 'Password can be a maximum of 25 characters')
        .matches(/^[a-zA-Z0-9]+$/, 'Password must contain only letters and numbers')
        .required('Password is Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), ''], 'Passwords must match')
        .required('Confirm Password is Required'),
      number: Yup.string()
        .test('is-valid-phone', 'Invalid phone number for selected country.', function(value) {
          const { parent } = this;
          if (!value) return false;
          try {
            const phoneNumber = parsePhoneNumberFromString('+' + value, phoneCountry as CountryCode);
            return phoneNumber && phoneNumber.isValid();
          } catch {
            return false;
          }
        })
        .max(100, 'Phone number can be a maximum of 100 characters')
        .required('Contact Number is Required'),
      address: Yup.string()
        .required('Address is Required')
        .max(250, 'Address can be a maximum of 250 characters'),
      termsconditions: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL + 'register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 0,
            name: values.name,
            emailId: values.email,
            phoneNumber: values.number,
            address: values.address,
            password: values.password,
          }),
        });
        
        // Get response text first to handle both JSON and plain text
        const responseText = await response.text();
        let data: any;
        
        // Try to parse as JSON, if it fails, use the text directly
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
        
        if (response.ok && data) {
          // If data is a string, try to parse it (API may return object or stringified object)
          let userObj = typeof data === 'string' ? JSON.parse(data) : data;
          localStorage.setItem('token', JSON.stringify(userObj));
          toast.success('Registration Successful');
          window.location.hash = '#/learner/homepage';
          window.location.reload();
        } else {
          // Extract error message from various possible fields and formats
          let errorMsg = 'Registration failed. Please try again.';
          
          if (typeof data === 'string' && data.trim()) {
            // If response is a plain string, use it directly
            errorMsg = data;
          } else if (typeof data === 'object' && data !== null) {
            // Try different possible error message fields
            errorMsg = data.message || 
                      data.error || 
                      data.msg || 
                      data.errorMessage ||
                      data.error_description ||
                      (data.errors && Array.isArray(data.errors) && data.errors[0]) ||
                      (data.errors && typeof data.errors === 'string' && data.errors) ||
                      errorMsg;
          }
          
          console.error('Registration error response:', { status: response.status, data, errorMsg });
          toast.error(errorMsg);
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        // If error has a message property, show it
        const errorMsg = error.message || error.toString() || 'Registration failed. Please try again.';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoginModeOpen, setLoginModeIsOpen] = useState(false);
  const [isInstructorloginMode, setLoginMode] = useState(false);

  const handleLoginModeOpen = () => {
    if (isInstructorloginMode) {
      setLoginModeIsOpen(true);
    } else {
      window.location.href = '/#/login';
    }
  };

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

      {/* Right Column - Sign Up Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Sign Up. Dive In. Learn Freely.</h1>
            <p className="text-sm text-gray-600 mt-2">Fields marked (<span className="text-[#ff0000]">*</span>) are mandatory.</p>
          </div>

          {/* <div className="flex gap-2 mb-6">
            <Button className="btn-rouded flex-1 hover:bg-orange-600">
              Signup As Learner
            </Button>
            <Button variant={'secondary'} className="btn-rouded flex-1">
              Signup As Instructor
            </Button>
          </div> */}

          <form onSubmit={signupSchema.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm text-gray-600 block mb-1">
                Full Name<span className="text-[#ff0000]"> *</span>
              </label>
              <Input id="username" value={signupSchema.values.name} name="name"
          onChange={signupSchema.handleChange} placeholder="John Doe" />
          {signupSchema.touched.name && signupSchema.errors.name && (
          <p className="text-red-500 text-sm mt-1">{signupSchema.errors.name}</p>
        )}
            </div>

            <div>
              <label htmlFor="email" className="text-sm text-gray-600 block mb-1">
                Email<span className="text-[#ff0000]"> *</span>
              </label>
              <Input id="email" type="email" 
              value={signupSchema.values.email}
          onChange={signupSchema.handleChange}
          onBlur={signupSchema.handleBlur} placeholder="johndoe@email.com" />
          {signupSchema.touched.email && signupSchema.errors.email && (
          <p className="text-red-500 text-sm mt-1">{signupSchema.errors.email}</p>
        )}
            </div>

            <div>
              <label htmlFor="number" className="text-sm text-gray-600 block mb-1">
                Contact Number<span className="text-[#ff0000]"> *</span>
              </label>
              <div className="relative">
                <PhoneInput
                  country={'in'}
                  value={signupSchema.values.number}
                  onChange={(value, country) => {
                    signupSchema.setFieldValue('number', value);
                    const c = country as { iso2?: string };
                    if (c && c.iso2) {
                      setPhoneCountry(c.iso2.toUpperCase());
                    }
                  }}
                  inputClass="!h-[42px] md:!h-[48px] !pl-[60px] !w-full !border !border-gray-300 !rounded-md !text-sm md:!text-base"
                  buttonClass="!border !border-gray-300 !rounded-l-md !rounded-r-none"
                  containerClass="!w-full"
                  inputProps={{
                    name: 'number',
                    required: true,
                    autoFocus: false,
                    placeholder: 'Enter your number',
                  }}
                  enableSearch={true}
                  searchPlaceholder="Search country..."
                  searchNotFound="No country found"
                />
                {signupSchema.touched.number && signupSchema.errors.number && (
                  <p className="text-red-500 text-sm mt-1">{signupSchema.errors.number}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="text-sm text-gray-600 block mb-1">
                Address<span className="text-[#ff0000]"> *</span>
              </label>
              <div className="relative">
                <Input id="address"
                value={signupSchema.values.address}
          onChange={signupSchema.handleChange}
                 placeholder="Mumbai, India" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
              </div>
              {signupSchema.touched.address && signupSchema.errors.address && (
          <p className="text-red-500 text-sm mt-1">{signupSchema.errors.address}</p>
        )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm text-gray-600 block mb-1">
                Password<span className="text-[#ff0000]"> *</span>
              </label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                   value={signupSchema.values.password}
          onChange={signupSchema.handleChange}
                  placeholder="••••••••••••"
                />
                {signupSchema.touched.password && signupSchema.errors.password && (
          <p className="text-red-500 text-sm mt-1">{signupSchema.errors.password}</p>
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
            <div>
              <label htmlFor="confirmPassword" className="text-sm text-gray-600 block mb-1">
                Confirm Password<span className="text-[#ff0000]"> *</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={signupSchema.values.confirmPassword || ""}
                  onChange={signupSchema.handleChange}
                  onBlur={signupSchema.handleBlur}
                  placeholder="Re-enter your password"
                />
                {signupSchema.touched.confirmPassword && signupSchema.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{signupSchema.errors.confirmPassword}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2 mt-4">
            <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="terms"
            checked={signupSchema.values.termsconditions}
            onCheckedChange={(checked) =>
              signupSchema.setFieldValue("termsconditions", checked)
            }
            className="data-[state=checked]:bg-orange-500 border-gray-300"
          />
              <label htmlFor="terms" className="text-xs text-gray-600">
                I accept the <a className="font-bold cursor-pointer" onClick={()=>{
                  signupSchema.setFieldValue("termsconditions", true)
                  window.location.hash="#/terms-of-use"}}>terms & conditions</a>
                  <br/>
                  { signupSchema.errors.termsconditions && (
          <p className="text-red-500 text-sm mt-1">{signupSchema.errors.termsconditions}</p>
        )}
              </label>
            </div>

            <Button type="submit" className="px-8 btn-rouded bg-orange-500 hover:bg-orange-600 mt-4" disabled={loading}>
              {loading ? 'Signing up...' : 'SIGN UP'}
            </Button>
            </div>

            <LoginModeDialog open={isLoginModeOpen} setOpen={setLoginModeIsOpen} setIsInstructor={setLoginMode} />

            <div className="text-center text-sm mt-6">
              Own an Account? <a href="/#/login" className="text-blue-600 font-medium">JUMP RIGHT IN</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}