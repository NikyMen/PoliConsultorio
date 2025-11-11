import { View, Text, Button } from 'react-native';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function PatientHome() {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.accent }}>Panel Paciente</Text>
      <Text>Consulta tus horarios, estudios, informes y noticias.</Text>
      <View style={{ height: 12 }} />
      <Button title="Ver calendario" onPress={() => router.push('/patient/calendar')} />
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}