// Work schedule per weekday
export interface DaySchedule {
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakDuration: number; // minutes between tasks
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export type DayOfWeek = keyof WeekSchedule;

// Core recurring tasks
export interface CoreTask {
  id: string;
  title: string;
  duration: number; // minutes
  timesPerDay: number; // how many times to do this task per day (1-5)
  recurrence: {
    type: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 for weekly (0 = Sunday)
    dayOfMonth?: number; // 1-31 for monthly
  };
  preferredTime: 'morning' | 'midday' | 'afternoon' | 'anytime' | 'spread'; // 'spread' = distribute throughout day
  color?: string;
}

// Timeframe options for todos
export type Timeframe = 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month' | 'someday';

// Todo items (always one-time tasks)
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  duration: number; // estimated minutes
  timeframe: Timeframe; // when this task should be done
  completed: boolean;
  createdAt: string; // ISO string
  notes?: string; // optional notes (e.g., reason for postponing)
}

// Scheduled task for a specific day
export interface ScheduledTask {
  id: string;
  sourceId: string; // CoreTask or TodoItem id
  sourceType: 'core' | 'todo' | 'break';
  title: string;
  scheduledStart: string; // ISO string
  scheduledEnd: string; // ISO string
  actualStart?: string;
  actualEnd?: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'overflow';
  duration: number; // minutes
  timeframe?: Timeframe;
  color?: string;
}

// Timeframe colors and labels
export const TIMEFRAME_CONFIG = {
  today: { color: '#ef4444', label: 'Today' },
  tomorrow: { color: '#f97316', label: 'Tomorrow' },
  this_week: { color: '#f59e0b', label: 'This Week' },
  next_week: { color: '#3b82f6', label: 'Next Week' },
  this_month: { color: '#8b5cf6', label: 'This Month' },
  someday: { color: '#64748b', label: 'Someday' },
} as const;

// Default schedule
export const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  enabled: true,
  startTime: '09:00',
  endTime: '17:00',
  breakDuration: 10,
};

export const DEFAULT_WEEK_SCHEDULE: WeekSchedule = {
  monday: { ...DEFAULT_DAY_SCHEDULE },
  tuesday: { ...DEFAULT_DAY_SCHEDULE },
  wednesday: { ...DEFAULT_DAY_SCHEDULE },
  thursday: { ...DEFAULT_DAY_SCHEDULE },
  friday: { ...DEFAULT_DAY_SCHEDULE },
  saturday: { ...DEFAULT_DAY_SCHEDULE, enabled: false },
  sunday: { ...DEFAULT_DAY_SCHEDULE, enabled: false },
};
