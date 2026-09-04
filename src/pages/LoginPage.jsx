import { useState } from 'react';
import AuthLayout from '../components/layout/AuthLayout';
import SocialButton from '../components/auth/SocialButton';
import LoginForm from '../components/auth/LoginForm';
import { signInWithGoogle, signInWithApple } from '../lib/socialAuth';

export default function LoginPage() {
  const [socialError, setSocialError] = useState('');

  const handleGoogleSignIn = () => {
    setSocialError('');
    signInWithGoogle({
      onSuccess: (res) => console.log('Google sign-in success', res),
      onError: (err) => setSocialError(err.message),
    });
  };

  const handleAppleSignIn = () => {
    setSocialError('');
    signInWithApple({
      onSuccess: (res) => console.log('Apple sign-in success', res),
      onError: (err) => setSocialError(err.message),
    });
  };

  return (
    <AuthLayout title="Alpha Intelligence" subtitle="Automation starts here.">

      <div className="flex gap-4 mb-8">
        <SocialButton
          label="Google"
          onClick={handleGoogleSignIn}
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
        />
        <SocialButton
          label="Apple"
          onClick={handleAppleSignIn}
          icon={<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.68-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.24-.86 3.43-.88 1.52-.03 2.69.59 3.5 1.52-3.1 1.7-2.66 5.86.34 7.03-.68 1.76-1.55 3.66-2.35 4.5zm-3.64-14.7c.61-1.3.4-2.81-.46-3.8-1.12.22-2.51 1.01-3.13 2.29-.53 1.1-.64 2.54.4 3.73 1.25-.13 2.51-.9 3.19-2.22z"/></svg>}
        />
      </div>

      {socialError && (
        <p className="text-red-400 text-xs -mt-6 mb-6">{socialError}</p>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 border-t border-gray-800"></div>
        <span className="text-gray-600 text-sm">Or</span>
        <div className="flex-1 border-t border-gray-800"></div>
      </div>

      <LoginForm />

    </AuthLayout>
  );
}
