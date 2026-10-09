import { Stack } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen
        name="history"
        options={{
          headerShown: true,
          title: 'Mi historial',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontSize: 16, fontWeight: '600', color: '#111827' },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 4 }}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  )
}
