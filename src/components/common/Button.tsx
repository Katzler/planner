import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const getVariantStyles = (variant: ButtonProps['variant']): CSSProperties => {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--accent-primary)',
        color: '#ffffff',
        border: 'none',
      };
    case 'secondary':
      return {
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
      };
    case 'success':
      return {
        background: 'var(--status-success)',
        color: '#ffffff',
      };
    case 'danger':
      return {
        background: 'var(--status-danger)',
        color: '#ffffff',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid transparent',
      };
    default:
      return {
        background: 'var(--accent-primary)',
        color: '#ffffff',
      };
  }
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, style, ...props }, ref) => {
    const variantStyles = getVariantStyles(variant);

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          ${sizes[size]}
          font-medium transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2
          inline-flex items-center justify-center
          ${className}
        `}
        style={{
          ...variantStyles,
          borderRadius: 'var(--border-radius-md)',
          ...style,
        }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
