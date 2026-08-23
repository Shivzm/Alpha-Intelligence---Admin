import logo from '../assets/Icon/alpha_logo.png'; 

// Custom SVG with black strokes removed for a cleaner, modern look
const CustomDatabaseIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="6" rx="8" ry="3" fill="#ff6b00" />
    <path d="M4 6V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V6" fill="#ff6b00" />
    <path d="M4 12V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V12" fill="#ff6b00" />
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#111" strokeWidth="1" />
    <path d="M4 6V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V6" stroke="#111" strokeWidth="1" />
    <path d="M4 12V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V12" stroke="#111" strokeWidth="1" />
  </svg>
);

export default function StatsGraphic() {
  return (
    <div className="hidden md:flex w-1/2 h-full bg-[#12141c] rounded-[2rem] relative flex-col items-center justify-center overflow-hidden">
      
      {/* Adjusted 3 Overlapping Background Circles */}
      <div className="absolute bottom-0 w-full h-full overflow-hidden pointer-events-none z-0 flex items-end justify-center">
         {/* Left Overlapping Circle */}
         <div className="absolute bottom-[30%] left-[20%] w-full aspect-square rounded-full bg-[#181b26] opacity-90"></div>
         
         {/* Right Overlapping Circle */}
         <div className="absolute -bottom-[20%] -right-[20%] w-[100%] aspect-square rounded-full bg-[#1a1d2a] opacity-90"></div>
         
         {/* Top/Center Overlapping Circle */}
         <div className="absolute -bottom-[40%] w-[120%] aspect-square rounded-full bg-[#1e2333] opacity-80 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]"></div>
      </div>
      
      {/* Logo Area */}
      <div className="absolute top-12 flex items-center gap-3 z-20">
         <img src={logo} alt="Alpha Intelligence Logo" className="w-7 h-7 object-contain" />
         <div className="flex flex-col">
           <span className="text-white font-bold tracking-widest text-sm leading-tight uppercase">Alpha</span>
           <span className="text-gray-400 text-[10px] tracking-wider uppercase">Intelligence</span>
         </div>
      </div>

      {/* Main Stats Card - Semi-transparent parent */}
      <div className="z-20 bg-[#0a0b10]/70 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,1)] rounded-2xl flex items-center w-[90%] max-w-[500px] relative border border-white/[0.04]">
        
        {/* Left Side: Custom Icon & Connecting Line */}
        <div className="flex items-center relative z-20 pl-6 pr-4">
           <CustomDatabaseIcon />
           <div className="h-[2px] w-8 bg-gray-600/50"></div>
           
           {/* Gray Translucent Intersection Circle */}
           <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-14 h-14 bg-white/[0.03] rounded-full z-10 pointer-events-none backdrop-blur-sm border border-white/[0.02]"></div>
        </div>

        {/* Right Side: 4 Glassmorphic Stats Grid */}
        <div className="grid grid-cols-2 gap-3 z-20 flex-1 py-6 pr-6 pl-2 text-left">
           
           {/* Stat 1: Glassmorphic (Stroke Removed) */}
           <div className="bg-white/[0.03] backdrop-blur-md rounded-lg p-3 border border-white/[0.02] shadow-inner">
             <p className="text-[10px] text-gray-300 font-semibold mb-1 uppercase tracking-wider leading-[1.2]">
               Total Records<br/>Managed
             </p>
             <p className="text-2xl text-white font-semibold">1,284</p>
           </div>
           
           {/* Stat 2: Glassmorphic */}
           <div className="bg-white/[0.03] backdrop-blur-md rounded-lg p-3 border border-white/[0.02] shadow-inner">
             <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider leading-[1.2]">
               Automated<br/>Documents
             </p>
             <p className="text-xl text-[#00e676] font-medium">↑ +12%</p>
           </div>
           
           {/* Stat 3: Glassmorphic */}
           <div className="bg-white/[0.03] backdrop-blur-md rounded-lg p-3 border border-white/[0.02] shadow-inner">
             <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider leading-[1.2]">
               Intent<br/>Match
             </p>
             <p className="text-xl text-[#00e676] font-medium">94.5%</p>
           </div>
           
           {/* Stat 4: Glassmorphic */}
           <div className="bg-white/[0.03] backdrop-blur-md rounded-lg p-3 border border-white/[0.02] shadow-inner">
             <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider leading-[1.2]">
               PDF Engine<br/>Efficiency
             </p>
             <p className="text-xl text-white font-medium">99.8%</p>
           </div>
           
        </div>
      </div>
    </div>
  );
}