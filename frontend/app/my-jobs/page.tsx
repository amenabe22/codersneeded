'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/lib/telegram'
import { jobsApi, applicationsApi, type Job, type Application } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Briefcase, Users, Eye, Edit, Trash2, Banknote, MapPin, Calendar, Download, FileText, ExternalLink } from 'lucide-react'
import { formatSalaryRange } from '@/lib/utils'

export default function MyJobsPage() {
  const webApp = useTelegramWebApp()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: jobs, isLoading, error } = useQuery(
    'my-jobs',
    () => jobsApi.getMyJobs(),
    {
      enabled: !!webApp,
    }
  )

  const deleteJobMutation = useMutation(
    (jobId: number) => jobsApi.deleteJob(jobId),
    {
      onSuccess: () => {
        toast.success('Job deleted successfully!')
        queryClient.invalidateQueries('my-jobs')
        webApp?.HapticFeedback.notificationOccurred('success')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to delete job')
        webApp?.HapticFeedback.notificationOccurred('error')
      },
    }
  )

  useEffect(() => {
    if (webApp) {
      webApp.MainButton.hide()
      webApp.BackButton.hide()
    }
  }, [webApp])

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJobMutation.mutate(jobId)
    }
  }

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
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💼</div>
              <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            </div>
            <button
              onClick={() => router.push('/post-job')}
              className="btn-primary flex items-center"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Post Job
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {jobs?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Developer Jobs Posted Yet
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Post your first developer job to find talented coders and engineers.
              </p>
              <button
                onClick={() => router.push('/post-job')}
                className="btn-primary w-full"
              >
                Post Your First Job
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs?.data?.map((job: Job) => (
              <JobCard key={job.id} job={job} onDelete={handleDeleteJob} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, onDelete }: { job: Job; onDelete: (id: number) => void }) {
  const router = useRouter()
  const [showApplications, setShowApplications] = useState(false)
  const { data: applications } = useQuery(
    ['job-applications', job.id],
    () => applicationsApi.getJobApplications(job.id),
    {
      enabled: showApplications,
    }
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success'
      case 'closed':
        return 'badge-danger'
      case 'draft':
        return 'badge-warning'
      default:
        return 'badge-secondary'
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span className={`badge ${getStatusColor(job.status)} mr-2`}>
              {job.status.toUpperCase()}
            </span>
            <span>{job.applications_count || 0} applicants</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View Job"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowApplications(!showApplications)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View Applications"
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Job"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="space-y-2.5 text-sm mb-4">
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center space-x-3">
            {job.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{job.location}</span>
              </div>
            )}
            {job.is_remote && (
              <span className="badge badge-success text-xs">Remote</span>
            )}
          </div>
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(job.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center font-bold text-blue-600">
          <Banknote className="h-4 w-4 mr-1.5" />
          <span>{formatSalaryRange(job.salary_min, job.salary_max, job.currency)}</span>
        </div>
      </div>

      {/* Applications Section */}
      {showApplications && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Applications ({applications?.data?.length || 0})
          </h4>
          {applications?.data?.length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet</p>
          ) : (
            <div className="space-y-3">
              {applications?.data?.map((application: Application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const [isLoadingResume, setIsLoadingResume] = useState(false)
  
  const updateApplicationMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => applicationsApi.updateApplication(id, data),
    {
      onSuccess: () => {
        toast.success('Application updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update application')
      },
    }
  )

  const handleStatusUpdate = (status: string) => {
    updateApplicationMutation.mutate({
      id: application.id,
      data: { status },
    })
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

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start space-x-3">
          {application.applicant?.photo_url ? (
            <img
              src={application.applicant.photo_url}
              alt="Profile"
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {application.applicant?.first_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div>
            <h5 className="font-semibold text-gray-900">
              {application.applicant?.first_name} {application.applicant?.last_name}
            </h5>
            <p className="text-xs text-gray-600">@{application.applicant?.username || 'No username'}</p>
          </div>
        </div>
        <span className={`badge ${getStatusColor(application.status)} text-xs`}>
          {application.status.toUpperCase()}
        </span>
      </div>

      {application.cover_letter && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 font-semibold">Cover Letter:</p>
          <p className="text-sm text-gray-700">
            {application.cover_letter}
          </p>
        </div>
      )}

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

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500 font-medium">
          📅 Applied {new Date(application.created_at).toLocaleDateString()}
        </span>
        {application.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate('accepted')}
              className="px-4 py-1.5 text-xs bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              className="px-4 py-1.5 text-xs bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
