import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'startup' | 'glass';

export const THEME_INFO: Record<Theme, { name: string; description: string }> = {
  startup: {
    name: 'Startup',
    description: 'Sleek dark dashboard with gradient accents',
  },
  glass: {
    name: 'Glassmorphism',
    description: 'Frosted glass over vibrant gradients',
  },
};

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'glass',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'daily-planner-theme',
    }
  )
);
