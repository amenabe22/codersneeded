import axios from 'axios'

// Use localhost backend for development
const API_BASE_URL = 'https://retain-authentication-albums-ranger.trycloudflare.com/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  console.log('🔐 API Request:', config.url)
  console.log('🔑 Token exists:', !!token)
  if (token) {
    console.log('🔑 Token preview:', token.substring(0, 20) + '...')
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('⚠️ No auth token found in localStorage')
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: number
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  profile_picture_url?: string
  phone?: string
  email?: string
  language_code?: string
  is_premium?: boolean
  role: 'job_seeker' | 'employer' | 'individual'
  created_at: string
  updated_at?: string
}

export interface Company {
  id: number
  name: string
  description?: string
  logo_url?: string
  website?: string
  owner_id: number
  created_at: string
  updated_at?: string
}

export interface JobSeekerProfile {
  id: number
  user_id: number
  bio?: string
  skills?: string
  experience_years?: number
  cv_url?: string
  phone?: string
  email?: string
  location?: string
  created_at: string
  updated_at?: string
}

export interface Job {
  id: number
  title: string
  description: string
  requirements?: string
  salary_min?: number
  salary_max?: number
  currency: string
  location?: string
  is_remote: boolean
  tags?: string
  status: 'active' | 'closed' | 'draft'
  poster_id: number
  company_id?: number
  created_at: string
  updated_at?: string
  poster?: User
  company?: Company
  applications_count?: number
}

export interface Application {
  id: number
  job_id: number
  applicant_id: number
  cover_letter?: string
  resume_url?: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  notes?: string
  created_at: string
  updated_at?: string
  applicant?: User
  job?: Job
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  data?: string
  is_read: boolean
  created_at: string
}

// Auth API
export const authApi = {
  login: (initData: string) => 
    api.post('/auth/telegram', { init_data: initData }),
  
  loginDev: () => 
    api.post('/auth/dev-login'),
  
  getMe: () => 
    api.get('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout'),
  
  uploadProfilePicture: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/auth/upload-profile-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Jobs API
export const jobsApi = {
  getJobs: (params?: {
    page?: number
    limit?: number
    query?: string
    location?: string
    is_remote?: boolean
    salary_min?: number
    salary_max?: number
    tags?: string
  }) => 
    api.get('/jobs/', { params }),
  
  getJob: (id: number) => 
    api.get(`/jobs/${id}/`),
  
  createJob: (data: {
    title: string
    description: string
    requirements?: string
    salary_min?: number
    salary_max?: number
    currency?: string
    location?: string
    is_remote?: boolean
    tags?: string
    company_id?: number
  }) => 
    api.post('/jobs/', data),
  
  updateJob: (id: number, data: Partial<Job>) => 
    api.put(`/jobs/${id}/`, data),
  
  deleteJob: (id: number) => 
    api.delete(`/jobs/${id}/`),
  
  getMyJobs: () => 
    api.get('/jobs/my-jobs/'),
}

// Applications API
export const applicationsApi = {
  apply: (data: {
    job_id: number
    cover_letter?: string
    resume_url?: string
  }) => 
    api.post('/applications/', data),
  
  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/applications/upload-resume/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  getMyApplications: () => 
    api.get('/applications/my-applications/'),
  
  getJobApplications: (jobId: number) => 
    api.get(`/applications/job/${jobId}`),
  
  updateApplication: (id: number, data: {
    status?: 'pending' | 'reviewed' | 'accepted' | 'rejected'
    notes?: string
  }) => 
    api.put(`/applications/${id}`, data),
  
  getApplication: (id: number) => 
    api.get(`/applications/${id}`),
  
  getResumeUrl: (applicationId: number) =>
    api.get(`/applications/resume-url/${applicationId}`),
  
  testNotification: () => 
    api.post('/applications/test-notification'),
}

// Profiles API
export const profilesApi = {
  updateProfile: (data: {
    username?: string
    first_name?: string
    last_name?: string
    role?: 'job_seeker' | 'employer' | 'individual'
  }) => 
    api.put('/profiles/me/', data),
  
  getCompany: () => 
    api.get('/profiles/company'),
  
  createCompany: (data: {
    name: string
    description?: string
    website?: string
  }) => 
    api.post('/profiles/company/', data),
  
  updateCompany: (data: {
    name?: string
    description?: string
    website?: string
  }) => 
    api.put('/profiles/company/', data),
  
  uploadCompanyLogo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/profiles/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  getJobSeekerProfile: () => 
    api.get('/profiles/job-seeker'),
  
  createJobSeekerProfile: (data: {
    bio?: string
    skills?: string
    experience_years?: number
    phone?: string
    email?: string
    location?: string
  }) => 
    api.post('/profiles/job-seeker/', data),
  
  updateJobSeekerProfile: (data: {
    bio?: string
    skills?: string
    experience_years?: number
    phone?: string
    email?: string
    location?: string
  }) => 
    api.put('/profiles/job-seeker/', data),
  
  uploadCV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/profiles/job-seeker/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: {
    skip?: number
    limit?: number
  }) => 
    api.get('/notifications/', { params }),
  
  getUnreadCount: () => 
    api.get('/notifications/unread-count'),
  
  markAsRead: (id: number) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/mark-all-read'),
}
