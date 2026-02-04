import { format, parseISO } from 'date-fns';
import { Coffee, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ScheduledTask } from '../../types';
import { TIMEFRAME_CONFIG } from '../../types';

interface TimelineItemProps {
  task: ScheduledTask;
  isActive: boolean;
  onClick: () => void;
}

export function TimelineItem({ task, isActive, onClick }: TimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto' as const,
  };

  const startTime = format(parseISO(task.scheduledStart), 'HH:mm');
  const endTime = format(parseISO(task.scheduledEnd), 'HH:mm');

  const isBreak = task.sourceType === 'break';
  const isCompleted = task.status === 'completed';
  const isSkipped = task.status === 'skipped';
  const timeframeConfig = task.timeframe ? TIMEFRAME_CONFIG[task.timeframe] : null;

  const getBackgroundStyle = () => {
    if (isBreak) {
      return {
        background: 'rgba(0, 0, 0, 0.15)',
        borderLeft: '3px solid var(--text-muted)',
      };
    }
    if (isActive) {
      return {
        background: 'var(--accent-bg)',
        boxShadow: '0 0 0 1px var(--accent-primary), 0 4px 20px var(--accent-bg)',
      };
    }
    if (isCompleted) {
      return {
        background: 'var(--status-success-bg)',
      };
    }
    if (isSkipped) {
      return {
        background: 'var(--bg-secondary)',
        opacity: 0.5,
      };
    }
    return {};
  };

  // Breaks should not be interactive
  const interactiveProps = isBreak
    ? {}
    : {
        onClick,
        ...attributes,
        ...listeners,
      };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...getBackgroundStyle(),
        borderRadius: 'var(--border-radius-md)',
        opacity: isBreak ? 0.7 : style.opacity,
      }}
      {...interactiveProps}
      className={`relative flex items-center gap-3 py-2 px-4 transition-colors touch-none ${
        isBreak ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'scale-[1.02]' : ''}`}
    >
      {/* Time */}
      <div className="w-12 text-right shrink-0">
        <span
          className="text-sm font-mono"
          style={{
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
          }}
        >
          {startTime}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Status indicator - inline with title */}
          {isCompleted && (
            <Check size={16} style={{ color: 'var(--status-success)' }} className="shrink-0" />
          )}
          {isBreak && (
            <Coffee size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          )}

          <span
            className={`font-medium truncate ${
              isCompleted || isSkipped ? 'line-through' : ''
            }`}
            style={{
              color:
                isCompleted || isSkipped
                  ? 'var(--text-muted)'
                  : isActive
                  ? 'var(--text-primary)'
                  : isBreak
                  ? 'var(--text-secondary)'
                  : 'var(--text-primary)',
            }}
          >
            {task.title}
          </span>

          {timeframeConfig && task.sourceType === 'todo' && (
            <span
              className="text-xs px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: `${timeframeConfig.color}20`, color: timeframeConfig.color }}
            >
              {timeframeConfig.label}
            </span>
          )}
          {task.status === 'overflow' && (
            <span className="text-xs font-medium shrink-0" style={{ color: 'var(--status-warning)' }}>
              EXTENDED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{task.duration} min</span>
          <span>•</span>
          <span>
            {startTime} - {endTime}
          </span>
          {task.sourceType === 'core' && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--accent-primary)' }}>Core</span>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
