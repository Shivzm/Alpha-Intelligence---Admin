export default function SocialButton({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      type="button"
      className="flex-1 flex items-center justify-center gap-2 border border-gray-700 rounded-lg py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}