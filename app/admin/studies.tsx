import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Alert, Platform } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton } from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing } from '../../lib/theme';
import { addStudy, deleteStudy, getStudies, type Study, uploadPdfStudy, getRemoteStudies, type RemoteStudy, deleteRemoteStudy } from '../../lib/studies';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { absoluteUrl } from '../../lib/api';

export default function AdminStudies() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [remoteStudies, setRemoteStudies] = useState<RemoteStudy[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [forEmail, setForEmail] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const list = await getStudies();
      setStudies(list);
      try {
        const remote = await getRemoteStudies();
        setRemoteStudies(remote);
      } catch (e: any) {
        setRemoteError(e?.message || 'No se pudo cargar los estudios del backend');
      }
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const pickWeb = async () => {
    try {
      const input = inputRef.current;
      if (!input) return;
      input.click();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir el selector');
    }
  };

  const isValidEmail = (email: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

  const onWebFilesSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name;
    const mimeType = file.type || 'application/octet-stream';
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const emailRaw = forEmail.trim();
        const email = emailRaw ? (isValidEmail(emailRaw) ? emailRaw : undefined) : undefined;
        if (emailRaw && !email) {
          Alert.alert('Email inválido', 'Usa un correo con dominio válido, o déjalo vacío.');
          ev.target.value = '';
          return;
        }
        if ((mimeType || '').toLowerCase() === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
          const created = await uploadPdfStudy(name, base64, email);
          setRemoteStudies((prev) => [created, ...prev]);
          Alert.alert('Éxito', 'PDF guardado en base de datos');
        } else {
          const dataUrl = `data:${mimeType};base64,${base64}`;
          const created = await addStudy({ name, mimeType, dataUrl, forEmail: email });
          setStudies((prev) => [created, ...prev]);
          Alert.alert('Éxito', 'Estudio guardado localmente');
        }
        ev.target.value = '';
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo guardar el estudio');
      }
    };
    reader.onerror = () => Alert.alert('Error', 'No se pudo leer el archivo');
    reader.readAsDataURL(file);
  };

  const pickNative = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });
      if (res.canceled) return;
      const asset = Array.isArray((res as any).assets) && (res as any).assets.length > 0 ? (res as any).assets[0] : null;
      const name = asset?.name || '';
      const uri = asset?.uri || '';
      const mimeType = asset?.mimeType || null;
      const size = typeof asset?.size === 'number' ? asset.size : undefined;
      if (!uri) {
        Alert.alert('Error', 'No se pudo obtener el archivo');
        return;
      }
      if (size && size > 20 * 1024 * 1024) {
        Alert.alert('Archivo muy grande', 'Máximo 20MB');
        return;
      }
      const fileObj = new FileSystem.File(uri);
      const base64 = fileObj.base64();
      const mt = mimeType || guessMimeTypeByName(name);
      const emailRaw = forEmail.trim();
      const email = emailRaw ? (isValidEmail(emailRaw) ? emailRaw : undefined) : undefined;
      if (emailRaw && !email) {
        Alert.alert('Email inválido', 'Usa un correo con dominio válido, o déjalo vacío.');
        return;
      }
      if (mt === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
        const created = await uploadPdfStudy(name, base64, email);
        setRemoteStudies((prev) => [created, ...prev]);
        Alert.alert('Éxito', 'PDF guardado en base de datos');
      } else {
        const dataUrl = `data:${mt};base64,${base64}`;
        const created = await addStudy({ name, mimeType: mt, dataUrl, forEmail: email });
        setStudies((prev) => [created, ...prev]);
        Alert.alert('Éxito', 'Estudio guardado localmente');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir el estudio');
    }
  };

  const guessMimeTypeByName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream';
  };

  const openStudy = (study: Study) => {
    router.push({ pathname: '/patient/study', params: { id: study.id } });
  };

  const openRemote = (study: RemoteStudy) => {
    router.push({ pathname: '/patient/study', params: { url: study.fileUrl, name: study.name } });
  };

  const onDelete = async (id: string) => {
    await deleteStudy(id);
    setStudies((prev) => prev.filter((s) => s.id !== id));
  };

  const onDeleteRemote = async (id: string) => {
    await deleteRemoteStudy(id);
    setRemoteStudies((prev) => prev.filter((s) => s.id !== id));
  };

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const downloadRemote = async (study: RemoteStudy) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = absoluteUrl(study.fileUrl);
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const dir = FileSystem.Paths.document.createDirectory('studies');
      try { dir.create({ intermediates: true, idempotent: true }); } catch {}
      const destFile = dir.createFile(sanitize(study.name || 'archivo.pdf'), study.mimeType || 'application/pdf');
      try { destFile.create({ overwrite: true, intermediates: true }); } catch {}
      await FileSystem.File.downloadFileAsync(absoluteUrl(study.fileUrl), destFile, { idempotent: true });
      Alert.alert('Descarga completa', destFile.uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  const downloadLocal = async (study: Study) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = study.dataUrl;
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const dir = FileSystem.Paths.document.createDirectory('studies');
      try { dir.create({ intermediates: true, idempotent: true }); } catch {}
      const ext = study.mimeType === 'application/pdf' ? '.pdf' : '';
      const destFile = dir.createFile(sanitize(study.name || 'archivo') + ext, study.mimeType);
      try { destFile.create({ overwrite: true, intermediates: true }); } catch {}
      const base64 = (study.dataUrl.split(',')[1] || '');
      destFile.write(base64, { encoding: 'base64' });
      Alert.alert('Descarga completa', destFile.uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Estudios</Text>
      <Text style={{ color: colors.muted, marginBottom: spacing.sm }}>Sube PDF, Word o Excel para que el paciente los pueda ver.</Text>
      <Text style={{ marginBottom: 4 }}>Paciente (email para asignar)</Text>
      <PaperTextInput
        placeholder="usuario@dominio"
        value={forEmail}
        onChangeText={setForEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={{ marginBottom: 12, width: '100%', maxWidth: 420 }}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        {Platform.OS === 'web' ? (
          <>
            <PaperButton mode="contained" icon="upload" onPress={pickWeb}>Subir estudio</PaperButton>
            {/* input oculto para web */}
            <input
              ref={inputRef as any}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
              onChange={onWebFilesSelected}
            />
          </>
        ) : (
          <PaperButton mode="contained" icon="upload" onPress={pickNative}>Subir estudio</PaperButton>
        )}
        <PaperButton mode="outlined" icon="arrow-left" onPress={() => router.push('/admin/home')}>Volver</PaperButton>
      </View>

      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Estudios PDF (backend)</Text>
      {remoteError ? <Text style={{ color: colors.accent, marginBottom: spacing.sm }}>{remoteError}</Text> : null}
      <FlatList
        data={remoteStudies}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No hay PDFs subidos al backend.</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.muted }}>{item.mimeType}</Text>
            {item.forEmail ? <Text style={{ color: colors.muted }}>Asignado a: {item.forEmail}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <PaperButton mode="contained" icon="eye" onPress={() => openRemote(item)}>Ver</PaperButton>
              <PaperButton mode="contained" icon="download" onPress={() => downloadRemote(item)}>Descargar</PaperButton>
              <PaperButton mode="outlined" icon="delete" onPress={() => onDeleteRemote(item.id)}>Eliminar</PaperButton>
            </View>
          </View>
        )}
      />

      <View style={{ height: spacing.md }} />

      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Estudios (local)</Text>
      <FlatList
        data={studies}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No hay estudios subidos.</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.muted }}>{item.mimeType}</Text>
            {item.forEmail ? <Text style={{ color: colors.muted }}>Asignado a: {item.forEmail}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <PaperButton mode="contained" icon="eye" onPress={() => openStudy(item)}>Ver</PaperButton>
              <PaperButton mode="contained" icon="download" onPress={() => downloadLocal(item)}>Descargar</PaperButton>
              <PaperButton mode="outlined" icon="delete" onPress={() => onDelete(item.id)}>Eliminar</PaperButton>
            </View>
          </View>
        )}
      />
    </View>
  );
}
