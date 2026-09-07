import axios from 'axios'

const CSRF_STORAGE_KEY = 'csrf_token'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const { data } = await axios.get('/api/v1/auth/csrf-token', { withCredentials: true })
    if (data?.token) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, data.token)
    }
    return data?.token ?? null
  } catch {
    return null
  }
}

function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_STORAGE_KEY)
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (!SAFE_METHODS.includes(config.method?.toUpperCase() ?? '')) {
    let csrfToken = getCsrfToken()
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken()
    }
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken
    }
  }

  return config
})

api.interceptors.response.use(
  (res) => {
    if (res.data?.csrfToken) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, res.data.csrfToken)
    }
    return res
  },
  async (err) => {
    const original = err.config
    if (err.response?.status === 403 &&
        (err.response?.data?.message === 'CSRF token missing' ||
         err.response?.data?.message === 'Invalid CSRF token') &&
        !original._csrfRetry) {
      original._csrfRetry = true
      const token = await fetchCsrfToken()
      if (token) {
        original.headers['x-csrf-token'] = token
        return api(original)
      }
    }

    if (err.response?.status === 503 && err.response?.data?.message?.includes?.('maintenance')) {
      if (window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance'
      }
      return Promise.reject(err)
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh }, { withCredentials: true })
          localStorage.setItem('access_token', data.accessToken)
          localStorage.setItem('refresh_token', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export { fetchCsrfToken }

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null
  try {
    const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh }, { withCredentials: true })
    localStorage.setItem('access_token', data.accessToken)
    localStorage.setItem('refresh_token', data.refreshToken)
    return data.accessToken as string
  } catch {
    return null
  }
}
