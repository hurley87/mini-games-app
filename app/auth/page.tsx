import { EnhancedAuthScreen } from '@/components/enhanced-auth-screen';
import type { Metadata } from 'next';

// Force dynamic rendering since this page requires client-side logic
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login - Mini Games',
  description: 'Login to Mini Games to start playing',
};

// Client component to handle event handlers
function AuthPageClient() {
  'use client';

  const handleAuthSuccess = () => {
    // Redirect to main page after successful auth
    window.location.href = '/';
  };

  return (
    <EnhancedAuthScreen onAuthSuccess={handleAuthSuccess} showSteps={true} />
  );
}

export default function AuthPage() {
  return <AuthPageClient />;
}
