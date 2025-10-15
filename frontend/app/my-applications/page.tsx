'use client'

import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/lib/telegram'
import { applicationsApi, type Application } from '@/lib/api'
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'

export default function MyApplicationsPage() {
  const webApp = useTelegramWebApp()
  const router = useRouter()

  const { data: applications, isLoading, error } = useQuery(
    'my-applications',
    () => applicationsApi.getMyApplications(),
    {
      enabled: !!webApp,
    }
  )

  useEffect(() => {
    if (webApp) {
      webApp.MainButton.hide()
      webApp.BackButton.hide()
    }
  }, [webApp])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Applications
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
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📝</div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Applications
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {applications?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Applications Yet
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Start applying for developer jobs to see your applications here.
              </p>
              <button
                onClick={() => router.push('/jobs')}
                className="btn-primary w-full"
              >
                Browse Developer Jobs
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications?.data?.map((application: Application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const router = useRouter()
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'reviewed':
        return <Eye className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'badge-success'
      case 'rejected':
        return 'badge-danger'
      case 'reviewed':
        return 'badge-primary'
      default:
        return 'badge-secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="card hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer"
         onClick={() => router.push(`/jobs/${application.job?.id}`)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">
            {application.job?.title}
          </h3>
          <div className="flex items-center text-sm text-gray-600">
            {application.job?.company ? (
              <span className="font-medium">{application.job.company.name}</span>
            ) : (
              <span className="font-medium">
                {application.job?.poster?.first_name} {application.job?.poster?.last_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <span className={`badge ${getStatusColor(application.status)} flex items-center`}>
            {getStatusIcon(application.status)}
            <span className="ml-1.5">{application.status === 'pending' ? 'Pending' : application.status === 'accepted' ? 'Accepted' : application.status === 'rejected' ? 'Rejected' : 'Reviewed'}</span>
          </span>
        </div>
      </div>

      {application.cover_letter && (
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
          {application.cover_letter}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Applied {formatDate(application.created_at)}</span>
        {application.updated_at !== application.created_at && (
          <span>Updated {formatDate(application.updated_at!)}</span>
        )}
      </div>

      {application.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium mb-1">Employer Note:</p>
          <p className="text-sm text-gray-700">{application.notes}</p>
        </div>
      )}
    </div>
  )
}
