import { useState, useEffect, Fragment } from 'react';
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
import { TimelineItem } from './TimelineItem';
import { NowIndicator } from './NowIndicator';
import { ProgressBar } from '../common/ProgressBar';
import { getDayProgress } from '../../utils/scheduler';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { useScheduleStore } from '../../stores/scheduleStore';

interface TimelineProps {
  schedule: ScheduledTask[];
  activeTaskId: string | null;
  onTaskClick: (taskId: string) => void;
}

export function Timeline({ schedule, activeTaskId, onTaskClick }: TimelineProps) {
  const reorderSchedule = useScheduleStore((state) => state.reorderSchedule);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
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

      {/* Timeline Items */}
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
    </div>
  );
}
