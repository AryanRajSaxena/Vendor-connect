'use client';

import { Card, CardContent, CardHeader } from './Card';
import { Badge } from './Badge';
import { CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';

interface OrderCardProps {
  productName: string;
  status: string;
  amount: number;
  date: string;
}

const statusConfig = {
  delivered: {
    icon: <CheckCircle className="w-5 h-5" />,
    variant: 'success' as const,
    label: 'Delivered',
  },
  shipped: {
    icon: <Package className="w-5 h-5" />,
    variant: 'info' as const,
    label: 'Shipped',
  },
  pending: {
    icon: <Clock className="w-5 h-5" />,
    variant: 'warning' as const,
    label: 'Pending',
  },
  cancelled: {
    icon: <AlertCircle className="w-5 h-5" />,
    variant: 'error' as const,
    label: 'Cancelled',
  },
  processing: {
    icon: <Clock className="w-5 h-5" />,
    variant: 'info' as const,
    label: 'Processing',
  },
};

export function OrderCard({
  productName,
  status,
  amount,
  date,
}: OrderCardProps) {
  const config =
    statusConfig[status.toLowerCase() as keyof typeof statusConfig] ||
    statusConfig.pending;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="hover:shadow-lg transform transition-all duration-200">
      <CardHeader
        title={productName}
        action={
          <div className="flex items-center gap-2">
            {config.icon}
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
          </div>
        }
      />
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Amount</p>
            <p className="text-white font-bold">₹{amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Date</p>
            <p className="text-white font-medium">{formattedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
