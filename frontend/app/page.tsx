'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp, useTelegramUser } from '@/lib/telegram'
import { authApi } from '@/lib/api'
import { authenticateUser } from '@/lib/auth-utils'
import { toast } from 'react-hot-toast'

export default function HomePage() {
  const router = useRouter()
  const webApp = useTelegramWebApp()
  const telegramUser = useTelegramUser()

  useEffect(() => {
    const autoAuthenticate = async () => {
      console.log('🚀 Starting auto-authentication...')
      
      const success = await authenticateUser()
      
      if (success) {
        console.log('✅ Auto-authentication successful')
        router.push('/jobs')
      } else {
        console.log('❌ Auto-authentication failed, redirecting anyway')
        toast.error('Authentication failed, but you can still browse jobs')
        router.push('/jobs')
      }
    }

    autoAuthenticate()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <div className="mb-6">
          <div className="text-6xl mb-4">👨‍💻</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Coders Needed
          </h1>
          <p className="text-gray-600 text-sm">
            Jobs for Developers & Software Engineers
          </p>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}
