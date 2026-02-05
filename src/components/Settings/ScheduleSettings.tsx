import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { DayOfWeek, DaySchedule } from '../../types';
import { DEFAULT_WEEK_SCHEDULE } from '../../types';
import toast from 'react-hot-toast';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border-secondary)',
  borderRadius: 'var(--border-radius-sm)',
  padding: '6px 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
};

interface DayRowProps {
  day: DayOfWeek;
  label: string;
  schedule: DaySchedule;
  onChange: (updates: Partial<DaySchedule>) => void;
}

function DayRow({ label, schedule, onChange }: DayRowProps) {
  // Validate times - startTime must be before endTime
  const isTimeInvalid = schedule.enabled && schedule.startTime >= schedule.endTime;

  const timeInputStyle = {
    ...inputStyle,
    ...(isTimeInvalid && {
      borderColor: 'var(--status-danger)',
      background: 'var(--status-danger-bg)',
    }),
  };

  return (
    <motion.div
      layout
      className="flex flex-col gap-2"
    >
      <div
        className="flex items-center gap-4 p-4 transition-colors"
        style={{
          borderRadius: 'var(--border-radius-md)',
          background: schedule.enabled ? 'var(--bg-input)' : 'var(--bg-secondary)',
          opacity: schedule.enabled ? 1 : 0.6,
        }}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="w-5 h-5"
            style={{
              accentColor: 'var(--accent-primary)',
            }}
          />
          <span className="w-24 font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
        </label>

        <div className="flex items-center gap-2">
          <input
            type="time"
            value={schedule.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            disabled={!schedule.enabled}
            style={timeInputStyle}
            className="focus:outline-none focus:ring-2 disabled:opacity-50"
            aria-invalid={isTimeInvalid}
          />
          <span style={{ color: 'var(--text-secondary)' }}>to</span>
          <input
            type="time"
            value={schedule.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            disabled={!schedule.enabled}
            style={timeInputStyle}
            className="focus:outline-none focus:ring-2 disabled:opacity-50"
            aria-invalid={isTimeInvalid}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Break:
          </span>
          <input
            type="number"
            value={schedule.breakDuration}
            onChange={(e) => onChange({ breakDuration: Number(e.target.value) })}
            disabled={!schedule.enabled}
            min={0}
            max={60}
            style={{ ...inputStyle, width: '64px' }}
            className="focus:outline-none focus:ring-2 disabled:opacity-50"
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            min
          </span>
        </div>
      </div>
      {isTimeInvalid && (
        <p className="text-xs pl-4" style={{ color: 'var(--status-danger)' }}>
          End time must be after start time
        </p>
      )}
    </motion.div>
  );
}

export function ScheduleSettings() {
  const { weekSchedule, updateDaySchedule, setWeekSchedule } = useScheduleStore();
  const [hasChanges, setHasChanges] = useState(false);

  const handleDayChange = (day: DayOfWeek, updates: Partial<DaySchedule>) => {
    updateDaySchedule(day, updates);
    setHasChanges(true);
  };

  const handleReset = () => {
    setWeekSchedule(DEFAULT_WEEK_SCHEDULE);
    setHasChanges(false);
    toast.success('Schedule reset to defaults');
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Schedule saved!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw size={16} className="mr-1" />
          Reset
        </Button>
        {hasChanges && (
          <Button variant="primary" size="sm" onClick={handleSave}>
            <Save size={16} className="mr-1" />
            Save
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, label }) => (
          <DayRow
            key={key}
            day={key}
            label={label}
            schedule={weekSchedule[key]}
            onChange={(updates) => handleDayChange(key, updates)}
          />
        ))}
      </div>

      <div
        className="p-4"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Tips
        </h3>
        <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>• Break duration is automatically added between tasks</li>
          <li>• Disable days you don't work (weekends, etc.)</li>
          <li>• Tasks will only be scheduled within your work hours</li>
        </ul>
      </div>
    </div>
  );
}
