import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/password-reset/request', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/password-reset/confirm', { token, newPassword })
    return response.data
  },
}

// Users API
export const usersApi = {
  getUsers: async (params?: any) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats/overview')
    return response.data
  },
}

// Tenants API
export const tenantsApi = {
  getTenants: async (params?: any) => {
    const response = await api.get('/tenants', { params })
    return response.data
  },

  getTenant: async (id: string) => {
    const response = await api.get(`/tenants/${id}`)
    return response.data
  },

  registerTenant: async (tenantData: any) => {
    const response = await api.post('/tenants/register', tenantData)
    return response.data
  },

  updateTenant: async (id: string, tenantData: any) => {
    const response = await api.put(`/tenants/${id}`, tenantData)
    return response.data
  },

  approveTenant: async (id: string) => {
    const response = await api.post(`/tenants/${id}/approve`)
    return response.data
  },

  rejectTenant: async (id: string, reason: string) => {
    const response = await api.post(`/tenants/${id}/reject`, { reason })
    return response.data
  },

  getTenantStats: async () => {
    const response = await api.get('/tenants/stats/overview')
    return response.data
  },
}

// Malls API
export const mallsApi = {
  getMalls: async (params?: any) => {
    const response = await api.get('/malls', { params })
    return response.data
  },

  getMall: async (id: string) => {
    const response = await api.get(`/malls/${id}`)
    return response.data
  },

  createMall: async (mallData: any) => {
    const response = await api.post('/malls', mallData)
    return response.data
  },

  updateMall: async (id: string, mallData: any) => {
    const response = await api.put(`/malls/${id}`, mallData)
    return response.data
  },

  getMallTenants: async (id: string, params?: any) => {
    const response = await api.get(`/malls/${id}/tenants`, { params })
    return response.data
  },

  getMallStats: async (id: string) => {
    const response = await api.get(`/malls/${id}/stats`)
    return response.data
  },

  getMallOverviewStats: async () => {
    const response = await api.get('/malls/stats/overview')
    return response.data
  },
}

// Dashboard API
export const dashboardApi = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview')
    return response.data
  },

  getFinancial: async () => {
    const response = await api.get('/dashboard/financial')
    return response.data
  },

  getAnalytics: async (params?: any) => {
    const response = await api.get('/dashboard/analytics', { params })
    return response.data
  },

  getUserActivity: async () => {
    const response = await api.get('/dashboard/user-activity')
    return response.data
  },

  getHealth: async () => {
    const response = await api.get('/dashboard/health')
    return response.data
  },
}

// Files API
export const filesApi = {
  uploadFiles: async (files: File[], metadata?: any) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key])
      })
    }
    
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getFiles: async (params?: any) => {
    const response = await api.get('/files', { params })
    return response.data
  },

  getFile: async (id: string) => {
    const response = await api.get(`/files/${id}`)
    return response.data
  },

  downloadFile: async (id: string) => {
    const response = await api.get(`/files/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  deleteFile: async (id: string) => {
    const response = await api.delete(`/files/${id}`)
    return response.data
  },

  getFileStats: async () => {
    const response = await api.get('/files/stats/overview')
    return response.data
  },
}

export default api 