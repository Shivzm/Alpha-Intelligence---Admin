import AuthLayout from '../components/layout/AuthLayout';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email you a link to get back in."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
