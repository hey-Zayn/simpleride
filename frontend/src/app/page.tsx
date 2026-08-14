'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.role === 'DRIVER') {
          router.replace('/driver');
        } else {
          router.replace('/rider');
        }
      } else {
        router.replace('/rider');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#F47920]" />
      <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
        Loading Mobility Service...
      </p>
    </div>
  );
}