"use client";

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Image as ImageIcon, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import { formatTime12Hour } from '@/utils/dateFormatter';
import api from '@/utils/api';

interface HygieneLog {
  _id: string;
  kitchenId: { _id: string; name: string };
  taskName: string;
  date: string;
  status: 'pending' | 'completed';
  photoUrl: string;
  createdAt: string;
  recordedBy?: { _id: string; name: string };
}

export default function HygienePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<HygieneLog | null>(null);
  const [logs, setLogs] = useState<HygieneLog[]>([]);
  const [kitchens, setKitchens] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Form State
  const [formData, setFormData] = useState({ 
    taskName: '', 
    date: new Date().toISOString(),
    status: 'completed',
    kitchenId: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/hygiene', {
        params: { page, limit, search: debouncedSearch }
      });
      if (data.success) {
        setLogs(data.data);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch hygiene logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  const fetchKitchens = async () => {
    try {
      const { data } = await api.get('/users?role=kitchen');
      if (data.success) {
        setKitchens(data.data.filter((u: any) => u.role === 'kitchen'));
      }
    } catch (error) {
      console.error('Failed to fetch kitchens');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchKitchens();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openAddModal = () => {
    setFormData({ 
      taskName: '', 
      date: new Date().toISOString(),
      status: 'completed',
      kitchenId: ''
    });
    setSelectedPhoto(null);
    setIsAddModalOpen(true);
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading('Logging task...');
      
      const payload = new FormData();
      payload.append('taskName', formData.taskName);
      payload.append('date', formData.date);
      payload.append('status', formData.status);
      if (formData.kitchenId) payload.append('kitchenId', formData.kitchenId);
      if (selectedPhoto) {
        payload.append('photo', selectedPhoto);
      }

      const response = await api.post('/hygiene', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        fetchLogs();
        showSuccess('Hygiene task logged successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to log hygiene task');
    }
  };

  const openEditModal = (log: HygieneLog) => {
    setSelectedLog(log);
    
    // Convert old YYYY-MM-DD or partial strings to full ISO string
    let formattedDate = log.date;
    if (log.date.length === 10) {
      formattedDate = new Date(`${log.date}T12:00:00Z`).toISOString();
    } else {
      formattedDate = new Date(log.date).toISOString();
    }

    setFormData({
      taskName: log.taskName,
      date: formattedDate,
      status: log.status,
      kitchenId: log.kitchenId?._id || ''
    });
    setSelectedPhoto(null);
    setIsEditModalOpen(true);
  };

  const openViewModal = (log: HygieneLog) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete('Hygiene Task');
    if (!confirmed) return;
    try {
      showLoading('Deleting log...');
      const { data } = await api.delete(`/hygiene/${id}`);
      if (data.success) {
        hideAlert();
        showSuccess('Log deleted successfully');
        fetchLogs();
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to delete log');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    try {
      showLoading('Updating task...');
      
      const payload = new FormData();
      payload.append('taskName', formData.taskName);
      payload.append('date', formData.date);
      payload.append('status', formData.status);
      if (formData.kitchenId) payload.append('kitchenId', formData.kitchenId);
      if (selectedPhoto) {
        payload.append('photo', selectedPhoto);
      }

      const response = await api.put(`/hygiene/${selectedLog._id}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        hideAlert();
        setIsEditModalOpen(false);
        fetchLogs();
        showSuccess('Hygiene task updated successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update hygiene task');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-green-600" /> Hygiene Tracking
        </h1>
        <button 
          onClick={openAddModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Log Task
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks or kitchen..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hygiene tasks logged yet.</div>
          ) : (
            <>
              <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Task Name</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Date & Time</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Logged By (Kitchen)</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{log.taskName}</td>
                    <td className="px-6 py-4">
                      {new Date(log.date).toLocaleDateString()} at {formatTime12Hour(`${String(new Date(log.date).getHours()).padStart(2, '0')}:${String(new Date(log.date).getMinutes()).padStart(2, '0')}`)}
                    </td>
                    <td className="px-6 py-4">{log.kitchenId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewModal(log)} 
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(log)} 
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(log._id)} 
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && logs.length > 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
                <div className="animate-pulse text-green-600 font-medium">Loading...</div>
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Hygiene Task">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
            <input 
              required
              type="text" 
              value={formData.taskName}
              onChange={(e) => setFormData({...formData, taskName: e.target.value})}
              placeholder="e.g. Sanitized prep area"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <DatePicker 
              selected={new Date(formData.date)}
              onChange={(date: Date | null) => {
                if (date) setFormData({...formData, date: date.toISOString()})
              }}
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              wrapperClassName="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Kitchen</label>
            <select 
              required
              value={formData.kitchenId}
              onChange={(e) => setFormData({...formData, kitchenId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a Kitchen...</option>
              {kitchens.map(k => <option key={k._id} value={k._id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proof Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
              Log Task
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Hygiene Task">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
            <input 
              required
              type="text" 
              value={formData.taskName}
              onChange={(e) => setFormData({...formData, taskName: e.target.value})}
              placeholder="e.g. Sanitized prep area"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <DatePicker 
              selected={new Date(formData.date)}
              onChange={(date: Date | null) => {
                if (date) setFormData({...formData, date: date.toISOString()})
              }}
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              wrapperClassName="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Kitchen</label>
            <select 
              required
              value={formData.kitchenId}
              onChange={(e) => setFormData({...formData, kitchenId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a Kitchen...</option>
              {kitchens.map(k => <option key={k._id} value={k._id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Proof Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setSelectedPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
              Update Task
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Hygiene Task">
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Task Name</label>
              <div className="text-gray-900 font-medium">{selectedLog.taskName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Date & Time</label>
              <div className="text-gray-900">
                {new Date(selectedLog.date).toLocaleDateString()} at {formatTime12Hour(`${String(new Date(selectedLog.date).getHours()).padStart(2, '0')}:${String(new Date(selectedLog.date).getMinutes()).padStart(2, '0')}`)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Logged By</label>
              <div className="text-gray-900">{selectedLog.kitchenId?.name || 'Unknown'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedLog.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedLog.status.toUpperCase()}
                </span>
              </div>
            </div>
            {selectedLog.photoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Proof Photo</label>
                <img src={selectedLog.photoUrl} alt="Proof" className="w-full h-auto rounded-lg border border-gray-200" />
              </div>
            )}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
