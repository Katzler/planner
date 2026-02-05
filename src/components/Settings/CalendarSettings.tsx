import { useState } from 'react';
import { RefreshCw, Unlink, Info } from 'lucide-react';
import { Button } from '../common/Button';
import { useCalendarStore } from '../../stores/calendarStore';
import { getTimedEventsForDate } from '../../utils/icsParser';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border-secondary)',
  borderRadius: 'var(--border-radius-sm)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  width: '100%',
};

export function CalendarSettings() {
  const {
    icalUrl,
    autoSync,
    lastSyncedAt,
    events,
    setIcalUrl,
    setAutoSync,
    syncCalendar,
    disconnect,
  } = useCalendarStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [localIcalUrl, setLocalIcalUrl] = useState(icalUrl || '');

  const isConnected = !!icalUrl;

  const handleSave = () => {
    if (!localIcalUrl.trim()) {
      toast.error('iCal URL is required');
      return;
    }
    setIcalUrl(localIcalUrl.trim());
    toast.success('Calendar URL saved');
  };

  const handleSync = async () => {
    if (!localIcalUrl.trim()) {
      toast.error('iCal URL is required');
      return;
    }

    // Save URL first if changed
    if (localIcalUrl.trim() !== icalUrl) {
      setIcalUrl(localIcalUrl.trim());
    }

    setIsSyncing(true);
    const result = await syncCalendar();
    setIsSyncing(false);

    if (result.success) {
      toast.success(`Synced ${result.count} events`);
    } else {
      toast.error(result.error || 'Sync failed');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setLocalIcalUrl('');
    toast.success('Calendar disconnected');
  };

  // Calculate stats
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayEvents = getTimedEventsForDate(events, today);
  const tomorrowEvents = getTimedEventsForDate(events, tomorrow);

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-3">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            iCal URL
          </label>
          <input
            type="url"
            value={localIcalUrl}
            onChange={(e) => setLocalIcalUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            style={inputStyle}
            className="focus:outline-none focus:ring-2"
          />
        </div>

        {/* Auto-sync checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Auto-sync when app loads
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSync}
          variant="primary"
          size="sm"
          className="flex-1"
          disabled={isSyncing || !localIcalUrl.trim()}
        >
          <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
        {!isConnected && (
          <Button
            onClick={handleSave}
            variant="secondary"
            size="sm"
            disabled={!localIcalUrl.trim()}
          >
            Save
          </Button>
        )}
        {isConnected && (
          <Button onClick={handleDisconnect} variant="ghost" size="sm">
            <Unlink size={14} className="mr-1" />
            Disconnect
          </Button>
        )}
      </div>

      {/* Status */}
      {lastSyncedAt && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Last synced: {format(parseISO(lastSyncedAt), 'MMM d, h:mm a')} · {events.length} events · {todayEvents.length} today, {tomorrowEvents.length} tomorrow
        </div>
      )}

      {/* Help Text */}
      <div
        className="p-3 flex items-start gap-2 text-sm"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <Info style={{ color: 'var(--accent-primary)' }} className="shrink-0 mt-0.5" size={16} />
        <div style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-2">
            <strong style={{ color: 'var(--text-primary)' }}>How to get your iCal URL:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <strong>calendar.google.com</strong> → Settings</li>
            <li>Click your calendar under "Settings for my calendars"</li>
            <li>Scroll to "Integrate calendar"</li>
            <li>Copy "Secret address in iCal format"</li>
            <li>Paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
