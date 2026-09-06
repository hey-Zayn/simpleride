'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, CarFront, Menu } from 'lucide-react';

const LIME = '#D3FF53';
const INK = '#141414';

const tabs = [
    { href: '/rider', label: 'Home', Icon: Home, match: (p: string) => p === '/rider' },
    { href: '/rider/services', label: 'Services', Icon: LayoutGrid, match: (p: string) => p.startsWith('/rider/services') },
    { href: '/rider/ride', label: 'Ride', Icon: CarFront, match: (p: string) => p.startsWith('/rider/ride') },
    {
        href: '/rider/more',
        label: 'More',
        Icon: Menu,
        match: (p: string) => p.startsWith('/rider/more') || p.startsWith('/rider/profile') || p.startsWith('/rider/history'),
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),12px)] pointer-events-none">
            <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-[16px] border border-black/5 bg-white/90 backdrop-blur-md px-2 py-2 shadow-[0_8px_24px_rgba(20,20,20,0.10)]">
                {tabs.map(({ href, label, Icon, match }) => {
                    const active = match(pathname);
                    return (
                        <Link key={href} href={href} className="relative flex flex-1 flex-col items-center gap-1 rounded-[10px] py-1.5">
                            {active && (
                                <motion.span
                                    layoutId="bottom-nav-active"
                                    className="absolute inset-0 rounded-[10px]"
                                    style={{ backgroundColor: INK }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className="relative z-10 flex flex-col items-center gap-1">
                                <Icon className="size-5" strokeWidth={1.75} style={{ color: active ? LIME : `${INK}8F` }} />
                                <span
                                    className="text-[10px] font-display font-semibold tracking-tight"
                                    style={{ color: active ? '#FFFFFF' : `${INK}8F` }}
                                >
                                    {label}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}