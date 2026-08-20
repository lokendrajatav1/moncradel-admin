"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Search, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import Modal from '@/components/Modal';

interface MasterVaccine {
  _id: string;
  name: string;
  dueMonths: number;
  dueAgeLabel: string;
  description: string;
  isActive: boolean;
}

export default function VaccinationMasterPage() {
  const [vaccines, setVaccines] = useState<MasterVaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dueMonths: '',
    dueAgeLabel: '',
    description: '',
    isActive: true
  });

  const fetchVaccines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vaccination-master');
      if (res.data.success) {
        setVaccines(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch master vaccines", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const handleOpenModal = (vaccine?: MasterVaccine) => {
    if (vaccine) {
      setEditingId(vaccine._id);
      setFormData({
        name: vaccine.name,
        dueMonths: vaccine.dueMonths.toString(),
        dueAgeLabel: vaccine.dueAgeLabel || '',
        description: vaccine.description || '',
        isActive: vaccine.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', dueMonths: '', dueAgeLabel: '', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingId ? 'Updating vaccine...' : 'Adding vaccine...');
      const payload = {
        ...formData,
        dueMonths: parseFloat(formData.dueMonths)
      };

      if (editingId) {
        await api.put(`/vaccination-master/${editingId}`, payload);
        showSuccess('Vaccine updated successfully');
      } else {
        await api.post('/vaccination-master', payload);
        showSuccess('Vaccine added successfully');
      }
      
      hideAlert();
      setIsModalOpen(false);
      fetchVaccines();
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmDelete(name);
    if (isConfirmed) {
      try {
        showLoading('Deleting vaccine...');
        await api.delete(`/vaccination-master/${id}`);
        hideAlert();
        showSuccess('Vaccine deleted successfully');
        fetchVaccines();
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Deletion failed');
      }
    }
  };

  const filteredVaccines = vaccines.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Vaccines Master Schedule
          </h1>
          <p className="text-gray-500 mt-1">Manage the global WHO/IAP vaccination schedule for all babies.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Vaccine
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search vaccines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-bold text-gray-900">{filteredVaccines.length}</span> vaccines
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Vaccine Name</th>
                <th className="px-6 py-3 font-semibold">Due Age</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVaccines.map(vaccine => (
                <tr key={vaccine._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{vaccine.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                      {vaccine.dueAgeLabel || `${vaccine.dueMonths} Months`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={vaccine.description}>{vaccine.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vaccine.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {vaccine.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(vaccine)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(vaccine._id, vaccine.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVaccines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No vaccines found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Vaccine" : "Add New Vaccine"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. OPV 1"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Age Label *</label>
            <input 
              type="text" 
              required
              placeholder='e.g. "6 Weeks" or "10 Months"'
              value={formData.dueAgeLabel}
              onChange={(e) => setFormData({...formData, dueAgeLabel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Age (in Months) *</label>
            <input 
              type="number" 
              step="0.1"
              required
              placeholder="e.g. 1.5 for 6 weeks"
              value={formData.dueMonths}
              onChange={(e) => setFormData({...formData, dueMonths: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Use 0 for birth, 1.5 for 6 weeks, 2.5 for 10 weeks, etc.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              rows={2}
              placeholder="e.g. Oral Polio Vaccine"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible in schedule)</label>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">{editingId ? 'Update' : 'Add'} Vaccine</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
