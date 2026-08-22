"use client";

import { useState, useEffect } from 'react';
import { Plus, Tag, Copy, Edit, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import Modal from '@/components/Modal';

interface Coupon {
  _id: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive?: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    expiryDate: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coupons');
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({ code: '', discountPercentage: '', maxDiscountAmount: '', minOrderAmount: '', expiryDate: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage.toString(),
      maxDiscountAmount: coupon.maxDiscountAmount.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '0',
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      isActive: coupon.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingCoupon ? 'Updating coupon...' : 'Creating coupon...');
      const payload = {
        code: formData.code,
        discountPercentage: Number(formData.discountPercentage),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        minOrderAmount: Number(formData.minOrderAmount),
        expiryDate: formData.expiryDate,
        isActive: formData.isActive
      };
      
      let data;
      if (editingCoupon) {
        const response = await api.put(`/coupons/${editingCoupon._id}`, payload);
        data = response.data;
      } else {
        const response = await api.post('/coupons', payload);
        data = response.data;
      }

      if (data.success) {
        hideAlert();
        setIsModalOpen(false);
        setFormData({ code: '', discountPercentage: '', maxDiscountAmount: '', minOrderAmount: '', expiryDate: '', isActive: true });
        setEditingCoupon(null);
        fetchCoupons();
        showSuccess(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || (editingCoupon ? 'Failed to update coupon' : 'Failed to create coupon'));
    }
  };

  const handleDelete = async (id: string, code: string) => {
    const isConfirmed = await confirmDelete(`Coupon ${code}`);
    if (isConfirmed) {
      try {
        showLoading('Deleting coupon...');
        const { data } = await api.delete(`/coupons/${id}`);
        if (data.success) {
          hideAlert();
          setCoupons(coupons.filter(c => c._id !== id));
          showSuccess('Coupon deleted successfully!');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess('Coupon code copied!');
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
     return <div className="p-8 text-center text-gray-500">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Tag className="h-6 w-6 text-blue-600 ml-2 mt-2" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-black text-gray-900 tracking-wider bg-gray-100 px-3 py-1 rounded-md border border-dashed border-gray-300">
                {coupon.code}
              </h2>
              <button 
                onClick={() => copyCode(coupon.code)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Copy code"
              >
                <Copy className="h-4 w-4"/>
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Discount:</span> {coupon.discountPercentage}%</p>
              <p><span className="font-semibold text-gray-900">Max Cap:</span> ₹{coupon.maxDiscountAmount}</p>
              <p><span className="font-semibold text-gray-900">Min Order:</span> ₹{coupon.minOrderAmount || 0}</p>
              <p><span className="font-semibold text-gray-900">Valid Till:</span> {new Date(coupon.expiryDate).toLocaleDateString()}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                (!isExpired(coupon.expiryDate) && coupon.isActive !== false) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {(!isExpired(coupon.expiryDate) && coupon.isActive !== false) ? 'Active' : 'Expired'}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(coupon)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Coupon"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(coupon._id, coupon.code)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Coupon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No coupons found. Create one to get started!
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? "Edit Coupon" : "Create New Coupon"}>
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SUMMER20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Cap (₹)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Status (Uncheck to make coupon inactive)
            </label>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
