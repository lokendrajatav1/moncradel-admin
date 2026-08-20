"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, Edit, Trash2, Baby as BabyIcon } from 'lucide-react';
import Modal from '@/components/Modal';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';

interface Parent {
  _id: string;
  name: string;
  phone: string;
}

interface Baby {
  _id: string;
  name: string;
  ageInMonths: number;
  weight?: number;
  allergies?: string[];
  diet?: string;
  parentId: Parent;
  assignedDoctorId?: string | { _id: string, name: string };
  isActive: boolean;
  createdAt: string;
  gender?: 'boy' | 'girl' | 'private';
  dateOfBirth?: string;
}

export default function BabiesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);
  
  // Parents and Doctors list for dropdown
  const [parents, setParents] = useState<{_id: string, name: string}[]>([]);
  const [doctors, setDoctors] = useState<{_id: string, name: string}[]>([]);

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    ageInMonths: '', 
    weight: '',
    allergies: '',
    diet: '',
    parentId: '',
    assignedDoctorId: '',
    gender: 'boy',
    dateOfBirth: ''
  });

  const fetchBabies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/babies');
      if (data.success) {
        setBabies(data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch babies');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [parentsRes, doctorsRes] = await Promise.all([
        api.get('/users?role=parent'),
        api.get('/users?role=doctor')
      ]);
      
      if (parentsRes.data.success) {
        setParents(parentsRes.data.data.filter((u: any) => u.role === 'parent'));
      }
      if (doctorsRes.data.success) {
        setDoctors(doctorsRes.data.data.filter((u: any) => u.role === 'doctor'));
      }
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchBabies();
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmDelete(`Are you sure you want to delete baby ${name}?`);
    if (!isConfirmed) return;
    
    try {
      showLoading('Deleting baby...');
      const response = await api.delete(`/babies/${id}`);
      if (response.data.success) {
        hideAlert();
        showSuccess(`Baby ${name} deleted successfully!`);
        fetchBabies();
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to delete baby');
    }
  };

  const openAddModal = () => {
    setEditingBaby(null);
    setFormData({ 
      name: '', ageInMonths: '', weight: '', allergies: '', diet: '', parentId: '', assignedDoctorId: '', gender: 'boy', dateOfBirth: '' 
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (baby: Baby) => {
    setEditingBaby(baby);
    setFormData({ 
      name: baby.name, 
      ageInMonths: baby.ageInMonths.toString(), 
      weight: baby.weight ? baby.weight.toString() : '', 
      allergies: baby.allergies ? baby.allergies.join(', ') : '', 
      diet: baby.diet ? baby.diet : '', 
      parentId: baby.parentId ? baby.parentId._id : '', 
      assignedDoctorId: baby.assignedDoctorId ? (baby.assignedDoctorId as any)._id || baby.assignedDoctorId : '',
      gender: baby.gender || 'boy',
      dateOfBirth: baby.dateOfBirth ? new Date(baby.dateOfBirth).toISOString().split('T')[0] : ''
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingBaby ? 'Updating baby...' : 'Adding baby...');
      
      const payload = {
        name: formData.name,
        ageInMonths: Number(formData.ageInMonths),
        weight: formData.weight ? Number(formData.weight) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        diet: formData.diet || undefined,
        parentId: formData.parentId,
        assignedDoctorId: formData.assignedDoctorId || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth
      };

      let data;
      if (editingBaby) {
        const response = await api.put(`/babies/${editingBaby._id}`, payload);
        data = response.data;
      } else {
        const response = await api.post('/babies', payload);
        data = response.data;
      }
      
      if (data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        fetchBabies();
        showSuccess(`Baby ${editingBaby ? 'updated' : 'added'} successfully!`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to add baby');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BabyIcon className="h-6 w-6 text-blue-600" /> Baby Management
        </h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add New Baby
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search babies..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading babies...</div>
          ) : babies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No babies found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Name</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Age (Months)</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Weight (Kg)</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Parent</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {babies.map((baby) => (
                  <tr key={baby._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/babies/${baby._id}`} className="text-blue-600 hover:underline">
                        {baby.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{baby.ageInMonths}</td>
                    <td className="px-6 py-4">{baby.weight || '-'}</td>
                    <td className="px-6 py-4">
                      {baby.parentId ? (
                        <Link href={`/users/${baby.parentId._id}`} className="text-blue-600 hover:underline">
                          {baby.parentId.name}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${baby.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${baby.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {baby.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/babies/${baby._id}`}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openEditModal(baby)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Baby"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(baby._id, baby.name)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Baby Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={editingBaby ? "Edit Baby" : "Add New Baby"}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baby Name</label>
            <input 
              required 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select 
                required 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
              >
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input 
                required
                type="date" 
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (Months)</label>
              <input 
                required 
                type="number" 
                min="0"
                value={formData.ageInMonths}
                onChange={(e) => setFormData({...formData, ageInMonths: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg) - Optional</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Peanuts, Dairy"
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences / Diet</label>
              <input 
                type="text" 
                placeholder="e.g. Vegetarian, Lactose-free"
                value={formData.diet}
                onChange={(e) => setFormData({...formData, diet: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <select 
                required 
                value={formData.parentId}
                onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Parent...</option>
                {parents.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor (Optional)</label>
              <select 
                value={formData.assignedDoctorId}
                onChange={(e) => setFormData({...formData, assignedDoctorId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">None...</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              {editingBaby ? "Update Baby" : "Add Baby"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
