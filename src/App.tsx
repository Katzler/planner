import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  ListTodo,
  Settings,
  Play,
  RefreshCw,
  Clock,
  Palette,
  Calendar,
  Download,
} from 'lucide-react';

// Components
import { Timeline } from './components/Timeline/Timeline';
import { CurrentTask } from './components/Timeline/CurrentTask';
import { CoreTaskList } from './components/Tasks/CoreTaskList';
import { TodoList } from './components/Tasks/TodoList';
import { ScheduleSettings } from './components/Settings/ScheduleSettings';
import { CalendarSettings } from './components/Settings/CalendarSettings';
import { ExportImport } from './components/Settings/ExportImport';
import { ThemeSelector } from './components/Settings/ThemeSelector';
import { SettingsSection } from './components/Settings/SettingsSection';
import { Button } from './components/common/Button';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ProgressBar } from './components/common/ProgressBar';
import { MusicPlayer } from './components/common/MusicPlayer';

// Stores
import { useTaskStore } from './stores/taskStore';
import { useScheduleStore } from './stores/scheduleStore';
import { useCalendarStore } from './stores/calendarStore';
import { useThemeStore, type Theme } from './stores/themeStore';

// Hooks
import { useSunPosition } from './hooks/useSunPosition';

// Types
import type { Timeframe } from './types';

// Utils
import { generateDailySchedule, getTotalScheduledMinutes } from './utils/scheduler';
import toast from 'react-hot-toast';
import { format, addMinutes, parse } from 'date-fns';

type Tab = 'dashboard' | 'core' | 'todos' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const currentTaskRef = useRef<{ togglePause: () => void } | null>(null);

  // Stores
  const { coreTasks, todos, updateTodo, rolloverTimeframes } = useTaskStore();
  const { events: calendarEvents, autoSync, icalUrl, syncCalendar } = useCalendarStore();
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
  const doRegenerateSchedule = useCallback(() => {
    const dayConfig = getTodayScheduleConfig();
    const schedule = generateDailySchedule(coreTasks, todos, dayConfig, calendarEvents);
    setTodaySchedule(schedule);
    toast.success('Schedule regenerated');
    setShowRegenerateConfirm(false);
  }, [coreTasks, todos, calendarEvents, getTodayScheduleConfig, setTodaySchedule]);

  const regenerateSchedule = useCallback(() => {
    // Show confirmation if day has started (to warn about losing manual reordering)
    if (todaySchedule.some((t) => t.status !== 'pending')) {
      setShowRegenerateConfirm(true);
    } else {
      doRegenerateSchedule();
    }
  }, [todaySchedule, doRegenerateSchedule]);

  // Roll over timeframes on mount (e.g. "tomorrow" → "today")
  useEffect(() => {
    rolloverTimeframes();
  }, []);

  // Auto-sync calendar on mount, then regenerate schedule with new events
  useEffect(() => {
    if (autoSync && icalUrl) {
      syncCalendar().then((result) => {
        if (result.success && result.count > 0) {
          const dayConfig = getTodayScheduleConfig();
          const freshEvents = useCalendarStore.getState().events;
          const schedule = generateDailySchedule(coreTasks, todos, dayConfig, freshEvents);
          setTodaySchedule(schedule);
        }
      });
    }
  }, []);

  // Auto-generate schedule on mount
  useEffect(() => {
    if (todaySchedule.length === 0 && (coreTasks.length > 0 || todos.length > 0)) {
      const dayConfig = getTodayScheduleConfig();
      const schedule = generateDailySchedule(coreTasks, todos, dayConfig, calendarEvents);
      setTodaySchedule(schedule);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space = Complete current task (only on dashboard)
      if (e.key === ' ' && activeTab === 'dashboard' && activeTaskId) {
        e.preventDefault();
        handleCompleteTask();
      }

      // P = Toggle pause
      if ((e.key === 'p' || e.key === 'P') && activeTab === 'dashboard') {
        e.preventDefault();
        currentTaskRef.current?.togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeTaskId]);

  // Start the day
  const handleStartDay = () => {
    const dayConfig = getTodayScheduleConfig();
    if (!dayConfig.enabled) {
      toast.error("Today is not a work day");
      return;
    }

    const schedule = generateDailySchedule(coreTasks, todos, dayConfig, calendarEvents);
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

  // Calculate dashboard metrics
  const dayConfig = getTodayScheduleConfig();
  const totalScheduledMinutes = getTotalScheduledMinutes(todaySchedule);
  const startTime = parse(dayConfig.startTime, 'HH:mm', new Date());
  const endTime = parse(dayConfig.endTime, 'HH:mm', new Date());
  const availableMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / 60000);
  const scheduledPercentage = availableMinutes > 0 ? Math.min((totalScheduledMinutes / availableMinutes) * 100, 100) : 0;
  const estimatedEndTime = totalScheduledMinutes > 0
    ? format(addMinutes(startTime, totalScheduledMinutes), 'h:mm a')
    : null;

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

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

      {/* Header with Navigation */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          backdropFilter: 'var(--backdrop-blur)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-primary)' }}
          >
            Planner
          </button>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {navItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-2 px-4 py-1.5 transition-all"
                style={{
                  borderRadius: '9999px',
                  background: activeTab === item.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === item.id ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                <item.icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side: Music Player + Settings */}
          <div className="flex items-center gap-2">
            <MusicPlayer />

            {/* Settings Button */}
            <button
            onClick={() => setActiveTab('settings')}
            className="p-2 transition-all"
            style={{
              borderRadius: '9999px',
              background: activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'settings' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <Settings size={20} />
          </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Main Content */}
        <main>
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
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                          {todaySchedule.filter((t) => t.sourceType === 'core').length} core tasks, {todaySchedule.filter((t) => t.sourceType === 'todo').length} todos
                        </p>

                        {/* Dashboard Metrics */}
                        {totalScheduledMinutes > 0 && (
                          <div
                            className="mb-6 p-4 text-left"
                            style={{
                              background: 'var(--bg-secondary)',
                              borderRadius: 'var(--border-radius-md)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Today's Schedule
                              </span>
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {formatDuration(totalScheduledMinutes)}
                              </span>
                            </div>
                            <ProgressBar
                              progress={scheduledPercentage}
                              height={6}
                              color={scheduledPercentage > 100 ? 'var(--status-danger)' : 'var(--accent-primary)'}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {Math.round(scheduledPercentage)}% filled
                              </span>
                              {estimatedEndTime && (
                                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                  <Clock size={12} />
                                  Est. done by {estimatedEndTime}
                                </span>
                              )}
                            </div>
                            {scheduledPercentage > 100 && (
                              <p className="text-xs mt-2" style={{ color: 'var(--status-danger)' }}>
                                ⚠️ Overbooked! Consider reducing tasks or extending work hours.
                              </p>
                            )}
                          </div>
                        )}

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
                  className="space-y-4"
                >
                  <SettingsSection
                    icon={<Palette style={{ color: 'var(--accent-primary)' }} size={20} />}
                    title="Theme"
                    description="Choose your visual style"
                    defaultOpen
                  >
                    <ThemeSelector />
                  </SettingsSection>
                  <SettingsSection
                    icon={<Clock style={{ color: 'var(--accent-primary)' }} size={20} />}
                    title="Work Schedule"
                    description="Configure your working hours for each day"
                  >
                    <ScheduleSettings />
                  </SettingsSection>
                  <SettingsSection
                    icon={<Calendar style={{ color: 'var(--accent-primary)' }} size={20} />}
                    title="Calendar Connection"
                    description="Import events from your calendar via iCal"
                  >
                    <CalendarSettings />
                  </SettingsSection>
                  <SettingsSection
                    icon={<Download style={{ color: 'var(--accent-primary)' }} size={20} />}
                    title="Backup & Restore"
                    description="Export or restore your data"
                  >
                    <ExportImport />
                  </SettingsSection>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
      </div>

      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        title="Regenerate Schedule"
        message="This will reset your schedule and any manual reordering you've done. Are you sure you want to continue?"
        confirmLabel="Regenerate"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={doRegenerateSchedule}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </div>
  );
}

export default App;
