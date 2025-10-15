'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp } from '@/lib/telegram'
import { jobsApi, applicationsApi, type Job } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Briefcase, MapPin, Banknote, Building, User, FileText, Send, Upload } from 'lucide-react'
import { formatSalaryRange } from '@/lib/utils'

interface ApplyPageProps {
  params: {
    id: string
  }
}

export default function ApplyPage({ params }: ApplyPageProps) {
  const webApp = useTelegramWebApp()
  const queryClient = useQueryClient()
  const router = useRouter()
  const jobId = parseInt(params.id)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: jobResponse, isLoading, error } = useQuery(
    ['job', jobId],
    () => jobsApi.getJob(jobId),
    {
      enabled: !!webApp && !isNaN(jobId),
    }
  )
  
  const job = jobResponse?.data

  const applyMutation = useMutation(
    (data: { job_id: number; cover_letter?: string }) => applicationsApi.apply(data),
    {
      onSuccess: () => {
        toast.success('Application submitted successfully!')
        queryClient.invalidateQueries(['my-applications'])
        webApp?.HapticFeedback.notificationOccurred('success')
        router.push(`/jobs/${jobId}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to submit application')
        webApp?.HapticFeedback.notificationOccurred('error')
      },
    }
  )

  useEffect(() => {
    if (webApp) {
      webApp.BackButton.show()
      const handleBack = () => {
        router.push(`/jobs/${jobId}`)
      }
      webApp.BackButton.onClick(handleBack)

      return () => {
        webApp.BackButton.hide()
        webApp.BackButton.offClick(handleBack)
      }
    }
  }, [webApp, router, jobId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setResumeFile(file)
    
    // Upload immediately
    setIsUploading(true)
    try {
      const response = await applicationsApi.uploadResume(file)
      setResumeUrl(response.data.resume_url)
      toast.success('Resume uploaded successfully!')
      webApp?.HapticFeedback.notificationOccurred('success')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload resume')
      setResumeFile(null)
      webApp?.HapticFeedback.notificationOccurred('error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    applyMutation.mutate({
      job_id: jobId,
      cover_letter: coverLetter.trim() || undefined,
      resume_url: resumeUrl || undefined,
    })
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600">
              The job you're trying to apply for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/jobs')}
              className="btn-primary mt-4"
            >
              Back to Jobs
            </button>
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
              onClick={() => router.push(`/jobs/${jobId}`)}
              className="mr-4 p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="text-xl mr-3">📝</div>
              <h1 className="text-2xl font-bold text-gray-900">Apply for Job</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Job Summary Card */}
        <div className="card mb-6 border-2 border-blue-100 bg-blue-50/30">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h2>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                {job.company ? (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span className="font-medium">{job.company.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span className="font-medium">{job.poster?.first_name} {job.poster?.last_name}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {job.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.is_remote && (
                  <span className="badge badge-success text-xs">Remote</span>
                )}
                <div className="flex items-center text-blue-600 font-semibold">
                  <Banknote className="h-4 w-4 mr-0.5" />
                  <span>{formatSalaryRange(job.salary_min, job.salary_max, job.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Your Application</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Cover Letter (Optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="input h-48 resize-none"
                  placeholder="Tell the employer why you're a great fit for this role. Mention your relevant experience, skills, and what excites you about this opportunity..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Tip: A personalized cover letter increases your chances of getting noticed!
                </p>
              </div>

              {/* Resume/CV Upload */}
              <div>
                <label className="label">Resume/CV (Optional)</label>
                <div className="space-y-3">
                  {!resumeFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                          isUploading
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                            : 'border-blue-300 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                              <p className="text-sm text-gray-600">Uploading resume...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-blue-600 mb-2" />
                              <p className="text-sm font-semibold text-gray-900">
                                Click to upload resume
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC, or DOCX (Max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {resumeFile.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null)
                            setResumeUrl('')
                          }}
                          className="ml-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Tip: Uploading your resume helps employers review your qualifications faster!
                </p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="card border-2 border-amber-100 bg-amber-50/30">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Before you apply</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Make sure you meet the job requirements</li>
                  <li>• Your Telegram profile info will be shared with the employer</li>
                  <li>• You can only apply once per job</li>
                  <li>• The employer will contact you through Telegram if interested</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-20 pb-4">
            <button
              type="submit"
              className="w-full btn-primary py-4 text-lg font-bold shadow-lg hover:shadow-xl flex items-center justify-center"
              disabled={applyMutation.isLoading}
            >
              {applyMutation.isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

