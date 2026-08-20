"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, ClipboardList, Eye, Plus, Baby, UserCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';

interface NutritionPlan {
  _id: string;
  babyId: { _id: string; name: string; ageInMonths: number };
  assignedBy: { _id: string; name: string; email: string };
  weeklySchedule: { day: string; mealId: string }[];
  guidelines: string;
  createdAt: string;
}

export default function NutritionPlansPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<NutritionPlan | null>(null);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data for form
  const [babies, setBabies] = useState<{_id: string, name: string}[]>([]);
  const [meals, setMeals] = useState<{_id: string, name: string, category: string}[]>([]);

  // Form State
  const [formData, setFormData] = useState({ 
    babyId: '', 
    guidelines: '',
    weeklySchedule: [] as { day: string, mealId: string }[]
  });
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealId, setSelectedMealId] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/nutrition-plans');
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch nutrition plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [babiesRes, mealsRes] = await Promise.all([
        api.get('/babies'),
        api.get('/meals') // Assuming /meals exists and returns all meals
      ]);
      if (babiesRes.data.success) setBabies(babiesRes.data.data);
      if (mealsRes.data.success) {
        setMeals(mealsRes.data.data);
        if (mealsRes.data.data.length > 0) {
          setSelectedMealId(mealsRes.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch babies or meals');
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchFormData();
  }, []);

  const openAddModal = () => {
    setEditingPlanId(null);
    setFormData({ 
      babyId: '', 
      guidelines: '',
      weeklySchedule: []
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (plan: NutritionPlan) => {
    setEditingPlanId(plan._id);
    setFormData({ 
      babyId: plan.babyId?._id || '', 
      guidelines: plan.guidelines || '',
      weeklySchedule: plan.weeklySchedule.map(s => ({
        day: s.day,
        mealId: typeof s.mealId === 'object' ? (s.mealId as any)._id : s.mealId
      }))
    });
    setIsAddModalOpen(true);
  };

  const addMealToSchedule = () => {
    if (!selectedMealId) return;
    setFormData(prev => ({
      ...prev,
      weeklySchedule: [...prev.weeklySchedule, { day: selectedDay, mealId: selectedMealId }]
    }));
  };

  const removeMealFromSchedule = (index: number) => {
    setFormData(prev => {
      const newSchedule = [...prev.weeklySchedule];
      newSchedule.splice(index, 1);
      return { ...prev, weeklySchedule: newSchedule };
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.weeklySchedule.length === 0) {
        showError('Please add at least one meal to the weekly schedule');
        return;
      }
      showLoading(editingPlanId ? 'Updating plan...' : 'Assigning plan...');
      
      const payload = {
        babyId: formData.babyId,
        guidelines: formData.guidelines,
        weeklySchedule: formData.weeklySchedule
      };

      let response;
      if (editingPlanId) {
        response = await api.put(`/nutrition-plans/${editingPlanId}`, payload);
      } else {
        response = await api.post('/nutrition-plans', payload);
      }
      
      if (response.data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setEditingPlanId(null);
        fetchPlans();
        showSuccess(`Nutrition plan ${editingPlanId ? 'updated' : 'assigned'} successfully!`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to assign nutrition plan');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirmDelete('this nutrition plan');
    if (isConfirmed) {
      try {
        showLoading('Deleting plan...');
        const response = await api.delete(`/nutrition-plans/${id}`);
        if (response.data.success) {
          hideAlert();
          fetchPlans();
          showSuccess('Nutrition plan deleted successfully!');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-purple-600" /> Nutrition Plans
        </h1>
        <button 
          onClick={openAddModal}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
        >
          + Assign New Plan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search plans..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No nutrition plans found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Baby</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Assigned By</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Total Meals</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Guidelines</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Date Created</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/babies/${plan.babyId?._id}?tab=nutrition`} className="text-blue-600 hover:underline">
                        {plan.babyId?.name || 'Unknown Baby'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{plan.assignedBy?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {plan.weeklySchedule.length} Meals
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={plan.guidelines}>{plan.guidelines || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(plan.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setViewingPlan(plan); setIsViewModalOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(plan)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(plan._id)}
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
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingPlanId ? "Edit Nutrition Plan" : "Assign Nutrition Plan"}>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Baby</label>
            <select 
              required 
              value={formData.babyId}
              onChange={(e) => setFormData({...formData, babyId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a baby...</option>
              {babies.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Guidelines (Optional)</label>
            <textarea 
              value={formData.guidelines}
              onChange={(e) => setFormData({...formData, guidelines: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any specific dietary guidelines or notes for parents/kitchen."
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Build Weekly Schedule</h4>
            
            <div className="flex gap-2 mb-4">
              <select 
                value={selectedDay} 
                onChange={e => setSelectedDay(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={selectedMealId}
                onChange={e => setSelectedMealId(e.target.value)}
                className="flex-[2] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 outline-none"
              >
                {meals.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={addMealToSchedule}
                className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Selected Schedule View */}
            {formData.weeklySchedule && formData.weeklySchedule.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-56 overflow-y-auto space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const dayItems = formData.weeklySchedule.filter(s => s.day === day);
                  if (dayItems.length === 0) return null;
                  
                  return (
                    <div key={day} className="mb-3 last:mb-0">
                      <h5 className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-2">{day}</h5>
                      <div className="space-y-2">
                        {formData.weeklySchedule.map((item, idx) => {
                          if (item.day !== day) return null;
                          const meal = meals.find(m => m._id === item.mealId);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg text-sm shadow-sm hover:border-purple-200 transition-colors">
                              <div className="flex gap-3 items-center">
                                <span className="text-gray-700 font-medium">{meal?.name || 'Unknown'}</span>
                              </div>
                              <button type="button" onClick={() => removeMealFromSchedule(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Remove Meal">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {(!formData.weeklySchedule || formData.weeklySchedule.length === 0) && (
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
                No meals added to the schedule yet.
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
              Save Plan
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Nutrition Plan Details">
        {viewingPlan && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 flex gap-3 items-center shadow-sm">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Baby className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-purple-600/80 uppercase tracking-wider font-bold mb-0.5">Baby Name</p>
                  <p className="font-semibold text-gray-900 leading-none">{viewingPlan.babyId?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex gap-3 items-center shadow-sm">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] text-blue-600/80 uppercase tracking-wider font-bold mb-0.5">Assigned By</p>
                  <p className="font-semibold text-gray-900 leading-none">{viewingPlan.assignedBy?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {viewingPlan.weeklySchedule && viewingPlan.weeklySchedule.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                   <ClipboardList className="h-4 w-4 text-purple-600" /> Weekly Schedule
                </h4>
                <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-4 max-h-64 overflow-y-auto space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const dayItems = viewingPlan.weeklySchedule.filter(s => s.day === day);
                    if (dayItems.length === 0) return null;
                    
                    return (
                      <div key={day} className="mb-3 last:mb-0">
                        <h5 className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-2">{day}</h5>
                        <div className="space-y-2">
                          {dayItems.map((item, idx) => {
                            const meal = typeof item.mealId === 'object' 
                              ? item.mealId 
                              : (meals.find(m => m._id === item.mealId) || { name: 'Unknown Meal' });
                            return (
                              <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg text-sm shadow-sm">
                                <span className="text-gray-700 font-medium">{(meal as any).name || 'Unknown Meal'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {viewingPlan.guidelines && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Dietary Guidelines</h4>
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {viewingPlan.guidelines}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100 flex justify-end">
               <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-5 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg shadow-sm transition-colors">
                 Close
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
