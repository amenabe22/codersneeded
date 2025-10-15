'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/lib/telegram'
import { jobsApi, applicationsApi, authApi, type Job, type Application } from '@/lib/api'
import { MapPin, Banknote, Calendar, Users, ArrowLeft, Briefcase, Clock, FileText, ExternalLink, UserIcon, CheckCircle, XCircle } from 'lucide-react'
import { formatSalaryRange } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const webApp = useTelegramWebApp()
  const router = useRouter()
  const jobId = parseInt(params.id)

  const { data: jobResponse, isLoading, error } = useQuery(
    ['job', jobId],
    () => jobsApi.getJob(jobId),
    {
      enabled: !!webApp && !isNaN(jobId),
    }
  )
  
  const job = jobResponse?.data

  const { data: currentUserResponse } = useQuery(
    'current-user',
    () => authApi.getMe(),
    {
      enabled: !!webApp,
    }
  )

  const currentUser = currentUserResponse?.data

  const { data: applications } = useQuery(
    ['my-applications'],
    () => applicationsApi.getMyApplications(),
    {
      enabled: !!webApp,
    }
  )

  // Fetch applicants if user is the poster
  const { data: jobApplicationsResponse } = useQuery(
    ['job-applications', jobId],
    () => applicationsApi.getJobApplications(jobId),
    {
      enabled: !!webApp && !!currentUser && !!job && currentUser.id === job.poster_id,
    }
  )

  useEffect(() => {
    if (webApp) {
      webApp.BackButton.show()
      const handleBack = () => {
        router.back()
      }
      webApp.BackButton.onClick(handleBack)

      return () => {
        webApp.BackButton.hide()
        webApp.BackButton.offClick(handleBack)
      }
    }
  }, [webApp, router])

  const hasApplied = applications?.data?.some(
    (app: Application) => app.job_id === jobId
  )

  // Check if current user is the poster of this job
  const isJobPoster = currentUser && job && currentUser.id === job.poster_id

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return []
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="card">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600">
              The job you're looking for doesn't exist or has been removed.
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
            <button
              onClick={() => router.back()}
              className="mr-4 p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="text-xl mr-3">💻</div>
              <h1 className="text-2xl font-bold text-gray-900">Developer Job Details</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Job Header */}
        <div className="card mb-6 border-2">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{job.title}</h2>
            <span className="badge badge-primary flex-shrink-0 ml-3">
              <Users className="h-3 w-3 mr-1" />
              {job.applications_count || 0}
            </span>
          </div>

          <div className="flex items-center text-gray-600 mb-4">
            {job.company ? (
              <>
                <Briefcase className="h-5 w-5 mr-2" />
                <span className="font-medium">{job.company.name}</span>
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                <span className="font-medium">{job.poster?.first_name} {job.poster?.last_name}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{job.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Banknote className="h-5 w-5 mr-2" />
              <span>{formatSalaryRange(job.salary_min, job.salary_max, job.currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
            {job.is_remote && (
              <span className="badge badge-success">Remote</span>
            )}
          </div>
        </div>

        {/* Tags */}
        {parseTags(job.tags).length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Tags</h3>
            <div className="flex flex-wrap gap-2">
              {parseTags(job.tags).map((tag, index) => (
                <span key={index} className="badge badge-secondary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Description */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          </div>
        )}

        {/* Applicants Section - Only visible to job poster */}
        {isJobPoster && jobApplicationsResponse?.data && (
          <div className="card mb-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-600" />
                Applicants ({jobApplicationsResponse.data.length})
              </h3>
            </div>

            {jobApplicationsResponse.data.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No applications yet</p>
                <p className="text-sm text-gray-500 mt-1">Applications will appear here once developers start applying</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobApplicationsResponse.data.map((application: Application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Apply Button */}
        {!hasApplied && !isJobPoster && (
          <div className="sticky bottom-20 pb-4">
            <button
              onClick={() => router.push(`/jobs/${jobId}/apply`)}
              className="w-full btn-primary py-4 text-lg font-bold shadow-lg hover:shadow-xl"
            >
              🚀 Apply Now
            </button>
          </div>
        )}

        {hasApplied && (
          <div className="card text-center border-2 border-green-100 bg-green-50/30">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">✅ Application Submitted</h3>
            <p className="text-gray-600 text-sm">
              You have already applied for this job. The employer will review your application and get back to you.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Application Card Component
function ApplicationCard({ application }: { application: Application }) {
  const queryClient = useQueryClient()
  const [isLoadingResume, setIsLoadingResume] = useState(false)

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || '?'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'reviewed':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'badge-success'
      case 'rejected':
        return 'badge-danger'
      case 'reviewed':
        return 'badge-info'
      default:
        return 'badge-warning'
    }
  }

  const handleViewResume = async () => {
    setIsLoadingResume(true)
    try {
      const response = await applicationsApi.getResumeUrl(application.id)
      const signedUrl = response.data.url
      window.open(signedUrl, '_blank')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load resume')
    } finally {
      setIsLoadingResume(false)
    }
  }

  const updateStatusMutation = useMutation(
    (status: 'accepted' | 'rejected') =>
      applicationsApi.updateApplication(application.id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['job-applications'])
        toast.success('Application status updated!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update status')
      },
    }
  )

  return (
    <div className={`p-4 rounded-xl border-2 ${getStatusColor(application.status)}`}>
      {/* Applicant Header */}
      <div className="flex items-center mb-3">
        {application.applicant?.photo_url ? (
          <img
            src={application.applicant.photo_url}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
            {getInitials(application.applicant?.first_name, application.applicant?.last_name)}
          </div>
        )}
        <div className="ml-3 flex-1">
          <h4 className="font-bold text-gray-900">
            {application.applicant?.first_name} {application.applicant?.last_name}
          </h4>
          <p className="text-sm text-gray-600">@{application.applicant?.username || 'unknown'}</p>
        </div>
        <span className={`badge ${getStatusBadge(application.status)} text-xs`}>
          {application.status}
        </span>
      </div>

      {/* Cover Letter */}
      {application.cover_letter && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg">
          <h5 className="text-xs font-semibold text-gray-700 mb-1">Cover Letter:</h5>
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
            {application.cover_letter}
          </p>
        </div>
      )}

      {/* Resume Button */}
      {application.resume_url && (
        <div className="mb-3">
          <button
            onClick={handleViewResume}
            disabled={isLoadingResume}
            className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              {isLoadingResume ? (
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">
                {isLoadingResume ? 'Loading...' : 'View Resume'}
              </span>
            </div>
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {application.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => updateStatusMutation.mutate('accepted')}
            disabled={updateStatusMutation.isLoading}
            className="flex-1 btn-success text-sm py-2 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4 mr-1 inline" />
            Accept
          </button>
          <button
            onClick={() => updateStatusMutation.mutate('rejected')}
            disabled={updateStatusMutation.isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4 mr-1 inline" />
            Reject
          </button>
        </div>
      )}

      {/* Applied Date */}
      <div className="mt-3 text-xs text-gray-500 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        Applied {new Date(application.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}
