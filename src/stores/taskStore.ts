import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CoreTask, TodoItem } from '../types';

interface TaskState {
  coreTasks: CoreTask[];
  todos: TodoItem[];

  // Core Task Actions
  addCoreTask: (task: Omit<CoreTask, 'id'>) => void;
  updateCoreTask: (id: string, updates: Partial<CoreTask>) => void;
  deleteCoreTask: (id: string) => void;

  // Todo Actions
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;

  // Bulk operations
  clearCompletedTodos: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      coreTasks: [],
      todos: [],

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
    }),
    {
      name: 'daily-planner-tasks',
    }
  )
);
