'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, FileText, User, Search, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show bottom nav on home page or auth pages
  if (pathname === '/' || pathname === '/telegram-demo') {
    return null
  }

  const isEmployer = user?.role === 'employer'
  const isJobSeeker = user?.role === 'job_seeker'

  const navItems = [
    {
      name: 'Jobs',
      icon: Search,
      href: '/jobs',
      show: true,
    },
    {
      name: 'My Applications',
      icon: FileText,
      href: '/my-applications',
      show: isJobSeeker,
    },
    {
      name: 'My Jobs',
      icon: Briefcase,
      href: '/my-jobs',
      show: isEmployer,
    },
    {
      name: 'Profile',
      icon: User,
      href: '/profile',
      show: true,
    },
  ]

  const visibleItems = navItems.filter(item => item.show)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-50">
      <div className="max-w-2xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

