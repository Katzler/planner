import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div
        className="w-full overflow-hidden"
        style={{
          height,
          background: 'var(--bg-input)',
          borderRadius: 'var(--border-radius-sm)',
        }}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full"
          style={{
            backgroundColor: color || 'var(--accent-primary)',
            borderRadius: 'var(--border-radius-sm)',
          }}
        />
      </div>
      {showLabel && (
        <div className="text-sm mt-1 text-right" style={{ color: 'var(--text-secondary)' }}>
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}
