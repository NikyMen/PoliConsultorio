import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Button, Alert } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Divider } from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { dias, timeSlots, getHorariosFor, setHorarioCellFor, setHorarioNoteFor, setHorariosFor, keyFor, type Dia } from '../../lib/horarios';
import { colors as c } from '../../lib/theme';

export default function AdminHorarios() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getHorariosFor(undefined);
      setNote(data.note || '');
      setCells(data.cells || {});
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const slots = useMemo(() => timeSlots(8, 18), []);

  const onChangeCell = (day: Dia, time: string, value: string) => {
    const k = keyFor(day, time);
    setCells((prev) => ({ ...prev, [k]: value }));
  };

  const onBlurCell = async (day: Dia, time: string) => {
    const k = keyFor(day, time);
    const v = cells[k] || '';
    await setHorarioCellFor(email.trim() || undefined, day, time, v);
  };

  const onBlurNote = async () => {
    await setHorarioNoteFor(email.trim() || undefined, note);
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Horarios</Text>
      <Text style={{ marginBottom: 4 }}>Paciente (email para asignar)</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: spacing.sm }}>
        <PaperTextInput
          placeholder="usuario@dominio"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={{ flex: 1 }}
        />
        <PaperButton mode="contained" icon="calendar-search" onPress={async () => {
          const data = await getHorariosFor(email.trim() || undefined);
          setNote(data.note || '');
          setCells(data.cells || {});
        }}>Ver horario</PaperButton>
      </View>
      <PaperTextInput
        placeholder="Notas generales"
        value={note}
        onChangeText={setNote}
        onBlur={onBlurNote}
        multiline={true}
        mode="outlined"
        style={{ marginBottom: spacing.md, minHeight: 80 }}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        <PaperButton mode="contained" icon="content-save" onPress={async () => {
          try {
            await setHorariosFor(email.trim() || undefined, { note, cells });
            Alert.alert('Guardado', 'Horarios y nota guardados');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudo guardar');
          }
        }}>Guardar</PaperButton>
      </View>
      <ScrollView horizontal={true} style={{ flex: 1 }}>
        <View style={{ minWidth: 900 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 100, padding: 10, backgroundColor: colors.secondary }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Hora</Text>
            </View>
            {dias.map((d) => (
              <View key={d} style={{ flex: 1, padding: 10, backgroundColor: colors.secondary }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{d}</Text>
              </View>
            ))}
          </View>
          <Divider style={{ backgroundColor: colors.border }} />
          <ScrollView style={{ flex: 1 }}>
            {slots.map((t, idx) => (
              <View key={t} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#f6f8fb' : '#ffffff' }}>
                <View style={{ width: 100, padding: 10 }}>
                  <Text style={{ fontWeight: '600' }}>{t}</Text>
                </View>
                {dias.map((d) => {
                  const k = keyFor(d, t);
                  const val = cells[k] || '';
                  return (
                    <View key={k} style={{ flex: 1, padding: 8 }}>
                      <PaperTextInput
                        value={val}
                        onChangeText={(v) => onChangeCell(d, t, v)}
                        onBlur={() => onBlurCell(d, t)}
                        mode="outlined"
                        placeholder=""
                        style={{ backgroundColor: '#fff' }}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
