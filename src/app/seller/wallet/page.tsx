'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';
import {
  Wallet,
  Send,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  DollarSign,
} from 'lucide-react';

interface WalletData {
  allTimeEarnings: number;
  currentBalance: number;
  totalWithdrawn: number;
}

interface TransferHistory {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  accountNumber?: string;
}

export default function SellerWalletPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [walletData, setWalletData] = useState<WalletData>({
    allTimeEarnings: 0,
    currentBalance: 0,
    totalWithdrawn: 0,
  });
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const walletRes = await fetch(`/api/seller/wallet?sellerId=${user!.id}`);
      const historyRes = await fetch(`/api/seller/transfers?sellerId=${user!.id}`);

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletData(data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setTransferHistory(Array.isArray(data) ? data : data.transfers || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const amount = parseFloat(transferAmount);

      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount > walletData.currentBalance) {
        setError('Amount cannot exceed wallet balance');
        return;
      }

      if (!user?.accountNumber) {
        setError('Please set your account number in settings first');
        return;
      }

      setTransferLoading(true);

      const response = await fetch('/api/seller/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          amount,
          accountNumber: user.accountNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transfer failed');
      }

      setSuccess(true);
      setTransferAmount('');
      setShowTransferModal(false);
      await fetchWalletData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTransferLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== 'seller') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          Your Wallet
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your commission earnings and withdraw to your account</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg mb-5 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Transfer initiated successfully! Check your transfer history for updates.
        </div>
      )}

      {/* Main Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-90">Current Wallet Balance</span>
            <Wallet className="w-5 h-5 opacity-75" />
          </div>
          <div className="mb-4">
            <p className="text-4xl font-bold mb-2">{formatCurrency(walletData.currentBalance)}</p>
            <p className="text-xs opacity-75">Available for withdrawal</p>
          </div>
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={walletData.currentBalance <= 0}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-violet-600 font-semibold py-2.5 rounded-lg transition-all"
          >
            <Send className="w-4 h-4" />
            Transfer to Account
          </button>
        </div>

        {/* All Time Earnings */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-90">All-Time Earnings</span>
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <div className="mb-4">
            <p className="text-4xl font-bold mb-2">{formatCurrency(walletData.allTimeEarnings)}</p>
            <p className="text-xs opacity-75">Total commissions earned</p>
          </div>
          <div className="text-sm">
            <p className="opacity-75">Withdrawn: {formatCurrency(walletData.totalWithdrawn)}</p>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Transfer History
        </h2>

        {transferHistory.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No transfers yet</p>
            <p className="text-xs text-gray-400 mt-1">Once you initiate a transfer, it will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transferHistory.map((transfer, idx) => (
              <div key={transfer.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transfer.status === 'completed'
                      ? 'bg-green-100'
                      : transfer.status === 'failed'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  }`}>
                    {transfer.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : transfer.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Transfer to {transfer.accountNumber ? `***${transfer.accountNumber.slice(-4)}` : 'Account'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transfer.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(transfer.amount)}</p>
                  <p className={`text-xs font-medium ${
                    transfer.status === 'completed'
                      ? 'text-green-600'
                      : transfer.status === 'failed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer to Your Account</h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Available Balance: <span className="font-semibold text-gray-900">{formatCurrency(walletData.currentBalance)}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Transfer</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={walletData.currentBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                {transferAmount && (
                  <p className="text-xs text-gray-500 mt-2">
                    You will receive: {formatCurrency(parseFloat(transferAmount) || 0)}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Account on file:</strong> {user.accountNumber ? `***${user.accountNumber.slice(-4)}` : 'Not set'}
                </p>
                {!user.accountNumber && (
                  <p className="text-xs text-red-600 mt-1">Please set your account number in settings first.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading || !transferAmount || !user.accountNumber}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  {transferLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Transfer Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
