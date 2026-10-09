import {
  View, Text, StyleSheet, SectionList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getHistory } from '../../src/api/check'
import type { EventType, AttendanceLog } from '../../src/types'

// ─── Configuración visual por tipo de evento ───────────────
const EVENT_CONFIG: Record<EventType, { icon: string; color: string }> = {
  start_work:     { icon: 'log-in-outline',              color: '#16A34A' },
  start_lunch:    { icon: 'restaurant-outline',          color: '#D97706' },
  end_lunch:      { icon: 'return-down-back-outline',    color: '#2563EB' },
  end_work:       { icon: 'log-out-outline',             color: '#6B7280' },
  start_overtime: { icon: 'time-outline',                color: '#7C3AED' },
  end_overtime:   { icon: 'stop-circle-outline',         color: '#7C3AED' },
}

// ─── Formato de fecha legible en español ───────────────────
const formatDate = (dateStr: string): string => {
  const date  = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Hoy'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ayer'

  return date.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ─── Componente: fila de un evento ─────────────────────────
function EventRow({ log }: { log: AttendanceLog }) {
  const config = EVENT_CONFIG[log.event_type] ?? { icon: 'time-outline', color: '#6B7280' }
  const time   = new Date(log.registered_at).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventIconBg, { backgroundColor: config.color + '18' }]}>
        <Ionicons name={config.icon as any} size={18} color={config.color} />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventLabel}>{log.event_label}</Text>
        {log.verification_method === 'pin_fallback' && (
          <Text style={styles.pinBadge}>PIN</Text>
        )}
      </View>
      <Text style={styles.eventTime}>{time}</Text>
    </View>
  )
}

// ─── Componente: resumen del día ────────────────────────────
function DaySummary({ events }: { events: AttendanceLog[] }) {
  const startWork = events.find(e => e.event_type === 'start_work')
  const endWork   = events.find(e => e.event_type === 'end_work')

  if (!startWork || !endWork) return null

  const start = new Date(startWork.registered_at)
  const end   = new Date(endWork.registered_at)
  const mins  = Math.round((end.getTime() - start.getTime()) / 60000)

  // Descontar tiempo de comida si existe
  const lunchStart = events.find(e => e.event_type === 'start_lunch')
  const lunchEnd   = events.find(e => e.event_type === 'end_lunch')
  let workedMins   = mins

  if (lunchStart && lunchEnd) {
    const lStart = new Date(lunchStart.registered_at)
    const lEnd   = new Date(lunchEnd.registered_at)
    workedMins  -= Math.round((lEnd.getTime() - lStart.getTime()) / 60000)
  }

  const hours = Math.floor(workedMins / 60)
  const rem   = workedMins % 60

  return (
    <View style={styles.summary}>
      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
      <Text style={styles.summaryText}>
        {hours}h {rem > 0 ? `${rem}m` : ''} trabajadas
      </Text>
    </View>
  )
}

// ─── Pantalla principal ─────────────────────────────────────
export default function HistoryScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => getHistory(30),
  })

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color="#9CA3AF" />
        <Text style={styles.errorText}>No se pudo cargar el historial</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sections = (data?.history ?? []).map(day => ({
    title: day.date,
    data:  day.events,
  }))

  if (sections.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
        <Text style={styles.emptyText}>No tienes registros en los últimos 30 días</Text>
      </View>
    )
  }

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      sections={sections}
      keyExtractor={(item, index) => `${item.event_type}-${index}`}
      renderSectionHeader={({ section }) => {
        const dayEvents = section.data as AttendanceLog[]
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{formatDate(section.title)}</Text>
            <DaySummary events={dayEvents} />
          </View>
        )
      }}
      renderItem={({ item }) => <EventRow log={item as AttendanceLog} />}
      SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F9FAFB' },
  listContent:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  errorText:          { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyText:          { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  retryButton:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EFF6FF' },
  retryText:          { fontSize: 14, color: '#2563EB', fontWeight: '500' },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  sectionTitle:       { fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  summary:            { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryText:        { fontSize: 12, color: '#16A34A', fontWeight: '500' },
  sectionSeparator:   { height: 8 },
  eventRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  eventIconBg:        { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  eventInfo:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventLabel:         { fontSize: 14, color: '#374151', fontWeight: '500' },
  pinBadge:           { fontSize: 10, color: '#D97706', fontWeight: '600', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  eventTime:          { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
})
