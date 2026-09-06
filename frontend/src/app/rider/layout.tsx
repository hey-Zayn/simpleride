'use client';

import { useAuthStore } from '@/store/useAuthStore';
import RiderHeader from '@/components/rider/RiderHeader';
import BottomNav from '@/components/rider/BottomNav';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();

    return (
        <div className="relative w-full min-h-screen bg-gray-100 font-sans">
            {/* Desktop floating header — hidden on mobile, bottom nav takes over */}
            <div className="max-sm:hidden">
                <RiderHeader
                    userName={user?.fullName || 'Rider'}
                    onLogout={() => useAuthStore.getState().logoutUser()}
                />
            </div>

            {children}

            {/* Mobile bottom tab bar — hidden on desktop */}
            <div className="sm:hidden">
                <BottomNav />
            </div>
        </div>
    );
}