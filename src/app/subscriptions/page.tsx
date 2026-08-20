"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, MoreVertical, Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/utils/api';
import { showError, showLoading, hideAlert, showSuccess, confirmDelete } from '@/utils/alert';

interface Subscription {
  _id: string;
  parentId: { _id: string, name: string };
  babyId: { _id: string, name: string };
  planId: { _id: string, title: string, price: number, durationInDays: number };
  startDate: string;
  endDate: string;
  status: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [parents, setParents] = useState<{ _id: string, name: string }[]>([]);
  const [babies, setBabies] = useState<{ _id: string, name: string }[]>([]);
  const [plans, setPlans] = useState<{ _id: string, title: string, durationInDays: number }[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const [formData, setFormData] = useState({
    parentId: '', babyId: '', planId: '', durationInDays: '7', status: ''
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/subscriptions');
      if (data.success) setSubscriptions(data.data);
    } catch (error) {
      showError('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [parentsRes, babiesRes, plansRes] = await Promise.all([
        api.get('/users?role=parent'),
        api.get('/babies'),
        api.get('/subscription-plans')
      ]);
      if (parentsRes.data.success) setParents(parentsRes.data.data.filter((u: any) => u.role === 'parent'));
      if (babiesRes.data.success) setBabies(babiesRes.data.data);
      if (plansRes.data.success) {
        const activePlans = plansRes.data.data.filter((p: any) => p.isActive);
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setFormData(prev => ({ ...prev, planId: activePlans[0]._id, durationInDays: activePlans[0].durationInDays.toString() }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch form data');
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchFormData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading('Creating subscription...');
      const payload = {
        parentId: formData.parentId,
        babyId: formData.babyId,
        planId: formData.planId,
        durationInDays: Number(formData.durationInDays)
      };
      const { data } = await api.post('/subscriptions', payload);
      if (data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setFormData({ parentId: '', babyId: '', planId: plans[0]?._id || '', durationInDays: plans[0]?.durationInDays?.toString() || '7', status: '' });
        fetchSubscriptions();
        showSuccess('Subscription created successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const parentBabies = babies.filter((b: any) => b.parentId?._id === pId || b.parentId === pId);
    setFormData({
      ...formData,
      parentId: pId,
      babyId: parentBabies.length === 1 ? parentBabies[0]._id : ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;
    try {
      showLoading('Updating subscription...');
      const payload = {
        status: formData.status
      };
      const { data } = await api.patch(`/subscriptions/${selectedSubscription._id}`, payload);
      if (data.success) {
        hideAlert();
        setIsEditModalOpen(false);
        fetchSubscriptions();
        showSuccess('Subscription updated successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleDelete = async (sub: Subscription) => {
    const isConfirmed = await confirmDelete(`Subscription ${sub._id.substring(sub._id.length - 6).toUpperCase()}`);
    if (!isConfirmed) return;
    try {
      showLoading('Deleting...');
      await api.delete(`/subscriptions/${sub._id}`);
      hideAlert();
      fetchSubscriptions();
      showSuccess('Subscription deleted');
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to delete subscription');
    }
  };

  const openAddModal = () => {
    setFormData({
      parentId: '', 
      babyId: '', 
      planId: plans[0]?._id || '', 
      durationInDays: plans[0]?.durationInDays?.toString() || '7',
      status: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setFormData({
      ...formData,
      status: sub.status as any
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsViewModalOpen(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      sub._id.toLowerCase().includes(searchLower) ||
      (sub.parentId?.name || '').toLowerCase().includes(searchLower) ||
      (sub.babyId?.name || '').toLowerCase().includes(searchLower) ||
      (sub.planId?.title || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Create Subscription
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between gap-2 px-4 py-2 w-44 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span>{filterOptions.find(o => o.value === statusFilter)?.label}</span>
              </div>
            </button>

            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === option.value
                          ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 border-l-2 border-transparent'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-200 text-gray-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Sub ID</th>
                <th className="px-6 py-4 font-semibold">Parent Name</th>
                <th className="px-6 py-4 font-semibold">Baby Name</th>
                <th className="px-6 py-4 font-semibold">Plan Type</th>
                <th className="px-6 py-4 font-semibold">End Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Loading subscriptions...</td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No subscriptions match your filters.</td>
                </tr>
              ) : filteredSubscriptions.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">{sub._id.substring(sub._id.length - 6).toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{sub.parentId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-700">{sub.babyId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-700 font-semibold">{sub.planId?.title || 'Unknown Plan'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openViewModal(sub)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Status"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Subscription"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === sub._id ? null : sub._id)}
                          className={`p-1.5 rounded-md transition-colors ${openMenuId === sub._id ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenuId === sub._id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              <button
                                onClick={() => {
                                  showSuccess('Invoice downloaded');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Download Invoice
                              </button>
                              <button
                                onClick={() => {
                                  showSuccess('Reminder email sent to parent');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Send Reminder
                              </button>
                              <button
                                onClick={() => {
                                  showSuccess('Subscription paused');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                Pause Plan
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Subscription Plan">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <select required value={formData.parentId} onChange={handleParentChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Parent...</option>
                {parents.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baby</label>
              <select required value={formData.babyId} onChange={(e) => setFormData({ ...formData, babyId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Baby...</option>
                {babies.filter(b => !formData.parentId || (b as any).parentId?._id === formData.parentId || (b as any).parentId === formData.parentId).map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Plan</label>
            <select required value={formData.planId} onChange={(e) => {
              const selected = plans.find(p => p._id === e.target.value);
              setFormData({ ...formData, planId: e.target.value, durationInDays: selected ? selected.durationInDays.toString() : formData.durationInDays });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {plans.map(p => <option key={p._id} value={p._id}>{p.title} ({p.durationInDays} Days)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
            <input required type="number" min="1" value={formData.durationInDays} onChange={(e) => setFormData({ ...formData, durationInDays: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 7 or 30" />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Create Subscription</button>
          </div>
        </form>
      </Modal>

      {/* Edit Subscription Modal */}
      {selectedSubscription && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Subscription Status">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={(formData as any).status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value } as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Update Status</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Details Modal */}
      {selectedSubscription && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Subscription Details">
          <div className="space-y-6 text-sm text-gray-700">
            <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-2 gap-6 border border-gray-100">
              <div>
                <h4 className="font-semibold text-gray-900">Subscription ID</h4>
                <p className="font-mono text-gray-900 font-medium">{selectedSubscription._id.substring(selectedSubscription._id.length - 6).toUpperCase()}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Status</h4>
                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${selectedSubscription.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedSubscription.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {selectedSubscription.status}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Parent</h4>
                <p className="text-gray-900 font-medium capitalize">{selectedSubscription.parentId?.name}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Baby</h4>
                <p className="text-gray-900 font-medium capitalize">{selectedSubscription.babyId?.name}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Plan</h4>
                <p className="text-gray-900 font-medium capitalize">{selectedSubscription.planId?.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">End Date</h4>
                <p className="text-gray-900 font-medium">{new Date(selectedSubscription.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-5 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
