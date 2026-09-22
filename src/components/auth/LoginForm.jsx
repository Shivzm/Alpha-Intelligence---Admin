import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === adminEmail && password === adminPassword) {
      // Simulate generating a secure JWT for the session
      const mockSessionToken = btoa(email + Date.now().toString());
      login(mockSessionToken, '/admin-dashboard'); 
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
          <i className="ri-mail-line w-5 h-5 text-gray-500 absolute left-3 flex items-center justify-center"></i>
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
          <i className="ri-lock-line w-5 h-5 text-gray-500 absolute left-3 flex items-center justify-center"></i>
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

      {error && <p className="text-red-500 text-sm mt-[-10px]">{error}</p>}

      <div className="flex items-center gap-3 mt-1">
        <input 
          id="terms"
          type="checkbox" 
          required
          className="w-4 h-4 rounded border-gray-700 bg-transparent accent-[#00e676] cursor-pointer" 
        />
        <label htmlFor="terms" className="text-gray-400 text-sm">
          I agree to the <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms & Privacy</a>
        </label>
      </div>

      <button 
        type="submit" 
        className="w-full bg-[#1b1c28] hover:bg-[#00e676] hover:text-black border border-gray-800 text-gray-200 rounded-lg py-3 mt-2 transition-all duration-300 font-medium">
        Continue
      </button>
    </form>
  );
}