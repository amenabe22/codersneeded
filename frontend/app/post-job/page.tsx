'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useTelegramWebApp } from '@/lib/telegram'
import { jobsApi, profilesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'react-hot-toast'
import { Plus, Building, User, DollarSign, MapPin, Tag, FileText } from 'lucide-react'

export default function PostJobPage() {
  const webApp = useTelegramWebApp()
  const { isAuthenticated, isLoading } = useAuth()
  const queryClient = useQueryClient()
  const [isIndividual, setIsIndividual] = useState(false)
  const [formData, setFormData] = useState({
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced full stack developer to join our dynamic team. You will be working on cutting-edge web applications using modern technologies like React, Node.js, and cloud platforms.',
    requirements: '• 3+ years experience with React and Node.js\n• Experience with databases (PostgreSQL, MongoDB)\n• Knowledge of cloud platforms (AWS, GCP, Azure)\n• Strong problem-solving and debugging skills\n• Good communication and teamwork abilities',
    salary_min: '80000',
    salary_max: '120000',
    currency: 'ETB',
    location: 'San Francisco, CA',
    is_remote: true,
    tags: 'React,Node.js,Full Stack,JavaScript,TypeScript',
  })


  const createJobMutation = useMutation(
    (data: any) => jobsApi.createJob(data),
    {
      onSuccess: () => {
        toast.success('Job posted successfully!')
        queryClient.invalidateQueries('jobs')
        webApp?.HapticFeedback.notificationOccurred('success')
        window.location.href = '/my-jobs'
      },
      onError: (error: any) => {
        console.error('Job posting error:', error)
        console.error('Error response:', error.response)
        console.error('Error data:', error.response?.data)
        
        let errorMessage = 'Failed to post job'
        
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        // Show detailed error in console and toast
        console.error('Final error message:', errorMessage)
        toast.error(`Job posting failed: ${errorMessage}`)
        webApp?.HapticFeedback.notificationOccurred('error')
      },
    }
  )


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('Please wait for authentication to complete')
      return
    }
    
    const jobData = {
      ...formData,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : undefined,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : undefined,
      company_id: isIndividual ? undefined : undefined, // Will be handled by backend based on user role
    }
    
    createJobMutation.mutate(jobData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button
              onClick={() => window.history.back()}
              className="mr-4 p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="text-2xl mr-3">💼</div>
              <h1 className="text-2xl font-bold text-gray-900">Post a Developer Job</h1>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post Type Toggle */}
        <div className="card mb-6 border-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Post as</h3>
          <div className="flex space-x-2 bg-gray-50 rounded-xl p-1.5">
            <button
              onClick={() => setIsIndividual(false)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                !isIndividual
                  ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="h-4 w-4 mr-2" />
              Company
            </button>
            <button
              onClick={() => setIsIndividual(true)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                isIndividual
                  ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Individual
            </button>
          </div>
        </div>

        {/* Job Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Job Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Senior React Developer, Python Backend Engineer, Full Stack Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="label">Job Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input h-32 resize-none"
                  placeholder="Describe the role, tech stack, responsibilities, and what makes this opportunity great for developers..."
                  required
                />
              </div>
              
              <div>
                <label className="label">Technical Requirements (Optional)</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="input h-24 resize-none"
                  placeholder="List required programming languages, frameworks, years of experience, technical skills..."
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Min Salary</label>
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  className="input"
                  placeholder="50000"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Max Salary</label>
                <input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  className="input"
                  placeholder="80000"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Type</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="e.g., New York, NY or Remote"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_remote"
                  checked={formData.is_remote}
                  onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_remote" className="ml-2 text-sm text-gray-700">
                  This is a remote position
                </label>
              </div>
            </div>
          </div>

          {/* Skills & Tags */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Tags</h3>
            <div>
              <label className="label">Technologies & Skills</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="JavaScript, React, Node.js, Python, TypeScript, AWS, Docker..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Add programming languages, frameworks, and tools (comma-separated)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-20 pb-4">
            <button
              type="submit"
              className="w-full btn-primary py-4 text-lg font-bold shadow-lg hover:shadow-xl"
              disabled={createJobMutation.isLoading || !isAuthenticated}
            >
              {createJobMutation.isLoading ? '⏳ Posting Job...' : !isAuthenticated ? '🔐 Authenticating...' : '🚀 Post Job'}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  )
}
