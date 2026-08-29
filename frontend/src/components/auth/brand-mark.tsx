'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
    /** Wrap the mark in a Link (e.g. back to home) when provided */
    href?: string;
    size?: 'sm' | 'md';
    /** Ring + icon color — matches MobilityLoader's bgColor */
    accentColor?: string;
    /** Disc fill behind the icon — matches MobilityLoader's accentColor */
    discColor?: string;
    className?: string;
}

const RING_COUNT = 2;
const RING_DURATION = 2.4;

const SIZES = {
    sm: { wrapper: 'size-9', disc: 'size-6', icon: 'size-3.5' },
    md: { wrapper: 'size-12', disc: 'size-8', icon: 'size-4' },
} as const;

export function BrandMark({
    href,
    size = 'sm',
    accentColor = '#D3FF53',
    discColor = '#141414',
    className,
}: BrandMarkProps) {
    const prefersReducedMotion = useReducedMotion();
    const dims = SIZES[size];

    const mark = (
        <div className={cn('relative flex items-center justify-center', dims.wrapper, className)}>
            {!prefersReducedMotion &&
                Array.from({ length: RING_COUNT }).map((_, i) => (
                    <motion.span
                        key={i}
                        className="absolute inset-0 rounded-full border"
                        style={{ borderColor: accentColor }}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{
                            duration: RING_DURATION,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: i * (RING_DURATION / 2),
                        }}
                    />
                ))}
            <div
                className={cn('relative z-10 flex items-center justify-center rounded-full', dims.disc)}
                style={{ backgroundColor: discColor }}
            >
                <Zap className={dims.icon} style={{ color: accentColor }} fill={accentColor} aria-hidden="true" />
            </div>
        </div>
    );

    if (!href) return mark;

    return (
        <Link href={href} aria-label="RideFlow home" className="inline-flex">
            {mark}
        </Link>
    );
}