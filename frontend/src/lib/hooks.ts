import { useEffect, useState, useRef } from 'react';

/**
 * Responsive breakpoint hook using Tailwind CSS breakpoints.
 * Returns true when the viewport matches the given breakpoint.
 * 
 * Breakpoints follow Tailwind defaults:
 * - xs: <640px
 * - sm: ≥640px
 * - md: ≥768px
 * - lg: ≥1024px
 * - xl: ≥1280px
 * - 2xl: ≥1536px
 */
export function useBreakpoint(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): boolean {
  const [matched, setMatched] = useState(false);
  const breakpointRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const breakpoints: Record<string, string> = {
      xs: '(max-width: 639px)',
      sm: '(min-width: 640px) and (max-width: 767px)',
      md: '(min-width: 768px) and (max-width: 1023px)',
      lg: '(min-width: 1024px) and (max-width: 1279px)',
      xl: '(min-width: 1280px) and (max-width: 1535px)',
      xxl: '(min-width: 1536px)',
    };

    const query = breakpoints[breakpoint];
    if (!query) {
      setMatched(false);
      return;
    }

    breakpointRef.current = matchMedia(query);

    const handleChange = () => {
      if (breakpointRef.current) {
        setMatched(breakpointRef.current.matches);
      }
    };

    if (breakpointRef.current) {
      setMatched(breakpointRef.current.matches);
      breakpointRef.current.addEventListener('change', handleChange);
    }

    // Cleanup on unmount
    return () => {
      if (breakpointRef.current) {
        breakpointRef.current.removeEventListener('change', handleChange);
      }
    };
  }, [breakpoint]);

  return matched;
}