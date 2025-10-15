import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { AuthProvider } from '@/lib/auth-context'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Coders Needed - Jobs for Developers & Software Engineers',
  description: 'Premium job board exclusively for developers and software engineers. Find your next coding opportunity or hire top tech talent.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="tg-viewport">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body className={`${inter.className} tg-viewport tg-theme-bg`}>
        <AuthProvider>
          <Providers>
            <div className="pb-16 w-full">
              {children}
            </div>
            <BottomNav />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
