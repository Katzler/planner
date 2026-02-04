import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Pause, Play, CalendarClock, X } from 'lucide-react';
import type { ScheduledTask, Timeframe } from '../../types';
import { TIMEFRAME_CONFIG } from '../../types';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { differenceInSeconds, parseISO } from 'date-fns';
import { celebrate } from '../../utils/celebrations';

interface CurrentTaskProps {
  task: ScheduledTask | null;
  onComplete: () => void;
  onPostpone?: (timeframe: Timeframe, notes: string) => void;
}

export function CurrentTask({ task, onComplete, onPostpone }: CurrentTaskProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [showPostpone, setShowPostpone] = useState(false);
  const [postponeTimeframe, setPostponeTimeframe] = useState<Timeframe>('tomorrow');
  const [postponeNotes, setPostponeNotes] = useState('');
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  const handleComplete = () => {
    celebrate({ element: doneButtonRef.current });
    onComplete();
  };

  useEffect(() => {
    if (!task || task.status !== 'active' || isPaused) return;

    const startTime = task.actualStart
      ? parseISO(task.actualStart)
      : parseISO(task.scheduledStart);

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = differenceInSeconds(now, startTime) - pausedElapsed;
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [task, isPaused, pausedElapsed]);

  useEffect(() => {
    setElapsedSeconds(0);
    setIsPaused(false);
    setPausedElapsed(0);
    setShowPostpone(false);
    setPostponeNotes('');
    setPostponeTimeframe('tomorrow');
  }, [task?.id]);

  const handlePauseToggle = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const pauseActiveRef = useRef(false);

  useEffect(() => {
    if (!isPaused || !task) {
      pauseActiveRef.current = false;
      return;
    }

    pauseActiveRef.current = true;
    const pauseStart = Date.now();

    return () => {
      if (!pauseActiveRef.current) return;
      const pauseDuration = Math.floor((Date.now() - pauseStart) / 1000);
      setPausedElapsed((prev) => prev + pauseDuration);
    };
  }, [isPaused, task]);

  const handlePostpone = () => {
    if (onPostpone) {
      onPostpone(postponeTimeframe, postponeNotes);
      setShowPostpone(false);
      setPostponeNotes('');
      setPostponeTimeframe('tomorrow');
    }
  };

  if (!task) {
    return (
      <div
        className="p-8 text-center"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
          style={{
            borderRadius: '50%',
            background: 'var(--status-success-bg)',
          }}
        >
          <Check style={{ color: 'var(--status-success)' }} size={32} />
        </motion.div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          All Done!
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          You've completed all tasks for today.
        </p>
      </div>
    );
  }

  const totalSeconds = task.duration * 60;
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const isOvertime = elapsedSeconds > totalSeconds;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const taskColor = task.color || 'var(--accent-primary)';
  const isTodo = task.sourceType === 'todo';

  return (
    <div
      className="p-6"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="px-2 py-1 text-xs font-medium uppercase"
          style={{
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: `${taskColor}20`,
            color: taskColor,
          }}
        >
          {task.sourceType === 'core' ? 'Core' : task.timeframe ? TIMEFRAME_CONFIG[task.timeframe].label : 'Todo'}
        </span>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={14} />
          <span>{task.duration} min</span>
        </div>
      </div>

      {/* Task Title */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {task.title}
      </h2>

      {/* Timer */}
      <div className="text-center mb-4">
        <div
          className="text-4xl font-mono font-bold mb-1"
          style={{
            color: isPaused
              ? 'var(--status-warning)'
              : isOvertime
              ? 'var(--status-danger)'
              : 'var(--text-primary)',
          }}
        >
          {isOvertime ? '-' : ''}
          {formatTime(isOvertime ? elapsedSeconds - totalSeconds : remainingSeconds)}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isPaused ? 'paused' : isOvertime ? 'overtime' : 'remaining'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <ProgressBar
          progress={progress}
          color={isOvertime ? 'var(--status-danger)' : taskColor}
          height={6}
        />
      </div>

      {/* Actions */}
      <div className={`grid gap-2 ${isTodo && onPostpone ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Button
          ref={doneButtonRef}
          variant="success"
          size="sm"
          onClick={handleComplete}
          className="flex items-center justify-center gap-1"
        >
          <Check size={16} />
          Done
        </Button>

        <Button
          variant={isPaused ? 'primary' : 'secondary'}
          size="sm"
          onClick={handlePauseToggle}
          className="flex items-center justify-center gap-1"
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        {isTodo && onPostpone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPostpone(!showPostpone)}
            className="flex items-center justify-center gap-1"
          >
            {showPostpone ? <X size={16} /> : <CalendarClock size={16} />}
            {showPostpone ? 'Cancel' : 'Postpone'}
          </Button>
        )}
      </div>

      {/* Postpone Panel */}
      <AnimatePresence>
        {showPostpone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 pt-4 space-y-3"
              style={{ borderTop: '1px solid var(--border-primary)' }}
            >
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Move to
                </label>
                <select
                  value={postponeTimeframe}
                  onChange={(e) => setPostponeTimeframe(e.target.value as Timeframe)}
                  className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this_week">This Week</option>
                  <option value="next_week">Next Week</option>
                  <option value="this_month">This Month</option>
                  <option value="someday">Someday</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Notes (optional)
                </label>
                <textarea
                  value={postponeNotes}
                  onChange={(e) => setPostponeNotes(e.target.value)}
                  placeholder="Why are you postponing this?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePostpone}
                className="w-full"
              >
                <CalendarClock size={16} className="mr-2" />
                Postpone Task
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
