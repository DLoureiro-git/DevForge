import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'

const USER_STORAGE_KEY = 'devforge_user'

/**
 * Hook para autenticação automática
 * Cria um user demo se não existir, ou restaura do localStorage
 */
export function useAutoAuth() {
  const { user, setUser } = useStore()

  useEffect(() => {
    const initAuth = async () => {
      // Se já tem user no store, skip
      if (user) return

      try {
        // Tentar restaurar do localStorage
        const stored = localStorage.getItem(USER_STORAGE_KEY)
        if (stored) {
          const parsedUser = JSON.parse(stored)
          setUser(parsedUser)
          console.log('[Auth] User restaurado do localStorage:', parsedUser.email)
          return
        }

        // Criar user demo
        console.log('[Auth] A criar user demo...')
        const randomId = Math.random().toString(36).substring(2, 8)
        const response = await api.register({
          email: `demo-${randomId}@devforge.dev`,
          name: `Demo User ${randomId}`,
          password: 'demo123', // Password não é usado por enquanto
        })

        const newUser = response.user
        setUser(newUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
        console.log('[Auth] User demo criado:', newUser.email)
      } catch (error) {
        console.error('[Auth] Erro ao inicializar auth:', error)
      }
    }

    initAuth()
  }, [user, setUser])

  return { user }
}
