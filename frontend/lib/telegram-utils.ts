import { TelegramUser, TelegramWebApp } from './telegram'

/**
 * Utility functions for working with Telegram WebApp data
 */

/**
 * Get the current user's Telegram ID
 */
export function getTelegramUserId(): number | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user?.id || null
  }
  return null
}

/**
 * Get the current user's full name
 */
export function getTelegramUserFullName(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe.user
    if (user) {
      const parts = [user.first_name]
      if (user.last_name) parts.push(user.last_name)
      return parts.join(' ')
    }
  }
  return null
}

/**
 * Get the current user's display name (username or full name)
 */
export function getTelegramUserDisplayName(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe.user
    if (user) {
      if (user.username) return `@${user.username}`
      return getTelegramUserFullName()
    }
  }
  return null
}

/**
 * Check if the app is running inside Telegram
 */
export function isRunningInTelegram(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp
}

/**
 * Get the current color scheme (light/dark)
 */
export function getTelegramColorScheme(): 'light' | 'dark' | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.colorScheme
  }
  return null
}

/**
 * Get the current platform (ios, android, desktop, etc.)
 */
export function getTelegramPlatform(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.platform
  }
  return null
}

/**
 * Get raw init data for backend authentication
 */
export function getTelegramInitData(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData
  }
  return null
}

/**
 * Show the main button with custom text and action
 */
export function showTelegramMainButton(text: string, onClick: () => void): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.MainButton.setText(text)
    tg.MainButton.onClick(onClick)
    tg.MainButton.show()
  }
}

/**
 * Hide the main button
 */
export function hideTelegramMainButton(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.MainButton.hide()
  }
}

/**
 * Show haptic feedback
 */
export function triggerTelegramHaptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning'): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
      tg.HapticFeedback.impactOccurred(type as any)
    } else {
      tg.HapticFeedback.notificationOccurred(type as any)
    }
  }
}

/**
 * Close the WebApp
 */
export function closeTelegramWebApp(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.close()
  }
}
