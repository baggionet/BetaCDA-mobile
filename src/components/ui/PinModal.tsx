import { useState } from 'react'
import {
  Modal, View, Text, TextInput,
  TouchableOpacity, StyleSheet,
} from 'react-native'

interface PinModalProps {
  visible: boolean
  onConfirm: (pin: string) => void
  onCancel: () => void
}

/**
 * PinModal — Modal de ingreso de PIN que funciona en iOS y Android.
 *
 * Reemplaza Alert.prompt que SOLO existe en iOS.
 * Uso idéntico en ambas plataformas.
 */
export default function PinModal({ visible, onConfirm, onCancel }: PinModalProps) {
  const [pin, setPin] = useState('')

  const handleConfirm = () => {
    const current = pin
    setPin('')
    onConfirm(current)
  }

  const handleCancel = () => {
    setPin('')
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Ingresa tu PIN</Text>
          <Text style={styles.subtitle}>
            Verifica tu identidad para registrar asistencia
          </Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="••••••"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, pin.length !== 6 && styles.confirmDisabled]}
              onPress={handleConfirm}
              disabled={pin.length !== 6}
            >
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#111827',
    marginVertical: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
