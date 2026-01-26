'use client'

import { useState, useEffect, useCallback } from 'react'

type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface MediaQueryState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
  width: number
  height: number
  isPortrait: boolean
  isLandscape: boolean
  isTouchDevice: boolean
}

const BREAKPOINTS = {
  mobile: 640,   // sm
  tablet: 1024,  // lg
} as const

/**
 * Hook to detect device type and screen characteristics
 * Uses SSR-safe approach with initial values
 */
export function useMediaQuery(): MediaQueryState {
  const [state, setState] = useState<MediaQueryState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    width: 1024,
    height: 768,
    isPortrait: false,
    isLandscape: true,
    isTouchDevice: false,
  })

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width < BREAKPOINTS.mobile
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet
    const isDesktop = width >= BREAKPOINTS.tablet
    const isPortrait = height > width
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    let deviceType: DeviceType = 'desktop'
    if (isMobile) deviceType = 'mobile'
    else if (isTablet) deviceType = 'tablet'

    setState({
      isMobile,
      isTablet,
      isDesktop,
      deviceType,
      width,
      height,
      isPortrait,
      isLandscape: !isPortrait,
      isTouchDevice,
    })
  }, [])

  useEffect(() => {
    // Initial update
    updateState()

    // Listen for resize events with debounce
    let timeoutId: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateState, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', updateState)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', updateState)
      clearTimeout(timeoutId)
    }
  }, [updateState])

  return state
}

/**
 * Simple hook to check if a media query matches
 */
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

export default useMediaQuery
