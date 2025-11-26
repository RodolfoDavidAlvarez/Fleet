import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-auto">
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} AGAVE ENVIRONMENTAL CONTRACTING, INC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link 
              href="/compliance" 
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-600)] transition-colors"
            >
              SMS Compliance
            </Link>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              Developed by <span className="font-semibold text-[var(--text-primary)]">Better Systems</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

