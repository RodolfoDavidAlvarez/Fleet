export default function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-6 w-6'
  return (
    <div
      className={`inline-block ${dimension} animate-spin rounded-full border-2 border-current border-t-transparent text-primary-600 ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
