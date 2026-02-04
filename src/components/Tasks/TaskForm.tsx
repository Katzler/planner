import { useState } from 'react';
import { Button } from '../common/Button';
import type { CoreTask, TodoItem, Timeframe } from '../../types';

interface CoreTaskFormProps {
  mode: 'core';
  initialData?: CoreTask;
  onSubmit: (data: Omit<CoreTask, 'id'>) => void;
  onCancel: () => void;
}

interface TodoFormProps {
  mode: 'todo';
  initialData?: TodoItem;
  onSubmit: (data: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  onCancel: () => void;
}

type TaskFormProps = CoreTaskFormProps | TodoFormProps;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const DURATION_OPTIONS = [
  { value: 10, label: '10 mins' },
  { value: 15, label: '15 mins' },
  { value: 30, label: '30 mins' },
  { value: 45, label: '45 mins' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 240, label: 'Half day (4h)' },
  { value: 480, label: 'Full day (8h)' },
];

const inputStyle = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-secondary)',
  borderRadius: 'var(--border-radius-md)',
  padding: '8px 16px',
  color: 'var(--text-primary)',
};

export function TaskForm(props: TaskFormProps) {
  const { mode, initialData, onSubmit, onCancel } = props;

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(
    mode === 'todo' ? (initialData as TodoItem)?.description || '' : ''
  );
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [timeframe, setTimeframe] = useState<Timeframe>(
    mode === 'todo' ? (initialData as TodoItem)?.timeframe || 'this_week' : 'this_week'
  );
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>(
    mode === 'core'
      ? (initialData as CoreTask)?.recurrence?.type || 'daily'
      : 'daily'
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    mode === 'core'
      ? (initialData as CoreTask)?.recurrence?.daysOfWeek || [1, 2, 3, 4, 5]
      : [1, 2, 3, 4, 5]
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    mode === 'core'
      ? (initialData as CoreTask)?.recurrence?.dayOfMonth || 1
      : 1
  );
  const [preferredTime, setPreferredTime] = useState<'morning' | 'midday' | 'afternoon' | 'anytime' | 'spread'>(
    mode === 'core' ? (initialData as CoreTask)?.preferredTime || 'anytime' : 'anytime'
  );
  const [timesPerDay, setTimesPerDay] = useState(
    mode === 'core' ? (initialData as CoreTask)?.timesPerDay || 1 : 1
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'core') {
      const coreTaskData: Omit<CoreTask, 'id'> = {
        title,
        duration,
        timesPerDay,
        recurrence: {
          type: recurrenceType as 'daily' | 'weekly' | 'monthly',
          ...(recurrenceType === 'weekly' || recurrenceType === 'daily'
            ? { daysOfWeek }
            : {}),
          ...(recurrenceType === 'monthly' ? { dayOfMonth } : {}),
        },
        preferredTime: timesPerDay > 1 ? 'spread' : preferredTime,
      };
      (onSubmit as CoreTaskFormProps['onSubmit'])(coreTaskData);
    } else {
      const todoData: Omit<TodoItem, 'id' | 'createdAt' | 'completed'> = {
        title,
        description: description || undefined,
        duration,
        timeframe,
      };
      (onSubmit as TodoFormProps['onSubmit'])(todoData);
    }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
          placeholder="Enter task title..."
          className="focus:outline-none focus:ring-2"
        />
      </div>

      {mode === 'todo' && (
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={inputStyle}
            placeholder="Add more details..."
            className="resize-none focus:outline-none focus:ring-2"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={inputStyle}
            className="focus:outline-none focus:ring-2"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {mode === 'todo' && (
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              When
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              style={inputStyle}
              className="focus:outline-none focus:ring-2"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this_week">This Week</option>
              <option value="next_week">Next Week</option>
              <option value="this_month">This Month</option>
              <option value="someday">Someday</option>
            </select>
          </div>
        )}

        {mode === 'core' && (
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Times Per Day
            </label>
            <select
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(Number(e.target.value))}
              style={inputStyle}
              className="focus:outline-none focus:ring-2"
            >
              <option value={1}>Once</option>
              <option value={2}>2 times</option>
              <option value={3}>3 times</option>
              <option value={4}>4 times</option>
              <option value={5}>5 times</option>
            </select>
          </div>
        )}
      </div>

      {mode === 'core' && timesPerDay === 1 && (
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Preferred Time
          </label>
          <select
            value={preferredTime}
            onChange={(e) =>
              setPreferredTime(e.target.value as typeof preferredTime)
            }
            style={inputStyle}
            className="focus:outline-none focus:ring-2"
          >
            <option value="morning">Morning</option>
            <option value="midday">Midday</option>
            <option value="afternoon">Afternoon</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
      )}

      {mode === 'core' && timesPerDay > 1 && (
        <div
          className="p-3 text-sm"
          style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--accent-primary)' }}>Note:</span> This task will be automatically spread throughout your work day ({timesPerDay} times).
        </div>
      )}

      {mode === 'core' && (
        <>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Recurrence
            </label>
            <select
              value={recurrenceType}
              onChange={(e) =>
                setRecurrenceType(e.target.value as typeof recurrenceType)
              }
              style={inputStyle}
              className="focus:outline-none focus:ring-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {(recurrenceType === 'daily' || recurrenceType === 'weekly') && (
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Days of Week
              </label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className="w-10 h-10 text-sm font-medium transition-colors"
                    style={{
                      borderRadius: 'var(--border-radius-md)',
                      background: daysOfWeek.includes(day.value)
                        ? 'var(--accent-primary)'
                        : 'var(--bg-input)',
                      color: daysOfWeek.includes(day.value)
                        ? '#ffffff'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType === 'monthly' && (
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Day of Month
              </label>
              <input
                type="number"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                min={1}
                max={31}
                style={inputStyle}
                className="focus:outline-none focus:ring-2"
              />
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initialData ? 'Update' : 'Create'} Task
        </Button>
      </div>
    </form>
  );
}
