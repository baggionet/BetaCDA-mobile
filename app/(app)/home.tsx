import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getStatus, checkIn } from '../../src/api/check'
import { getDeviceInfo } from '../../src/utils/device'
import useAuthStore from '../../src/store/authStore'
import PinModal from '../../src/components/ui/PinModal'
import type { EventType } from '../../src/types'
// se agrega la importación de Location para poder solicitar permisos de ubicación
import * as Location from 'expo-location'

const EVENT_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  start_work:     { label: 'Iniciar labores',     icon: 'log-in-outline',           color: '#16A34A', bg: '#DCFCE7' },
  start_lunch:    { label: 'Salir a comer',        icon: 'restaurant-outline',       color: '#D97706', bg: '#FEF3C7' },
  end_lunch:      { label: 'Regresar de comida',   icon: 'return-down-back-outline', color: '#2563EB', bg: '#DBEAFE' },
  end_work:       { label: 'Terminar jornada',     icon: 'log-out-outline',          color: '#6B7280', bg: '#F3F4F6' },
  start_overtime: { label: 'Iniciar horas extra',  icon: 'time-outline',             color: '#7C3AED', bg: '#EDE9FE' },
  end_overtime:   { label: 'Terminar horas extra', icon: 'stop-circle-outline',      color: '#7C3AED', bg: '#EDE9FE' },
}

const STATUS_COLOR: Record<string, string> = {
  'En oficina':         '#16A34A',
  'En comida':          '#D97706',
  'Horas extra':        '#7C3AED',
  'Jornada completada': '#2563EB',
  'Sin registro hoy':   '#9CA3AF',
}

// ── Componente de botón de acción ─────────────────────────
//function ActionButton({ eventType, onPress, isLoading }: {
//  eventType: EventType; onPress: (e: EventType) => void; isLoading: boolean
//}) {
//  const config = EVENT_CONFIG[eventType]
//  return (
//    <TouchableOpacity
//      style={[styles.actionButton, { backgroundColor: config.bg }, isLoading && styles.buttonDisabled]}
//      onPress={() => onPress(eventType)} disabled={isLoading}
//    >
//      <Ionicons name={config.icon as any} size={28} color={config.color} />
//      <Text style={[styles.actionLabel, { color: config.color }]}>{config.label}</Text>
//      {isLoading && <ActivityIndicator size="small" color={config.color} />}
//    </TouchableOpacity>
//  )
//}
// ── Componente de botón de acción  mejorado─────────────────────────
function ActionButton({ eventType, onPress, isLoading, disabled, disabledReason }: {
  eventType: EventType
  onPress: (e: EventType) => void
  isLoading: boolean
  disabled?: boolean
  disabledReason?: string
}) {
  const config = EVENT_CONFIG[eventType]
  const isDisabled = isLoading || disabled

  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: config.bg }, isDisabled && styles.buttonDisabled]}
      onPress={() => !isDisabled && onPress(eventType)}
      disabled={isDisabled}
    >
      <Ionicons name={config.icon as any} size={28} color={isDisabled ? '#9CA3AF' : config.color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: isDisabled ? '#9CA3AF' : config.color }]}>
          {config.label}
        </Text>
        {disabled && disabledReason && (
          <Text style={styles.actionSubLabel}>{disabledReason}</Text>
        )}
      </View>
      {isLoading && <ActivityIndicator size="small" color={config.color} />}
      {disabled && !isLoading && (
        <Ionicons name="lock-closed-outline" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  )
}

// ── Componente de tarjeta de horario ───────────────────────
function ScheduleCard({ schedule, punctuality, timezone }: {
  schedule: any
  punctuality: any
  timezone: string
}) {
  if (!schedule) return null

  // Si hoy es día de descanso
  if (!schedule.is_working_day) {
    return (
      <View style={schedStyles.card}>
        <Text style={schedStyles.label}>HORARIO DE HOY</Text>
        <View style={schedStyles.restRow}>
          <Ionicons name="moon-outline" size={18} color="#9CA3AF" />
          <Text style={schedStyles.restText}>Día de descanso</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={schedStyles.card}>
      <View style={schedStyles.cardHeader}>
        <Text style={schedStyles.label}>HORARIO DE HOY</Text>
        {/* Badge de puntualidad — solo si ya checó entrada */}
        {punctuality && (
          punctuality.is_late ? (
            <View style={schedStyles.badgeLate}>
              <Ionicons name="warning-outline" size={12} color="#B45309" />
              <Text style={schedStyles.badgeLateText}>
                {punctuality.late_minutes} min tarde
              </Text>
            </View>
          ) : (
            <View style={schedStyles.badgeOnTime}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#15803D" />
              <Text style={schedStyles.badgeOnTimeText}>A tiempo</Text>
            </View>
          )
        )}
      </View>

      {/* Horario */}
      <View style={schedStyles.timesRow}>
        <View style={schedStyles.timeBlock}>
          <Ionicons name="log-in-outline" size={16} color="#6B7280" />
          <Text style={schedStyles.timeValue}>{schedule.start_time}</Text>
          <Text style={schedStyles.timeLabel}>Entrada</Text>
        </View>
        <View style={schedStyles.timeSep} />
        <View style={schedStyles.timeBlock}>
          <Ionicons name="log-out-outline" size={16} color="#6B7280" />
          <Text style={schedStyles.timeValue}>{schedule.end_time}</Text>
          <Text style={schedStyles.timeLabel}>Salida</Text>
        </View>
        {schedule.tolerance_minutes > 0 && (
          <>
            <View style={schedStyles.timeSep} />
            <View style={schedStyles.timeBlock}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={schedStyles.timeValue}>{schedule.tolerance_minutes}'</Text>
              <Text style={schedStyles.timeLabel}>Tolerancia</Text>
            </View>
          </>
        )}
      </View>

      {/* Nombre del horario y hora de chequeo si ya entró */}
      <View style={schedStyles.cardFooter}>
        {schedule.schedule_name && (
          <Text style={schedStyles.scheduleName}>{schedule.schedule_name}</Text>
        )}
        {punctuality?.checked_in_at && (
          <Text style={schedStyles.checkedIn}>
            Entrada registrada: {punctuality.checked_in_at}
          </Text>
        )}
      </View>
    </View>
  )
}

const schedStyles = StyleSheet.create({
  card:            { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:           { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.8 },
  restRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  restText:        { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
  timesRow:        { flexDirection: 'row', alignItems: 'center', gap: 0 },
  timeBlock:       { flex: 1, alignItems: 'center', gap: 4 },
  timeValue:       { fontSize: 20, fontWeight: '700', color: '#111827' },
  timeLabel:       { fontSize: 11, color: '#9CA3AF' },
  timeSep:         { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  scheduleName:    { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  checkedIn:       { fontSize: 12, color: '#6B7280' },
  badgeLate:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#FCD34D' },
  badgeLateText:   { fontSize: 12, color: '#B45309', fontWeight: '600' },
  badgeOnTime:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC' },
  badgeOnTimeText: { fontSize: 12, color: '#15803D', fontWeight: '600' },
})

/**
 * Determina si un botón de evento está habilitado según el horario del día.
 * Retorna { allowed: boolean; reason?: string }
 */
function isActionAllowed(
  eventType: EventType,
  schedule: any | null,
  serverTime: string | null,
  timezone: string
): { allowed: boolean; reason?: string } {
  // Sin horario asignado → todo permitido (comportamiento anterior)
  if (!schedule || !schedule.is_working_day) return { allowed: true }
  // Sin hora del servidor → no bloquear
  if (!serverTime) return { allowed: true }

  // Hora actual en minutos desde medianoche (usando server_time)
  const now = new Date(serverTime)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const toMin = (hhmm: string | null): number | null => {
    if (!hhmm) return null
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }

  const startMin      = toMin(schedule.start_time)
  const endMin        = toMin(schedule.end_time)
  const tolerance     = schedule.tolerance_minutes ?? 0
  const EARLY_WINDOW  = 30  // minutos antes de start_time que ya se habilita el botón
  const END_WINDOW    = 60  // minutos antes de end_time que se habilita "Terminar jornada"

  if (eventType === 'start_work') {
    if (startMin === null) return { allowed: true }
    const openAt  = startMin - EARLY_WINDOW
    const closeAt = startMin + tolerance
    if (nowMin < openAt)  return { allowed: false, reason: `Disponible a las ${schedule.start_time}` }
    if (nowMin > closeAt) return { allowed: false, reason: 'Ventana de entrada cerrada' }
    return { allowed: true }
  }

  if (eventType === 'end_work') {
    if (endMin === null) return { allowed: true }
    const openAt = endMin - END_WINDOW
    if (nowMin < openAt) return { allowed: false, reason: `Disponible aprox. a las ${schedule.end_time}` }
    return { allowed: true }
  }

  // start_lunch, end_lunch, start_overtime, end_overtime → sin restricción de horario
  return { allowed: true }
}

// ── Componente principal de la pantalla de inicio ─────────────

export default function HomeScreen() {
  const queryClient = useQueryClient()
  const { employee, logout } = useAuthStore()

  const [processingEvent, setProcessingEvent] = useState<EventType | null>(null)

  // ── Estado del modal de PIN ────────────────────────────────
  const [pinModalVisible, setPinModalVisible] = useState(false)
  // Resolver la promesa del PIN desde fuera del modal
  const [pinResolver, setPinResolver] = useState<((pin: string | null) => void) | null>(null)

  const { data: status, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['status'],
    queryFn: getStatus,
    refetchInterval: 60 * 1000,
  })

  const { mutateAsync: doCheckIn } = useMutation({
    mutationFn: checkIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status'] }),
  })

  // ── Mostrar modal PIN y esperar respuesta ─────────────────
  const requestPin = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      setPinResolver(() => resolve)
      setPinModalVisible(true)
    })
  }, [])

  const handlePinConfirm = useCallback(async (enteredPin: string) => {
    setPinModalVisible(false)
    const savedPin = await SecureStore.getItemAsync('fallback_pin')
    if (enteredPin === savedPin) {
      pinResolver?.('pin_fallback')
    } else {
      Alert.alert('PIN incorrecto', 'El PIN ingresado no es válido.')
      pinResolver?.(null)
    }
    setPinResolver(null)
  }, [pinResolver])

  const handlePinCancel = useCallback(() => {
    setPinModalVisible(false)
    pinResolver?.(null)
    setPinResolver(null)
  }, [pinResolver])

  // ── Verificación de identidad (biométrica o PIN) ──────────
  const verifyIdentity = async (): Promise<'biometric' | 'pin_fallback' | null> => {
    const authMethod = await SecureStore.getItemAsync('auth_method')

    if (!authMethod) {
      router.replace('/biometric-setup')
      return null
    }

    if (authMethod === 'biometric') {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad para registrar asistencia',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN',
      })
      if (result.success) return 'biometric'
      if (result.error === 'user_fallback') {
        const result = await requestPin()
        return result as 'pin_fallback' | null
      }
      return null
    }

    // Método PIN directo
    const result = await requestPin()
    return result as 'pin_fallback' | null
  }

// ── Obtener ubicación actual ──────────────────────────────
const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    // Solicitar permiso
    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== 'granted') {
      // Si el usuario niega el permiso, el chequeo continúa sin ubicación
      console.log('Permiso de ubicación denegado')
      return null
    }

    // Obtener coordenadas con precisión balanceada
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitude:  location.coords.latitude,
      longitude: location.coords.longitude,
    }
  } catch (error) {
    // Si falla la ubicación, el chequeo continúa sin ella
    console.log('Error obteniendo ubicación:', error)
    return null
  }
}



  // ── Registrar chequeo ─────────────────────────────────────
  const handleCheckIn = async (eventType: EventType) => {
    setProcessingEvent(eventType)
    try {
      const verificationMethod = await verifyIdentity()
      if (!verificationMethod) return

      const deviceInfo = await getDeviceInfo()

      // Obtener ubicación en paralelo — no bloquea si falla
      const location = await getLocation()

      await doCheckIn({
        event_type:          eventType,
        device_uuid:         deviceInfo.device_uuid,
        verification_method: verificationMethod,
        // Solo enviar si se obtuvo la ubicación
        ...(location && {
          latitude:  location.latitude,
          longitude: location.longitude,
        }),
      })

      Alert.alert('✓ Registro exitoso', EVENT_CONFIG[eventType].label)
    } catch (err: any) {
      const httpStatus = err.response?.status
      const msg = err.response?.data?.message ?? 'Error al registrar. Intenta de nuevo.'
      if (httpStatus === 402) {
        Alert.alert('Suscripción inactiva', 'Contacta a tu administrador.')
      } else {
        Alert.alert('Error', msg)
      }
    } finally {
      setProcessingEvent(null)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro? Necesitarás un nuevo código de vinculación para volver a entrar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión', style: 'destructive',
          onPress: async () => { await logout(); router.replace('/bind') },
        },
      ]
    )
  }

  const todaySchedule = status?.today_schedule ?? null
  const punctuality   = status?.punctuality   ?? null
  const availableActions = (status?.available_actions ?? []) as EventType[]
  const currentStatus    = status?.current_status ?? 'Sin registro hoy'
  const statusColor      = STATUS_COLOR[currentStatus] ?? '#9CA3AF'
  const timezone         = status?.server_timezone ?? 'America/Mexico_City'

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1E3A5F" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.employeeName}>{employee?.full_name ?? ''}</Text>
            <Text style={styles.position}>{employee?.position ?? ''}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Estado actual */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>ESTADO ACTUAL</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{currentStatus}</Text>
          </View>
          {status?.last_event && (
            <Text style={styles.lastEventText}>
              Último: {status.last_event.event_label} ·{' '}
              {new Date(status.last_event.registered_at).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', timeZone: timezone,
              })}
            </Text>
          )}
          <Text style={styles.serverTime}>
            {status?.server_time
              ? new Date(status.server_time).toLocaleTimeString('es-MX', {
                  hour: '2-digit', minute: '2-digit', timeZone: timezone,
                })
              : '--:--'
            }
          </Text>
        </View>


        <ScheduleCard
          schedule={todaySchedule}
          punctuality={punctuality}
          timezone={timezone}
        />



        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>
            {availableActions.length > 0 ? 'Registrar' : 'Jornada completada'}
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#1E3A5F" style={{ marginTop: 32 }} />
          ) : availableActions.length === 0 ? (
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={52} color="#16A34A" />
              <Text style={styles.completedText}>
                Tu jornada de hoy ha sido registrada completamente.
              </Text>
            </View>
          ) : (
            //<View style={styles.actionsGrid}>
            //  {availableActions.map((eventType) => (
            //    <ActionButton
            //      key={eventType}
            //      eventType={eventType}
            //      onPress={handleCheckIn}
            //      isLoading={processingEvent === eventType}
            //    />
            //  ))}
            //</View>

            <View style={styles.actionsGrid}>
              {availableActions.map((eventType) => {
                const { allowed, reason } = isActionAllowed(
                  eventType,
                  todaySchedule,
                  status?.server_time ?? null,
                  timezone
                )
                return (
                  <ActionButton
                    key={eventType}
                    eventType={eventType}
                    onPress={handleCheckIn}
                    isLoading={processingEvent === eventType}
                    disabled={!allowed}
                    disabledReason={reason}
                  />
                )
              })}
            </View>

          )}
        </View>

        {/* Link historial */}
        <TouchableOpacity style={styles.historyLink} onPress={() => router.push('/(app)/history')}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={styles.historyLinkText}>Ver mi historial de asistencia</Text>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de PIN — fuera del ScrollView para no tener problemas de z-index */}
      <PinModal
        visible={pinModalVisible}
        onConfirm={handlePinConfirm}
        onCancel={handlePinCancel}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent:      { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 20 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:           { fontSize: 14, color: '#9CA3AF' },
  employeeName:       { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 2 },
  position:           { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutButton:       { padding: 8 },
  statusCard:         { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  statusLabel:        { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.8 },
  statusRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:          { width: 10, height: 10, borderRadius: 5 },
  statusText:         { fontSize: 18, fontWeight: '600' },
  lastEventText:      { fontSize: 12, color: '#9CA3AF' },
  serverTime:         { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'right', marginTop: 4 },
  actionsSection:     { gap: 16 },
  sectionTitle:       { fontSize: 16, fontWeight: '600', color: '#374151' },
  actionsGrid:        { gap: 12 },
  actionButton:       { borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionLabel:        { fontSize: 16, fontWeight: '600', flex: 1 },
  buttonDisabled:     { opacity: 0.5 },
  completedContainer: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  completedText:      { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  historyLink:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  historyLinkText:    { fontSize: 14, color: '#2563EB', fontWeight: '500', flex: 1 },
  actionSubLabel:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
})
