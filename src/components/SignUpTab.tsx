
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register - Rathore Rishtey</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-[#e52d42] to-[#c41e3a] min-h-screen flex flex-col justify-between font-sans antialiased text-gray-800">

  <!-- Header / Branding Section -->
  <div class="flex-1 flex flex-col items-center justify-center text-white pt-12 pb-8 px-4 text-center">
    <div class="flex items-center space-x-1 text-4xl font-extrabold tracking-tight">
      <span>rathore</span><span class="text-white opacity-90">rishtey</span>
    </div>
    <p class="mt-2 text-sm font-medium tracking-wide opacity-90">Find Your Perfect Match</p>
  </div>

  <!-- Bottom Sheet / Form Card -->
  <div class="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl w-full max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-center text-gray-900 mb-6">Register for Free</h2>

    <!-- Phone Registration Form -->
    <form id="phone-form" onsubmit="event.preventDefault();" class="space-y-4">
      <div class="flex gap-2">
        <!-- Country Code Dropdown -->
        <div class="relative border border-gray-300 rounded-lg px-3 py-3 flex items-center bg-gray-50 focus-within:ring-2 focus-within:ring-rose-500">
          <select id="country-code" class="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer pr-2">
            <option value="+91">+91</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
          </select>
        </div>

        <!-- Phone Input Field -->
        <input 
          type="tel" 
          id="phone-number" 
          placeholder="Enter mobile no." 
          maxlength="10"
          oninput="toggleOtpButton(this.value)"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium"
        />
      </div>

      <!-- Invisible reCAPTCHA container for Firebase Phone Auth -->
      <div id="recaptcha-container"></div>

      <!-- Submit / Get OTP Button -->
      <button 
        type="button" 
        id="otp-btn" 
        disabled 
        onclick="handleSendOTP()"
        class="w-full py-3.5 rounded-full text-base font-bold transition-all bg-gray-200 text-gray-400 cursor-not-allowed"
      >
        Get OTP
      </button>
    </form>

    <!-- Divider -->
    <div class="relative my-6 text-center">
      <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
      <span class="relative bg-white px-3 text-xs text-gray-400 font-medium">Or</span>
    </div>

    <!-- Google Sign-In Button (Centered & Full Width for 2-option setup) -->
    <div class="mb-6">
      <button 
        onclick="handleGoogleAuth()" 
        class="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-full py-3 px-4 hover:bg-gray-50 transition shadow-sm"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span class="text-sm font-semibold text-gray-700">Continue with Google</span>
      </button>
    </div>

    <!-- Terms Disclaimer -->
    <p class="text-center text-xs text-gray-400 mb-6 leading-relaxed">
      By continuing, you agree to our <a href="#" class="underline hover:text-gray-600">Privacy Policy</a> and <a href="#" class="underline hover:text-gray-600">T&C</a>.
    </p>

    <!-- Already Have Account / Login Link -->
    <div class="border border-gray-200 rounded-full py-3 text-center">
      <span class="text-xs text-gray-600 font-medium">Already have an account?</span>
      <a href="/login" class="text-xs text-cyan-600 font-bold ml-1 hover:underline">Login &gt;</a>
    </div>
  </div>

  <!-- JavaScript Handler Logic -->
  <script type="module">
    import { auth } from './firebase.js';
    import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

    // Enable / Disable 'Get OTP' button based on phone number length
    window.toggleOtpButton = function(val) {
      const btn = document.getElementById('otp-btn');
      if (val.trim().length === 10) {
        btn.disabled = false;
        btn.className = "w-full py-3.5 rounded-full text-base font-bold transition-all bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:opacity-95 cursor-pointer";
      } else {
        btn.disabled = true;
        btn.className = "w-full py-3.5 rounded-full text-base font-bold transition-all bg-gray-200 text-gray-400 cursor-not-allowed";
      }
    };

    // Trigger Google Sign-In with scopes
    window.handleGoogleAuth = async function() {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Logged in user:", result.user);
      } catch (err) {
        console.error("Google Auth Error:", err.message);
      }
    };

    // Trigger Phone OTP Request
    window.handleSendOTP = async function() {
      const code = document.getElementById('country-code').value;
      const num = document.getElementById('phone-number').value;
      const fullPhone = `${code}${num}`;

      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
        }
        const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
        window.confirmationResult = confirmation;
        alert("OTP sent successfully to " + fullPhone);
      } catch (err) {
        console.error("Phone Auth Error:", err.message);
      }
    };
  </script>
</body>
</html>

  
