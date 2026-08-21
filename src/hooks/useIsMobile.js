import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

// Tracks viewport width and whether it's at/under the mobile breakpoint.
// Shared across the app so every component uses the same threshold.
export const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile: windowWidth <= breakpoint, windowWidth };
};

export default useIsMobile;
