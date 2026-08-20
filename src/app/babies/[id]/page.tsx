"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Baby as BabyIcon, Edit } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert } from '@/utils/alert';
import Modal from '@/components/Modal';
import { Baby } from './components/types';
import OverviewTab from './components/OverviewTab';
import GrowthTab from './components/GrowthTab';
import MilestonesTab from './components/MilestonesTab';
import NutritionTab from './components/NutritionTab';
import PrescriptionsTab from './components/PrescriptionsTab';
import ActivityLogsTab from './components/ActivityLogsTab';
import VaccinationsTab from './components/VaccinationsTab';

export default function BabyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const babyId = params.id as string;

  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit Form Data
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [parents, setParents] = useState<{_id: string, name: string}[]>([]);
  const [doctors, setDoctors] = useState<{_id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    name: '', ageInMonths: '', weight: '', allergies: '', diet: '', parentId: '', assignedDoctorId: '', gender: 'boy', dateOfBirth: '' 
  });

  const fetchBabyData = async () => {
    try {
      setLoading(true);
      const babyRes = await api.get(`/babies/${babyId}`);
      if (babyRes.data.success) {
        setBaby(babyRes.data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch baby details');
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
      if (parentsRes.data.success) setParents(parentsRes.data.data.filter((u: any) => u.role === 'parent'));
      if (doctorsRes.data.success) setDoctors(doctorsRes.data.data.filter((u: any) => u.role === 'doctor'));
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  useEffect(() => {
    if (babyId) {
      fetchBabyData();
      fetchUsers();
    }
  }, [babyId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const openEditModal = () => {
    if (!baby) return;
    setFormData({ 
      name: baby.name, 
      ageInMonths: baby.ageInMonths.toString(), 
      weight: baby.weight ? baby.weight.toString() : '', 
      allergies: baby.allergies ? baby.allergies.join(', ') : '', 
      diet: baby.diet ? baby.diet : '', 
      parentId: typeof baby.parentId === 'object' ? (baby.parentId as any)._id : baby.parentId, 
      assignedDoctorId: baby.assignedDoctorId ? (typeof baby.assignedDoctorId === 'object' ? (baby.assignedDoctorId as any)._id : baby.assignedDoctorId) : '',
      gender: baby.gender || 'boy',
      dateOfBirth: baby.dateOfBirth ? new Date(baby.dateOfBirth).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading('Updating baby...');
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
      const { data } = await api.put(`/babies/${babyId}`, payload);
      if (data.success) {
        hideAlert();
        setIsEditModalOpen(false);
        fetchBabyData();
        showSuccess('Baby updated successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update baby');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading baby details...</div>;
  }

  if (!baby) {
    return <div className="p-8 text-center text-red-500">Baby not found</div>;
  }

  return (
    <div className="flex flex-col space-y-6 pb-12">
      <div className="shrink-0">
        <button
          onClick={() => router.push('/babies')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Babies
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BabyIcon className="h-6 w-6 text-blue-600" /> {baby.name}'s Profile
          <button onClick={openEditModal} className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Profile">
            <Edit className="h-5 w-5" />
          </button>
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex shrink-0 gap-2 mb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'growth' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Growth Tracking
        </button>
        <button 
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'milestones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Milestones
        </button>
        <button 
          onClick={() => setActiveTab('nutrition')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'nutrition' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Nutrition Plans
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'prescriptions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Prescriptions
        </button>
        <button 
          onClick={() => setActiveTab('activitylogs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'activitylogs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Activity Logs
        </button>
        <button 
          onClick={() => setActiveTab('vaccinations')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'vaccinations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Vaccinations
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'overview' && <OverviewTab baby={baby} />}
        {activeTab === 'growth' && <GrowthTab babyId={babyId} />}
        {activeTab === 'milestones' && <MilestonesTab babyId={babyId} />}
        {activeTab === 'nutrition' && <NutritionTab babyId={babyId} />}
        {activeTab === 'prescriptions' && <PrescriptionsTab babyId={babyId} />}
        {activeTab === 'activitylogs' && <ActivityLogsTab babyId={babyId} />}
        {activeTab === 'vaccinations' && <VaccinationsTab baby={baby!} />}
      </div>

      {/* Edit Baby Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Baby Details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baby Name</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input required type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (Months)</label>
              <input required type="number" min="0" value={formData.ageInMonths} onChange={(e) => setFormData({...formData, ageInMonths: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg) - Optional</label>
              <input type="number" step="0.1" min="0" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma separated)</label>
            <input type="text" placeholder="e.g. Peanuts, Dairy" value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences / Diet</label>
            <input type="text" placeholder="e.g. Vegetarian, Lactose-free" value={formData.diet} onChange={(e) => setFormData({...formData, diet: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <select required value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Parent...</option>
                {parents.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor (Optional)</label>
              <select value={formData.assignedDoctorId} onChange={(e) => setFormData({...formData, assignedDoctorId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">None...</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Update Baby</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
