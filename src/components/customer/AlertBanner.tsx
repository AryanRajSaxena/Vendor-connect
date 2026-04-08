'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertBannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  icon?: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}

const variants = {
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-l-4 border-blue-500',
    textColor: 'text-blue-300',
  },
  success: {
    bg: 'bg-green-900/20',
    border: 'border-l-4 border-green-500',
    textColor: 'text-green-300',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-l-4 border-yellow-500',
    textColor: 'text-yellow-300',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-l-4 border-red-500',
    textColor: 'text-red-300',
  },
};

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function AlertBanner({
  variant = 'info',
  title,
  message,
  icon: customIcon,
  onClose,
  dismissible = true,
}: AlertBannerProps) {
  const config = variants[variant];
  const IconComponent = customIcon ? null : iconMap[variant];

  return (
    <div
      className={clsx(
        'rounded-lg p-4 flex items-start gap-3',
        config.bg,
        config.border
      )}
    >
      {IconComponent ? (
        <IconComponent className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.textColor)} />
      ) : customIcon ? (
        <div className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.textColor)}>
          {customIcon}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={clsx('font-semibold mb-1', config.textColor)}>
            {title}
          </h4>
        )}
        <p className="text-sm text-gray-300">{message}</p>
      </div>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-300 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
