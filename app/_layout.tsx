import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import useAuthStore from '../src/store/authStore'

/**
 * QueryClient — igual filosofía que en React web.
 * staleTime más corto aquí porque en móvil es más probable
 * que el usuario regrese a la app después de minutos/horas
 * y queremos datos frescos del estado de asistencia.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos
      retry: 1,
    },
  },
})

/**
 * RootLayout — punto de entrada de toda la navegación (Expo Router).
 *
 * Responsabilidades:
 *  1. Restaurar la sesión guardada en SecureStore al abrir la app
 *  2. Proveer QueryClient a todas las pantallas
 *  3. Definir el stack de navegación raíz
 */
export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="bind" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="biometric-setup" />
          <Stack.Screen name="(app)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
