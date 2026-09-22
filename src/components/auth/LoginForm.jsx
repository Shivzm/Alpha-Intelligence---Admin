import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Pull credentials securely from the .env file
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Check input against environment variables
    if (email === adminEmail && password === adminPassword) {
      navigate('/admin-dashboard'); 
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      
      {/* Email Field */}
      <div>
        <label className="block text-gray-300 text-sm mb-1.5" htmlFor="email">Email</label>
        <div className="relative flex items-center">
          <svg className="w-5 h-5 text-gray-500 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <input 
            id="email"
            type="email" 
            placeholder="admin@example.com" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00e676] transition-colors" 
          />
        </div>
      </div>
      
      {/* Password Field */}
      <div>
        <label className="block text-gray-300 text-sm mb-1.5" htmlFor="password">Password</label>
        <div className="relative flex items-center">
          <svg className="w-5 h-5 text-gray-500 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <input 
            id="password"
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg py-2.5 pl-10 pr-10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00e676] transition-colors" 
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-gray-500 hover:text-gray-300 focus:outline-none flex items-center justify-center transition-colors"
          >
            <i className={`text-lg ${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'}`}></i>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-[-10px]">{error}</p>
      )}

      {/* Checkbox */}
      <div className="flex items-center gap-3 mt-1">
        <input 
          id="terms"
          type="checkbox" 
          required
          className="w-4 h-4 rounded border-gray-700 bg-transparent text-[#00e676] focus:ring-[#00e676]" 
        />
        <label htmlFor="terms" className="text-gray-400 text-sm">
          I agree to the <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms & Privacy</a>
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="w-full bg-[#1b1c28] hover:bg-[#00e676] hover:text-black border border-gray-800 text-gray-200 rounded-lg py-3 mt-2 transition-all duration-300 font-medium">
        Continue
      </button>
    </form>
  );
}