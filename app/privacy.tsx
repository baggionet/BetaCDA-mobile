import React, { useState } from 'react';
import useAuthStore from '../src/store/authStore';
import { StyleSheet, Text, View, Button, ActivityIndicator, Alert, TouchableOpacity} from 'react-native';
import { router } from 'expo-router'
import { Image } from 'react-native';
// Importamos la función que me mostraste en tu primera pregunta
import {acceptPrivacy} from '../src/api/bind'; 
const logoBetaCheck = require('../assets/images/Logo-betachecksinfondo.png');

export default function PrivacyScreen({ navigation }: any) {
  // Estado para saber si la petición está en curso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateEmployee = useAuthStore((state) => state.updateEmployee)

  const handleAccept = async () => {
    setIsSubmitting(true); // Desactivamos el botón / mostramos spinner

    try {
      // Ejecutamos la función que conecta con el backend
      await acceptPrivacy();

      // Actualizar el store en memoria y SecureStore
      updateEmployee({ privacy_accepted: true })
       
      // Si el backend responde con éxito (tanto si es nuevo como si ya existía):
      Alert.alert("¡Éxito!", "Aviso de Privacidad actualizado correctamente.");
      
      // Aquí usualmente rediriges al usuario al Home o la siguiente pantalla
      router.replace('/(app)/home')
      
    } catch (error) {
      // Si el servidor falla (ej. error de red, token expirado, etc.)
      console.error(error);
      Alert.alert(
        "Error", 
        "No se pudo registrar tu aceptación. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false); // Volvemos a activar el flujo
    }
  };

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

      {isSubmitting ? (
        // Si está cargando, mostramos un spinner
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        // Si no está cargando, mostramos el botón
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            Al aceptar, confirmas que has leído y comprendido nuestra política de privacidad.
          </Text>
            <TouchableOpacity style={styles.button} onPress={handleAccept} disabled={isSubmitting}>
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
      )}
    </View>
  );
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
