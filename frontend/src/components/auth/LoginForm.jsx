import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../lib/adminApi';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!apiUrl && useMockData) {
        const demoEmail = import.meta.env.VITE_DEMO_EMAIL || import.meta.env.VITE_ADMIN_EMAIL;
        const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || import.meta.env.VITE_ADMIN_PASSWORD;
        if (email !== demoEmail || password !== demoPassword) {
          throw new Error('Invalid demo credentials.');
        }
        login('demo-session', '/admin-dashboard');
        return;
      }

      const result = await adminApi.login(email, password);
      if (!result?.token) {
        throw new Error('The login response did not include a token.');
      }
      login(result.token, '/admin-dashboard');
    } catch (error) {
      setError(error.message || 'Unable to sign in.');
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
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-gray-300 text-sm" htmlFor="password">Password</label>
          <Link
            to="/reset-password"
            className="text-xs text-[#00e676] hover:text-[#00c868] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
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