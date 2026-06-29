import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

/**
 * Cliente HTTP base para la API de AttendanceSaaS (móvil).
 *
 * IMPORTANTE — URL base en desarrollo con dispositivo/emulador físico:
 *  - Simulador iOS: puede usar "localhost" o el dominio .test de Herd
 *    directamente, ya que comparte la red del Mac.
 *  - Emulador Android: NO puede usar "localhost" — Android Studio
 *    emulator usa 10.0.2.2 para referirse a la máquina host.
 *  - Dispositivo físico (ambos): necesita la IP local de tu Mac
 *    en la red (ej: 192.168.1.50), nunca localhost ni .test
 *    (a menos que tengas DNS local configurado en el dispositivo).
 *
 * Por eso EXPO_PUBLIC_API_URL se configura distinto según
 * cómo estés probando — ver .env.example
 */
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

// ─── REQUEST INTERCEPTOR ─────────────────────────────────
// Lee el token de SecureStore (cifrado) y lo agrega al header.
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── RESPONSE INTERCEPTOR ────────────────────────────────
// Si el token expira (401), limpiamos la sesión.
// La navegación de vuelta a /bind se maneja en el componente
// que consume el error, no aquí (a diferencia de React web,
// en React Native no hay "window.location").
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('auth_employee')
    }
    return Promise.reject(error)
  }
)

export default api
