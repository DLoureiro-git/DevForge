import { create } from 'zustand'

interface User {
  id: string
  email: string
  name?: string
}

interface Project {
  id: string
  name: string
  status: 'active' | 'completed' | 'failed'
  currentPhase?: string
  createdAt: string
  updatedAt: string
}

interface Settings {
  anthropicKey?: string
  ollamaUrl?: string
  supabaseUrl?: string
  supabaseKey?: string
}

interface AppState {
  user: User | null
  currentProject: Project | null
  settings: Settings
  setUser: (user: User | null) => void
  setCurrentProject: (project: Project | null) => void
  updateSettings: (settings: Partial<Settings>) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentProject: null,
  settings: {},

  setUser: (user) => set({ user }),

  setCurrentProject: (project) => set({ currentProject: project }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}))
