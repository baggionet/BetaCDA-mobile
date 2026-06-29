import { View, Text, StyleSheet } from 'react-native'

export default function BiometricSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Biometric Setup (próximamente)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#374151' },
})
