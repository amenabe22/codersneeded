'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/lib/telegram'
import { jobsApi, applicationsApi, type Job, type Application, type RankedApplication } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Briefcase, Users, Eye, Edit, Trash2, Banknote, MapPin, Calendar, Download, FileText, ExternalLink, Sparkles, TrendingUp, Award, AlertCircle, CheckCircle, XCircle, Brain } from 'lucide-react'
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
  const [useAIRanking, setUseAIRanking] = useState(true)
  
  const { data: rankedApplications, isLoading: isLoadingRanked } = useQuery(
    ['ranked-applications', job.id],
    () => applicationsApi.getRankedJobApplications(job.id),
    {
      enabled: showApplications && useAIRanking,
    }
  )
  
  const { data: applications } = useQuery(
    ['job-applications', job.id],
    () => applicationsApi.getJobApplications(job.id),
    {
      enabled: showApplications && !useAIRanking,
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
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              Applications ({useAIRanking ? rankedApplications?.data?.length : applications?.data?.length || 0})
            </h4>
            <button
              onClick={() => setUseAIRanking(!useAIRanking)}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                useAIRanking 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI Ranking
            </button>
          </div>
          
          {isLoadingRanked && useAIRanking ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Brain className="h-4 w-4 mr-1.5 text-purple-600" />
                  AI analyzing applicants...
                </p>
              </div>
            </div>
          ) : useAIRanking && rankedApplications?.data?.length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet</p>
          ) : !useAIRanking && applications?.data?.length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet</p>
          ) : useAIRanking ? (
            <div className="space-y-3">
              {rankedApplications?.data?.map((rankedApp: RankedApplication, index: number) => (
                <AIRankedApplicationCard 
                  key={rankedApp.application.id} 
                  rankedApplication={rankedApp}
                  rank={index + 1}
                />
              ))}
            </div>
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

function AIRankedApplicationCard({ rankedApplication, rank }: { rankedApplication: RankedApplication; rank: number }) {
  const [isLoadingResume, setIsLoadingResume] = useState(false)
  const { application, ai_analysis } = rankedApplication
  
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

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'hire':
        return 'bg-green-50 border-green-300 text-green-800'
      case 'interview':
        return 'bg-blue-50 border-blue-300 text-blue-800'
      case 'maybe':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800'
      case 'pass':
        return 'bg-red-50 border-red-300 text-red-800'
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'hire':
        return <Award className="h-4 w-4" />
      case 'interview':
        return <CheckCircle className="h-4 w-4" />
      case 'maybe':
        return <AlertCircle className="h-4 w-4" />
      case 'pass':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{getRankBadge(rank)}</span>
      </div>

      {/* Overall Score Badge */}
      <div className="absolute -top-3 -right-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-50"></div>
          <div className="relative bg-white rounded-full px-3 py-1.5 shadow-lg border-2 border-purple-200">
            <span className={`text-lg font-bold ${getScoreColor(ai_analysis.overall_score)}`}>
              {ai_analysis.overall_score}
            </span>
            <span className="text-xs text-gray-500 ml-0.5">/100</span>
          </div>
        </div>
      </div>

      {/* Applicant Info */}
      <div className="flex items-start space-x-3 mb-4 mt-2">
        {application.applicant?.photo_url ? (
          <img
            src={application.applicant.photo_url}
            alt="Profile"
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-purple-200"
          />
        ) : (
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center ring-2 ring-purple-200">
            <span className="text-white font-bold text-xl">
              {application.applicant?.first_name?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-gray-900 text-lg">
              {application.applicant?.first_name} {application.applicant?.last_name}
            </h5>
            <span className={`badge ${getStatusColor(application.status)} text-xs`}>
              {application.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-600">@{application.applicant?.username || 'No username'}</p>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 mb-3 ${getRecommendationColor(ai_analysis.recommendation)}`}>
        {getRecommendationIcon(ai_analysis.recommendation)}
        <span className="font-bold text-sm uppercase">{ai_analysis.recommendation}</span>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Cover Letter</div>
          <div className={`text-lg font-bold ${getScoreColor(ai_analysis.cover_letter_score)}`}>
            {ai_analysis.cover_letter_score}
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Complete</div>
          <div className={`text-lg font-bold ${getScoreColor(ai_analysis.completeness_score)}`}>
            {ai_analysis.completeness_score}
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Relevance</div>
          <div className={`text-lg font-bold ${getScoreColor(ai_analysis.relevance_score)}`}>
            {ai_analysis.relevance_score}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-2">
          <Brain className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-700 mb-1">AI Analysis</p>
            <p className="text-sm text-gray-700">{ai_analysis.ai_summary}</p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {ai_analysis.strengths && ai_analysis.strengths.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1.5 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-xs font-semibold text-green-700">Strengths</p>
          </div>
          <div className="space-y-1">
            {ai_analysis.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                <span className="text-green-600">•</span>
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concerns */}
      {ai_analysis.concerns && ai_analysis.concerns.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1.5 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-xs font-semibold text-orange-700">Concerns</p>
          </div>
          <div className="space-y-1">
            {ai_analysis.concerns.map((concern, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                <span className="text-orange-600">•</span>
                <span>{concern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover Letter */}
      {application.cover_letter && (
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1 font-semibold">Cover Letter:</p>
          <p className="text-sm text-gray-700 line-clamp-3">
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
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 rounded-lg border-2 border-blue-200 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              {isLoadingResume ? (
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-semibold">
                {isLoadingResume ? 'Loading...' : 'View Resume'}
              </span>
            </div>
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500 font-medium">
          📅 {new Date(application.created_at).toLocaleDateString()}
        </span>
        {application.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate('accepted')}
              className="px-4 py-2 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              className="px-4 py-2 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>
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
