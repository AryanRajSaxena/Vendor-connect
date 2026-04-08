'use client';

import clsx from 'clsx';

interface BadgeProps {
  children: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-gray-800 text-gray-300',
  success: 'bg-green-900/40 text-green-300 border border-green-800',
  warning: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  error: 'bg-red-900/40 text-red-300 border border-red-800',
  info: 'bg-blue-900/40 text-blue-300 border border-blue-800',
  primary: 'bg-primary-900/40 text-primary-300 border border-primary-800',
  secondary: 'bg-secondary-900/40 text-secondary-300 border border-secondary-800',
};

const sizes = {
  sm: 'px-2 py-1 text-xs font-medium rounded',
  md: 'px-3 py-1.5 text-sm font-semibold rounded-md',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={clsx(variants[variant], sizes[size])}>
      {children}
    </span>
  );
}
