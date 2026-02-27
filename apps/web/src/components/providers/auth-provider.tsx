'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetchUser();
      }
      setIsInitialized(true);
    };

    initAuth();
  }, [fetchUser]);

  // Show nothing while initializing to prevent flash of unauthenticated state
  if (!isInitialized && typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
    return null;
  }

  return <>{children}</>;
}
