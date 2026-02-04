import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  ListTodo,
  Settings,
  Play,
  RefreshCw,
} from 'lucide-react';

// Components
import { Timeline } from './components/Timeline/Timeline';
import { CurrentTask } from './components/Timeline/CurrentTask';
import { CoreTaskList } from './components/Tasks/CoreTaskList';
import { TodoList } from './components/Tasks/TodoList';
import { ScheduleSettings } from './components/Settings/ScheduleSettings';
import { ExportImport } from './components/Settings/ExportImport';
import { ThemeSelector } from './components/Settings/ThemeSelector';
import { Button } from './components/common/Button';

// Stores
import { useTaskStore } from './stores/taskStore';
import { useScheduleStore } from './stores/scheduleStore';
import { useThemeStore, type Theme } from './stores/themeStore';

// Hooks
import { useSunPosition } from './hooks/useSunPosition';

// Types
import type { Timeframe } from './types';

// Utils
import { generateDailySchedule } from './utils/scheduler';
import toast from 'react-hot-toast';

type Tab = 'dashboard' | 'core' | 'todos' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Stores
  const { coreTasks, todos, updateTodo } = useTaskStore();
  const { theme, setTheme } = useThemeStore();

  // Sun/moon position for glass theme
  const { cssVariables: sunVariables } = useSunPosition();

  // Apply theme to document (with fallback for invalid stored themes)
  useEffect(() => {
    const validThemes: Theme[] = ['startup', 'glass'];
    const themeToApply = validThemes.includes(theme) ? theme : 'glass';
    if (themeToApply !== theme) {
      setTheme(themeToApply);
    }
    document.documentElement.setAttribute('data-theme', themeToApply);

    // Apply sun position CSS variables for glass theme
    if (themeToApply === 'glass') {
      const root = document.documentElement;
      Object.entries(sunVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value as string);
      });
    }
  }, [theme, setTheme, sunVariables]);
  const {
    todaySchedule,
    activeTaskId,
    setTodaySchedule,
    setActiveTask,
    completeTask,
    skipTask,
    getTodayScheduleConfig,
    updateScheduledTask,
  } = useScheduleStore();

  // Generate today's schedule
  const regenerateSchedule = useCallback(() => {
    const dayConfig = getTodayScheduleConfig();
    const schedule = generateDailySchedule(coreTasks, todos, dayConfig);
    setTodaySchedule(schedule);
    toast.success('Schedule regenerated');
  }, [coreTasks, todos, getTodayScheduleConfig, setTodaySchedule]);

  // Auto-generate schedule on mount
  useEffect(() => {
    if (todaySchedule.length === 0 && (coreTasks.length > 0 || todos.length > 0)) {
      const dayConfig = getTodayScheduleConfig();
      const schedule = generateDailySchedule(coreTasks, todos, dayConfig);
      setTodaySchedule(schedule);
    }
  }, []);

  // Start the day
  const handleStartDay = () => {
    const dayConfig = getTodayScheduleConfig();
    if (!dayConfig.enabled) {
      toast.error("Today is not a work day");
      return;
    }

    const schedule = generateDailySchedule(coreTasks, todos, dayConfig);
    if (schedule.length === 0) {
      toast.error('No tasks to schedule. Add some tasks first.');
      return;
    }

    setTodaySchedule(schedule);

    // Mark first non-break task as active
    const firstTask = schedule.find((t) => t.sourceType !== 'break');
    if (firstTask) {
      setActiveTask(firstTask.id);
      updateScheduledTask(firstTask.id, {
        status: 'active',
        actualStart: new Date().toISOString(),
      });
    }

    toast.success('Day started');
  };

  // Handle task completion
  const handleCompleteTask = () => {
    if (!activeTaskId) return;

    const { completed, nextTask } = completeTask(activeTaskId);
    if (!completed) return;

    // If it was a todo, mark the source todo as completed
    if (completed.sourceType === 'todo') {
      updateTodo(completed.sourceId, { completed: true });
    }

    // Activate next task
    if (nextTask) {
      updateScheduledTask(nextTask.id, {
        status: 'active',
        actualStart: new Date().toISOString(),
      });
    }
  };

  // Handle postponing a todo task
  const handlePostponeTask = (newTimeframe: Timeframe, notes: string) => {
    if (!activeTaskId) return;

    const task = todaySchedule.find((t) => t.id === activeTaskId);
    if (!task || task.sourceType !== 'todo') return;

    // Update the todo with new timeframe and notes
    updateTodo(task.sourceId, {
      timeframe: newTimeframe,
      notes: notes || undefined,
    });

    // Find next task before skipping
    const taskIndex = todaySchedule.findIndex((t) => t.id === activeTaskId);
    const nextTask = todaySchedule.slice(taskIndex + 1).find((t) => t.sourceType !== 'break');

    // Skip the current task in schedule
    skipTask(activeTaskId);

    // Activate next task
    if (nextTask) {
      updateScheduledTask(nextTask.id, {
        status: 'active',
        actualStart: new Date().toISOString(),
      });
    }

    toast.success(`Task moved to ${newTimeframe.replace('_', ' ')}`);
  };

  // Get active task
  const activeTask = todaySchedule.find((t) => t.id === activeTaskId) || null;
  const hasStartedDay = todaySchedule.some((t) => t.status !== 'pending');

  // Navigation items
  const navItems = [
    { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Today' },
    { id: 'core' as Tab, icon: Target, label: 'Core Tasks' },
    { id: 'todos' as Tab, icon: ListTodo, label: 'Todos' },
    { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          },
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          backdropFilter: 'var(--backdrop-blur)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Planner
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-48 shrink-0">
            <div
              className="p-2 sticky top-20"
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid var(--border-primary)',
              }}
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderRadius: 'var(--border-radius-md)',
                    background: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                    color: activeTab === item.id ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  <item.icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {/* Left Column - Current Task */}
                  <div className="space-y-4">
                    {!hasStartedDay ? (
                      <div
                        className="p-8 text-center"
                        style={{
                          background: 'var(--bg-card)',
                          borderRadius: 'var(--border-radius-lg)',
                          border: '1px solid var(--border-primary)',
                        }}
                      >
                        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good morning';
                            if (hour < 17) return 'Good afternoon';
                            return 'Good evening';
                          })()}
                        </h2>
                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                          {coreTasks.length} core tasks, {todos.filter((t) => !t.completed).length} todos
                        </p>
                        <Button onClick={handleStartDay} size="lg">
                          <Play size={18} className="mr-2" />
                          Start Day
                        </Button>
                      </div>
                    ) : (
                      <CurrentTask
                        task={activeTask}
                        onComplete={handleCompleteTask}
                        onPostpone={handlePostponeTask}
                      />
                    )}

                    {hasStartedDay && (
                      <Button
                        variant="ghost"
                        onClick={regenerateSchedule}
                        className="w-full"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Regenerate Schedule
                      </Button>
                    )}
                  </div>

                  {/* Right Column - Timeline */}
                  <div>
                    <Timeline
                      schedule={todaySchedule}
                      activeTaskId={activeTaskId}
                      onTaskClick={(id) => {
                        const task = todaySchedule.find((t) => t.id === id);
                        // Allow switching to pending or skipped tasks (not completed or breaks)
                        if (task && (task.status === 'pending' || task.status === 'skipped') && task.sourceType !== 'break') {
                          if (activeTaskId && activeTaskId !== id) {
                            // Put current task back to pending so user can return to it
                            updateScheduledTask(activeTaskId, { status: 'pending' });
                          }
                          setActiveTask(id);
                          updateScheduledTask(id, {
                            status: 'active',
                            actualStart: new Date().toISOString(),
                          });
                        }
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'core' && (
                <motion.div
                  key="core"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CoreTaskList />
                </motion.div>
              )}

              {activeTab === 'todos' && (
                <motion.div
                  key="todos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TodoList />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <ThemeSelector />
                  <ScheduleSettings />
                  <ExportImport />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
