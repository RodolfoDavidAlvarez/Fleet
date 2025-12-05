/**
 * Performance utilities for optimizing app responsiveness
 */

// Detect if device is low-end based on hardware concurrency
export function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  // Consider device low-end if it has <= 4 cores or <= 4GB RAM
  return cores <= 4 || memory <= 4;
}

// Reduce animations on low-end devices
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;

  // Check prefers-reduced-motion media query
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  // Also reduce on low-end devices
  return isLowEndDevice();
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Prefetch route
export function prefetchRoute(href: string) {
  if (typeof window === "undefined") return;

  // Use Next.js router prefetch if available
  if ((window as any).__NEXT_DATA__) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  }
}
