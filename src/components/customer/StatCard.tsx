'use client';

import { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const colorStyles = {
  primary: 'bg-primary-900/30 border-primary-800 text-primary-400',
  secondary: 'bg-secondary-900/30 border-secondary-800 text-secondary-400',
  success: 'bg-green-900/30 border-green-800 text-green-400',
  warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-400',
  error: 'bg-red-900/30 border-red-800 text-red-400',
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
}: StatCardProps) {
  return (
    <Card
      className={`${colorStyles[color]} border text-center`}
      variant="flat"
    >
      <div className="space-y-3">
        {icon && (
          <div className="flex justify-center text-3xl">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {trend && trendValue && (
          <div className={`text-xs font-medium ${
            trend === 'up' ? 'text-success' : 'text-error'
          }`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
    </Card>
  );
}
