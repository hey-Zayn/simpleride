'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#FFFEE9] text-[#141414] flex flex-col justify-between selection:bg-[#C1F11D] selection:text-[#141414] font-sans">
      
      {/* Centered Main Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] bg-white rounded-xl border-2 border-[#141414]/15 shadow-[0_12px_32px_-8px_rgba(20,20,20,0.08)] p-7 sm:p-9 relative"
        >
          {/* Brand Header Inside Card */}
          

          {/* Title & Subtitle */}
          <div className="mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#141414] tracking-tight mb-1">
              {title}
            </h1>
            <p className="text-xs sm:text-sm font-display font-bold text-[#141414]/80 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#DCDBC7] border-t-2 border-[#141414]/10 py-4 text-center text-xs font-sans font-semibold text-[#141414]/70">
        &copy; {new Date().getFullYear()} Velvet Mobility Inc. All rights reserved.
      </footer>
    </div>
  );
}