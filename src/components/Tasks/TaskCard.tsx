import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

  // Only use sortable for core tasks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isTodo });

  // For core tasks: use plain div with dnd-kit styles (no Framer Motion conflicts)
  // For todos: use Framer Motion for nice animations
  if (!isTodo) {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="px-3 py-2 cursor-grab active:cursor-grabbing touch-none"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition || undefined,
          opacity: isDragging ? 0.5 : 1,
          background: isDragging ? 'var(--accent-bg)' : 'var(--bg-card)',
          borderRadius: 'var(--border-radius-md)',
          border: isDragging ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)',
          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
        }}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {task.title}
              </h3>
              {coreTask && (
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

            <div
              className="flex items-center gap-3 mt-1.5 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {task.duration} min
              </span>
              {recurrence && (
                <span className="flex items-center gap-1">
                  <RotateCcw size={12} />
                  {RECURRENCE_LABELS[recurrence.type]}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 transition-colors"
              style={{
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-muted)',
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 transition-colors"
              style={{
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-muted)',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Todo card with Framer Motion animations
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="px-3 py-2 transition-colors"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-primary)',
        opacity: todoTask?.completed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(props as TodoCardProps).onToggleComplete}
          className="mt-0.5 w-4 h-4 flex items-center justify-center transition-colors"
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
            {todoTask?.timeframe && (
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
              className="flex items-start gap-1 mt-1.5 text-xs px-1.5 py-1"
              style={{
                background: 'var(--status-warning-bg)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--status-warning)',
              }}
            >
              <StickyNote size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{todoTask.notes}</span>
            </div>
          )}

          <div
            className="flex items-center gap-3 mt-1.5 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {task.duration} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onEdit}
            className="p-1.5 transition-colors"
            style={{
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 transition-colors"
            style={{
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
