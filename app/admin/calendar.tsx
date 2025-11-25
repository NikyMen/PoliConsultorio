import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getEvents, addEvent, updateEvent, deleteEventById, type CalendarEvent, formatDate, compareEventDates, formatTime } from '../../lib/schedule';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';

export default function AdminCalendar() {
  const { isAuthenticated, role } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [date, setDate] = useState(''); // DD-MM-YYYY
  const [time, setTime] = useState(''); // HH:mm
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [forEmail, setForEmail] = useState('');
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const evs = await getEvents();
      evs.sort(compareEventDates);
      setEvents(evs);
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const resetForm = () => {
    setDate('');
    setTime('');
    setTitle('');
    setNotes('');
    setForEmail('');
    setEditing(null);
  };

  const onSave = async () => {
    if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      Alert.alert('Fecha inválida', 'Usa formato DD-MM-YYYY');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Ingresa un título');
      return;
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('Hora inválida', 'Usa formato HH:mm');
      return;
    }
    try {
      if (editing) {
        const updated = await updateEvent({ id: editing.id, date, time: formatTime(time), title: title.trim(), notes: notes.trim() || undefined, forEmail: forEmail.trim() || undefined });
        const next = events.map((e) => (e.id === updated.id ? updated : e)).sort(compareEventDates);
        setEvents(next);
      } else {
        const created = await addEvent({ date, time: formatTime(time), title: title.trim(), notes: notes.trim() || undefined, forEmail: forEmail.trim() || undefined });
        const next = [...events, created].sort(compareEventDates);
        setEvents(next);
      }
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar');
    }
  };

  const onEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setDate(ev.date);
    setTime(formatTime(ev.time));
    setTitle(ev.title);
    setNotes(ev.notes || '');
    setForEmail(ev.forEmail || '');
  };

  const onDelete = async (id: string) => {
    await deleteEventById(id);
    setEvents(events.filter((e) => e.id !== id));
    if (editing?.id === id) resetForm();
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Editor de calendario</Text>

      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ marginBottom: 4 }}>Fecha (DD-MM-YYYY)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Button title={date ? `Seleccionada: ${date}` : 'Seleccionar fecha'} onPress={() => setDatePickerOpen(true)} />
          {date ? <Button title="Borrar" color={colors.accent} onPress={() => setDate('')} /> : null}
        </View>
        <DatePickerModal
          locale="es"
          mode="single"
          visible={datePickerOpen}
          onDismiss={() => setDatePickerOpen(false)}
          date={undefined}
          onConfirm={({ date }) => {
            if (date) {
              const d = String(date.getDate()).padStart(2, '0');
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const y = String(date.getFullYear());
              setDate(`${d}-${m}-${y}`);
            }
            setDatePickerOpen(false);
          }}
        />
        <Text style={{ marginTop: spacing.sm, marginBottom: 4 }}>Hora (HH:mm)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Button title={time ? `Seleccionada: ${formatTime(time)}` : 'Seleccionar hora'} onPress={() => setTimePickerOpen(true)} />
          {time ? <Button title="Borrar" color={colors.accent} onPress={() => setTime('')} /> : null}
        </View>
        <TimePickerModal
          visible={timePickerOpen}
          onDismiss={() => setTimePickerOpen(false)}
          onConfirm={({ hours, minutes }) => {
            setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            setTimePickerOpen(false);
          }}
          hours={undefined}
          minutes={undefined}
          label="Selecciona la hora"
        />
        <Text style={{ marginTop: spacing.sm, marginBottom: 4 }}>Título</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Título del evento"
          style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#fff' }} />
        <Text style={{ marginTop: spacing.sm, marginBottom: 4 }}>Notas</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Notas opcionales" multiline={true}
          style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#fff', minHeight: 60 }} />
        <Text style={{ marginTop: spacing.sm, marginBottom: 4 }}>Paciente (email opcional)</Text>
        <TextInput value={forEmail} onChangeText={setForEmail} placeholder="usuario@dominio"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#fff' }} />

        <View style={{ height: spacing.sm }} />
        <Button title={editing ? 'Actualizar evento' : 'Agregar evento'} onPress={onSave} />
        {editing ? (
          <View style={{ marginTop: spacing.sm }}>
            <Button title="Cancelar edición" onPress={resetForm} color={colors.accent} />
          </View>
        ) : null}
      </View>

      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Eventos</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '600' }}>{formatDate(item.date)} {item.time ? `• ${formatTime(item.time)}` : ''} — {item.title}</Text>
            {item.notes ? <Text style={{ color: colors.muted }}>{item.notes}</Text> : null}
            {item.forEmail ? <Text style={{ color: colors.muted }}>Asignado a: {item.forEmail}</Text> : null}
            <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
              <Button title="Editar" onPress={() => onEdit(item)} />
              <View style={{ width: 8 }} />
              <Button title="Eliminar" onPress={() => onDelete(item.id)} color={colors.accent} />
            </View>
          </View>
        )}
      />
    </View>
  );
}
