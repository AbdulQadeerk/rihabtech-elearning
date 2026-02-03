// OTP Verification page for forgot password flow
import { useState, useRef, useEffect } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { toast } from "sonner";
import { API_BASE_URL } from '../../lib/api';

function getEmailFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/email=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

const OTP_LENGTH = 6;
const RESEND_INTERVAL = 30; // seconds

export default function VerifyResetOtpPage() {
  const [loading, setLoading] = useState(false);
  const email = getEmailFromHash();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [timer, setTimer] = useState(RESEND_INTERVAL);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[idx] = val[val.length - 1];
    setOtp(newOtp);
    if (idx < OTP_LENGTH - 1 && val) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (paste.length === OTP_LENGTH) {
      setOtp(paste.split(''));
      setTimeout(() => {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      }, 10);
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== OTP_LENGTH) {
      toast.error('Please enter the complete OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL + 'verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: otpValue,
          email: email,
        }),
      });
      let data;
      let errorMsg = 'Invalid OTP.';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) { data = {}; }
        errorMsg = data.message || data.error || data.msg || errorMsg;
      } else {
        try {
          data = await response.text();
          if (data && typeof data === 'string') errorMsg = data;
        } catch (e) {}
      }
      if (response.ok) {
        toast.success('OTP verified. Please reset your password.');
        window.location.hash = `#/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(otpValue)}`;
      } else {
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch(API_BASE_URL + 'forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email }),
      });
      let data;
      let msg = 'OTP resent.';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) { data = {}; }
        msg = data.message || data.error || data.msg || msg;
      } else {
        try {
          data = await response.text();
          if (data && typeof data === 'string') msg = data;
        } catch (e) {}
      }
      if (response.ok) {
        toast.success(msg);
        setTimer(RESEND_INTERVAL);
      } else {
        toast.error(msg);
      }
    } catch (error) {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex md:w-1/2 App-Gradient-Angular flex-col items-center justify-center px-[110px] relative">
        <div className="bg-white rounded-full p-8 w-4/5 aspect-square flex items-center justify-center">
          <img
            src="Images/5243321.png"
            alt="OTP Verification"
            className="max-w-full"
          />
        </div>
        <div className="text-center mt-8 text-white">
          <h2 className="text-white text-[31.25px] font-bold font-['Zen_Kaku_Gothic_Antique'] leading-[37.50px] mb-2">Verify OTP</h2>
          <p className="text-neutral-100 text-base font-normal font-['Zen_Kaku_Gothic_Antique'] leading-7">
            Enter the OTP sent to your email to continue.
          </p>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Verify OTP</h1>
          </div>
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  className={`w-12 h-12 text-2xl text-center border border-gray-600 bg-gray-50 rounded-lg focus:outline-none focus:border-orange-500 transition-all`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <div className="text-center text-sm mb-2">
              {timer > 0 ? (
                <span className="text-gray-400">Didn't get the OTP? <span>Resend in {timer}s</span></span>
              ) : (
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="ml-2 px-4 py-1 rounded-full bg-orange-500 text-white font-semibold shadow hover:bg-orange-600 transition-all"
                >
                  {resending ? 'Resending...' : 'Resend Now'}
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2 mt-4">
              <Button type="submit" className="px-8 btn-rouded bg-orange-500 hover:bg-orange-600 mt-4 w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
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