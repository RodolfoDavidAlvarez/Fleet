export default function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-6 w-6'
  const borderWidth = size === 'sm' ? 'border-2' : size === 'lg' ? 'border-4' : 'border-2'
  return (
    <div className="relative inline-block">
      <div
        className={`${dimension} ${borderWidth} animate-spin rounded-full border-primary-200 border-t-primary-600 ${className}`}
        role="status"
        aria-label="Loading"
      />
      <div className={`absolute inset-0 ${dimension} ${borderWidth} rounded-full border-transparent border-t-primary-400 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
  )
}
