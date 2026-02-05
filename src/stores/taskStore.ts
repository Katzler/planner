import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, addWeeks, parseISO } from 'date-fns';
import type { CoreTask, TodoItem } from '../types';

interface TaskState {
  coreTasks: CoreTask[];
  todos: TodoItem[];
  lastRolloverDate: string | null;

  // Core Task Actions
  addCoreTask: (task: Omit<CoreTask, 'id'>) => void;
  updateCoreTask: (id: string, updates: Partial<CoreTask>) => void;
  deleteCoreTask: (id: string) => void;
  reorderCoreTasks: (activeId: string, overId: string) => void;

  // Todo Actions
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;

  // Bulk operations
  clearCompletedTodos: () => void;

  // Date rollover
  rolloverTimeframes: () => void;
}

const generateId = () => crypto.randomUUID().split('-')[0];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      coreTasks: [],
      todos: [],
      lastRolloverDate: null,

      addCoreTask: (task) =>
        set((state) => ({
          coreTasks: [...state.coreTasks, { ...task, id: generateId(), timesPerDay: task.timesPerDay || 1 }],
        })),

      updateCoreTask: (id, updates) =>
        set((state) => ({
          coreTasks: state.coreTasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      deleteCoreTask: (id) =>
        set((state) => ({
          coreTasks: state.coreTasks.filter((task) => task.id !== id),
        })),

      reorderCoreTasks: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.coreTasks.findIndex((t) => t.id === activeId);
          const newIndex = state.coreTasks.findIndex((t) => t.id === overId);

          if (oldIndex === -1 || newIndex === -1) return state;

          const newTasks = [...state.coreTasks];
          const [removed] = newTasks.splice(oldIndex, 1);
          newTasks.splice(newIndex, 0, removed);

          return { coreTasks: newTasks };
        }),

      addTodo: (todo) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              ...todo,
              id: generateId(),
              createdAt: new Date().toISOString(),
              completed: false,
            },
          ],
        })),

      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates } : todo
          ),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),

      toggleTodoComplete: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),

      clearCompletedTodos: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),

      rolloverTimeframes: () => {
        const now = new Date();
        const today = startOfDay(now).toISOString();
        const state = get();

        if (state.lastRolloverDate === today) return;

        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const currentMonthStart = startOfMonth(now);

        set({
          lastRolloverDate: today,
          todos: state.todos.map((todo) => {
            if (todo.completed) return todo;

            const createdAt = parseISO(todo.createdAt);

            switch (todo.timeframe) {
              case 'tomorrow':
                return { ...todo, timeframe: 'today' as const };

              case 'this_week': {
                // If created in a previous week, it's overdue
                const createdWeekEnd = endOfWeek(createdAt, { weekStartsOn: 1 });
                if (isBefore(createdWeekEnd, currentWeekStart)) {
                  return { ...todo, timeframe: 'today' as const };
                }
                return todo;
              }

              case 'next_week': {
                // "Next week" from creation = the week after createdAt's week
                const targetWeekStart = startOfWeek(addWeeks(createdAt, 1), { weekStartsOn: 1 });
                const targetWeekEnd = endOfWeek(addWeeks(createdAt, 1), { weekStartsOn: 1 });
                // If we're past that week entirely, it's overdue
                if (isBefore(targetWeekEnd, currentWeekStart)) {
                  return { ...todo, timeframe: 'today' as const };
                }
                // If we're now in that week, promote to "this_week"
                if (!isBefore(now, targetWeekStart)) {
                  return { ...todo, timeframe: 'this_week' as const };
                }
                return todo;
              }

              case 'this_month': {
                // If created in a previous month, it's overdue
                const createdMonthEnd = endOfMonth(createdAt);
                if (isBefore(createdMonthEnd, currentMonthStart)) {
                  return { ...todo, timeframe: 'today' as const };
                }
                return todo;
              }

              default:
                return todo;
            }
          }),
        });
      },
    }),
    {
      name: 'daily-planner-tasks',
    }
  )
);
