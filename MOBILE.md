# AttendanceSaaS — Documentación App Móvil

**Stack:** React Native + Expo SDK 56 + TypeScript  
**Plataformas:** iOS y Android  
**Navegación:** Expo Router (basado en archivos)  
**Build:** EAS Build (Expo Application Services)  
**Autenticación:** Bearer Token cifrado en expo-secure-store  

---

## Índice

1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Requisitos e Instalación](#2-requisitos-e-instalación)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Development Build con EAS](#4-development-build-con-eas)
5. [Configuración — app.json](#5-configuración--appjson)
6. [Arquitectura y Navegación](#6-arquitectura-y-navegación)
7. [Flujo Completo del Usuario](#7-flujo-completo-del-usuario)
8. [Pantallas](#8-pantallas)
9. [Estado Global — authStore.ts](#9-estado-global--authstorets)
10. [Cliente HTTP — axios.ts](#10-cliente-http--axists)
11. [Funciones de API](#11-funciones-de-api)
12. [Biometría y PIN](#12-biometría-y-pin)
13. [Identificación del Dispositivo](#13-identificación-del-dispositivo)
14. [Tipos TypeScript](#14-tipos-typescript)
15. [Componentes UI](#15-componentes-ui)
16. [Diferencias iOS vs Android](#16-diferencias-ios-vs-android)
17. [Build y Publicación](#17-build-y-publicación)

---

## 1. Estructura del Proyecto

```
attendance-mobile/
├── app/                               ← Rutas (Expo Router — basado en archivos)
│   ├── _layout.tsx                    ← Layout raíz: QueryClient + restaurar sesión
│   ├── index.tsx                      ← Router lógico: decide a dónde navegar
│   ├── bind.tsx                       ← Vinculación de dispositivo (primera pantalla)
│   ├── privacy.tsx                    ← Aviso de privacidad (LFPDPPP)
│   ├── biometric-setup.tsx            ← Configurar biometría o PIN (una sola vez)
│   └── (app)/                         ← Grupo de rutas autenticadas
│       ├── _layout.tsx                ← Layout con header de navegación
│       ├── home.tsx                   ← Pantalla principal de chequeo
│       └── history.tsx                ← Historial de asistencia
│
├── src/
│   ├── api/
│   │   ├── axios.ts                   ← Cliente HTTP con SecureStore interceptor
│   │   ├── bind.ts                    ← bindDevice, acceptPrivacy
│   │   └── check.ts                   ← getStatus, checkIn, getHistory
│   │
│   ├── components/
│   │   └── ui/
│   │       └── PinModal.tsx           ← Modal de PIN cross-platform (iOS + Android)
│   │
│   ├── store/
│   │   └── authStore.ts               ← Estado global: Zustand + SecureStore
│   │
│   ├── types/
│   │   └── index.ts                   ← Tipos TypeScript compartidos
│   │
│   └── utils/
│       └── device.ts                  ← device_uuid, device_name, os, versión
│
├── assets/                            ← Imágenes, íconos, splash screen
├── .env                               ← Variables de entorno (no commitear)
├── .env.example                       ← Plantilla de variables
├── .npmrc                             ← legacy-peer-deps=true (Expo SDK 56)
├── app.json                           ← Configuración de Expo
├── eas.json                           ← Configuración de EAS Build
└── package.json
```

---

## 2. Requisitos e Instalación

### Requisitos del sistema

| Herramienta | Versión mínima | Instalación |
|-------------|----------------|-------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Incluido con Node.js |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Xcode | 15+ | Solo Mac — Mac App Store |
| Android Studio | Latest | Solo para emulador Android |

### Instalación

```bash
git clone https://github.com/tu-usuario/attendance-mobile.git
cd attendance-mobile
npm install
```

### Dependencias principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `expo` | ~56.0.12 | Framework base |
| `expo-router` | ~56.2.11 | Navegación basada en archivos |
| `expo-local-authentication` | latest | Biometría nativa (Face ID / Huella) |
| `expo-secure-store` | latest | Almacenamiento cifrado del token |
| `expo-device` | latest | Modelo y OS del dispositivo |
| `expo-application` | latest | Versión de la app instalada |
| `expo-constants` | latest | Variables de entorno y constantes |
| `react-native-safe-area-context` | latest | Márgenes seguros en notch/isla |
| `react-native-screens` | latest | Optimización de pantallas nativas |
| `axios` | latest | Cliente HTTP |
| `zustand` | latest | Estado global |
| `@tanstack/react-query` | latest | Cache y sincronización de datos |
| `@expo/vector-icons` | latest | Íconos (Ionicons) |

### Archivo `.npmrc` requerido

Expo SDK 56 tiene conflictos de peer dependencies con npm. El archivo `.npmrc` en la raíz resuelve esto:

```
legacy-peer-deps=true
```

Sin este archivo, `npm install` falla con `ERESOLVE`.

---

## 3. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=http://betacda.test/api/v1
```

> Las variables deben comenzar con `EXPO_PUBLIC_` para ser accesibles en el código desde `process.env.EXPO_PUBLIC_*`.

### URL según entorno de prueba

| Entorno | URL recomendada |
|---------|----------------|
| Simulador iOS (Mac con Herd) | `http://betacda.test/api/v1` |
| Simulador iOS (sin Herd) | `http://localhost:8000/api/v1` |
| Emulador Android Studio | `http://10.0.2.2/api/v1` |
| Dispositivo físico en WiFi | `http://192.168.X.X/api/v1` |
| Producción | `https://tu-url.railway.app/api/v1` |

**Obtener la IP local en Mac:**
```bash
ipconfig getifaddr en0
```

> ⚠️ El simulador iOS comparte la red del Mac — puede usar `localhost` o dominios `.test` de Herd directamente.  
> ⚠️ El emulador Android NO puede resolver `localhost` del Mac — usa `10.0.2.2` o la IP local.  
> ⚠️ Reinicia Expo después de modificar `.env`: `npx expo start --clear`

---

## 4. Development Build con EAS

La app **no puede correr en Expo Go** porque usa `expo-local-authentication` para biometría nativa, que requiere código nativo no incluido en Expo Go.

### Primera configuración

```bash
# 1. Iniciar sesión en Expo
eas login

# 2. Configurar el proyecto (genera/actualiza eas.json)
eas build:configure

# 3. Build para simulador iOS (sin Apple Developer Account)
eas build --profile development --platform ios

# 4. Build para emulador Android
eas build --profile development --platform android
```

### Configuración `eas.json`

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Correr el servidor de desarrollo

```bash
npx expo start --clear
```

Después de iniciar:
- Presiona `i` → abre en simulador iOS
- Presiona `a` → abre en emulador Android
- Escanea el QR → abre en dispositivo físico con el Development Build instalado

---

## 5. Configuración — `app.json`

```json
{
  "expo": {
    "name": "AttendanceSaaS",
    "slug": "attendance-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.attendancesaas.mobile",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Usamos Face ID para confirmar tu identidad al registrar tu asistencia."
      }
    },
    "android": {
      "package": "com.attendancesaas.mobile",
      "permissions": [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Usamos Face ID para confirmar tu identidad al registrar tu asistencia."
        }
      ]
    ],
    "scheme": "attendancesaas"
  }
}
```

**Permisos declarados:**

| Plataforma | Permiso | Propósito |
|------------|---------|-----------|
| iOS | `NSFaceIDUsageDescription` | Face ID al registrar asistencia |
| Android | `USE_BIOMETRIC` | Huella digital |
| Android | `USE_FINGERPRINT` | Compatibilidad con Android < 9 |

---

## 6. Arquitectura y Navegación

Expo Router mapea la estructura de archivos en `app/` a rutas de navegación automáticamente, similar a Next.js.

### Árbol de navegación

```
/ (app/index.tsx — router lógico, sin UI)
 │
 ├── /bind                ← Sin sesión (primer uso)
 ├── /privacy             ← Con sesión, sin aviso de privacidad
 ├── /biometric-setup     ← Primera configuración de seguridad
 │
 └── /(app)/              ← Grupo autenticado (token + privacidad OK)
     ├── home             ← Pantalla principal de chequeo
     └── history          ← Historial de asistencia
```

### Lógica de enrutamiento en `index.tsx`

```typescript
useEffect(() => {
  if (isLoading) return  // Esperar a que SecureStore restaure la sesión

  if (!token || !employee) {
    router.replace('/bind')       // Sin sesión → vincular
    return
  }

  if (!employee.privacy_accepted) {
    router.replace('/privacy')    // Sin aviso aceptado → privacy
    return
  }

  router.replace('/(app)/home')   // Todo OK → pantalla principal
}, [isLoading, token, employee])
```

### Stack del grupo `(app)/`

El layout `app/(app)/_layout.tsx` configura la navegación interna:

- `home` → sin header nativo (el diseño tiene su propio header)
- `history` → con header nativo: título "Mi historial" + botón de regreso

---

## 7. Flujo Completo del Usuario

### Primera vez (instalación nueva)

```
Instalar app
    │
    ▼
/bind — Ingresar código de 8 caracteres
    │
    │  POST /mobile/bind
    │  ← { token, employee, expires_at }
    │
    ▼
Guardar token + employee en SecureStore
    │
    ▼
/privacy — Leer y aceptar Aviso de Privacidad
    │
    │  POST /mobile/accept-privacy
    │  updateEmployee({ privacy_accepted: true })
    │
    ▼
Verificar si auth_method existe en SecureStore
    │
    ├── No existe → /biometric-setup
    │
    └── Ya existe → /(app)/home
```

### Configuración biométrica (solo primera vez)

```
/biometric-setup
    │
    ▼
Detectar hardware biométrico
    │
    ├── Face ID disponible y enrollado
    │       → Paso "biometric"
    │       → Prueba Face ID
    │       → Si éxito: SecureStore.set('auth_method', 'biometric')
    │       → /(app)/home
    │
    ├── Huella disponible y enrollada
    │       → Mismo flujo que Face ID
    │
    └── Sin biometría
            → Paso "pin_setup"
            → Ingresar PIN de 6 dígitos
            → Confirmar PIN
            → SecureStore.set('fallback_pin', pin)
            → SecureStore.set('auth_method', 'pin')
            → /(app)/home
```

### Uso diario

```
Abrir app
    │
    ▼
index.tsx lee SecureStore
    │
    ▼ (token + privacidad OK)
    │
/(app)/home
    │
    ▼
GET /mobile/status ──► Estado actual + acciones disponibles
    │
    ▼
Empleado toca una acción (ej: "Iniciar labores")
    │
    ▼
verifyIdentity()
    │
    ├── auth_method = "biometric"
    │       └── LocalAuthentication.authenticateAsync()
    │               ├── success → verification_method = "biometric"
    │               └── user_fallback → PinModal
    │
    └── auth_method = "pin"
            └── PinModal → comparar con SecureStore
    │
    ▼
POST /mobile/check
    │
    ├── 200 OK → Alert "✓ Registro exitoso" + refetch status
    ├── 402   → Alert "Suscripción inactiva"
    ├── 403   → Alert "Acceso denegado"
    └── Error → Alert "Error al registrar"
```

### Apertura con sesión activa (regresa a la app)

```
Abrir app
    │
    ▼
_layout.tsx → restoreSession() → Lee SecureStore
    │
    ▼
index.tsx → token ✅ + privacy ✅
    │
    ▼
/(app)/home → Listo para checar
```

---

## 8. Pantallas

### `app/bind.tsx` — Vinculación de dispositivo

**Propósito:** Primera pantalla para empleados nuevos. Conecta el dispositivo con el sistema usando el código proporcionado por el administrador.

**Comportamiento del input:**
- Auto-capitalización: el código se convierte a mayúsculas automáticamente al escribir
- El botón "Vincular" se habilita solo cuando hay exactamente 8 caracteres
- Limpia el error al empezar a escribir de nuevo

**Datos enviados a la API (`POST /mobile/bind`):**

| Campo | Origen en la app |
|-------|-----------------|
| `binding_code` | Input del usuario (8 chars, mayúsculas) |
| `device_uuid` | Generado y persistido en SecureStore (`device.ts`) |
| `device_name` | `Device.modelName` de expo-device |
| `device_os` | `Platform.OS` (`ios` o `android`) |
| `os_version` | `Device.osVersion` |
| `app_version` | `Application.nativeApplicationVersion` |

**Errores manejados:**

| Error API | Mensaje mostrado |
|-----------|-----------------|
| `422` | Mensaje del servidor (código inválido, expirado, etc.) |
| `409` | "Este dispositivo ya está vinculado a otra cuenta." |
| Sin red | "No se pudo vincular el dispositivo. Verifica tu conexión." |

---

### `app/privacy.tsx` — Aviso de Privacidad

**Propósito:** Cumplimiento legal (LFPDPPP — Ley Federal de Protección de Datos Personales). El empleado debe aceptar antes de usar la app.

**Lo que sucede al tocar "Aceptar":**

```typescript
const handleAccept = async () => {
  setIsSubmitting(true)
  try {
    await acceptPrivacy()                           // POST /mobile/accept-privacy

    updateEmployee({ privacy_accepted: true })      // Actualizar store + SecureStore

    const authMethod = await SecureStore.getItemAsync('auth_method')
    if (!authMethod) {
      router.replace('/biometric-setup')            // Primera vez → configurar
    } else {
      router.replace('/(app)/home')                 // Ya configurado → home
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo registrar tu aceptación.')
  } finally {
    setIsSubmitting(false)
  }
}
```

> ⚠️ **Bug común:** Si no se llama a `updateEmployee({ privacy_accepted: true })`, al cerrar y reabrir la app el store seguirá teniendo `privacy_accepted: false` y el usuario volverá siempre a esta pantalla.

---

### `app/biometric-setup.tsx` — Configuración de Seguridad

**Propósito:** Configurar el método de verificación de identidad. Se ejecuta **una sola vez** después de aceptar el aviso de privacidad.

**Pasos del formulario:**

| Paso (`Step`) | UI | Condición |
|---------------|----|-----------| 
| `detecting` | Spinner | Al montar la pantalla |
| `biometric` | Botón "Probar {tipo}" | `hasHardware && isEnrolled` |
| `pin_setup` | Input PIN 6 dígitos | Sin biometría disponible, o usuario prefirió PIN |
| `pin_confirm` | Input repetir PIN | Después de `pin_setup` |

**Detección de biometría:**

```typescript
const detectBiometrics = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled  = await LocalAuthentication.isEnrolledAsync()
  const types       = await LocalAuthentication.supportedAuthenticationTypesAsync()

  if (hasHardware && isEnrolled) {
    const isFaceId = types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    )
    setBiometricType(isFaceId ? 'Face ID' : 'Huella digital')
    setStep('biometric')
  } else {
    setStep('pin_setup')  // Sin biometría → directo a PIN
  }
}
```

**Datos guardados en SecureStore:**

| Clave | Valor | Cuándo |
|-------|-------|--------|
| `auth_method` | `'biometric'` | Si usa Face ID o Huella |
| `auth_method` | `'pin'` | Si usa PIN |
| `fallback_pin` | `'123456'` (ejemplo) | Solo si eligió PIN |

---

### `app/(app)/home.tsx` — Pantalla Principal de Chequeo

**Propósito:** Pantalla de uso diario. Muestra el estado actual del empleado y permite registrar eventos de asistencia con verificación biométrica o PIN.

**Datos consumidos (`GET /mobile/status`):**

| Campo de la API | Uso en UI |
|----------------|-----------|
| `current_status` | Badge de estado con color |
| `last_event.event_label` | Texto descriptivo del último evento |
| `last_event.registered_at` | Hora del último chequeo |
| `available_actions` | Genera los botones de acción disponibles |
| `server_time` | Reloj digital que muestra la hora actual |
| `server_timezone` | Zona horaria para `toLocaleTimeString()` |

**Configuración visual de eventos:**

```typescript
const EVENT_CONFIG: Record<EventType, {...}> = {
  start_work:     { label: 'Iniciar labores',     color: '#16A34A', bg: '#DCFCE7' },
  start_lunch:    { label: 'Salir a comer',        color: '#D97706', bg: '#FEF3C7' },
  end_lunch:      { label: 'Regresar de comida',   color: '#2563EB', bg: '#DBEAFE' },
  end_work:       { label: 'Terminar jornada',     color: '#6B7280', bg: '#F3F4F6' },
  start_overtime: { label: 'Iniciar horas extra',  color: '#7C3AED', bg: '#EDE9FE' },
  end_overtime:   { label: 'Terminar horas extra', color: '#7C3AED', bg: '#EDE9FE' },
}
```

**Auto-refresh del status:**
```typescript
const { data: status, refetch, isRefetching } = useQuery({
  queryKey: ['status'],
  queryFn:  getStatus,
  refetchInterval: 60 * 1000,  // Refresca cada 60 segundos automáticamente
})
```

**Pull-to-refresh:**
```tsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={refetch}
      tintColor="#1E3A5F"
    />
  }
>
```

**Mostrar hora con zona horaria correcta:**
```typescript
new Date(status.server_time).toLocaleTimeString('es-MX', {
  hour:     '2-digit',
  minute:   '2-digit',
  timeZone: status.server_timezone ?? 'America/Mexico_City',
})
```

---

### `app/(app)/history.tsx` — Historial de Asistencia

**Propósito:** Permite al empleado consultar sus registros de los últimos 30 días.

**Estructura de la lista:**

```
SectionList
│
├── Sección: "Hoy" (2026-07-01)
│   ├── [✅ Verde]    Inicio de labores      09:02
│   ├── [🍽️ Ámbar]   Salida a comer         14:00
│   ├── [↩️ Azul]    Regreso de comida      15:02
│   └── [⏹️ Gris]    Fin de jornada         18:05  [8h 1m trabajadas]
│
├── Sección: "Ayer" (2026-06-30)
│   ├── [✅ Verde]    Inicio de labores      09:00
│   └── [⏹️ Gris]    Fin de jornada         18:02  [9h trabajadas]
│
└── Sección: "lunes, 29 de junio"
    └── ...
```

**Formato de fechas:**
```typescript
const formatDate = (dateStr: string): string => {
  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (dateStr === today)     return 'Hoy'
  if (dateStr === yesterday) return 'Ayer'

  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}
```

**Cálculo de horas trabajadas por día (en el frontend):**
```typescript
// Para días con start_work y end_work completos
const mins = (end_work - start_work) - (end_lunch - start_lunch || 0)
const horas = `${Math.floor(mins/60)}h ${mins%60 > 0 ? `${mins%60}m` : ''} trabajadas`
```

---

## 9. Estado Global — `authStore.ts`

El estado de autenticación usa **Zustand** con persistencia manual en **expo-secure-store** (cifrado nativo con Keychain en iOS y Keystore en Android).

### Por qué no usar `AsyncStorage`

| Característica | AsyncStorage | SecureStore |
|----------------|-------------|-------------|
| Cifrado | ❌ Texto plano | ✅ Cifrado nativo |
| iOS backend | SQLite sin cifrar | Keychain |
| Android backend | Archivos del sistema | Keystore |
| Apropiado para tokens | ❌ No | ✅ Sí |

### API del store

```typescript
import useAuthStore from '../src/store/authStore'

// Leer estado
const { employee, token, isLoading } = useAuthStore()

// Verificar sesión
const hasSession = token !== null && employee !== null

// Restaurar sesión (llamar en _layout.tsx al montar)
const restoreSession = useAuthStore(s => s.restoreSession)
useEffect(() => { restoreSession() }, [])

// Después del bind exitoso
const login = useAuthStore(s => s.login)
await login(employee, token)           // Guarda en memoria + SecureStore

// Actualizar datos del empleado (después de aceptar privacidad)
const updateEmployee = useAuthStore(s => s.updateEmployee)
updateEmployee({ privacy_accepted: true })

// Cerrar sesión
const logout = useAuthStore(s => s.logout)
await logout()                          // Borra de memoria + SecureStore
```

### Claves guardadas en SecureStore

| Clave | Contenido | Borrado en |
|-------|-----------|------------|
| `auth_token` | Bearer token de Sanctum | `logout()` / 401 |
| `auth_employee` | JSON del empleado | `logout()` / 401 |
| `device_uuid` | UUID único del dispositivo | Nunca (permanente) |
| `auth_method` | `'biometric'` o `'pin'` | `logout()` |
| `fallback_pin` | PIN de 6 dígitos | `logout()` |

### `isLoading` — evitar parpadeo al abrir la app

```typescript
// En _layout.tsx:
if (isLoading) {
  return <ActivityIndicator />  // Mostrar spinner mientras lee SecureStore
}
// El isLoading pasa a false cuando restoreSession() termina
```

Sin esto, hay un parpadeo donde se muestra `/bind` por un instante aunque el usuario ya tenga sesión.

---

## 10. Cliente HTTP — `axios.ts`

### Configuración base

```typescript
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
  timeout: 15000,  // 15 segundos de timeout
})
```

### Interceptor de request — agrega el token automáticamente

```typescript
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Interceptor de response — maneja expiración del token

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Limpiar credenciales de SecureStore
      await SecureStore.deleteItemAsync('auth_token')
      await SecureStore.deleteItemAsync('auth_employee')
      // La redirección a /bind se maneja en los componentes
      // que detectan token === null en el store
    }
    return Promise.reject(error)
  }
)
```

---

## 11. Funciones de API

### `src/api/bind.ts`

```typescript
// Vincula el dispositivo con el código del admin
bindDevice(bindingCode: string, deviceInfo: DeviceInfo): Promise<BindResponse>

// Acepta el aviso de privacidad
acceptPrivacy(): Promise<void>
```

**Ejemplo de uso:**
```typescript
import { bindDevice } from '../api/bind'
import { getDeviceInfo } from '../utils/device'

const deviceInfo = await getDeviceInfo()
const result = await bindDevice('ABCD1234', deviceInfo)
// result.token, result.employee, result.expires_at
```

### `src/api/check.ts`

```typescript
// Estado actual y acciones disponibles
getStatus(): Promise<StatusResponse>

// Registrar un evento de asistencia
checkIn(params: {
  event_type:          EventType
  device_uuid:         string
  verification_method: VerificationMethod
  latitude?:           number
  longitude?:          number
}): Promise<CheckResponse>

// Historial de los últimos N días agrupado por día
getHistory(days?: number): Promise<HistoryResponse>
```

---

## 12. Biometría y PIN

### Detección de capacidades

```typescript
import * as LocalAuthentication from 'expo-local-authentication'

// ¿Tiene hardware biométrico?
const hasHardware = await LocalAuthentication.hasHardwareAsync()

// ¿Hay huellas/Face ID registrados en el dispositivo?
const isEnrolled = await LocalAuthentication.isEnrolledAsync()

// ¿Qué tipos de biometría soporta?
const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
// AuthenticationType.FINGERPRINT = 1
// AuthenticationType.FACIAL_RECOGNITION = 2
// AuthenticationType.IRIS = 3
```

### Autenticación biométrica

```typescript
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Confirma tu identidad para registrar asistencia',
  cancelLabel:   'Cancelar',
  fallbackLabel: 'Usar PIN',   // Solo visible en iOS
})

switch (result.success) {
  case true:
    // Autenticación exitosa
    break
  case false:
    switch (result.error) {
      case 'user_cancel':    // Usuario canceló
      case 'user_fallback':  // Usuario pidió usar PIN (solo iOS)
      case 'lockout':        // Demasiados intentos fallidos
      case 'not_enrolled':   // No hay biometría configurada
    }
}
```

### `PinModal` — PIN cross-platform

`Alert.prompt` (que muestra un cuadro de texto en una alerta nativa) **solo existe en iOS**. En Android no hace nada.

El componente `PinModal.tsx` reemplaza `Alert.prompt` con un modal React Native propio que funciona igual en ambas plataformas:

```typescript
// Patrón para usar PinModal como promesa (igual que Alert.prompt)
const [pinModalVisible, setPinModalVisible] = useState(false)
const [pinResolver, setPinResolver] = useState<((pin: string | null) => void) | null>(null)

const requestPin = (): Promise<string | null> => {
  return new Promise((resolve) => {
    setPinResolver(() => resolve)
    setPinModalVisible(true)
  })
}

// Cuando el usuario confirma el PIN:
const handlePinConfirm = async (enteredPin: string) => {
  setPinModalVisible(false)
  const savedPin = await SecureStore.getItemAsync('fallback_pin')
  if (enteredPin === savedPin) {
    pinResolver?.('pin_fallback')
  } else {
    Alert.alert('PIN incorrecto', 'El PIN ingresado no es válido.')
    pinResolver?.(null)
  }
  setPinResolver(null)
}
```

```tsx
{/* El modal debe estar FUERA del ScrollView para evitar problemas de z-index */}
<>
  <ScrollView>...</ScrollView>
  <PinModal
    visible={pinModalVisible}
    onConfirm={handlePinConfirm}
    onCancel={handlePinCancel}
  />
</>
```

---

## 13. Identificación del Dispositivo

### Por qué no usar identificadores de hardware

Apple y Google restringen el acceso a identificadores de hardware únicos por razones de privacidad:
- En iOS, `UIDevice.identifierForVendor` cambia si el usuario desinstala y reinstala la app
- En Android, `Settings.Secure.ANDROID_ID` cambia con factory reset

### Estrategia adoptada: UUID generado por la app

```typescript
// src/utils/device.ts
async function getOrCreateDeviceUuid(): Promise<string> {
  let uuid = await SecureStore.getItemAsync('device_uuid')

  if (!uuid) {
    // Primera vez: generar y guardar permanentemente
    uuid = generateUuidV4()
    await SecureStore.setItemAsync('device_uuid', uuid)
  }

  return uuid
}
```

**Comportamiento:**
- ✅ **Estable** mientras la app esté instalada
- ✅ **Único** por instalación de la app
- ❌ Se pierde si el usuario **desinstala** la app → al reinstalar, necesita re-vincular con un nuevo código

Este comportamiento es **intencionado y correcto** — si un empleado borra la app, debe volver a vincular su dispositivo con el sistema, lo que garantiza que el administrador mantenga control sobre qué dispositivos están autorizados.

### Función completa `getDeviceInfo()`

```typescript
export async function getDeviceInfo(): Promise<DeviceInfo> {
  return {
    device_uuid: await getOrCreateDeviceUuid(),
    device_name: Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android'),
    device_os:   Platform.OS === 'ios' ? 'ios' : 'android',
    os_version:  Device.osVersion ?? Platform.Version.toString(),
    app_version: Application.nativeApplicationVersion
                 ?? Constants.expoConfig?.version
                 ?? '1.0.0',
  }
}
```

---

## 14. Tipos TypeScript

**Archivo:** `src/types/index.ts`

```typescript
type EventType =
  | 'start_work' | 'start_lunch' | 'end_lunch'
  | 'end_work'   | 'start_overtime' | 'end_overtime'

type VerificationMethod = 'biometric' | 'pin_fallback'

interface Employee {
  id:               number
  full_name:        string
  position:         string
  privacy_accepted: boolean
}

interface AttendanceLog {
  event_type:          EventType
  event_label:         string
  registered_at:       string    // ISO 8601
  verification_method: VerificationMethod
}

interface BindResponse {
  token:      string
  expires_at: string
  employee:   Employee
}

interface StatusResponse {
  employee:          Employee
  current_status:    string
  last_event:        AttendanceLog | null
  available_actions: EventType[]
  server_time:       string
  server_timezone:   string
}

interface CheckResponse {
  log:               AttendanceLog
  employee_name:     string
  server_time:       string
  available_actions: EventType[]
  shift_complete:    boolean
}

interface HistoryDay {
  date:   string       // YYYY-MM-DD
  events: AttendanceLog[]
}

interface HistoryResponse {
  days:    number
  history: HistoryDay[]
}

interface DeviceInfo {
  device_uuid: string
  device_name: string
  device_os:   'ios' | 'android'
  os_version:  string
  app_version: string
}

// Respuesta estándar de la API
interface ApiResponse<T> {
  success: boolean
  message: string
  data:    T | null
  errors:  Record<string, string[]> | null
}
```

---

## 15. Componentes UI

### `PinModal`

```tsx
import PinModal from '../src/components/ui/PinModal'

<PinModal
  visible={pinModalVisible}
  onConfirm={(pin: string) => handlePinConfirm(pin)}
  onCancel={() => handlePinCancel()}
/>
```

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `visible` | `boolean` | Controla visibilidad del modal |
| `onConfirm` | `(pin: string) => void` | Callback con el PIN ingresado |
| `onCancel` | `() => void` | Callback al cancelar |

**Comportamiento:**
- `autoFocus` en el input — el teclado numérico aparece automáticamente
- El botón "Confirmar" se habilita solo cuando hay exactamente 6 dígitos
- El PIN se limpia al cerrar el modal (éxito o cancelación)
- Overlay semi-transparente con `animationType="fade"`

---

## 16. Diferencias iOS vs Android

| Característica | iOS | Android |
|----------------|-----|---------|
| Tipo de biometría | Face ID / Touch ID | Huella digital |
| `fallbackLabel` en biometría | ✅ Botón visible en diálogo nativo | ❌ No soportado |
| `Alert.prompt` | ✅ Disponible | ❌ No disponible → usar `PinModal` |
| Dominio `.test` (Herd) | ✅ Resuelve en simulador | ❌ No resuelve en emulador |
| URL para `localhost` | `localhost` o IP | `10.0.2.2` |
| Permisos biométría | `NSFaceIDUsageDescription` | `USE_BIOMETRIC` |
| Almacenamiento seguro | Keychain | Keystore |
| Build sin cuenta de pago | ✅ Simulador gratis | ✅ Emulador gratis |

---

## 17. Build y Publicación

### Build de producción

```bash
# iOS (requiere Apple Developer Account — $99 USD/año)
eas build --profile production --platform ios

# Android (requiere Google Play Developer — $25 USD pago único)
eas build --profile production --platform android

# Ambas plataformas simultáneamente
eas build --profile production --platform all
```

### Publicar en tiendas

```bash
# Subir a App Store Connect (iOS)
eas submit --platform ios

# Subir a Google Play Console (Android)
eas submit --platform android
```

### Actualizar la app sin nuevo build (OTA Updates)

Expo permite publicar actualizaciones JavaScript sin pasar por revisión de las tiendas:

```bash
eas update --branch production --message "Fix: corrección de bug en pantalla de chequeo"
```

> ⚠️ Las OTA updates solo funcionan para cambios en código JavaScript/TypeScript.  
> Cambios en permisos, código nativo o `app.json` requieren un nuevo build completo.

### Variables de entorno en producción

Para builds de producción, configura las variables en EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://tu-url.railway.app/api/v1"
```

O en el Dashboard de Expo: `expo.dev → tu proyecto → Secrets`

### Checklist antes de publicar

```
□ APP_ENV configurado correctamente en la API de producción
□ EXPO_PUBLIC_API_URL apunta a la URL de producción (Railway)
□ Webhook de Stripe configurado en el Dashboard de Stripe
□ Íconos y splash screen con las dimensiones correctas
□ Nombre y descripción de la app revisados en app.json
□ Versión incrementada (version en app.json)
□ Probado en dispositivo físico real (no solo simulador/emulador)
□ Probado el flujo completo: bind → privacy → biometric → check → history
□ Probado con PIN cuando la biometría no está disponible
□ Probado el cierre de sesión y re-vinculación
```
