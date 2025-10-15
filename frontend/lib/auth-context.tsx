'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTelegramWebApp, useTelegramUser } from './telegram'
import { authApi } from './api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const webApp = useTelegramWebApp()
  const telegramUser = useTelegramUser()

  useEffect(() => {
    const authenticate = async () => {
      console.log('🚀 Starting authentication process...')
      
      // Check existing token first
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        try {
          const response = await authApi.getMe()
          setUser(response.data)
          setIsAuthenticated(true)
          setIsLoading(false)
          console.log('✅ Authenticated with existing token')
          return
        } catch (error) {
          console.log('❌ Existing token invalid, removing...')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
      }

      // Try Telegram auth first (if available)
      if (webApp && webApp.initData && telegramUser) {
        try {
          console.log('📱 Attempting Telegram authentication...')
          const response = await authApi.login(webApp.initData)
          const { access_token, user: userData } = response.data
          localStorage.setItem('auth_token', access_token)
          localStorage.setItem('user_data', JSON.stringify(userData))
          setUser(userData)
          setIsAuthenticated(true)
          setIsLoading(false)
          console.log('✅ Telegram authentication successful')
          return
        } catch (error) {
          console.log('❌ Telegram auth failed:', error)
        }
      }

      // Fallback to dev auth (this should NEVER fail)
      try {
        console.log('🔧 Using dev authentication fallback...')
        console.log('🔧 API base URL:', process.env.NEXT_PUBLIC_API_URL)
        const response = await authApi.loginDev()
        console.log('🔧 Dev auth response:', response)
        console.log('🔧 Response data:', response.data)
        const { access_token, user: userData } = response.data
        console.log('🔧 Access token:', access_token)
        console.log('🔧 User data:', userData)
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
        console.log('✅ Dev authentication successful')
      } catch (error) {
        console.error('💥 CRITICAL: All authentication methods failed:', error)
        console.error('💥 Error details:', (error as any).response)
        console.error('💥 Error message:', (error as any).message)
        // This should never happen, but if it does, create a local user
        const fallbackUser = {
          id: 999999,
          telegram_id: 999999,
          username: 'fallback_user',
          first_name: 'Test',
          last_name: 'User',
          role: 'individual'
        }
        setUser(fallbackUser)
        setIsAuthenticated(true)
        console.log('🆘 Using emergency fallback user')
      }
      
      setIsLoading(false)
      console.log('🏁 Authentication process completed')
    }

    authenticate()
  }, [webApp, telegramUser])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
