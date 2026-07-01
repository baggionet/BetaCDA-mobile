import api from './axios'
import type {
  ApiResponse, StatusResponse, CheckResponse,
  HistoryResponse, EventType, VerificationMethod,
} from '../types'

/**
 * GET /api/v1/mobile/status
 * Estado actual del empleado autenticado.
 */
export const getStatus = async (): Promise<StatusResponse> => {
  const response = await api.get<ApiResponse<StatusResponse>>('/mobile/status')
  if (!response.data.data) throw new Error(response.data.message)
  return response.data.data
}

/**
 * POST /api/v1/mobile/check
 * Registra un evento de asistencia.
 */
export const checkIn = async (
  eventType: EventType,
  deviceUuid: string,
  verificationMethod: VerificationMethod,
  location?: { latitude: number; longitude: number }
): Promise<CheckResponse> => {
  const response = await api.post<ApiResponse<CheckResponse>>('/mobile/check', {
    event_type:          eventType,
    device_uuid:         deviceUuid,
    verification_method: verificationMethod,
    latitude:            location?.latitude,
    longitude:           location?.longitude,
  })
  if (!response.data.data) throw new Error(response.data.message)
  return response.data.data
}

/**
 * GET /api/v1/mobile/history
 * Historial de chequeos del empleado.
 */
export const getHistory = async (days = 30): Promise<HistoryResponse> => {
  const response = await api.get<ApiResponse<HistoryResponse>>('/mobile/history', {
    params: { days },
  })
  if (!response.data.data) throw new Error(response.data.message)
  return response.data.data
}
