'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { useTelegramWebApp, useTelegramUser } from '@/lib/telegram'
import { authApi, profilesApi, applicationsApi, type User } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { User as UserIcon, Building, FileText, Settings, Upload, Briefcase, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function ProfilePage() {
  const webApp = useTelegramWebApp()
  const telegramUser = useTelegramUser()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'job-seeker'>('personal')
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const { data: user, isLoading, error } = useQuery(
    'user-profile',
    () => authApi.getMe(),
    {
      enabled: !!webApp && isAuthenticated,
      retry: 3,
      retryDelay: 1000,
    }
  )

  const { data: company } = useQuery(
    'company-profile',
    () => profilesApi.getCompany(),
    {
      enabled: !!webApp && user?.data?.role === 'employer',
    }
  )

  const { data: jobSeekerProfile } = useQuery(
    'job-seeker-profile',
    () => profilesApi.getJobSeekerProfile(),
    {
      enabled: !!webApp && user?.data?.role === 'job_seeker',
    }
  )

  const updateProfileMutation = useMutation(
    (data: any) => profilesApi.updateProfile(data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!')
        queryClient.invalidateQueries('user-profile')
        webApp?.HapticFeedback.notificationOccurred('success')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update profile')
        webApp?.HapticFeedback.notificationOccurred('error')
      },
    }
  )

  const testNotificationMutation = useMutation(
    () => applicationsApi.testNotification(),
    {
      onSuccess: () => {
        toast.success('Test notification sent! Check your Telegram 📱')
        webApp?.HapticFeedback.notificationOccurred('success')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to send notification')
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

  if (authLoading || isLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please wait while we authenticate you...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = user?.data

  if (error || !currentUser) {
    console.error('Profile load error:', error)
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Profile Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load your profile. Please try again.
            </p>
            {error && (
              <p className="text-sm text-red-500 mb-4">
                Error: {(error as any)?.response?.data?.detail || (error as any)?.message || 'Unknown error'}
              </p>
            )}
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="btn-primary"
            >
              Retry Authentication
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-3">👤</div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Profile
              </h1>
            </div>
            {currentUser.role === 'employer' && (
              <button
                onClick={() => router.push('/post-job')}
                className="btn-primary flex items-center text-sm"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Post Job
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="card mb-6 border-2">
          <div className="flex items-center">
            {currentUser.photo_url ? (
              <img
                src={currentUser.photo_url}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="flex-1 ml-4">
              <h2 className="text-xl font-bold text-gray-900">
                {currentUser.first_name} {currentUser.last_name}
              </h2>
              <p className="text-gray-600 text-sm mt-0.5">@{currentUser.username || 'No username'}</p>
              <span className={`badge mt-2 ${
                currentUser.role === 'job_seeker' ? 'badge-primary' :
                currentUser.role === 'employer' ? 'badge-success' :
                'badge-warning'
              }`}>
                {currentUser.role === 'job_seeker' ? '👤 Job Seeker' :
                 currentUser.role === 'employer' ? '💼 Employer' : 
                 currentUser.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Test Notification Button */}
        <div className="card mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-orange-600" />
                Test Telegram Notifications
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Send yourself a test "hate message" notification to make sure everything works! 🔥
              </p>
            </div>
            <button
              onClick={() => testNotificationMutation.mutate()}
              disabled={testNotificationMutation.isLoading}
              className="btn-primary ml-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testNotificationMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2 inline" />
                  Send Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-white rounded-2xl p-1.5 mb-6 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Personal Info
          </button>
          {currentUser.role === 'employer' && (
            <button
              onClick={() => setActiveTab('company')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'company'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Company
            </button>
          )}
          {currentUser.role === 'job_seeker' && (
            <button
              onClick={() => setActiveTab('job-seeker')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'job-seeker'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Job Seeker Profile
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <PersonalInfoTab user={currentUser} onUpdate={updateProfileMutation.mutate} />
        )}
        {activeTab === 'company' && currentUser.role === 'employer' && (
          <CompanyTab company={company?.data} />
        )}
        {activeTab === 'job-seeker' && currentUser.role === 'job_seeker' && (
          <JobSeekerTab profile={jobSeekerProfile?.data} />
        )}
      </div>
    </div>
  )
}

function PersonalInfoTab({ user, onUpdate }: { user: User; onUpdate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    email: user.email || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input"
            placeholder="Enter your username"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="input"
              placeholder="Enter your last name"
            />
          </div>
        </div>
        <div>
          <label className="label">Phone Number (Optional)</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input"
            placeholder="+1 (555) 123-4567"
          />
          <p className="text-xs text-gray-500 mt-1">Your contact number for job opportunities</p>
        </div>
        <div>
          <label className="label">Email Address (Optional)</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            placeholder="your.email@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">Your email for job-related communications</p>
        </div>
        <button type="submit" className="btn-primary w-full">
          Update Profile
        </button>
      </form>
    </div>
  )
}

function CompanyTab({ company }: { company: any }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  })

  const createMutation = useMutation(
    (data: any) => profilesApi.createCompany(data),
    {
      onSuccess: () => {
        toast.success('Company created successfully!')
        setShowCreateForm(false)
        setFormData({ name: '', description: '', website: '' })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to create company')
      },
    }
  )

  const updateMutation = useMutation(
    (data: any) => profilesApi.updateCompany(data),
    {
      onSuccess: () => {
        toast.success('Company updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update company')
      },
    }
  )

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (!company) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h3>
        {!showCreateForm ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Company Profile</h4>
            <p className="text-gray-600 mb-4">
              Create a company profile to post jobs and manage your business presence.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Company Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input h-24 resize-none"
                placeholder="Enter company description"
              />
            </div>
            <div>
              <label className="label">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input"
                placeholder="https://example.com"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h3>
      <form onSubmit={handleUpdateSubmit} className="space-y-4">
        <div>
          <label className="label">Company Name</label>
          <input
            type="text"
            value={formData.name || company.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Enter company name"
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description || company.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input h-24 resize-none"
            placeholder="Enter company description"
          />
        </div>
        <div>
          <label className="label">Website</label>
          <input
            type="url"
            value={formData.website || company.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="input"
            placeholder="https://example.com"
          />
        </div>
        {company.logo_url && (
          <div>
            <label className="label">Current Logo</label>
            <img
              src={`http://localhost:8000/uploads/${company.logo_url}`}
              alt="Company Logo"
              className="w-20 h-20 object-cover rounded-lg border"
            />
          </div>
        )}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? 'Updating...' : 'Update Company'}
        </button>
      </form>
    </div>
  )
}

function JobSeekerTab({ profile }: { profile: any }) {
  const [formData, setFormData] = useState({
    bio: '',
    skills: '',
    experience_years: '',
    phone: '',
    email: '',
    location: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        skills: profile.skills || '',
        experience_years: profile.experience_years?.toString() || '',
        phone: profile.phone || '',
        email: profile.email || '',
        location: profile.location || '',
      })
    }
  }, [profile])

  const createMutation = useMutation(
    (data: any) => profilesApi.createJobSeekerProfile(data),
    {
      onSuccess: () => {
        toast.success('Profile created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to create profile')
      },
    }
  )

  const updateMutation = useMutation(
    (data: any) => profilesApi.updateJobSeekerProfile(data),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update profile')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
    }
    
    if (profile) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (!profile) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Seeker Profile</h3>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Create Your Profile</h4>
          <p className="text-gray-600 mb-4">
            Complete your profile to stand out to employers.
          </p>
        </div>
        <JobSeekerForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isLoading={createMutation.isLoading}
        />
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Seeker Profile</h3>
      {profile.cv_url && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">CV uploaded successfully</span>
          </div>
        </div>
      )}
      <JobSeekerForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isLoading}
      />
    </div>
  )
}

function JobSeekerForm({ formData, setFormData, onSubmit, isLoading }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="input h-24 resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>
      <div>
        <label className="label">Skills</label>
        <input
          type="text"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          className="input"
          placeholder="JavaScript, Python, React, etc."
        />
      </div>
      <div>
        <label className="label">Years of Experience</label>
        <input
          type="number"
          value={formData.experience_years}
          onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
          className="input"
          placeholder="0"
          min="0"
        />
      </div>
      <div>
        <label className="label">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input"
          placeholder="+1234567890"
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label className="label">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="input"
          placeholder="City, Country"
        />
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
