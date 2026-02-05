import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfDay, endOfDay, addWeeks, subWeeks, isBefore, isAfter, parseISO } from 'date-fns';
import type { CalendarEvent } from '../types';
import { parseIcsFile } from '../utils/icsParser';

const PROXY_URL = 'https://yellow-resonance-4153.jack-katzler.workers.dev/';

interface CalendarState {
  // Connection settings
  icalUrl: string | null;
  autoSync: boolean;
  lastSyncedAt: string | null;

  // Event data
  events: CalendarEvent[];

  // Actions
  setIcalUrl: (url: string | null) => void;
  setAutoSync: (enabled: boolean) => void;
  syncCalendar: () => Promise<{ success: boolean; count: number; error?: string }>;
  clearEvents: () => void;
  disconnect: () => void;

  // Helpers
  getTimedEventsForDate: (date: Date) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      icalUrl: null,
      autoSync: true,
      lastSyncedAt: null,
      events: [],

      setIcalUrl: (url) => set({ icalUrl: url }),
      setAutoSync: (enabled) => set({ autoSync: enabled }),

      syncCalendar: async () => {
        const { icalUrl } = get();

        if (!icalUrl) {
          return { success: false, count: 0, error: 'Missing iCal URL' };
        }

        try {
          const fetchUrl = `${PROXY_URL}?url=${encodeURIComponent(icalUrl)}`;
          const response = await fetch(fetchUrl);

          if (!response.ok) {
            return { success: false, count: 0, error: `Fetch failed: ${response.status} ${response.statusText}` };
          }

          const icsContent = await response.text();
          const allEvents = parseIcsFile(icsContent);

          // Filter to events within ±4 weeks of today
          const now = new Date();
          const rangeStart = subWeeks(now, 1);
          const rangeEnd = addWeeks(now, 4);

          const filteredEvents = allEvents.filter((event) => {
            const eventStart = parseISO(event.start);
            return !isBefore(eventStart, rangeStart) && !isAfter(eventStart, rangeEnd);
          });

          set({
            events: filteredEvents,
            lastSyncedAt: new Date().toISOString(),
          });

          return { success: true, count: filteredEvents.length };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { success: false, count: 0, error: message };
        }
      },

      clearEvents: () => set({ events: [], lastSyncedAt: null }),

      disconnect: () =>
        set({
          icalUrl: null,
          autoSync: true,
          lastSyncedAt: null,
          events: [],
        }),

      getTimedEventsForDate: (date: Date) => {
        const { events } = get();
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        return events.filter((event) => {
          if (event.isAllDay) return false;
          const eventStart = parseISO(event.start);
          const eventEnd = parseISO(event.end);
          return isBefore(eventStart, dayEnd) && isAfter(eventEnd, dayStart);
        });
      },
    }),
    {
      name: 'daily-planner-calendar',
      partialize: (state) => ({
        icalUrl: state.icalUrl,
        autoSync: state.autoSync,
        lastSyncedAt: state.lastSyncedAt,
        events: state.events,
      }),
    }
  )
);
