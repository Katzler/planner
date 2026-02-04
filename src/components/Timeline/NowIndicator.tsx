import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function NowIndicator() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center my-1">
      {/* Time label */}
      <div
        className="w-12 text-right shrink-0 pr-2"
        style={{ color: 'var(--status-danger)' }}
      >
        <span className="text-xs font-mono font-semibold">
          {format(currentTime, 'HH:mm')}
        </span>
      </div>

      {/* Line */}
      <div className="flex-1 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--status-danger)' }}
        />
        <div
          className="flex-1 h-0.5"
          style={{ background: 'var(--status-danger)' }}
        />
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger)',
          }}
        >
          NOW
        </span>
      </div>
    </div>
  );
}
