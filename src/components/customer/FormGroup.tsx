'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface FormGroupProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  error,
  required,
  children,
  className,
}: FormGroupProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      <label className="block text-sm font-medium text-white">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
