"use client";

import { useState, useEffect, useCallback } from 'react';
import { Activity, Edit, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import Modal from '@/components/Modal';
import { GrowthRecord } from './types';

interface GrowthTabProps {
  babyId: string;
}

export default function GrowthTab({ babyId }: GrowthTabProps) {
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [editingGrowthRecord, setEditingGrowthRecord] = useState<GrowthRecord | null>(null);
  
  const [growthData, setGrowthData] = useState({ 
    weight: '', 
    height: '', 
    headCircumference: '', 
    notes: '' 
  });

  const fetchGrowthRecords = useCallback(async () => {
    try {
      const growthRes = await api.get(`/growth/${babyId}`);
      if (growthRes.data.success) {
        setGrowthRecords(growthRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch growth records', error);
    }
  }, [babyId]);

  useEffect(() => {
    fetchGrowthRecords();
  }, [fetchGrowthRecords]);

  const handleAddGrowth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingGrowthRecord ? 'Updating growth record...' : 'Adding growth record...');
      const payload = {
        babyId,
        weight: Number(growthData.weight),
        height: Number(growthData.height),
        headCircumference: growthData.headCircumference ? Number(growthData.headCircumference) : undefined,
        notes: growthData.notes
      };
      
      let data;
      if (editingGrowthRecord) {
        const response = await api.put(`/growth/${editingGrowthRecord._id}`, payload);
        data = response.data;
      } else {
        const response = await api.post('/growth', payload);
        data = response.data;
      }

      if (data.success) {
        hideAlert();
        setIsGrowthModalOpen(false);
        setEditingGrowthRecord(null);
        setGrowthData({ weight: '', height: '', headCircumference: '', notes: '' });
        fetchGrowthRecords();
        showSuccess(`Growth record ${editingGrowthRecord ? 'updated' : 'added'}!`);
      }
    } catch (error: any) {
      hideAlert();
      const errorMsg = error.response?.data?.errors 
        ? error.response.data.errors.map((e: any) => e.message).join(', ') 
        : error.response?.data?.message;
      showError(errorMsg || `Failed to ${editingGrowthRecord ? 'update' : 'add'} growth record`);
    }
  };

  const openEditGrowthModal = (record: GrowthRecord) => {
    setEditingGrowthRecord(record);
    setGrowthData({
      weight: record.weight.toString(),
      height: record.height.toString(),
      headCircumference: record.headCircumference ? record.headCircumference.toString() : '',
      notes: record.notes || ''
    });
    setIsGrowthModalOpen(true);
  };

  const handleDeleteGrowth = async (record: GrowthRecord) => {
    const isConfirmed = await confirmDelete('this growth record');
    if (isConfirmed) {
      try {
        showLoading('Deleting record...');
        const { data } = await api.delete(`/growth/${record._id}`);
        if (data.success) {
          hideAlert();
          fetchGrowthRecords();
          showSuccess('Record deleted successfully');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="h-4 w-4 text-green-600" /> Growth Records</h3>
          <button 
            onClick={() => { 
              setEditingGrowthRecord(null); 
              setGrowthData({ weight: '', height: '', headCircumference: '', notes: '' }); 
              setIsGrowthModalOpen(true); 
            }} 
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
          >
            + Add Record
          </button>
        </div>
        
        <div className="flex flex-col">
          {/* Growth Chart */}
          {growthRecords.length > 0 && (
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Growth Chart</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    growthRecords.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(r => ({
                      date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      weight: r.weight,
                      height: r.height
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dx={-10} domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} dx={10} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" name="Weight (kg)" dataKey="weight" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" name="Height (cm)" dataKey="height" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="w-full">
          {growthRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No growth records found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900">
                <tr>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Date</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Weight (kg)</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Height (cm)</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Head Circ. (cm)</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200">Notes</th>
                  <th className="px-6 py-3 font-semibold border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {growthRecords.map(record => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{record.weight}</td>
                    <td className="px-6 py-3">{record.height}</td>
                    <td className="px-6 py-3">{record.headCircumference || '-'}</td>
                    <td className="px-6 py-3 max-w-xs truncate" title={record.notes}>{record.notes || '-'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditGrowthModal(record)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteGrowth(record)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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
      </div>

      {/* Add/Edit Growth Modal */}
      <Modal isOpen={isGrowthModalOpen} onClose={() => setIsGrowthModalOpen(false)} title={editingGrowthRecord ? "Edit Growth Record" : "Add Growth Record"}>
        <form onSubmit={handleAddGrowth} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input required type="number" step="0.1" value={growthData.weight} onChange={e => setGrowthData({ ...growthData, weight: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input required type="number" step="0.1" value={growthData.height} onChange={e => setGrowthData({ ...growthData, height: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Head Circumference (cm) - Optional</label>
            <input type="number" step="0.1" value={growthData.headCircumference} onChange={e => setGrowthData({ ...growthData, headCircumference: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={growthData.notes} onChange={e => setGrowthData({ ...growthData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" rows={3}></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsGrowthModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">{editingGrowthRecord ? 'Update Record' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
