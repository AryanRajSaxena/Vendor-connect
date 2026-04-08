'use client';

import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={clsx(
            'w-5 h-5 rounded border-2 border-gray-700 bg-gray-800',
            'cursor-pointer transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'checked:bg-primary-500 checked:border-primary-500',
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-sm text-gray-300 select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
