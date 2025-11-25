import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { api } from '../../lib/api';

type Role = 'ADMIN' | 'PATIENT';

export default function AdminUsuarios() {
  const { isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>('PATIENT');

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const onRegister = async () => {
    try {
      const em = email.trim();
      const pw = password.trim();
      if (!em || !/[^@\s]+@[^@\s]+\.[^@\s]+/.test(em)) throw new Error('Correo inválido');
      if (pw.length < 6) throw new Error('Contraseña mínima 6 caracteres');
      await api.post('/auth/register', { email: em, password: pw, role: userRole });
      Alert.alert('Usuario creado', `${em} (${userRole})`);
      setEmail('');
      setPassword('');
      setUserRole('PATIENT');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo crear');
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Usuarios</Text>
      <Text style={{ marginBottom: 4 }}>Correo</Text>
      <TextInput
        placeholder="usuario@dominio"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff', marginBottom: spacing.sm }}
      />
      <Text style={{ marginBottom: 4 }}>Contraseña</Text>
      <TextInput
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff', marginBottom: spacing.sm }}
      />
      <Text style={{ marginBottom: 4 }}>Rol</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        <Button title={userRole === 'PATIENT' ? 'Paciente ✓' : 'Paciente'} onPress={() => setUserRole('PATIENT')} />
        <Button title={userRole === 'ADMIN' ? 'Admin ✓' : 'Admin'} onPress={() => setUserRole('ADMIN')} />
      </View>
      <Button title="Crear usuario" onPress={onRegister} color={colors.primary} />
    </View>
  );
}
