import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { colors } from '../lib/theme';
import { Provider as PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <Stack screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: colors.background },
        }}>
          <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
          <Stack.Screen name="admin/home" options={{ title: 'Administrador' }} />
          <Stack.Screen name="admin/calendar" options={{ title: 'Calendario' }} />
          <Stack.Screen name="patient/home" options={{ title: 'Paciente' }} />
          <Stack.Screen name="patient/calendar" options={{ title: 'Calendario' }} />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}