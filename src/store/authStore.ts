import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { Employee } from '../types'

/**
 * Estado global de autenticación para la app móvil.
 *
 * A diferencia del store de React web (que usa localStorage),
 * aquí usamos expo-secure-store que cifra los datos usando
 * Keychain (iOS) o Keystore (Android) — mucho más seguro
 * para guardar el token Bearer en un dispositivo móvil.
 *
 * Zustand normalmente tiene un middleware "persist" con
 * AsyncStorage, pero como SecureStore es async y queremos
 * cifrado, implementamos la persistencia manualmente.
 */

const TOKEN_KEY    = 'auth_token'
const EMPLOYEE_KEY = 'auth_employee'

interface AuthState {
  employee: Employee | null
  token: string | null
  isLoading: boolean // true mientras se restaura la sesión al abrir la app

  // Acciones
  login: (employee: Employee, token: string) => Promise<void>
  updateEmployee: (data: Partial<Employee>) => void
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

const useAuthStore = create<AuthState>((set, get) => ({
  employee:  null,
  token:     null,
  isLoading: true,

  /**
   * Guarda la sesión tanto en memoria (Zustand) como en SecureStore.
   * Llamado después de un bind exitoso.
   */
  login: async (employee, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(EMPLOYEE_KEY, JSON.stringify(employee))
    set({ employee, token })
  },

  /**
   * Actualiza datos del empleado en memoria y en SecureStore
   * (ej: después de aceptar el aviso de privacidad).
   */
  updateEmployee: (data) => {
    set((state) => {
      const updated = state.employee ? { ...state.employee, ...data } : null
      if (updated) {
        SecureStore.setItemAsync(EMPLOYEE_KEY, JSON.stringify(updated))
      }
      return { employee: updated }
    })
  },

  /**
   * Cierra sesión — limpia memoria y SecureStore.
   */
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(EMPLOYEE_KEY)
    set({ employee: null, token: null })
  },

  /**
   * Restaura la sesión guardada al abrir la app.
   * Se llama UNA VEZ en el layout raíz (_layout.tsx).
   */
  restoreSession: async () => {
    try {
      const token        = await SecureStore.getItemAsync(TOKEN_KEY)
      const employeeJson = await SecureStore.getItemAsync(EMPLOYEE_KEY)

      if (token && employeeJson) {
        set({
          token,
          employee: JSON.parse(employeeJson),
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))

export default useAuthStore
