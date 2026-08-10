import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getRoleFromToken(token: string | undefined): 'RIDER' | 'DRIVER' | null {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = atob(base64);
        const payload = JSON.parse(jsonPayload);
        return payload.role || null;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const activeRideStatus = request.cookies.get('active_ride_status')?.value;
    const { pathname } = request.nextUrl;

    const role = getRoleFromToken(token);

    // Active statuses where a ride is currently underway
    const activeStatuses = ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'];
    const hasActiveRide = activeRideStatus && activeStatuses.includes(activeRideStatus);

    // 1. Redirect unauthenticated users from private portals to login
    if ((pathname.startsWith('/rider') || pathname.startsWith('/driver')) && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 2. Role-based Access Control (RBAC): Guard routes according to user role
    if (token && role) {
        if (role === 'DRIVER' && pathname.startsWith('/rider')) {
            return NextResponse.redirect(new URL('/driver', request.url));
        }

        if (role === 'RIDER' && pathname.startsWith('/driver')) {
            return NextResponse.redirect(new URL('/rider', request.url));
        }
    }

    // 3. Redirect authenticated users away from auth pages (/login, /register)
    if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && token) {
        const targetDashboard = role === 'DRIVER' ? '/driver' : '/rider';
        return NextResponse.redirect(new URL(targetDashboard, request.url));
    }

    // 4. Active Ride Lockdown: If user has an active ride and navigates away from their dashboard, force them back
    if (token && hasActiveRide) {
        const targetDashboard = role === 'DRIVER' ? '/driver' : '/rider';
        if (!pathname.startsWith(targetDashboard)) {
            return NextResponse.redirect(new URL(targetDashboard, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/rider/:path*', '/driver/:path*', '/login', '/register'],
};