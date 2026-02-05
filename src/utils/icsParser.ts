import type { CalendarEvent } from '../types';
import { startOfDay, endOfDay, isBefore, isAfter, parseISO } from 'date-fns';

/**
 * Unfold lines per RFC 5545 (lines can be folded by inserting CRLF + space/tab)
 */
function unfoldLines(content: string): string {
  return content.replace(/\r?\n[ \t]/g, '');
}

/**
 * Get a property value from a VEVENT block's lines.
 * Handles properties with parameters (e.g., DTSTART;TZID=...:value)
 */
function getProperty(lines: string[], property: string): string | null {
  for (const line of lines) {
    // Match "PROPERTY:" or "PROPERTY;params:"
    if (line.startsWith(property + ':') || line.startsWith(property + ';')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        return line.substring(colonIndex + 1).trim();
      }
    }
  }
  return null;
}

/**
 * Parse an iCal date/datetime string into a Date and whether it's all-day.
 *
 * Formats:
 *   20260205                    → all-day (DATE)
 *   20260205T140000Z            → UTC datetime
 *   20260205T140000             → local datetime (no timezone)
 */
function parseIcsDateTime(value: string): { date: Date; isAllDay: boolean } {
  // Remove any trailing whitespace
  value = value.trim();

  // All-day: exactly 8 digits (YYYYMMDD)
  if (/^\d{8}$/.test(value)) {
    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6)) - 1;
    const day = parseInt(value.substring(6, 8));
    return { date: new Date(year, month, day), isAllDay: true };
  }

  // DateTime with UTC: YYYYMMDDTHHMMSSZ
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6)) - 1;
    const day = parseInt(value.substring(6, 8));
    const hour = parseInt(value.substring(9, 11));
    const minute = parseInt(value.substring(11, 13));
    const second = parseInt(value.substring(13, 15));
    return { date: new Date(Date.UTC(year, month, day, hour, minute, second)), isAllDay: false };
  }

  // DateTime without timezone: YYYYMMDDTHHMMSS (treat as local)
  if (/^\d{8}T\d{6}$/.test(value)) {
    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6)) - 1;
    const day = parseInt(value.substring(6, 8));
    const hour = parseInt(value.substring(9, 11));
    const minute = parseInt(value.substring(11, 13));
    const second = parseInt(value.substring(13, 15));
    return { date: new Date(year, month, day, hour, minute, second), isAllDay: false };
  }

  // Fallback: try native Date parsing
  return { date: new Date(value), isAllDay: false };
}

/**
 * Unescape iCal text values.
 * iCal escapes: \n → newline, \, → comma, \; → semicolon, \\ → backslash
 */
function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse an .ics file content string into CalendarEvent objects.
 */
export function parseIcsFile(content: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const unfolded = unfoldLines(content);
  const lines = unfolded.split(/\r?\n/);

  let inEvent = false;
  let eventLines: string[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      eventLines = [];
      continue;
    }

    if (line === 'END:VEVENT' && inEvent) {
      inEvent = false;

      const uid = getProperty(eventLines, 'UID');
      const summary = getProperty(eventLines, 'SUMMARY');
      const dtStart = getProperty(eventLines, 'DTSTART');
      const dtEnd = getProperty(eventLines, 'DTEND');
      const description = getProperty(eventLines, 'DESCRIPTION');
      const location = getProperty(eventLines, 'LOCATION');

      if (!dtStart || !summary) continue;

      const start = parseIcsDateTime(dtStart);

      // If no DTEND, use DTSTART (single-point event)
      let end = dtEnd ? parseIcsDateTime(dtEnd) : { date: start.date, isAllDay: start.isAllDay };

      // For all-day events without DTEND, end = start + 1 day
      if (start.isAllDay && !dtEnd) {
        const nextDay = new Date(start.date);
        nextDay.setDate(nextDay.getDate() + 1);
        end = { date: nextDay, isAllDay: true };
      }

      events.push({
        id: uid || crypto.randomUUID().split('-')[0],
        title: unescapeIcsText(summary),
        description: description ? unescapeIcsText(description) : undefined,
        start: start.date.toISOString(),
        end: end.date.toISOString(),
        location: location ? unescapeIcsText(location) : undefined,
        isAllDay: start.isAllDay,
        importedAt: new Date().toISOString(),
      });

      continue;
    }

    if (inEvent) {
      eventLines.push(line);
    }
  }

  return events;
}

/**
 * Get timed (non-all-day) events that fall on a specific date.
 */
export function getTimedEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return events.filter((event) => {
    if (event.isAllDay) return false;

    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);

    // Event overlaps with this day if it starts before day ends AND ends after day starts
    return isBefore(eventStart, dayEnd) && isAfter(eventEnd, dayStart);
  });
}
