import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Wire this up to your actual "send reset link" API call.
    console.log('Password reset requested for', email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="border border-gray-800 bg-[#15161c] rounded-lg p-4">
          <p className="text-gray-200 text-sm font-medium mb-1">Check your inbox</p>
          <p className="text-gray-500 text-sm">
            If an account exists for <span className="text-gray-300">{email}</span>, a
            password reset link is on its way.
          </p>
        </div>

        <Link
          to="/"
          className="w-full text-center bg-[#1b1c28] hover:bg-[#252736] border border-gray-800 text-gray-200 rounded-lg py-3 transition-colors font-medium"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-gray-300 text-sm mb-1.5" htmlFor="email">Email</label>
        <div className="relative flex items-center">
          <svg className="w-5 h-5 text-gray-500 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full bg-transparent border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-[#1b1c28] hover:bg-[#252736] border border-gray-800 text-gray-200 rounded-lg py-3 mt-2 transition-colors font-medium">
        Send reset link
      </button>

      <Link
        to="/"
        className="text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Back to login
      </Link>
    </form>
  );
}
