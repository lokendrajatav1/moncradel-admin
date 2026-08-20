"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import api from '@/utils/api';
import Modal from '@/components/Modal';

interface Batch {
  _id: string;
  batchNumber: string;
  mealId: { _id: string; name: string };
  kitchenId: { name: string };
  quantity: number;
  orderIds: string[];
  status: string;
  createdAt: string;
}

interface Meal {
  _id: string;
  name: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  preparing:  'bg-blue-100 text-blue-700',
  ready:      'bg-green-100 text-green-700',
  completed:  'bg-gray-100 text-gray-600',
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ mealId: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/batches', {
        params: { page, limit, search: debouncedSearch }
      });
      if (data.success) {
        setBatches(data.data);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error: any) {
      showError('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  const fetchMeals = async () => {
    try {
      const { data } = await api.get('/meals');
      if (data.success) {
        setMeals(data.data);
      }
    } catch {
      // silently fail — meals dropdown just stays empty
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mealId) return showError('Please select a meal');
    if (formData.quantity < 1) return showError('Quantity must be at least 1');
    try {
      setSubmitting(true);
      showLoading('Creating batch...');
      const response = await api.post('/batches', formData);
      if (response.data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setFormData({ mealId: '', quantity: 1 });
        await fetchBatches();
        showSuccess('Batch created successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      showLoading('Updating status...');
      await api.patch(`/batches/${id}/status`, { status: newStatus });
      hideAlert();
      await fetchBatches();
      showSuccess('Batch status updated');
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete('this batch');
    if (!confirmed) return;
    try {
      showLoading('Cancelling batch...');
      await api.delete(`/batches/${id}`);
      hideAlert();
      await fetchBatches();
      showSuccess('Batch cancelled. Linked orders reverted to pending.');
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to cancel batch');
    }
  };



  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Batches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage meal cooking batches and track order preparation</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Batch
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by batch, meal or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading && batches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'No batches match your search.' : 'No batches found. Create your first batch!'}
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Batch #</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Meal</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200 text-center">Qty Planned</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200 text-center">Orders Assigned</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Created</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900 text-xs">{batch.batchNumber || '—'}</td>
                    <td className="px-6 py-4 font-medium">{batch.mealId?.name || 'Unknown Meal'}</td>
                    <td className="px-6 py-4 text-center">{batch.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                        {batch.orderIds?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[batch.status] || 'bg-gray-100 text-gray-600'}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(batch.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {batch.status !== 'completed' ? (
                          <select
                            value={batch.status}
                            onChange={(e) => updateStatus(batch._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Done</span>
                        )}
                        {batch.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(batch._id)}
                            title="Cancel this batch"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && batches.length > 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
                <div className="animate-pulse text-blue-600 font-medium">Loading...</div>
              </div>
            )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select 
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setFormData({ mealId: '', quantity: 1 }); }} title="Create New Batch">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Meal</label>
            <select
              required
              value={formData.mealId}
              onChange={(e) => setFormData({ ...formData, mealId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="">— Choose a Meal —</option>
              {meals.map((meal) => (
                <option key={meal._id} value={meal._id}>{meal.name}</option>
              ))}
            </select>
            {meals.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No meals found. Please create meals first.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Cook</label>
            <input
              required
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. 20"
            />
            <p className="text-xs text-gray-500 mt-1">
              The system will automatically assign up to this many pending orders to this batch.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setFormData({ mealId: '', quantity: 1 }); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
