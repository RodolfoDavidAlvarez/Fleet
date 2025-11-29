import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ToastProvider } from '@/components/ui/toast'
import PrefetchProvider from '@/components/PrefetchProvider'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'AGAVE ENVIRONMENTAL CONTRACTING, INC. - Fleet Management System',
  description: 'Modern fleet management system with admin and mechanic dashboards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="font-sans antialiased">
        <QueryProvider>
          <PrefetchProvider>
            <ToastProvider>{children}</ToastProvider>
          </PrefetchProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
