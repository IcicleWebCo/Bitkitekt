import { useState, useEffect, RefObject } from 'react';

export function useHeaderHeight(headerRef: RefObject<HTMLElement | null>, defaultHeight: number = 80): number {
  const [height, setHeight] = useState(defaultHeight);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const observer = new ResizeObserver((entries) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          const newHeight = entry.target.getBoundingClientRect().height;
          setHeight(newHeight);
        }
      });
    });

    observer.observe(element);

    const initialHeight = element.getBoundingClientRect().height;
    setHeight(initialHeight);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, [headerRef]);

  return height;
}
