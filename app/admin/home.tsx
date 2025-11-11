import { View, Text, Button } from 'react-native';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.secondary }}>Panel Administrador</Text>
      <Text>Desde aquí gestionarás horarios, estudios, informes y noticias.</Text>
      <View style={{ height: 12 }} />
      <Button title="Editar calendario" onPress={() => router.push('/admin/calendar')} />
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}