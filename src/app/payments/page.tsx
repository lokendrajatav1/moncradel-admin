"use client";

import { useState, useEffect } from 'react';
import { Search, Download, CheckCircle, XCircle, Clock, IndianRupee, Filter } from 'lucide-react';
import { showError } from '@/utils/alert';
import api from '@/utils/api';
import { downloadCSV } from '@/utils/exportCsv';

interface Payment {
  _id: string;
  transactionId?: string;
  userId: { name: string; email?: string; phone?: string };
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: 'text-green-500', text: 'text-green-700', bg: 'bg-green-50', label: 'Success' },
  failed:  { icon: XCircle,    color: 'text-red-500',   text: 'text-red-700',   bg: 'bg-red-50',   label: 'Failed'  },
  pending: { icon: Clock,      color: 'text-yellow-500',text: 'text-yellow-700',bg: 'bg-yellow-50',label: 'Pending' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const { data } = await api.get(`/payments?${params}`);
      if (data.success) {
        setPayments(data.data);
        setTotal(data.total || 0);
        setTotalRevenue(data.totalRevenue || 0);
      }
    } catch (error: any) {
      showError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    
    const exportData = payments.map(p => ({
      'TXN ID': p.transactionId || p._id.slice(-10).toUpperCase(),
      'User Name': p.userId?.name || 'Unknown',
      'User Phone': p.userId?.phone || '',
      'Amount (₹)': p.amount,
      'Status': p.status,
      'Date': new Date(p.createdAt).toLocaleString()
    }));
    
    downloadCSV(exportData, 'Payments_Export');
  };

  const filtered = payments.filter(p => {
    const txn = (p.transactionId || p._id).toLowerCase();
    const name = p.userId?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return txn.includes(q) || name.includes(q);
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Revenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">All transactions across the platform</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search TXN ID or user name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto whitespace-nowrap shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full">
            <IndianRupee className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '...' : `₹${totalRevenue.toLocaleString()}`}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '...' : total.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Filter className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Showing (this page)</p>
            <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 pt-0">

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No payments found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((payment) => {
                  const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {payment.transactionId || payment._id.slice(-12).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {payment.userId?.name || 'Unknown'}
                        {payment.userId?.phone && (
                          <div className="text-xs text-gray-400 font-normal">{payment.userId.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{payment.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(payment.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0">
            <span>Page {page} of {totalPages} · {total} total transactions</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
              >Previous</button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

