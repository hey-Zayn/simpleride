'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LIME = '#D3FF53';

export interface AuthSlide {
    id: string;
    title: string;
    description: string;
    image?: string;
}

interface AuthCarouselProps {
    slides?: AuthSlide[];
    durationMs?: number;
    compact?: boolean;
    className?: string;
}

export const defaultAuthSlides: AuthSlide[] = [
    {
        id: 'dispatch',
        title: 'Mobility, under control.',
        description:
            'A secure operational workspace for booking rides, managing dispatches, and tracking every movement in real time.',
        image: '/images/auth/slide-1.webp',
    },
    {
        id: 'tracking',
        title: 'Every ride, in view.',
        description: 'Follow drivers turn by turn and get accurate ETAs, from pickup to drop-off.',
        image: '/images/auth/slide-2.webp',
    },
    {
        id: 'earnings',
        title: 'Built for full-time earners.',
        description: 'Instant payouts, transparent trip history, and a dispatch queue that respects your time.',
        image: '/images/auth/slide-3.webp',
    },
];

export function AuthCarousel({
    slides = defaultAuthSlides,
    durationMs = 5200,
    compact = false,
    className,
}: AuthCarouselProps) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const count = slides.length;
    const active = slides[index];

    const goTo = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

    return (
        <div
            className={cn('flex h-full flex-col items-center justify-center', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div
                className={cn(
                    'relative w-full max-w-sm overflow-hidden rounded-[16px] bg-white',
                    compact ? 'mb-6 h-[220px]' : 'mb-10 h-[340px]'
                )}
            >
                <AnimatePresence initial={false}>
                    <motion.div
                        key={active.id}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.03 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {active.image ? (
                            <Image
                                src={active.image}
                                alt=""
                                fill
                                sizes={compact ? '100vw' : '384px'}
                                className="object-contain p-4"
                                priority={index === 0}
                            />
                        ) : (
                            <div
                                className="absolute inset-0"
                                style={{ background: `radial-gradient(circle at 50% 40%, ${LIME}30, transparent 60%)` }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className={cn('max-w-sm text-center', compact && 'max-w-xs')}>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={active.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={cn('font-serif italic leading-snug text-[#141414]', compact ? 'text-base' : 'text-lg')}
                    >
                        <span className="font-semibold not-italic">{active.title}</span> {active.description}
                    </motion.p>
                </AnimatePresence>

                <div
                    className="mt-6 flex items-center justify-center gap-2"
                    role="tablist"
                    aria-label="Slide progress"
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') goTo(index + 1);
                        if (e.key === 'ArrowLeft') goTo(index - 1);
                    }}
                >
                    {slides.map((slide, i) => {
                        const isActive = i === index;
                        const filled = i < index || (prefersReducedMotion && isActive);
                        return (
                            <button
                                key={slide.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`Show slide ${i + 1} of ${count}`}
                                onClick={() => goTo(i)}
                                className="relative h-[3px] w-10 overflow-hidden rounded-full bg-[#141414]/10 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                                style={{ ['--tw-ring-color' as string]: LIME }}
                            >
                                <span
                                    onAnimationEnd={() => isActive && goTo(index + 1)}
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                        backgroundColor: LIME,
                                        width: filled ? '100%' : isActive ? undefined : '0%',
                                        animationName: isActive && !prefersReducedMotion ? 'auth-carousel-fill' : 'none',
                                        animationDuration: `${durationMs}ms`,
                                        animationTimingFunction: 'linear',
                                        animationFillMode: 'forwards',
                                        animationPlayState: paused ? 'paused' : 'running',
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
        @keyframes auth-carousel-fill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}