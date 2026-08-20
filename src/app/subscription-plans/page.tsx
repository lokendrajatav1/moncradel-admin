"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/utils/api';
import { showError, showLoading, hideAlert, showSuccess, confirmDelete } from '@/utils/alert';

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationInDays: number;
  features: string[];
  isActive: boolean;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    durationInDays: '',
    features: '',
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/subscription-plans');
      if (data.success) setPlans(data.data);
    } catch (error) {
      showError('Failed to fetch pricing plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading('Creating plan...');
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        durationInDays: Number(formData.durationInDays),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        isActive: formData.isActive
      };
      const { data } = await api.post('/subscription-plans', payload);
      if (data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setFormData({ title: '', description: '', price: '', durationInDays: '', features: '', isActive: true });
        fetchPlans();
        showSuccess('Plan created successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      showLoading('Updating plan...');
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        durationInDays: Number(formData.durationInDays),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        isActive: formData.isActive
      };
      const { data } = await api.patch(`/subscription-plans/${selectedPlan._id}`, payload);
      if (data.success) {
        hideAlert();
        setIsEditModalOpen(false);
        fetchPlans();
        showSuccess('Plan updated successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update plan');
    }
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    const isConfirmed = await confirmDelete(`Plan: ${plan.title}`);
    if (!isConfirmed) return;
    try {
      showLoading('Deleting...');
      await api.delete(`/subscription-plans/${plan._id}`);
      hideAlert();
      fetchPlans();
      showSuccess('Plan deleted');
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      durationInDays: '',
      features: '',
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      price: plan.price.toString(),
      durationInDays: plan.durationInDays.toString(),
      features: plan.features.join(', '),
      isActive: plan.isActive
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Plans</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">No pricing plans created yet.</div>
        ) : plans.map((plan) => (
          <div key={plan._id} className={`rounded-2xl border ${plan.isActive ? 'bg-white border-blue-200 shadow-lg hover:shadow-xl' : 'bg-gray-50 border-gray-300 shadow hover:shadow-md opacity-90'} transition-shadow overflow-hidden flex flex-col`}>
            <div className={`p-6 pb-4 ${plan.isActive ? 'bg-gradient-to-b from-blue-50/50 to-white' : 'bg-transparent'}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{plan.title}</h3>
                {plan.isActive ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5"/> Active</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full"><XCircle className="w-3.5 h-3.5"/> Inactive</span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-bold text-gray-800">₹{plan.price}</span>
                <span className="text-sm font-medium text-gray-500">/ {plan.durationInDays} days</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">{plan.description || 'No description provided.'}</p>
            </div>
            
            <div className={`px-6 pb-6 pt-4 flex-grow ${plan.isActive ? 'bg-white' : 'bg-transparent'}`}>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Included Features</h4>
              <ul className="space-y-3">
                {plan.features.length > 0 ? plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                )) : (
                  <li className="text-sm text-gray-500 italic">No features listed</li>
                )}
              </ul>
            </div>
            
            <div className={`p-4 border-t flex justify-end gap-3 ${plan.isActive ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-transparent'}`}>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(plan)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(plan)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Pricing Plan">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Premium Weekly Meals" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description for parents..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <input required type="number" min="1" value={formData.durationInDays} onChange={(e) => setFormData({...formData, durationInDays: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="7" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features (Comma separated)</label>
            <textarea value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="3 meals a day, Expert Dietitian, Free Delivery..." rows={2} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Plan is active and visible to users</label>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Create Plan</button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      {selectedPlan && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pricing Plan">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
              <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                <input required type="number" min="1" value={formData.durationInDays} onChange={(e) => setFormData({...formData, durationInDays: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features (Comma separated)</label>
              <textarea value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="editIsActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">Plan is active and visible to users</label>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Update Plan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
