interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
  label?: string;
}

export function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
  label = 'Progress',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div
        className="w-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{
          height,
          background: 'var(--bg-input)',
          borderRadius: 'var(--border-radius-sm)',
        }}
      >
        <div
          className="h-full"
          style={{
            width: `${clampedProgress}%`,
            transition: 'width 0.5s ease-out',
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
