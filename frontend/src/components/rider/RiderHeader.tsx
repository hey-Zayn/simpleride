'use client';

import Link from 'next/link';
import { Bell, User, LogOut, History, CreditCard } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RiderHeaderProps {
  userName?: string;
  userAvatarUrl?: string;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

export default function RiderHeader({
  userName = 'Rider',
  userAvatarUrl,
  notificationCount = 0,
  onNotificationsClick,
  onProfileClick,
  onLogout,
}: RiderHeaderProps) {
  const initials = userName
    .trim()
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="fixed top-5 left-0 right-0 z-50 px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/rider" className="pointer-events-auto flex items-center gap-2.5 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-sm border border-black/5 shadow-xs transition-opacity hover:opacity-90">
          <div className="w-5 h-5 rounded-sm bg-[#141414] flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-xs bg-[#C1F11D]" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-[#141414]">
            Ryde
          </span>
        </Link>

        {/* Floating Right Bar */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/80 backdrop-blur-md px-1.5 py-1 rounded-sm border border-black/5 shadow-xs">
          {/* Notifications */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            aria-label="Notifications"
            className="relative w-8 h-8 rounded-sm hover:bg-black/5 text-[#141414] transition-colors"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Profile menu"
                className="flex items-center gap-2 p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141414] hover:bg-black/5 transition-colors"
              >
                <Avatar className="w-7 h-7 rounded-sm">
                  <AvatarImage src={userAvatarUrl} alt={userName} />
                  <AvatarFallback className="rounded-sm bg-[#C1F11D] text-[#141414] font-display font-bold text-[11px]">
                    {initials || <User className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-48 rounded-sm font-sans bg-white/95 backdrop-blur-md border border-black/10 shadow-lg p-1 text-[#141414]"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {userName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/5 my-1" />
              
              <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer rounded-sm px-2 py-1.5 hover:bg-[#C1F11D] focus:bg-[#C1F11D] transition-colors gap-2">
                <Link href="/rider/profile">
                  <User className="w-3.5 h-3.5 opacity-70" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer rounded-sm px-2 py-1.5 hover:bg-[#C1F11D] focus:bg-[#C1F11D] transition-colors gap-2">
                <Link href="/rider/history">
                  <History className="w-3.5 h-3.5 opacity-70" />
                  Trip history
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-black/5 my-1" />

              <DropdownMenuItem
                onClick={onLogout}
                className="text-xs font-medium cursor-pointer rounded-sm px-2 py-1.5 text-rose-600 focus:text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}