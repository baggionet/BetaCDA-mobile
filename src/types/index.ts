/**
 * Tipos compartidos en toda la app.
 * Reflejan la estructura de los Resources de Laravel.
 */

export type EventType =
  | 'start_work'
  | 'start_lunch'
  | 'end_lunch'
  | 'end_work'
  | 'start_overtime'
  | 'end_overtime'

export type VerificationMethod = 'biometric' | 'pin_fallback'

export interface Employee {
  id: number
  full_name: string
  position: string
  privacy_accepted: boolean
}

export interface AttendanceLog {
  event_type: EventType
  event_label: string
  registered_at: string
  verification_method: VerificationMethod
}

export interface BindResponse {
  token: string
  expires_at: string
  employee: Employee
}

export interface StatusResponse {
  employee: Employee
  current_status: string
  last_event: AttendanceLog | null
  available_actions: EventType[]
  server_time: string
  server_timezone: string
}

export interface CheckResponse {
  log: AttendanceLog
  employee_name: string
  server_time: string
  available_actions: EventType[]
  shift_complete: boolean
}

export interface HistoryDay {
  date: string
  events: AttendanceLog[]
}

export interface HistoryResponse {
  days: number
  history: HistoryDay[]
}

/**
 * Estructura estándar de respuesta de tu API Laravel.
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors: Record<string, string[]> | { subscription?: string } | null
}

/**
 * Información del dispositivo recolectada para bind y check.
 */
export interface DeviceInfo {
  device_uuid: string
  device_name: string
  device_os: 'ios' | 'android'
  os_version: string
  app_version: string
}
