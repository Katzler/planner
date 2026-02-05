import { useState, useEffect, Fragment, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ScheduledTask } from '../../types';
import { TIMEFRAME_CONFIG } from '../../types';
import { TimelineItem } from './TimelineItem';
import { NowIndicator } from './NowIndicator';
import { ProgressBar } from '../common/ProgressBar';
import { getDayProgress, generateScheduleForDate, getTotalScheduledMinutes } from '../../utils/scheduler';
import { Calendar, Clock, Moon, Coffee, Target, ListTodo } from 'lucide-react';
import { format, parseISO, isBefore, isAfter, isTomorrow } from 'date-fns';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useTaskStore } from '../../stores/taskStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { CALENDAR_EVENT_COLOR } from '../../types';

type TabType = 'today' | 'upcoming';

interface TimelineProps {
  schedule: ScheduledTask[];
  activeTaskId: string | null;
  onTaskClick: (taskId: string) => void;
}

export function Timeline({ schedule, activeTaskId, onTaskClick }: TimelineProps) {
  const reorderSchedule = useScheduleStore((state) => state.reorderSchedule);
  const { getNextWorkDay, getScheduleConfigForDate } = useScheduleStore();
  const { coreTasks, todos } = useTaskStore();
  const { events: calendarEvents } = useCalendarStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Get next work day info
  const nextWorkDay = useMemo(() => getNextWorkDay(), [getNextWorkDay]);
  const nextWorkDayConfig = useMemo(
    () => getScheduleConfigForDate(nextWorkDay),
    [nextWorkDay, getScheduleConfigForDate]
  );
  const nextWorkDayLabel = useMemo(
    () => isTomorrow(nextWorkDay) ? 'Tomorrow' : format(nextWorkDay, 'EEEE'),
    [nextWorkDay]
  );

  // Generate tomorrow's schedule
  const upcomingSchedule = useMemo(() => {
    if (!nextWorkDayConfig.enabled) return [];
    return generateScheduleForDate(nextWorkDay, coreTasks, todos, nextWorkDayConfig, calendarEvents);
  }, [nextWorkDay, coreTasks, todos, nextWorkDayConfig, calendarEvents]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const progress = getDayProgress(schedule);
  const completedCount = schedule.filter(
    (t) => t.status === 'completed' && t.sourceType !== 'break'
  ).length;
  const totalCount = schedule.filter((t) => t.sourceType !== 'break').length;

  // Find where the "now" indicator should be placed
  const findNowPosition = (): number => {
    if (schedule.length === 0) return -1;

    for (let i = 0; i < schedule.length; i++) {
      const task = schedule[i];
      const taskStart = parseISO(task.scheduledStart);
      const taskEnd = parseISO(task.scheduledEnd);

      // If current time is before this task starts, show indicator before this task
      if (isBefore(currentTime, taskStart)) {
        return i;
      }

      // If current time is during this task, show indicator before this task
      if (!isBefore(currentTime, taskStart) && !isAfter(currentTime, taskEnd)) {
        return i;
      }
    }

    // Current time is after all tasks
    return schedule.length;
  };

  const nowPosition = findNowPosition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderSchedule(active.id as string, over.id as string);
    }
  };

  // Calculate upcoming schedule stats
  const upcomingTotalMinutes = getTotalScheduledMinutes(upcomingSchedule);
  const upcomingCoreCount = upcomingSchedule.filter(t => t.sourceType === 'core').length;
  const upcomingTodoCount = upcomingSchedule.filter(t => t.sourceType === 'todo').length;
  const upcomingCalendarCount = upcomingSchedule.filter(t => t.sourceType === 'calendar').length;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Tabs */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('today')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'today' ? 'var(--text-primary)' : 'var(--text-muted)',
            background: activeTab === 'today' ? 'var(--bg-secondary)' : 'transparent',
            borderTop: activeTab === 'today' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderBottom: activeTab === 'today' ? '1px solid var(--bg-secondary)' : '1px solid var(--border-primary)',
            marginBottom: '-1px',
            position: 'relative',
            zIndex: activeTab === 'today' ? 1 : 0,
          }}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-colors"
          style={{
            color: activeTab === 'upcoming' ? 'var(--text-primary)' : 'var(--text-muted)',
            background: activeTab === 'upcoming' ? 'var(--bg-secondary)' : 'transparent',
            borderTop: activeTab === 'upcoming' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderBottom: activeTab === 'upcoming' ? '1px solid var(--bg-secondary)' : '1px solid var(--border-primary)',
            marginBottom: '-1px',
            position: 'relative',
            zIndex: activeTab === 'upcoming' ? 1 : 0,
          }}
        >
          {nextWorkDayLabel}
        </button>
      </div>

      {/* Header - Today */}
      {activeTab === 'today' && (
        <div
          className="p-4"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar style={{ color: 'var(--accent-primary)' }} size={20} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Today's Schedule
              </h3>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(), 'EEEE, MMM d')}
            </span>
          </div>

          <ProgressBar progress={progress} height={6} />

          <div className="flex items-center justify-between mt-2 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>
              {completedCount} / {totalCount} tasks
            </span>
            <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>
              {Math.round(progress)}% complete
            </span>
          </div>
        </div>
      )}

      {/* Header - Upcoming */}
      {activeTab === 'upcoming' && (
        <div
          className="p-4"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar style={{ color: 'var(--accent-primary)' }} size={20} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {nextWorkDayLabel}'s Schedule
              </h3>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {format(nextWorkDay, 'EEEE, MMM d')}
            </span>
          </div>

          {nextWorkDayConfig.enabled && upcomingSchedule.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(upcomingTotalMinutes)}
                </span>
                <span className="flex items-center gap-1">
                  <Target size={14} style={{ color: 'var(--accent-primary)' }} />
                  {upcomingCoreCount} core
                </span>
                <span className="flex items-center gap-1">
                  <ListTodo size={14} style={{ color: 'var(--status-success)' }} />
                  {upcomingTodoCount} todos
                </span>
                {upcomingCalendarCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} style={{ color: CALENDAR_EVENT_COLOR }} />
                    {upcomingCalendarCount} events
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Timeline Items - Today */}
      {activeTab === 'today' && (
        <div className="p-2 max-h-[500px] overflow-y-auto">
          {schedule.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No tasks scheduled for today</p>
              <p className="text-sm mt-1">Add some tasks to get started!</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={schedule.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {schedule.map((task, index) => (
                    <Fragment key={task.id}>
                      {nowPosition === index && <NowIndicator />}
                      <TimelineItem
                        task={task}
                        isActive={task.id === activeTaskId}
                        onClick={() => onTaskClick(task.id)}
                      />
                    </Fragment>
                  ))}
                  {nowPosition === schedule.length && <NowIndicator />}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Timeline Items - Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="p-2 max-h-[500px] overflow-y-auto">
          {!nextWorkDayConfig.enabled ? (
            <div className="text-center py-8">
              <Moon size={32} className="mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {nextWorkDayLabel} is a day off
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Enjoy your rest!
              </p>
            </div>
          ) : upcomingSchedule.length === 0 ? (
            <div className="text-center py-8">
              <Coffee size={32} className="mx-auto mb-2" style={{ color: 'var(--status-success)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                No tasks scheduled yet
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Add tasks to fill your day!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingSchedule.map((task) => (
                <UpcomingTaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Read-only task item for upcoming schedule
function UpcomingTaskItem({ task }: { task: ScheduledTask }) {
  const startTime = parseISO(task.scheduledStart);
  const isBreak = task.sourceType === 'break';
  const isCore = task.sourceType === 'core';
  const isCalendar = task.sourceType === 'calendar';

  const getTaskColor = () => {
    if (isBreak) return 'var(--text-muted)';
    if (isCalendar) return task.color || CALENDAR_EVENT_COLOR;
    if (task.color) return task.color;
    if (task.timeframe) return TIMEFRAME_CONFIG[task.timeframe].color;
    return 'var(--accent-primary)';
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={{
        background: isBreak ? 'transparent' : 'var(--bg-card)',
        borderRadius: 'var(--border-radius-md)',
        border: isBreak ? 'none' : '1px solid var(--border-primary)',
        opacity: isBreak ? 0.6 : 1,
      }}
    >
      <span
        className="text-xs font-mono w-14 shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {format(startTime, 'h:mm a')}
      </span>

      <div
        className="w-1 h-5 rounded-full shrink-0"
        style={{ background: getTaskColor() }}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${isBreak ? 'italic' : 'font-medium'}`}
          style={{ color: isBreak ? 'var(--text-muted)' : 'var(--text-primary)' }}
        >
          {task.title}
        </p>
      </div>

      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
        {task.duration}m
      </span>

      {!isBreak && (
        <span
          className="text-xs px-1.5 py-0.5 shrink-0"
          style={{
            borderRadius: 'var(--border-radius-sm)',
            background: isCore ? 'var(--accent-bg)' : `${getTaskColor()}20`,
            color: isCore ? 'var(--accent-primary)' : getTaskColor(),
          }}
        >
          {isCalendar ? 'Calendar' : isCore ? 'Core' : task.timeframe ? TIMEFRAME_CONFIG[task.timeframe].label : 'Todo'}
        </span>
      )}
    </div>
  );
}
