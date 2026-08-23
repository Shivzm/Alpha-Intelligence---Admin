export default function LoginForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your authentication logic here
    console.log("Form submitted");
  };

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
            placeholder="Enter your email" 
            required
            className="w-full bg-transparent border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors" 
          />
        </div>
      </div>
      
      <div>
        <label className="block text-gray-300 text-sm mb-1.5" htmlFor="password">Password</label>
        <div className="relative flex items-center">
          <svg className="w-5 h-5 text-gray-500 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <input 
            id="password"
            type="password" 
            placeholder="Enter your password" 
            required
            className="w-full bg-transparent border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors" 
          />
        </div>
      </div>

      {/* Checkbox */}
      <div className="flex items-center gap-3 mt-1">
        <input 
          id="terms"
          type="checkbox" 
          required
          className="w-4 h-4 rounded border-gray-700 bg-transparent text-indigo-500 focus:ring-indigo-500" 
        />
        <label htmlFor="terms" className="text-gray-400 text-sm">
          I agree to the <a href="#" className="text-gray-300 hover:text-white transition-colors">Terms & Privacy</a>
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="w-full bg-[#1b1c28] hover:bg-[#252736] border border-gray-800 text-gray-200 rounded-lg py-3 mt-2 transition-colors font-medium">
        Continue
      </button>
    </form>
  );
}