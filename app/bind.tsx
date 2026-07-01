import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { bindDevice } from '../src/api/bind'
import { getDeviceInfo } from '../src/utils/device'
import useAuthStore from '../src/store/authStore'
//import { Ionicons } from '@expo/vector-icons'
import { Image } from 'react-native';
const logoBetaCheck = require('../assets/images/Logo-betachecksinfondo.png');

/**
 * BindScreen — Pantalla de vinculación del dispositivo.
 *
 * Flujo:
 *  1. Empleado ingresa el código de 8 caracteres que le dio su admin
 *  2. Recolectamos info del dispositivo (device_uuid, os, etc.)
 *  3. POST /mobile/bind
 *  4. Si OK → guardamos token + employee en el store (SecureStore)
 *  5. Navegamos a /privacy si no ha aceptado el aviso, o a /(app)/home
 */
export default function BindScreen() {
  const [code, setCode]   = useState('')
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore((state) => state.login)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const deviceInfo = await getDeviceInfo()
      return bindDevice(code.trim().toUpperCase(), deviceInfo)
    },
    onSuccess: async (data) => {
      await login(data.employee, data.token)

      if (!data.employee.privacy_accepted) {
        router.replace('/privacy')
      } else {
        router.replace('/(app)/home')
      }
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message ??
        'No se pudo vincular el dispositivo. Verifica tu conexión.'
      setError(message)
    },
  })

  const handleSubmit = () => {
    setError(null)

    if (code.trim().length !== 8) {
      setError('El código debe tener exactamente 8 caracteres.')
      return
    }

    mutate()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View>
            <Image source={logoBetaCheck} style={{width: 90, height: 90}} />
          </View>
          <Text style={styles.title}>BetaCheck</Text>
          <Text style={styles.subtitle}>
            Ingresa el código que te proporcionó tu empresa
          </Text>
        </View>

        {/* Input del código */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Código de vinculación</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase())
              if (error) setError(null)
            }}
            placeholder="ABCD1234"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            editable={!isPending}
          />

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (isPending || code.length !== 8) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isPending || code.length !== 8}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Vincular dispositivo</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Si no tienes un código, solicítalo a tu administrador de RH.
        </Text>

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#111827',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
  },
})
