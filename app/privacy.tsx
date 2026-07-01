import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { Image } from 'react-native';
const logoBetaCheck = require('../assets/images/Logo-betachecksinfondo.png');

export default function PrivacyScreen() {
  const handleAcceptPrivacy = () => {
    // Aquí puedes manejar la aceptación de la política de privacidad
    // Por ejemplo, actualizar el estado del usuario en tu store o backend
    console.log('Política de privacidad aceptada')
    router.replace('/(app)/home')
  }
  return (

    
      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View>
            <Image source={logoBetaCheck} style={{width: 90, height: 90}} />
          </View>
          <Text style={styles.title}>Politica de Privacidad</Text>
          
          <Text style={styles.subtitle}>
            Esta es la política de privacidad de nuestra aplicación. Al utilizar nuestra aplicación, aceptas los términos y condiciones establecidos en esta política. Nos comprometemos a proteger tu información personal y a garantizar que se maneje de manera segura y responsable.
          </Text>
         
        </View>

        {/* Input del código */}
        <View style={styles.formContainer}>
           <Text style={styles.subtitle}>
            Al aceptar, confirmas que has leído y comprendido nuestra política de privacidad.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleAcceptPrivacy}
          >
              <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
