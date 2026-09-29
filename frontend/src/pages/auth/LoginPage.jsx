import { useEffect, useState } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../lib/adminApi';
import { initializeGoogleSignIn } from '../../lib/socialAuth';

export default function LoginPage() {
  const [socialError, setSocialError] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    initializeGoogleSignIn({
      onSuccess: async (credential) => {
        setSocialError('');
        try {
          const session = await adminApi.loginWithGoogle(credential);
          login(session.expiresAt, '/admin-dashboard');
        } catch (error) {
          setSocialError(error.message || 'Unable to sign in with Google.');
        }
      },
      onError: (error) => setSocialError(error.message),
    });
  }, [login]);

  return (
    <AuthLayout title="Alpha Intelligence" subtitle="Automation starts here.">

      <div className="mb-8">
        <div id="google-signin-button" className="flex items-center justify-center" />
      </div>

      {socialError && (
        <p className="text-red-400 text-xs -mt-6 mb-6">{socialError}</p>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 border-t border-gray-800"></div>
        <span className="text-gray-600 text-sm">Or</span>
        <div className="flex-1 border-t border-divider"></div>
      </div>

      <LoginForm />

    </AuthLayout>
  );
}
