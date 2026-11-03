import React, { useState } from 'react';
import { auth } from '../firebase'; // Adjust path to your firebase.js file if needed
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

export default function SignUpTab() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Handle Google Sign-In
  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google User:", result.user);
      alert(`Welcome ${result.user.displayName || 'User'}!`);
    } catch (err: any) {
      console.error("Google Auth Error:", err.message);
      alert(err.message);
    }
  };

  // Send OTP via Firebase Phone Auth
  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber}`;

    try {
      // Setup invisible reCAPTCHA container if not already initialized
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsOtpStep(true);
      alert("OTP sent successfully!");
    } catch (err: any) {
      console.error("Phone Auth Error:", err.message);
      alert("Failed to send OTP: " + err.message);
    }
  };

  // Verify OTP Code
  const handleVerifyOTP = async () => {
    if (!confirmationResult || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("Verified User:", result.user);
      alert("Phone number verified successfully!");
    } catch (err: any) {
      console.error("Invalid OTP:", err.message);
      alert("Invalid OTP code. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#e52d42] to-[#c41e3a] min-h-screen flex flex-col justify-between font-sans antialiased text-gray-800">
      
      {/* Header / Branding Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-white pt-12 pb-8 px-4 text-center">
        <div className="flex items-center space-x-1 text-4xl font-extrabold tracking-tight">
          <span>rathore</span><span className="text-white opacity-90">rishtey</span>
        </div>
        <p className="mt-2 text-sm font-medium tracking-wide opacity-90">Find Your Perfect Match</p>
      </div>

      {/* Bottom Sheet / Form Card */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {isOtpStep ? "Enter Verification Code" : "Register for Free"}
        </h2>

        {!isOtpStep ? (
          /* Phone Registration Step */
          <div className="space-y-4">
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative border border-gray-300 rounded-lg px-3 py-3 flex items-center bg-gray-50">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
              </div>

              {/* Phone Input Field */}
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile no." 
                maxLength={10}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>

            {/* Get OTP Button */}
            <button 
              type="button" 
              disabled={phoneNumber.length !== 10}
              onClick={handleSendOTP}
              className={`w-full py-3.5 rounded-full text-base font-bold transition-all ${
                phoneNumber.length === 10 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:opacity-95 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Get OTP
            </button>
          </div>
        ) : (
          /* OTP Verification Step */
          <div className="space-y-4">
            <input 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP" 
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500 font-bold"
            />
            <button 
              type="button" 
              disabled={otp.length !== 6}
              onClick={handleVerifyOTP}
              className={`w-full py-3.5 rounded-full text-base font-bold transition-all ${
                otp.length === 6 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:opacity-95 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Verify OTP
            </button>
            <button 
              type="button" 
              onClick={() => setIsOtpStep(false)}
              className="w-full text-center text-xs text-rose-600 font-semibold hover:underline mt-2"
            >
              Change Phone Number
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">Or</span>
        </div>

        {/* Google Sign-In Button */}
        <div className="mb-6">
          <button 
            type="button"
            onClick={handleGoogleAuth} 
            className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-700">Continue with Google</span>
          </button>
        </div>

        {/* Terms Disclaimer */}
        <p className="text-center text-xs text-gray-400 mb-6 leading-relaxed">
          By continuing, you agree to our <a href="#" className="underline hover:text-gray-600">Privacy Policy</a> and <a href="#" className="underline hover:text-gray-600">T&C</a>.
        </p>

        {/* Login Link */}
        <div className="border border-gray-200 rounded-full py-3 text-center">
          <span className="text-xs text-gray-600 font-medium">Already have an account?</span>
          <a href="/login" className="text-xs text-cyan-600 font-bold ml-1 hover:underline">Login &gt;</a>
        </div>
      </div>

    </div>
  );
}
