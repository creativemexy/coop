import { create } from 'zustand'

interface ThemeState {
  theme: 'light' | 'dark'
  toggle: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useTheme = create<ThemeState>((set) => {
  const stored = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as 'light' | 'dark' | null
  const initial = stored || 'light'

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }

  return {
    theme: initial,
    toggle: () =>
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light'
        localStorage.setItem('theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
        return { theme: next }
      }),
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      set({ theme })
    },
  }
})
