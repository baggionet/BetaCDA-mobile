import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native'
import { router } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'

const PIN_KEY = 'fallback_pin'
type Step = 'detecting' | 'biometric' | 'pin_setup' | 'pin_confirm'

export default function BiometricSetupScreen() {
  const [step,          setStep]          = useState<Step>('detecting')
  const [biometricType, setBiometricType] = useState<string>('')
  const [pin,           setPin]           = useState('')
  const [pinConfirm,    setPinConfirm]    = useState('')
  const [isLoading,     setIsLoading]     = useState(false)

  useEffect(() => { detectBiometrics() }, [])

  const detectBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled  = await LocalAuthentication.isEnrolledAsync()
    const types       = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (hasHardware && isEnrolled) {
      const isFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      setBiometricType(isFaceId ? 'Face ID' : 'Huella digital')
      setStep('biometric')
    } else {
      setStep('pin_setup')
    }
  }

  const handleTestBiometric = async () => {
    setIsLoading(true)
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirma con ${biometricType}`,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN',
      })
      if (result.success) {
        await SecureStore.setItemAsync('auth_method', 'biometric')
        router.replace('/(app)/home')
      } else if (result.error === 'user_fallback') {
        setStep('pin_setup')
      } else {
        Alert.alert('Intenta de nuevo', 'No se pudo verificar tu identidad.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSetup = () => {
    if (pin.length !== 6) { Alert.alert('PIN inválido', 'El PIN debe tener 6 dígitos.'); return }
    setPinConfirm('')
    setStep('pin_confirm')
  }

  const handlePinConfirm = async () => {
    if (pinConfirm !== pin) { Alert.alert('Error', 'Los PINs no coinciden.'); setPinConfirm(''); return }
    setIsLoading(true)
    try {
      await SecureStore.setItemAsync(PIN_KEY, pin)
      await SecureStore.setItemAsync('auth_method', 'pin')
      router.replace('/(app)/home')
    } finally { setIsLoading(false) }
  }

  if (step === 'detecting') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.detectingText}>Detectando biometría...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {step === 'biometric' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                size={52} color="#1E3A5F"
              />
            </View>
            <Text style={styles.title}>Configura {biometricType}</Text>
            <Text style={styles.subtitle}>
              Usa {biometricType} para registrar tu asistencia de forma rápida y segura.
            </Text>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleTestBiometric} disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.buttonText}>Probar {biometricType}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('pin_setup')}>
              <Text style={styles.linkText}>Prefiero usar un PIN numérico</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'pin_setup' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="keypad-outline" size={52} color="#1E3A5F" />
            </View>
            <Text style={styles.title}>Crea tu PIN</Text>
            <Text style={styles.subtitle}>
              Ingresa un PIN de 6 dígitos para verificar tu identidad en cada chequeo.
            </Text>
            <TextInput
              style={styles.pinInput} value={pin} onChangeText={setPin}
              placeholder="••••••" placeholderTextColor="#9CA3AF"
              keyboardType="numeric" secureTextEntry maxLength={6} textAlign="center"
            />
            <TouchableOpacity
              style={[styles.button, pin.length !== 6 && styles.buttonDisabled]}
              onPress={handlePinSetup} disabled={pin.length !== 6}
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'pin_confirm' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={52} color="#1E3A5F" />
            </View>
            <Text style={styles.title}>Confirma tu PIN</Text>
            <Text style={styles.subtitle}>Ingresa el mismo PIN nuevamente.</Text>
            <TextInput
              style={styles.pinInput} value={pinConfirm} onChangeText={setPinConfirm}
              placeholder="••••••" placeholderTextColor="#9CA3AF"
              keyboardType="numeric" secureTextEntry maxLength={6} textAlign="center"
            />
            <TouchableOpacity
              style={[styles.button, (pinConfirm.length !== 6 || isLoading) && styles.buttonDisabled]}
              onPress={handlePinConfirm} disabled={pinConfirm.length !== 6 || isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Confirmar PIN</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPin(''); setPinConfirm(''); setStep('pin_setup') }}>
              <Text style={styles.linkText}>Cambiar PIN</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  detectingText:  { color: '#6B7280', fontSize: 14 },
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  content:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  iconContainer:  { width: 96, height: 96, borderRadius: 24, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  title:          { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle:       { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  pinInput:       { borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, fontSize: 24, fontWeight: '700', letterSpacing: 8, width: '100%', color: '#111827' },
  button:         { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', width: '100%' },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkText:       { color: '#2563EB', fontSize: 14, marginTop: 8 },
})
