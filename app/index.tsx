import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import useAuthStore from '../src/store/authStore'

/**
 * Pantalla raíz "/" — no muestra UI propia, solo decide
 * a dónde navegar según el estado de la sesión:
 *
 *   - isLoading=true           → muestra spinner mientras se restaura
 *   - sin token                → /bind (vincular dispositivo)
 *   - con token, sin privacy   → /privacy (aceptar aviso)
 *   - con token, con privacy   → /(app)/home (pantalla principal)
 */
export default function Index() {
  const { employee, token, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return // esperar a que termine de restaurar

    if (!token || !employee) {
      router.replace('/bind')
      return
    }

    if (!employee.privacy_accepted) {
      router.replace('/privacy')
      return
    }

    router.replace('/(app)/home')
  }, [isLoading, token, employee])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3A5F" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
})
