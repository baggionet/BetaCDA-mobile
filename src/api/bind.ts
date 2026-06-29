import api from './axios'
import type { ApiResponse, BindResponse, DeviceInfo } from '../types'

/**
 * POST /api/v1/mobile/bind
 * Vincula el dispositivo con el código proporcionado por el admin.
 */
export const bindDevice = async (
  bindingCode: string,
  deviceInfo: DeviceInfo
): Promise<BindResponse> => {
  const response = await api.post<ApiResponse<BindResponse>>('/mobile/bind', {
    binding_code: bindingCode,
    ...deviceInfo,
  })

  if (!response.data.data) {
    throw new Error(response.data.message)
  }

  return response.data.data
}

/**
 * POST /api/v1/mobile/accept-privacy
 * Requiere estar autenticado (token ya en SecureStore).
 */
export const acceptPrivacy = async (): Promise<void> => {
  await api.post('/mobile/accept-privacy')
}
