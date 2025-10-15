import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  // Format in K (thousands)
  if (amount >= 1000) {
    const inK = amount / 1000
    // Remove decimals if it's a whole number, otherwise show 1 decimal
    const formatted = inK % 1 === 0 ? inK.toFixed(0) : inK.toFixed(1)
    return `${formatted}K ${currency}`
  }
  return `${amount} ${currency}`
}

export function formatSalaryRange(min?: number, max?: number, currency: string = 'ETB'): string {
  if (!min && !max) return 'Salary not specified'
  
  if (min && max) {
    if (min === max) {
      return formatCurrency(min, currency)
    }
    // Format both in K
    const minK = min >= 1000 ? `${(min / 1000).toFixed(0)}K` : min.toString()
    const maxK = max >= 1000 ? `${(max / 1000).toFixed(0)}K` : max.toString()
    return `${minK} - ${maxK} ${currency}`
  }
  
  if (min) {
    const minK = min >= 1000 ? `${(min / 1000).toFixed(0)}K` : min.toString()
    return `${minK}+ ${currency}`
  }
  
  const maxK = max && max >= 1000 ? `${(max / 1000).toFixed(0)}K` : (max || 0).toString()
  return `Up to ${maxK} ${currency}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }

  return formatDate(d)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function parseTags(tagsString?: string): string[] {
  if (!tagsString) return []
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
}

export function formatTags(tagsList: string[]): string {
  return tagsList.join(', ')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
