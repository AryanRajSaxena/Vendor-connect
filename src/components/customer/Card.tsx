'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({
  children,
  className,
  onClick,
  variant = 'default',
}: CardProps) {
  const baseStyles = 'rounded-lg p-6 transition-all duration-200';
  
  const variants = {
    default: 'bg-gray-900 border border-gray-800 shadow-soft hover:shadow-medium',
    elevated: 'bg-gray-800 border border-gray-700 shadow-medium hover:shadow-large',
    flat: 'bg-gray-900 border border-gray-800',
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function CardHeader({ title, subtitle, action, children }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-800">
      <div className="flex-1">
        {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx('space-y-4', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('pt-4 border-t border-gray-800 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}
