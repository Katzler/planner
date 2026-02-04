import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays } from 'date-fns';
import type {
  WeekSchedule,
  DaySchedule,
  DayOfWeek,
  ScheduledTask,
} from '../types';
import { DEFAULT_WEEK_SCHEDULE } from '../types';

interface ScheduleState {
  weekSchedule: WeekSchedule;
  todaySchedule: ScheduledTask[];
  activeTaskId: string | null;

  // Schedule Actions
  updateDaySchedule: (day: DayOfWeek, schedule: Partial<DaySchedule>) => void;
  setWeekSchedule: (schedule: WeekSchedule) => void;

  // Today's Schedule Actions
  setTodaySchedule: (tasks: ScheduledTask[]) => void;
  updateScheduledTask: (id: string, updates: Partial<ScheduledTask>) => void;
  setActiveTask: (id: string | null) => void;
  completeTask: (id: string) => { completed: ScheduledTask | null; nextTask: ScheduledTask | null };
  skipTask: (id: string) => void;
  extendTask: (id: string, minutes: number) => void;
  reorderSchedule: (activeId: string, overId: string) => void;

  // Helpers
  getTodayScheduleConfig: () => DaySchedule;
  getCurrentDayKey: () => DayOfWeek;
  getScheduleConfigForDate: (date: Date) => DaySchedule;
  getDayKeyForDate: (date: Date) => DayOfWeek;
  getNextWorkDay: () => Date;
}


export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      weekSchedule: DEFAULT_WEEK_SCHEDULE,
      todaySchedule: [],
      activeTaskId: null,

      updateDaySchedule: (day, schedule) =>
        set((state) => ({
          weekSchedule: {
            ...state.weekSchedule,
            [day]: { ...state.weekSchedule[day], ...schedule },
          },
        })),

      setWeekSchedule: (schedule) =>
        set({ weekSchedule: schedule }),

      setTodaySchedule: (tasks) =>
        set({ todaySchedule: tasks, activeTaskId: tasks.length > 0 ? tasks[0].id : null }),

      updateScheduledTask: (id, updates) =>
        set((state) => ({
          todaySchedule: state.todaySchedule.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      setActiveTask: (id) =>
        set({ activeTaskId: id }),

      completeTask: (id) => {
        const state = get();
        const taskIndex = state.todaySchedule.findIndex((t) => t.id === id);
        const task = state.todaySchedule[taskIndex];

        if (!task) return { completed: null, nextTask: null };

        const completedTask = {
          ...task,
          status: 'completed' as const,
          actualEnd: new Date().toISOString(),
        };

        const nextTask = state.todaySchedule[taskIndex + 1] || null;

        set((state) => ({
          todaySchedule: state.todaySchedule.map((t) =>
            t.id === id ? completedTask : t
          ),
          activeTaskId: nextTask?.id || null,
        }));

        return { completed: completedTask, nextTask };
      },

      skipTask: (id) =>
        set((state) => {
          const taskIndex = state.todaySchedule.findIndex((t) => t.id === id);
          const nextTask = state.todaySchedule[taskIndex + 1] || null;

          return {
            todaySchedule: state.todaySchedule.map((task) =>
              task.id === id ? { ...task, status: 'skipped' as const } : task
            ),
            activeTaskId: nextTask?.id || null,
          };
        }),

      extendTask: (id, minutes) =>
        set((state) => ({
          todaySchedule: state.todaySchedule.map((task) => {
            if (task.id === id) {
              const newEnd = new Date(task.scheduledEnd);
              newEnd.setMinutes(newEnd.getMinutes() + minutes);
              return {
                ...task,
                scheduledEnd: newEnd.toISOString(),
                duration: task.duration + minutes,
                status: 'overflow' as const,
              };
            }
            return task;
          }),
        })),

      reorderSchedule: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.todaySchedule.findIndex((t) => t.id === activeId);
          const newIndex = state.todaySchedule.findIndex((t) => t.id === overId);

          if (oldIndex === -1 || newIndex === -1) return state;

          const newSchedule = [...state.todaySchedule];
          const [removed] = newSchedule.splice(oldIndex, 1);
          newSchedule.splice(newIndex, 0, removed);

          return { todaySchedule: newSchedule };
        }),

      getCurrentDayKey: () => {
        const days: DayOfWeek[] = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        return days[new Date().getDay()];
      },

      getTodayScheduleConfig: () => {
        const state = get();
        const dayKey = state.getCurrentDayKey();
        return state.weekSchedule[dayKey];
      },

      getDayKeyForDate: (date: Date) => {
        const days: DayOfWeek[] = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        return days[date.getDay()];
      },

      getScheduleConfigForDate: (date: Date) => {
        const state = get();
        const dayKey = state.getDayKeyForDate(date);
        return state.weekSchedule[dayKey];
      },

      getNextWorkDay: () => {
        const state = get();
        let checkDate = addDays(new Date(), 1); // Start from tomorrow

        // Check up to 7 days ahead to find the next work day
        for (let i = 0; i < 7; i++) {
          const dayConfig = state.getScheduleConfigForDate(checkDate);
          if (dayConfig.enabled) {
            return checkDate;
          }
          checkDate = addDays(checkDate, 1);
        }

        // Fallback to tomorrow if no work days found (shouldn't happen)
        return addDays(new Date(), 1);
      },
    }),
    {
      name: 'daily-planner-schedule',
      partialize: (state) => ({
        weekSchedule: state.weekSchedule,
      }),
    }
  )
);
