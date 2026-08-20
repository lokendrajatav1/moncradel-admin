"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, Clock, Plus, Trash2, Edit2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete, confirmAction } from '@/utils/alert';
import api from '@/utils/api';
import Modal from '@/components/Modal';

interface Earning {
  _id: string;
  staffId: { _id: string; name: string; phone?: string };
  staffRole: 'delivery' | 'doctor' | 'kitchen';
  orderId?: { _id: string; totalAmount: number };
  appointmentId?: { _id: string; date: string };
  amount: number;
  notes?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

interface StaffUser {
  _id: string;
  name: string;
  role: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  delivery: { label: 'Delivery',color: 'text-purple-700', bg: 'bg-purple-100' },
  doctor:   { label: 'Doctor',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  kitchen:  { label: 'Kitchen', color: 'text-orange-700', bg: 'bg-orange-100' },
};

const ROLE_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'doctor',   label: 'Doctors' },
  { key: 'kitchen',  label: 'Kitchen' },
];

export default function PayoutsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({ total: 0, pending: 0, paid: 0, breakdown: { driver: 0, doctor: 0, kitchen: 0 } });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [formData, setFormData] = useState({ staffId: '', staffRole: 'delivery', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewEarning, setViewEarning] = useState<Earning | null>(null);

  // Pagination & Debouncing
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeRole, statusFilter, itemsPerPage]);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeRole !== 'all') params.append('staffRole', activeRole);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const { data } = await api.get(`/earnings?${params.toString()}`);
      if (data.success) {
        setEarnings(data.data);
        setTotalCount(data.count || 0);
        setSummary({
          total: data.totalEarned || 0,
          pending: data.pendingAmount || 0,
          paid: data.paidAmount || 0,
          breakdown: { driver: 0, doctor: 0, kitchen: 0 }
        });
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  }, [activeRole, statusFilter, debouncedSearch, currentPage, itemsPerPage]);

  const fetchStaffList = async () => {
    try {
      const { data } = await api.get('/users?role[in]=delivery&role[in]=doctor&role[in]=kitchen&limit=100');
      if (data.success) {
        setStaffList(data.data.filter((u: any) => ['delivery', 'doctor', 'kitchen'].includes(u.role)));
      }
    } catch {}
  };

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const markAsPaid = async (id: string) => {
    if (await confirmAction('Confirm Payout', 'Are you sure you want to mark this as paid?', 'Yes, Pay')) {
      try {
        showLoading('Processing payout...');
        await api.patch(`/earnings/${id}/pay`);
        hideAlert();
        showSuccess('Marked as paid!');
        fetchEarnings();
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed');
      }
    }
  };

  const handleDeletePayout = async (id: string) => {
    if (await confirmDelete('Are you sure you want to delete this payout?')) {
      try {
        showLoading('Deleting payout...');
        await api.delete(`/earnings/${id}`);
        hideAlert();
        showSuccess('Payout deleted successfully');
        fetchEarnings();
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId) return showError('Please select a staff member');
    if (!formData.amount || Number(formData.amount) <= 0) return showError('Enter a valid amount');
    try {
      setSubmitting(true);
      if (editId) {
        showLoading('Updating payout...');
        await api.put(`/earnings/${editId}`, {
          staffId: formData.staffId,
          staffRole: formData.staffRole,
          amount: Number(formData.amount),
          notes: formData.notes
        });
        showSuccess('Payout updated!');
      } else {
        showLoading('Creating payout...');
        await api.post('/earnings', {
          staffId: formData.staffId,
          staffRole: formData.staffRole,
          amount: Number(formData.amount),
          notes: formData.notes
        });
        showSuccess('Payout record created!');
      }
      hideAlert();
      setIsAddModalOpen(false);
      setEditId(null);
      setFormData({ staffId: '', staffRole: 'delivery', amount: '', notes: '' });
      fetchEarnings();
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to save payout');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (earning: Earning) => {
    fetchStaffList();
    setEditId(earning._id);
    setFormData({
      staffRole: earning.staffRole,
      staffId: earning.staffId._id,
      amount: earning.amount.toString(),
      notes: earning.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage payouts for drivers, doctors & kitchen staff</p>
        </div>
        <button
          onClick={() => { 
            fetchStaffList(); 
            setEditId(null);
            setFormData({ staffId: '', staffRole: 'delivery', amount: '', notes: '' });
            setIsAddModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Payout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm text-gray-500 font-medium">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : `₹${summary.total.toLocaleString()}`}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm text-yellow-600 font-medium">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{loading ? '...' : `₹${summary.pending.toLocaleString()}`}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-sm text-green-600 font-medium">Paid Out</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{loading ? '...' : `₹${summary.paid.toLocaleString()}`}</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Role Tabs & Toolbar */}
        <div className="border-b border-gray-200 px-4 bg-white shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex gap-1 overflow-x-auto">
            {ROLE_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveRole(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeRole === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pb-3 xl:pb-0">
            <div className="relative w-full xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-all shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[130px] cursor-pointer transition-all shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payouts...</div>
          ) : totalCount === 0 ? (
            <div className="p-8 text-center text-gray-500">No payouts found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Staff</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Notes</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {earnings.map((earning) => {
                  const role = ROLE_CONFIG[earning.staffRole] || ROLE_CONFIG.driver;
                  return (
                    <tr key={earning._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{earning.staffId?.name || 'Unknown'}</p>
                        {earning.staffId?.phone && (
                          <p className="text-xs text-gray-400">{earning.staffId.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${role.bg} ${role.color}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{earning.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs max-w-[160px] truncate">{earning.notes || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(earning.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {earning.status === 'paid'
                            ? <CheckCircle className="h-4 w-4 text-green-500" />
                            : <Clock className="h-4 w-4 text-yellow-500" />
                          }
                          <span className={`font-medium capitalize ${earning.status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>
                            {earning.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewEarning(earning)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Payout"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {earning.status === 'pending' && (
                            <>
                              <button
                                onClick={() => markAsPaid(earning._id)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 font-medium rounded-md hover:bg-blue-100 transition-colors text-sm"
                              >
                                Pay Now
                              </button>
                              <button
                                onClick={() => openEditModal(earning)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                title="Edit Payout"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayout(earning._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete Payout"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination UI */}
        {!loading && totalCount > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 hidden sm:inline">Rows per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                     setItemsPerPage(Number(e.target.value));
                     setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Payout Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editId ? "Edit Payout Record" : "Add Payout Record"}>
        <form onSubmit={handleAddPayout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.staffRole}
              onChange={(e) => setFormData({ ...formData, staffRole: e.target.value, staffId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="delivery">Delivery</option>
              <option value="doctor">Doctor</option>
              <option value="kitchen">Kitchen Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
            <select
              required
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="">— Select Staff —</option>
              {staffList
                .filter(s => s.role === formData.staffRole)
                .map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))
              }
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              required
              type="number"
              min={1}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Weekly delivery bonus"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : (editId ? 'Update Payout' : 'Create Payout')}
            </button>
          </div>
        </form>
      </Modal>
      {/* View Payout Modal */}
      <Modal isOpen={!!viewEarning} onClose={() => setViewEarning(null)} title="Payout Details">
        {viewEarning && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Staff Member</p>
                <p className="font-medium text-gray-900">{viewEarning.staffId?.name || 'Unknown'}</p>
                {viewEarning.staffId?.phone && <p className="text-gray-500">{viewEarning.staffId.phone}</p>}
              </div>
              <div>
                <p className="text-gray-500 mb-1">Role</p>
                <p className="font-medium capitalize text-gray-900">{viewEarning.staffRole}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Amount</p>
                <p className="font-bold text-gray-900 text-lg">₹{viewEarning.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {viewEarning.status === 'paid'
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <Clock className="h-4 w-4 text-yellow-500" />
                  }
                  <span className={`font-medium capitalize ${viewEarning.status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {viewEarning.status}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Date Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(viewEarning.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {viewEarning.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Notes</p>
                  <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{viewEarning.notes}</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button type="button" onClick={() => setViewEarning(null)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
