import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'var(--backdrop-blur)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--border-radius-lg)',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom: '1px solid var(--border-primary)',
                }}
              >
                <h2
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 transition-colors"
                  style={{
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
