"use client";

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Utensils, Calendar, Edit, Trash2, Plus, X } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import Modal from '@/components/Modal';
import { NutritionPlan, Meal, ScheduleItem } from './types';

interface NutritionTabProps {
  babyId: string;
}

export default function NutritionTab({ babyId }: NutritionTabProps) {
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recommendedMeals, setRecommendedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  
  // Form states
  const [planData, setPlanData] = useState<{ guidelines: string, weeklySchedule: ScheduleItem[] }>({ 
    guidelines: '', 
    weeklySchedule: [] 
  });
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealId, setSelectedMealId] = useState('');

  const fetchNutritionPlans = useCallback(async () => {
    try {
      setLoading(true);
      const [planRes, mealRes, recRes] = await Promise.all([
        api.get(`/nutrition-plans/${babyId}`),
        api.get('/meals'),
        api.get(`/meals/recommendations/${babyId}`).catch(() => ({ data: { success: false, data: [] } }))
      ]);
      
      if (planRes.data.success) {
        setNutritionPlans(planRes.data.data);
      }
      if (mealRes.data.success) {
        setMeals(mealRes.data.data);
        if (mealRes.data.data.length > 0) {
          setSelectedMealId(mealRes.data.data[0]._id);
        }
      }
      if (recRes.data.success) {
        setRecommendedMeals(recRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch nutrition data', error);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchNutritionPlans();
  }, [fetchNutritionPlans]);

  const addMealToSchedule = () => {
    if (!selectedMealId) return;
    const meal = meals.find(m => m._id === selectedMealId);
    if (!meal) return;

    setPlanData(prev => ({
      ...prev,
      weeklySchedule: [...prev.weeklySchedule, { day: selectedDay, mealId: meal }]
    }));
  };

  const removeMealFromSchedule = (index: number) => {
    setPlanData(prev => {
      const newSchedule = [...prev.weeklySchedule];
      newSchedule.splice(index, 1);
      return { ...prev, weeklySchedule: newSchedule };
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (planData.weeklySchedule.length === 0) {
        showError('Please add at least one meal to the weekly schedule');
        return;
      }
      showLoading(editingPlan ? 'Updating plan...' : 'Adding plan...');
      
      // Transform schedule for API (send only IDs)
      const scheduleForApi = planData.weeklySchedule.map(item => ({
        day: item.day,
        mealId: typeof item.mealId === 'object' ? item.mealId._id : item.mealId
      }));

      const payload = {
        babyId,
        guidelines: planData.guidelines,
        weeklySchedule: scheduleForApi
      };
      
      let res;
      if (editingPlan) {
        res = await api.put(`/nutrition-plans/${editingPlan._id}`, payload);
      } else {
        res = await api.post('/nutrition-plans', payload);
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setEditingPlan(null);
        setPlanData({ guidelines: '', weeklySchedule: [] });
        fetchNutritionPlans();
        hideAlert();
        showSuccess(`Nutrition plan ${editingPlan ? 'updated' : 'added'} successfully`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || `Failed to ${editingPlan ? 'update' : 'add'} plan`);
    }
  };

  const openEditModal = (plan: NutritionPlan) => {
    setEditingPlan(plan);
    setPlanData({
      guidelines: plan.guidelines || '',
      weeklySchedule: plan.weeklySchedule || []
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (plan: NutritionPlan) => {
    const isConfirmed = await confirmDelete('this nutrition plan');
    if (isConfirmed) {
      try {
        showLoading('Deleting plan...');
        const res = await api.delete(`/nutrition-plans/${plan._id}`);
        if (res.data.success) {
          fetchNutritionPlans();
          hideAlert();
          showSuccess('Nutrition plan deleted successfully');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-purple-600" /> Nutrition Plans</h3>
        <button onClick={() => { setEditingPlan(null); setPlanData({ guidelines: '', weeklySchedule: [] }); setIsModalOpen(true); }} className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors shadow-sm">
          + Add Plan
        </button>
      </div>
      <div className="p-6 flex-1">
        {loading ? (
          <div className="text-center text-gray-500">Loading nutrition plans...</div>
        ) : nutritionPlans.length === 0 ? (
          <div className="text-center text-gray-500">No nutrition plans assigned.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nutritionPlans.map(plan => (
              <div key={plan._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/80 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600 shadow-sm border border-purple-200/50">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg tracking-tight">Nutrition Plan</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-purple-400" />
                        {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full font-medium border border-purple-100">
                      By {plan.assignedBy?.name || 'Doctor'}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-purple-100 shadow-sm">
                      <button onClick={() => openEditModal(plan)} className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeletePlan(plan)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {plan.weeklySchedule && plan.weeklySchedule.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Weekly Schedule</h5>
                    <div className="space-y-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const dayMeals = plan.weeklySchedule!.filter(s => s.day === day);
                        if (dayMeals.length === 0) return null;
                        
                        return (
                          <div key={day} className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                            <h6 className="text-xs font-semibold text-purple-800 mb-2">{day}</h6>
                            <div className="space-y-2">
                              {dayMeals.map((item, idx) => {
                                const meal = item.mealId as Meal;
                                return (
                                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
                                    <span className="font-medium text-gray-800">{meal?.name || 'Unknown Meal'}</span>
                                    {meal?.nutritionalInfo?.calories && (
                                      <span className="text-xs text-gray-500">{meal.nutritionalInfo.calories} kcal</span>
                                    )}
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
                
                {plan.guidelines && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dietary Guidelines</h5>
                    <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {plan.guidelines}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? "Edit Nutrition Plan" : "Add Nutrition Plan"}>
        <form onSubmit={handleSavePlan} className="space-y-5">
          {/* Schedule Builder */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Build Weekly Schedule</h4>
            
            {recommendedMeals.length > 0 && (
              <div className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h5 className="text-xs font-bold text-purple-700 mb-2">Recommended Meals for this Baby</h5>
                <div className="flex flex-wrap gap-2">
                  {recommendedMeals.map(rm => (
                    <button 
                      type="button" 
                      key={rm._id}
                      onClick={() => { setSelectedMealId(rm._id); }}
                      className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${selectedMealId === rm._id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                    >
                      {rm.name}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-purple-500 mt-2">Click to select, then use the + button below to add to schedule.</p>
              </div>
            )}

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
            {planData.weeklySchedule && planData.weeklySchedule.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-56 overflow-y-auto space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const dayItems = planData.weeklySchedule.filter(s => s.day === day);
                  if (dayItems.length === 0) return null;
                  
                  return (
                    <div key={day} className="mb-3 last:mb-0">
                      <h5 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">{day}</h5>
                      <div className="space-y-2">
                        {planData.weeklySchedule.map((item, idx) => {
                          if (item.day !== day) return null;
                          const meal = typeof item.mealId === 'object' ? item.mealId : meals.find(m => m._id === item.mealId);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg text-sm shadow-sm hover:border-purple-200 transition-colors">
                              <div className="flex gap-3 items-center">
                                <span className="text-gray-800 font-medium">{meal?.name || 'Unknown'}</span>
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
            {(!planData.weeklySchedule || planData.weeklySchedule.length === 0) && (
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
                No meals added to the schedule yet.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Guidelines (Optional)</label>
            <textarea
              rows={3}
              value={planData.guidelines}
              onChange={(e) => setPlanData({ ...planData, guidelines: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Enter specific dietary rules or notes..."
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium shadow-sm">{editingPlan ? 'Update Plan' : 'Save Plan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
