import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import type { DeviceInfo } from '../types'

/**
 * Clave donde persistimos el device_uuid generado localmente.
 *
 * IMPORTANTE: a diferencia de iOS/Android nativos, Expo no expone
 * un identificador de hardware único y persistente directamente
 * (por privacidad, Apple/Google lo restringen). La estrategia
 * correcta es generar un UUID nosotros mismos UNA SOLA VEZ y
 * guardarlo en SecureStore — así se mantiene estable entre
 * sesiones de la app, pero se pierde si el usuario desinstala
 * la app (lo cual es el comportamiento esperado y aceptable
 * para nuestro caso: simplemente tendría que re-vincular).
 */
const DEVICE_UUID_KEY = 'device_uuid'

/**
 * Obtiene (o genera si no existe) el device_uuid persistente.
 */
async function getOrCreateDeviceUuid(): Promise<string> {
  let uuid = await SecureStore.getItemAsync(DEVICE_UUID_KEY)

  if (!uuid) {
    // Generar un UUID v4 simple sin dependencias externas
    uuid = generateUuidV4()
    await SecureStore.setItemAsync(DEVICE_UUID_KEY, uuid)
  }

  return uuid
}

/**
 * Generador de UUID v4 sin librerías externas.
 * Suficientemente único para nuestro propósito (no es criptográfico).
 */
function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Recolecta toda la información del dispositivo necesaria
 * para los endpoints /mobile/bind y /mobile/check.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const device_uuid = await getOrCreateDeviceUuid()

  const device_os: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android'

  const device_name =
    Device.modelName ??
    (Platform.OS === 'ios' ? 'iPhone' : 'Android Device')

  const os_version = Device.osVersion ?? Platform.Version.toString()

  const app_version =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '1.0.0'

  return {
    device_uuid,
    device_name,
    device_os,
    os_version,
    app_version,
  }
}
