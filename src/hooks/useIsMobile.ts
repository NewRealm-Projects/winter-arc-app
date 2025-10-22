import { useEffect, useState } from 'react';

/**
 * Hook to detect if viewport is mobile (<481px)
 * Uses conditional rendering approach (not responsive CSS)
 * Mobile = < 481px, Desktop = >= 481px
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Initial check (SSR safe)
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < 481;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 481);
    };

    // Initial sync in case of timing issues
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
