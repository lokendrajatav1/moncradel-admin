"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Calendar, Edit, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import Modal from '@/components/Modal';
import { Milestone } from './types';

interface MilestonesTabProps {
  babyId: string;
}

export default function MilestonesTab({ babyId }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneData, setMilestoneData] = useState({ 
    title: '', 
    dateAchieved: '', 
    notes: '' 
  });

  const fetchMilestones = useCallback(async () => {
    try {
      const milestoneRes = await api.get(`/milestones/${babyId}`);
      if (milestoneRes.data.success) {
        setMilestones(milestoneRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch milestones', error);
    }
  }, [babyId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingMilestone ? 'Updating milestone...' : 'Adding milestone...');
      const payload = {
        babyId,
        title: milestoneData.title,
        dateAchieved: milestoneData.dateAchieved,
        notes: milestoneData.notes
      };
      
      let res;
      if (editingMilestone) {
        res = await api.put(`/milestones/${editingMilestone._id}`, payload);
      } else {
        res = await api.post('/milestones', payload);
      }

      if (res.data.success) {
        setIsMilestoneModalOpen(false);
        setEditingMilestone(null);
        setMilestoneData({ title: '', dateAchieved: '', notes: '' });
        fetchMilestones();
        hideAlert();
        showSuccess(`Milestone ${editingMilestone ? 'updated' : 'added'} successfully`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || `Failed to ${editingMilestone ? 'update' : 'add'} milestone`);
    }
  };

  const openEditMilestoneModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneData({
      title: milestone.title,
      dateAchieved: milestone.dateAchieved.split('T')[0],
      notes: milestone.notes || ''
    });
    setIsMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = async (milestone: Milestone) => {
    const isConfirmed = await confirmDelete('this milestone');
    if (isConfirmed) {
      try {
        showLoading('Deleting milestone...');
        const res = await api.delete(`/milestones/${milestone._id}`);
        if (res.data.success) {
          fetchMilestones();
          hideAlert();
          showSuccess('Milestone deleted successfully');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete milestone');
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-500" /> Milestones</h3>
          <button onClick={() => { setEditingMilestone(null); setMilestoneData({ title: '', dateAchieved: '', notes: '' }); setIsMilestoneModalOpen(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm">
            + Add Milestone
          </button>
        </div>
        <div className="p-6 flex-1">
          {milestones.length === 0 ? (
            <div className="text-center text-gray-500">No milestones achieved yet.</div>
          ) : (
            <div className="relative border-l-2 border-orange-200 ml-3 space-y-8 pb-4 pt-2">
              {milestones.map(m => (
                <div key={m._id} className="relative pl-8 group">
                  <div className="absolute -left-[11px] top-4 h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                    <div className="absolute h-2 w-2 rounded-full bg-orange-400 animate-ping opacity-75"></div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group-hover:border-orange-200 group-hover:-translate-y-0.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{m.title}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-orange-400" /> 
                          {new Date(m.dateAchieved).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button onClick={() => openEditMilestoneModal(m)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteMilestone(m)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {m.notes && (
                      <div className="mt-3.5">
                        <p className="text-sm text-gray-600 italic leading-relaxed">
                          "{m.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title={editingMilestone ? "Edit Milestone" : "Add Milestone"}>
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
            <input required type="text" placeholder="e.g. First Steps" value={milestoneData.title} onChange={e => setMilestoneData({ ...milestoneData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Achieved</label>
            <input required type="date" value={milestoneData.dateAchieved} onChange={e => setMilestoneData({ ...milestoneData, dateAchieved: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Memories</label>
            <textarea value={milestoneData.notes} onChange={e => setMilestoneData({ ...milestoneData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3}></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsMilestoneModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm">{editingMilestone ? 'Update Milestone' : 'Save Milestone'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
