'use client';

import React, { useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  History, 
  LogOut, 
  Plus, 
  Car 
} from 'lucide-react';
import {useAuthStore} from '@/store/useAuthStore'

export default function DriverHeader() {
  const {user, logoutUser, fetchMe}= useAuthStore();

  useLayoutEffect(()=>{
    fetchMe();
  },[fetchMe]);
  return (
    <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-md border-b border-black/10 px-10 py-3 transition-all">
      <div className="w-full flex items-center justify-between">
        
        {/* Left Side: Modernized Sleek Logo */}
        <Link href="/driver" className="flex items-center gap-2.5 group">
          <div className="flex flex-col">
            <span className="text-[#141414] font-bold text-sm tracking-tight font-display uppercase leading-none">
              Driver
            </span>
          </div>
        </Link>

        {/* Right Side: Notification & Profile Menu */}
        <div className="flex items-center gap-3">
        

          {/* Single Notification Bell Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-[#141414] hover:bg-black/5 rounded-sm transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C1F11D] ring-2 ring-white" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Profile Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1.5 p-1 hover:bg-transparent active:bg-transparent focus:bg-transparent border-none outline-none"
              >
                <Avatar className="h-8 w-8 rounded-sm">
                  <AvatarImage 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                    alt="Driver Profile" 
                  />
                  <AvatarFallback className="bg-[#141414] text-[#C1F11D] font-bold text-xs rounded-sm">
                    SJ
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>

            {/* Clean Rounded-SM Dropdown Menu */}
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white text-[#141414] border border-black/10 rounded-sm shadow-xl p-1"
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold font-display text-[#141414] leading-none">{user?.fullName}</p>
                  <p className="text-[11px] text-gray-500 leading-none">{user?.email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-gray-100" />

              <DropdownMenuItem className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold font-display cursor-pointer  rounded-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span>Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold font-display cursor-pointer  rounded-sm">
                <Settings className="w-4 h-4 text-gray-500" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold font-display cursor-pointer  rounded-sm">
                <History className="w-4 h-4 text-gray-500" />
                <span>Trips / Ride History</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-100" />

              <DropdownMenuItem onClick={()=>logoutUser()} className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold font-display cursor-pointer text-rose-500 hover:bg-rose-800 focus:bg-rose-800 focus:text-white/80 hover:text-white  rounded-sm">
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}