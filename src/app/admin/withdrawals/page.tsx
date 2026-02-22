'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  accountHolder: string;
  bankAccount: string;
  ifsc: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

type FilterStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'all';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchWithdrawals();
  }, [isLoading, user, router]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/withdrawals');
      if (!response.ok) throw new Error('Failed to fetch withdrawals');

      const data = await response.json();
      setWithdrawals(Array.isArray(data) ? data : data.withdrawals || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    try {
      setActionLoading(withdrawalId);

      const response = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) throw new Error('Failed to approve withdrawal');

      setWithdrawals(
        withdrawals.map((w) => (w.id === withdrawalId ? { ...w, status: 'approved' } : w))
      );
      alert('✓ Withdrawal approved');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (withdrawalId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(withdrawalId);

      const response = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reason }),
      });

      if (!response.ok) throw new Error('Failed to reject withdrawal');

      setWithdrawals(
        withdrawals.map((w) => (w.id === withdrawalId ? { ...w, status: 'rejected' } : w))
      );
      alert('✓ Withdrawal rejected');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (withdrawalId: string) => {
    try {
      setActionLoading(withdrawalId);

      const response = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) throw new Error('Failed to mark as completed');

      setWithdrawals(
        withdrawals.map((w) => (w.id === withdrawalId ? { ...w, status: 'completed' } : w))
      );
      alert('✓ Withdrawal marked as completed');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(
    (w) => filterStatus === 'all' || w.status === filterStatus
  );

  const stats = {
    pendingCount: withdrawals.filter((w) => w.status === 'pending').length,
    pendingAmount: withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0),
    approvedCount: withdrawals.filter((w) => w.status === 'approved').length,
    approvedAmount: withdrawals
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0),
    completedAmount: withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="text-primary hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-600">Review and approve seller withdrawal requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending Requests</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Approved (Pending)</p>
            <p className="text-2xl font-bold text-blue-600">{stats.approvedCount}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.approvedAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{withdrawals.filter((w) => w.status === 'completed').length}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.completedAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Processed</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.completedAmount + stats.approvedAmount + stats.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-4 mb-6 flex gap-2 flex-wrap">
          {(['pending', 'approved', 'completed', 'rejected', 'all'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({filteredWithdrawals.length})
            </button>
          ))}
        </div>

        {/* Withdrawals Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">Loading withdrawal requests...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Seller</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Requested</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Bank Details</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{withdrawal.sellerName || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{withdrawal.sellerId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-lg">{formatCurrency(withdrawal.amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(withdrawal.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(withdrawal.status)}`}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-600">
                          <p>{withdrawal.accountHolder}</p>
                          <p className="text-xs text-gray-500">{withdrawal.bankAccount.slice(-4)}</p>
                          <p className="text-xs text-gray-500">{withdrawal.ifsc}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(withdrawal.id)}
                                disabled={actionLoading === withdrawal.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal.id)}
                                disabled={actionLoading === withdrawal.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {withdrawal.status === 'approved' && (
                            <button
                              onClick={() => handleMarkCompleted(withdrawal.id)}
                              disabled={actionLoading === withdrawal.id}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Mark as completed"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}

                          {withdrawal.status === 'completed' && (
                            <span className="text-green-600 font-semibold text-sm">✓ Done</span>
                          )}

                          {withdrawal.status === 'rejected' && (
                            <span className="text-red-600 font-semibold text-sm">✗ Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
