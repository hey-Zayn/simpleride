"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobilityLoaderProps {
    /** Text shown under the radar icon */
    label?: string;
    /** Background color behind the whole screen */
    bgColor?: string;
    /** Color of the center disc + radar pulses */
    accentColor?: string;
    /** Icon rendered in the center disc (defaults to Zap) */
    icon?: React.ReactNode;
    /** Render full-viewport (true) or fill the parent container (false) */
    fullScreen?: boolean;
    className?: string;
}

const RING_COUNT = 3;
const RING_DURATION = 2.4;

function MobilityLoader({
    label = "Loading Service...",
    bgColor = "#D3FF53",
    accentColor = "#000000",
    icon,
    fullScreen = true,
    className,
}: MobilityLoaderProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div
            className={cn(
                "w-full flex flex-col items-center justify-center gap-6 px-6",
                fullScreen && "min-h-screen",
                className
            )}
            style={{ backgroundColor: bgColor }}
            role="status"
            aria-live="polite"
        >
            {/* Radar */}
            <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36">



                {/* animated radar pulses, staggered so a new ring launches as the last fades */}
                {!prefersReducedMotion &&
                    Array.from({ length: RING_COUNT }).map((_, i) => (
                        <motion.span
                            key={i}
                            className="absolute inset-[30%] rounded-full border"
                            style={{ borderColor: accentColor }}
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 2.6, opacity: 0 }}
                            transition={{
                                duration: RING_DURATION,
                                repeat: Infinity,
                                ease: "easeOut",
                                delay: (i * RING_DURATION) / RING_COUNT,
                            }}
                        />
                    ))}

                {/* center disc + icon */}
                <div
                    className="relative z-10 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                    style={{ backgroundColor: accentColor }}
                >
                    {icon ?? (
                        <Zap
                            className="w-6 h-6 sm:w-7 sm:h-7"
                            style={{ color: bgColor }}
                            fill={bgColor}
                        />
                    )}
                </div>
            </div>

            <p
                className="text-xs sm:text-sm font-display font-bold uppercase tracking-widest text-center"
                style={{ color: `${accentColor}B3` }} // ~70% opacity
            >
                {label}
            </p>
        </div>
    );
}


export default MobilityLoader;