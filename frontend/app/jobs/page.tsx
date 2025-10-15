'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTelegramWebApp, useTelegramUser } from '@/lib/telegram'
import { jobsApi, type Job } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Search, MapPin, Banknote, Calendar, Users, User, Smartphone, Plus, Loader2, Building } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { formatSalaryRange } from '@/lib/utils'

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function JobsPage() {
  const webApp = useTelegramWebApp()
  const telegramUser = useTelegramUser()
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')

  // Debounce search inputs to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const debouncedLocation = useDebounce(location, 500)
  const debouncedSalaryMin = useDebounce(salaryMin, 500)
  const debouncedSalaryMax = useDebounce(salaryMax, 500)

  const { data: jobs, isLoading, isFetching, error } = useQuery(
    ['jobs', debouncedSearchQuery, debouncedLocation, isRemote, debouncedSalaryMin, debouncedSalaryMax],
    () => jobsApi.getJobs({
      query: debouncedSearchQuery || undefined,
      location: debouncedLocation || undefined,
      is_remote: isRemote,
      salary_min: debouncedSalaryMin ? parseFloat(debouncedSalaryMin) : undefined,
      salary_max: debouncedSalaryMax ? parseFloat(debouncedSalaryMax) : undefined,
    }),
    {
      keepPreviousData: true, // Keep showing old data while fetching new data
    }
  )

  useEffect(() => {
    if (webApp) {
      webApp.MainButton.hide()
      webApp.BackButton.hide()
    }
  }, [webApp])

  // Show skeleton loader only on initial load, not on subsequent searches
  if (isLoading && !jobs) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 w-full">
        <div className="max-w-4xl mx-auto w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 w-full">
        <div className="max-w-4xl mx-auto text-center w-full">
          <div className="card">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Jobs
            </h2>
            <p className="text-gray-600">
              Please try again later or contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 w-full">
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="flex items-center mb-6">
            <div className="text-3xl mr-3">👨‍💻</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Coders Needed
              </h1>
              <p className="text-xs text-gray-600 font-medium">For Developers & Software Engineers</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search React Developer, Python Engineer, Full Stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 pr-12 shadow-sm"
            />
            {isFetching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 h-5 w-5 animate-spin" />
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="📍 Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input text-sm shadow-sm"
            />
            <select
              value={isRemote === undefined ? '' : isRemote.toString()}
              onChange={(e) => setIsRemote(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="input text-sm shadow-sm"
            >
              <option value="">All Types</option>
              <option value="true">🏠 Remote</option>
              <option value="false">🏢 On-site</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="💰 Min Salary"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="input text-sm shadow-sm"
            />
            <input
              type="number"
              placeholder="💰 Max Salary"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="input text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Telegram User Info */}
      {telegramUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 w-full">
          <div className="max-w-4xl mx-auto px-4 py-3 w-full">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    Welcome, {telegramUser.first_name}
                    {telegramUser.last_name && ` ${telegramUser.last_name}`}
                  </p>
                  {telegramUser.is_premium && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border border-amber-200">
                      ⭐ Premium
                    </span>
                  )}
                </div>
                {telegramUser.username && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    @{telegramUser.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="max-w-4xl mx-auto px-4 py-6 w-full">
        {jobs?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Coding Jobs Found
              </h3>
              <p className="text-gray-600 text-sm">
                Try different keywords like "React", "Python", "Full Stack" or check back later for new developer opportunities.
              </p>
            </div>
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-50' : ''}`}>
            {jobs?.data?.map((job: Job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Employers */}
      {user?.role === 'employer' && (
        <Link
          href="/post-job"
          prefetch={true}
          className="fixed bottom-20 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-40 flex items-center justify-center"
          title="Post a Job"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  )
}

function JobCard({ job }: { job: Job }) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return []
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
  }
  
  return (
    <Link 
      href={`/jobs/${job.id}`}
      prefetch={true}
      className="group card hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer block"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center mt-1.5">
            {job.company ? (
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-1.5 text-gray-400" />
                <span className="font-medium">{job.company.name}</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1.5 text-gray-400" />
                <span className="font-medium">{job.poster?.first_name} {job.poster?.last_name}</span>
              </div>
            )}
          </div>
        </div>
        <span className="badge badge-primary text-xs flex-shrink-0">
          <Users className="h-3 w-3 mr-1" />
          {job.applications_count || 0}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {/* Tags */}
      {parseTags(job.tags).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {parseTags(job.tags).slice(0, 3).map((tag, index) => (
            <span key={index} className="badge badge-secondary text-xs">
              {tag}
            </span>
          ))}
          {parseTags(job.tags).length > 3 && (
            <span className="badge badge-info text-xs">
              +{parseTags(job.tags).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          {job.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              <span className="font-medium">{job.location}</span>
            </div>
          )}
          {job.is_remote && (
            <span className="badge badge-success text-xs">Remote</span>
          )}
        </div>
        <div className="flex items-center text-sm font-bold text-blue-600">
          <Banknote className="h-4 w-4 mr-1.5" />
          <span>{formatSalaryRange(job.salary_min, job.salary_max, job.currency)}</span>
        </div>
      </div>
    </Link>
  )
}
