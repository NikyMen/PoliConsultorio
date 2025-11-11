import { useEffect, useState } from 'react';
import { View, Text, SectionList, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing } from '../../lib/theme';
import { getEventsFor, groupEventsByDate, type CalendarEvent, formatDate, compareEventDates, formatTime } from '../../lib/schedule';

export default function PatientCalendar() {
  const { isAuthenticated, role, user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const evs = await getEventsFor(user?.email);
      evs.sort(compareEventDates);
      setEvents(evs);
      setLoading(false);
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.accent, marginBottom: spacing.sm }}>Calendario</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : events.length === 0 ? (
        <Text style={{ color: colors.muted }}>No hay eventos programados.</Text>
      ) : (
        <SectionList
          sections={groupEventsByDate(events).map((g) => ({ title: g.date, data: g.events }))}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={{ backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{formatDate(section.title as string)}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{item.time ? `${formatTime(item.time)} — ` : ''}{item.title}</Text>
              {item.notes ? <Text style={{ color: colors.muted }}>{item.notes}</Text> : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}