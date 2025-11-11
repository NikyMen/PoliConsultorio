import { getItem, saveItem, deleteItem } from './storage';

export type CalendarEvent = {
  id: string;
  date: string; // DD-MM-YYYY
  time?: string; // HH:mm (opcional por compatibilidad)
  title: string;
  notes?: string;
  forEmail?: string; // email del paciente asignado
};

const STORAGE_KEY = 'events';

function generateId() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toDMY(date: Date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

export function parseDateFlexible(str: string): Date | null {
  // soporta DD-MM-YYYY y YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-').map((s) => parseInt(s, 10));
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map((s) => parseInt(s, 10));
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export function parseTime(str?: string): { hours: number; minutes: number } | null {
  if (!str) return null;
  // HH:mm
  if (!/^\d{2}:\d{2}$/.test(str)) return null;
  const [hStr, mStr] = str.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatTime(str?: string) {
  // Devuelve HH:mm normalizado
  const t = parseTime(str);
  if (!t) return str ?? '';
  return `${pad(t.hours)}:${pad(t.minutes)}`;
}

export function getEventTimestamp(ev: CalendarEvent): number {
  const d = parseDateFlexible(ev.date);
  if (!d) return 0;
  const t = parseTime(ev.time);
  d.setHours(t?.hours ?? 0, t?.minutes ?? 0, 0, 0);
  return d.getTime();
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const raw = await getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CalendarEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addEvent(event: Omit<CalendarEvent, 'id'>) {
  const all = await getEvents();
  const newEvent: CalendarEvent = { id: generateId(), ...event };
  const updated = [...all, newEvent];
  await saveItem(STORAGE_KEY, JSON.stringify(updated));
  return newEvent;
}

export async function updateEvent(event: CalendarEvent) {
  const all = await getEvents();
  const idx = all.findIndex((e) => e.id === event.id);
  if (idx === -1) throw new Error('Evento no encontrado');
  all[idx] = event;
  await saveItem(STORAGE_KEY, JSON.stringify(all));
  return event;
}

export async function deleteEventById(id: string) {
  const all = await getEvents();
  const updated = all.filter((e) => e.id !== id);
  await saveItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function getEventsFor(email?: string): Promise<CalendarEvent[]> {
  const all = await getEvents();
  if (!email) return all;
  return all.filter((e) => !e.forEmail || e.forEmail === email);
}

export function groupEventsByDate(events: CalendarEvent[]) {
  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    byDate[ev.date] = byDate[ev.date] || [];
    byDate[ev.date].push(ev);
  }
  const dates = Object.keys(byDate).sort((a, b) => {
    const da = parseDateFlexible(a)?.getTime() ?? 0;
    const db = parseDateFlexible(b)?.getTime() ?? 0;
    return da - db;
  });
  return dates.map((d) => ({
    date: d,
    events: byDate[d]
      .sort((a, b) => {
        const ta = getEventTimestamp(a);
        const tb = getEventTimestamp(b);
        if (ta !== tb) return ta - tb;
        return (formatTime(a.time) || '').localeCompare(formatTime(b.time) || '') || a.title.localeCompare(b.title);
      }),
  }));
}

export function formatDate(date: string) {
  // Devuelve DD/MM/YYYY desde DD-MM-YYYY o YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    const [d, m, y] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }
  return date;
}

export function compareEventDates(a: CalendarEvent, b: CalendarEvent) {
  const ta = getEventTimestamp(a);
  const tb = getEventTimestamp(b);
  return ta - tb;
}