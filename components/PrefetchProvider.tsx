'use client'

// Aggressive prefetching removed to improve performance
export default function PrefetchProvider({ children }: { children: React.ReactNode }) {
  // Logic removed to prevent network congestion and main thread blocking
  // The app now relies on React Query's standard caching and revalidation
  return <>{children}</>
}
