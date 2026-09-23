import axios from 'axios'

const CSRF_STORAGE_KEY = 'csrf_token'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

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

async function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const csrf = (await fetchCsrfToken()) ?? sessionStorage.getItem(CSRF_STORAGE_KEY)
      const headers: Record<string, string> = {}
      if (csrf) headers['x-csrf-token'] = csrf
      const { data } = await axios.post('/api/v1/auth/refresh', {}, {
        withCredentials: true,
        headers,
        timeout: 10000,
      })
      if (data?.accessToken) {
        accessToken = data.accessToken
        return accessToken
      }
      return null
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

api.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
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

let isRedirectingToLogin = false
function goToLogin(): void {
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true
  accessToken = null
  sessionStorage.removeItem(CSRF_STORAGE_KEY)
  // Session restoration also runs on the login page. Reloading that same
  // route on every unauthenticated response creates an infinite refresh loop.
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (res) => {
    if (res.data?.csrfToken) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, res.data.csrfToken)
    }
    return res
  },
  async (err) => {
    const original = err.config
    if (!original) return Promise.reject(err)

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

    if (err.response?.status === 401 &&
        !original._retry &&
        !original.url?.includes('/auth/')) {
      original._retry = true
      const newToken = await refreshSession()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      goToLogin()
    }
    return Promise.reject(err)
  }
)

export { fetchCsrfToken }

export async function refreshAccessToken(): Promise<string | null> {
  return refreshSession()
}
