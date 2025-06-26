import { EnhancedAuthScreen } from '@/components/enhanced-auth-screen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Mini Games',
  description: 'Login to Mini Games to start playing',
};

export default function AuthPage() {
  return (
    <EnhancedAuthScreen 
      onAuthSuccess={() => {
        // Redirect to main page after successful auth
        window.location.href = '/';
      }}
      showSteps={true}
    />
  );
}