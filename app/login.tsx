import { useEffect, useState } from 'react';
import { View, Text, Platform, Image } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../lib/auth';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../lib/theme';

export default function LoginScreen() {
  const { login, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message || 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(role === 'ADMIN' ? '/admin/home' : '/patient/home');
    }
  }, [isAuthenticated, role, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: spacing.md }}>
      <Image source={require('../assets/icon.png')} style={{ width: 120, height: 120, marginBottom: spacing.md }} />
      <Text style={{ fontSize: 26, marginBottom: spacing.sm, color: colors.secondary }}>PoliConsultorio</Text>
      <PaperTextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={{ width: 300, marginBottom: spacing.sm }}
      />
      <PaperTextInput
        placeholder="Contraseña"
        secureTextEntry={!passwordVisible}
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        right={<PaperTextInput.Icon icon={passwordVisible ? 'eye-off' : 'eye'} onPress={() => setPasswordVisible((v) => !v)} />}
        style={{ width: 300, marginBottom: spacing.sm }}
      />
      {error ? <Text style={{ color: colors.accent, marginBottom: spacing.sm }}>{error}</Text> : null}
      <PaperButton mode="contained" onPress={onSubmit} disabled={loading} icon="login">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </PaperButton>
      <Text style={{ marginTop: spacing.sm, color: colors.muted }}>Plataforma: {Platform.OS}</Text>
      {isAuthenticated ? <Text style={{ marginTop: 8 }}>Sesión activa: {role}</Text> : null}
    </View>
  );
}