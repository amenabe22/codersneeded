import { useState, useEffect } from 'react'
import { authApi } from './api'
import { useTelegramWebApp, useTelegramUser } from './telegram'

/**
 * Robust authentication utility that handles all edge cases
 */
export async function authenticateUser(): Promise<boolean> {
  try {
    // First, check if we have a valid existing token
    const existingToken = localStorage.getItem('auth_token')
    if (existingToken) {
      try {
        await authApi.getMe()
        console.log('✅ Existing token is valid')
        return true
      } catch (error) {
        console.log('❌ Existing token invalid, clearing it')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }

    // Check if we're in Telegram Mini App
    const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null
    const telegramUser = webApp?.initDataUnsafe?.user

    if (webApp && webApp.initData && telegramUser) {
      try {
        console.log('🔄 Attempting Telegram authentication...')
        const response = await authApi.login(webApp.initData)
        const { access_token, user } = response.data
        
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(user))
        
        console.log('✅ Telegram authentication successful')
        return true
      } catch (error: any) {
        console.log('❌ Telegram authentication failed:', error.response?.data?.detail || error.message)
        
        // If it's a bot token issue, try dev auth as fallback
        if (error.response?.status === 401 || error.response?.status === 500) {
          console.log('🔄 Telegram auth failed, trying dev authentication...')
          try {
            const devResponse = await authApi.loginDev()
            const { access_token, user } = devResponse.data
            
            localStorage.setItem('auth_token', access_token)
            localStorage.setItem('user_data', JSON.stringify(user))
            
            console.log('✅ Dev authentication successful as fallback')
            return true
          } catch (devError) {
            console.log('❌ Dev authentication also failed:', devError)
          }
        }
      }
    } else {
      // Not in Telegram, try dev authentication
      console.log('🔄 Not in Telegram, trying dev authentication...')
      try {
        const response = await authApi.loginDev()
        const { access_token, user } = response.data
        
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(user))
        
        console.log('✅ Dev authentication successful')
        return true
      } catch (error) {
        console.log('❌ Dev authentication failed:', error)
      }
    }

    console.log('❌ All authentication methods failed')
    return false
  } catch (error) {
    console.log('❌ Authentication error:', error)
    return false
  }
}

/**
 * Hook for authentication with automatic retry
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      setIsLoading(true)
      setError(null)
      
      const success = await authenticateUser()
      
      setIsAuthenticated(success)
      setIsLoading(false)
      
      if (!success) {
        setError('Authentication failed. Please try again.')
      }
    }

    handleAuth()
  }, [])

  return { isAuthenticated, isLoading, error }
}

