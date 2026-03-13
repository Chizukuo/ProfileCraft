import { useCallback, useEffect, useRef } from 'react';

/**
 * 限制函数调用频率的自定义 Hook
 */
export const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const isThrottled = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const throttledCallback = useCallback((...args: any[]) => {
    if (isThrottled.current) return;
    callback(...args);
    isThrottled.current = true;
    timeoutRef.current = window.setTimeout(() => {
      isThrottled.current = false;
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return throttledCallback;
};
