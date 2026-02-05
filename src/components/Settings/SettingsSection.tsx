import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
  headerRight?: ReactNode;
}

export function SettingsSection({
  icon,
  title,
  description,
  defaultOpen = false,
  children,
  headerRight,
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-primary)',
        backdropFilter: 'var(--backdrop-blur)',
        WebkitBackdropFilter: 'var(--backdrop-blur)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-5 text-left"
        style={{ background: 'transparent' }}
      >
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0"
          style={{
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--accent-bg)',
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        </div>
        {headerRight && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
