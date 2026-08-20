"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Trophy, Search, Eye } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert } from '@/utils/alert';
import Modal from '@/components/Modal';
import Swal from 'sweetalert2';

interface StandardMilestone {
  _id: string;
  title: string;
  description: string;
  ageInMonths: number;
  category: string;
}

const CATEGORIES = ['Physical', 'Cognitive', 'Social', 'Communication', 'Other'];

export default function StandardMilestonesPage() {
  const [milestones, setMilestones] = useState<StandardMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<StandardMilestone | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    ageInMonths: '',
    category: 'Other'
  });

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/standard-milestones');
      if (data.success) {
        setMilestones(data.data);
      }
    } catch (error) {
      showError('Failed to fetch standard milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const openAddModal = () => {
    setFormData({ _id: '', title: '', description: '', ageInMonths: '', category: 'Other' });
    setIsModalOpen(true);
  };

  const openEditModal = (milestone: StandardMilestone) => {
    setFormData({
      _id: milestone._id,
      title: milestone.title,
      description: milestone.description,
      ageInMonths: milestone.ageInMonths.toString(),
      category: milestone.category
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(formData._id ? 'Updating milestone...' : 'Adding milestone...');
      
      const payload = {
        title: formData.title,
        description: formData.description,
        ageInMonths: Number(formData.ageInMonths),
        category: formData.category
      };

      if (formData._id) {
        const { data } = await api.put(`/standard-milestones/${formData._id}`, payload);
        if (data.success) {
          setMilestones(milestones.map(m => m._id === formData._id ? data.data : m));
          showSuccess('Milestone updated successfully');
        }
      } else {
        const { data } = await api.post('/standard-milestones', payload);
        if (data.success) {
          setMilestones([...milestones, data.data].sort((a, b) => a.ageInMonths - b.ageInMonths));
          showSuccess('Milestone added successfully');
        }
      }
      setIsModalOpen(false);
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to save milestone');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        showLoading('Deleting...');
        const { data } = await api.delete(`/standard-milestones/${id}`);
        if (data.success) {
          setMilestones(milestones.filter(m => m._id !== id));
          showSuccess('Milestone deleted');
        }
      } catch (error) {
        hideAlert();
        showError('Failed to delete milestone');
      }
    }
  };

  const filteredMilestones = milestones.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-orange-500" /> Standard Milestones
          </h1>
          <p className="text-gray-500 mt-1">Manage predefined developmental milestones for babies.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-5 w-5" /> Add Milestone
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search milestones..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-900 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Title</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Age (Months)</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Category</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-200">Description</th>
                <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading milestones...
                  </td>
                </tr>
              ) : filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No standard milestones found.
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((milestone) => (
                  <tr key={milestone._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{milestone.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {milestone.ageInMonths} months
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {milestone.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={milestone.description}>
                      {milestone.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setViewingMilestone(milestone);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(milestone)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(milestone._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData._id ? 'Edit Standard Milestone' : 'Add Standard Milestone'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milestone Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Starts crawling"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (Months)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.ageInMonths}
                onChange={(e) => setFormData({ ...formData, ageInMonths: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief description of the milestone..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {formData._id ? 'Save Changes' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Standard Milestone"
      >
        {viewingMilestone && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Title</h3>
              <p className="text-gray-900 font-medium text-lg">{viewingMilestone.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Age</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {viewingMilestone.ageInMonths} months
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {viewingMilestone.category}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 text-sm whitespace-pre-wrap">
                {viewingMilestone.description || <span className="text-gray-400 italic">No description provided.</span>}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
