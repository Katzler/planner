import { motion } from 'framer-motion';
import { Clock, Pencil, Trash2, Check, RotateCcw, StickyNote } from 'lucide-react';
import type { CoreTask, TodoItem } from '../../types';
import { TIMEFRAME_CONFIG } from '../../types';

interface CoreTaskCardProps {
  task: CoreTask;
  onEdit: () => void;
  onDelete: () => void;
}

interface TodoCardProps {
  task: TodoItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

type TaskCardProps =
  | ({ type: 'core' } & CoreTaskCardProps)
  | ({ type: 'todo' } & TodoCardProps);

const RECURRENCE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function TaskCard(props: TaskCardProps) {
  const { type, task, onEdit, onDelete } = props;

  const isTodo = type === 'todo';
  const todoTask = isTodo ? (task as TodoItem) : null;
  const coreTask = !isTodo ? (task as CoreTask) : null;

  const recurrence = coreTask?.recurrence;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="p-4 transition-colors"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-primary)',
        opacity: todoTask?.completed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {isTodo && (
          <button
            onClick={(props as TodoCardProps).onToggleComplete}
            className="mt-0.5 w-5 h-5 flex items-center justify-center transition-colors"
            style={{
              borderRadius: 'var(--border-radius-sm)',
              border: todoTask?.completed
                ? '2px solid var(--status-success)'
                : '2px solid var(--text-muted)',
              background: todoTask?.completed ? 'var(--status-success)' : 'transparent',
              color: '#ffffff',
            }}
          >
            {todoTask?.completed && <Check size={12} />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-medium truncate ${todoTask?.completed ? 'line-through' : ''}`}
              style={{
                color: todoTask?.completed ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
            >
              {task.title}
            </h3>
            {isTodo && todoTask && todoTask.timeframe && (
              <span
                className="px-2 py-0.5 text-xs font-medium"
                style={{
                  borderRadius: 'var(--border-radius-lg)',
                  backgroundColor: `${TIMEFRAME_CONFIG[todoTask.timeframe].color}20`,
                  color: TIMEFRAME_CONFIG[todoTask.timeframe].color,
                }}
              >
                {TIMEFRAME_CONFIG[todoTask.timeframe].label}
              </span>
            )}
            {!isTodo && coreTask && (
              <span
                className="px-2 py-0.5 text-xs font-medium"
                style={{
                  borderRadius: 'var(--border-radius-lg)',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent-primary)',
                }}
              >
                {coreTask.preferredTime}
              </span>
            )}
          </div>

          {todoTask?.description && (
            <p
              className="text-sm mt-1 line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {todoTask.description}
            </p>
          )}

          {todoTask?.notes && (
            <div
              className="flex items-start gap-1.5 mt-2 text-sm px-2 py-1.5"
              style={{
                background: 'var(--status-warning-bg)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--status-warning)',
              }}
            >
              <StickyNote size={14} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{todoTask.notes}</span>
            </div>
          )}

          <div
            className="flex items-center gap-4 mt-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {task.duration} min
            </span>
            {recurrence && (
              <span className="flex items-center gap-1">
                <RotateCcw size={14} />
                {RECURRENCE_LABELS[recurrence.type]}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 transition-colors"
            style={{
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 transition-colors"
            style={{
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
