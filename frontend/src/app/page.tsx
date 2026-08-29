'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import MobilityLoader from '../components/home/MobilityLoader';

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
    // if (isLoading) {
    //   <MobilityLoader />
    // }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen w-full">
      <MobilityLoader />
      loading
    </div>
  );
}