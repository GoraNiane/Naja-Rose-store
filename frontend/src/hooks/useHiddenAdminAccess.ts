import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UseHiddenAdminAccessOptions {
  /**
   * Number of rapid clicks required to trigger admin access
   * @default 5
   */
  requiredClicks?: number;

  /**
   * Maximum allowed time window in milliseconds between clicks
   * @default 2000
   */
  timeout?: number;

  /**
   * Target destination route after 5 rapid clicks
   * @default '/admin/login'
   */
  targetUrl?: string;

  /**
   * Optional custom callback on trigger
   */
  onTrigger?: () => void;

  /**
   * Route to navigate to on standard single click
   * @default '/'
   */
  singleClickNavigateTo?: string;

  /**
   * Duration in ms of the subtle pulse animation before navigation
   * @default 350
   */
  animationDuration?: number;
}

export function useHiddenAdminAccess(options: UseHiddenAdminAccessOptions = {}) {
  const {
    requiredClicks = 5,
    timeout = 2000,
    targetUrl = '/admin/login',
    onTrigger,
    singleClickNavigateTo = '/',
    animationDuration = 350,
  } = options;

  const navigate = useNavigate();
  const clicksRef = useRef<number>(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const [isTriggering, setIsTriggering] = useState(false);

  // Clear timeout safely on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const resetClicks = useCallback(() => {
    clicksRef.current = 0;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, []);

  const registerTap = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      clicksRef.current += 1;
      const currentClicks = clicksRef.current;

      // Reset existing window timer
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // 5 Rapid Clicks Achieved
      if (currentClicks >= requiredClicks) {
        resetClicks();
        setIsTriggering(true);

        if (onTrigger) {
          onTrigger();
        }

        // Play subtle discreet pulse/zoom animation then redirect to /admin/login
        setTimeout(() => {
          setIsTriggering(false);
          navigate(targetUrl);
        }, animationDuration);
        return;
      }

      // Reset count to 0 if next click does not happen within timeout
      clickTimeoutRef.current = setTimeout(() => {
        clicksRef.current = 0;
      }, timeout);

      // On 1st click, if singleClickNavigateTo is set and not triggering 5-clicks
      if (currentClicks === 1 && singleClickNavigateTo) {
        if (typeof window !== 'undefined' && window.location.pathname !== singleClickNavigateTo) {
          navigate(singleClickNavigateTo);
        }
      }
    },
    [requiredClicks, timeout, targetUrl, onTrigger, singleClickNavigateTo, animationDuration, navigate, resetClicks]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent synthetic click immediately after touch event on mobile/tablet
      const now = Date.now();
      if (now - lastTouchTimeRef.current < 500) {
        e.preventDefault();
        return;
      }
      registerTap(e);
    },
    [registerTap]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      registerTap(e);
    },
    [registerTap]
  );

  return {
    handleClick,
    handleTouchEnd,
    isTriggering,
    resetClicks,
    triggerProps: {
      onClick: handleClick,
      onTouchEnd: handleTouchEnd,
    },
  };
}
