'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Performance monitoring hook for page transitions
export function usePerformanceMonitoring() {
  const pathname = usePathname()
  const navigationStart = useRef<number>()
  const lastPathname = useRef<string>()

  useEffect(() => {
    const currentTime = performance.now()
    
    // Record navigation start time
    if (lastPathname.current && lastPathname.current !== pathname) {
      const transitionTime = currentTime - (navigationStart.current || currentTime)
      
      // Only log slow transitions (> 300ms)
      if (transitionTime > 300) {
        console.warn(`Slow page transition: ${lastPathname.current} → ${pathname} took ${transitionTime.toFixed(2)}ms`)
      }
    }
    
    navigationStart.current = currentTime
    lastPathname.current = pathname
  }, [pathname])

  // Track component mount performance
  const trackMount = (componentName: string) => {
    const mountStart = performance.now()
    
    return () => {
      const mountTime = performance.now() - mountStart
      if (mountTime > 100) {
        console.warn(`Slow component mount: ${componentName} took ${mountTime.toFixed(2)}ms`)
      }
    }
  }

  return { trackMount }
}

// Query performance tracking
export function useQueryPerformance(queryKey: string[], enabled = true) {
  const startTime = useRef<number>()

  useEffect(() => {
    if (enabled) {
      startTime.current = performance.now()
    }
  }, [enabled])

  const trackSuccess = () => {
    if (startTime.current) {
      const queryTime = performance.now() - startTime.current
      if (queryTime > 1000) {
        console.warn(`Slow query: ${queryKey.join('/')} took ${queryTime.toFixed(2)}ms`)
      }
    }
  }

  return { trackSuccess }
}