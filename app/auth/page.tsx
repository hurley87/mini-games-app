'use client';

import { EnhancedAuthScreen } from '@/components/enhanced-auth-screen';
import { useRouter } from 'next/navigation';

// Force dynamic rendering since this page requires client-side logic
export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    // Redirect to main page after successful auth
    router.push('/');
  };

  return (
    <EnhancedAuthScreen onAuthSuccess={handleAuthSuccess} showSteps={true} />
  );
}
