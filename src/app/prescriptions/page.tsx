"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Trash2, Pill, Eye, Download, Edit, X, Activity, Utensils, Calendar } from 'lucide-react';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import PrescriptionDrawer from '@/components/PrescriptionDrawer';
import Image from 'next/image';

interface Prescription {
  _id: string;
  babyId: { _id: string; name: string; parentId?: { _id: string; name: string; avatar?: string } };
  doctorId: { _id: string; name: string; email: string; avatar?: string };
  uploadedByParent?: boolean;
  fileUrl: string;
  medicalNotes: string;
  nutritionRecommendations: string;
  medicines: any[];
  vitals: { weight: string; temperature: string; bp: string };
  nextVisitDate: string;
  createdAt: string;
}

export default function PrescriptionsPage() {
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [babies, setBabies] = useState<{_id: string, name: string}[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [rxData, setRxData] = useState({
    babyId: '',
    file: null as File | null,
    medicalNotes: '',
    nutritionRecommendations: '',
    vitals: { weight: '', temperature: '', bp: '' },
    nextVisitDate: '',
    medicines: [] as any[]
  });

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/prescriptions');
      if (data.success) {
        setPrescriptions(data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchBabies = async () => {
    try {
      const res = await api.get('/babies');
      if (res.data.success) {
        setBabies(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch babies');
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchBabies();
  }, []);

  const addMedicineRow = () => {
    setRxData({
      ...rxData,
      medicines: [...rxData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicineRow = (index: number) => {
    const updated = [...rxData.medicines];
    updated.splice(index, 1);
    setRxData({ ...rxData, medicines: updated });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...rxData.medicines];
    updated[index][field] = value;
    setRxData({ ...rxData, medicines: updated });
  };

  const openAddDrawer = () => {
    setEditingRxId(null);
    setRxData({
      babyId: '',
      file: null,
      medicalNotes: '',
      nutritionRecommendations: '',
      vitals: { weight: '', temperature: '', bp: '' },
      nextVisitDate: '',
      medicines: []
    });
    setIsRxModalOpen(true);
  };

  const handleEdit = (rx: Prescription) => {
    setEditingRxId(rx._id);
    setRxData({
      babyId: rx.babyId?._id || '',
      file: null, // Keep existing file unless a new one is uploaded
      medicalNotes: rx.medicalNotes || '',
      nutritionRecommendations: rx.nutritionRecommendations || '',
      vitals: rx.vitals || { weight: '', temperature: '', bp: '' },
      nextVisitDate: rx.nextVisitDate ? new Date(rx.nextVisitDate).toISOString().split('T')[0] : '',
      medicines: rx.medicines || []
    });
    setIsRxModalOpen(true);
  };

  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxData.babyId) {
      showError('Please select a patient first.');
      return;
    }
    
    if (!rxData.file && !rxData.medicalNotes && rxData.medicines.length === 0 && !editingRxId) {
      showError('Please add a file, notes, or medicines.');
      return;
    }

    try {
      showLoading(editingRxId ? 'Updating prescription...' : 'Saving prescription...');
      const payload = new FormData();
      payload.append('babyId', rxData.babyId);
      payload.append('medicalNotes', rxData.medicalNotes);
      payload.append('nutritionRecommendations', rxData.nutritionRecommendations);
      payload.append('vitals', JSON.stringify(rxData.vitals));
      payload.append('nextVisitDate', rxData.nextVisitDate);
      payload.append('medicines', JSON.stringify(rxData.medicines));
      
      if (rxData.file) {
        payload.append('file', rxData.file);
      }

      let response;
      if (editingRxId) {
        response = await api.put(`/prescriptions/${editingRxId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/prescriptions', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        hideAlert();
        setIsRxModalOpen(false);
        fetchPrescriptions();
        showSuccess(editingRxId ? 'Prescription updated!' : 'Prescription saved successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to save prescription');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete('this prescription');
    if (confirmed) {
      try {
        showLoading('Deleting...');
        const res = await api.delete(`/prescriptions/${id}`);
        if (res.data.success) {
          hideAlert();
          fetchPrescriptions();
          showSuccess('Prescription deleted');
        }
      } catch (error) {
        hideAlert();
        showError('Failed to delete prescription');
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="h-6 w-6 text-blue-600" /> All Prescriptions
        </h1>
        <button 
          onClick={openAddDrawer}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Prescription
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by baby or doctor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No prescriptions found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Patient</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Uploaded By</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Type</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Medicines</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Date</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">File</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions
                  .filter(p =>
                    !searchTerm ||
                    p.babyId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/babies/${p.babyId?._id}?tab=prescriptions`} className="text-blue-600 hover:underline">
                        {p.babyId?.name || 'Unknown Baby'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          {p.uploadedByParent ? (
                            p.babyId?.parentId?.avatar
                              ? <img src={p.babyId.parentId.avatar} alt="" className="w-full h-full object-cover" />
                              : <span className="text-purple-500 text-xs font-bold">P</span>
                          ) : (
                            p.doctorId?.avatar
                              ? <img src={p.doctorId.avatar} alt="" className="w-full h-full object-cover" />
                              : <span className="text-blue-500 text-xs font-bold">Dr</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-700">
                          {p.uploadedByParent ? (p.babyId?.parentId?.name ? `${p.babyId.parentId.name} (Parent)` : 'Parent Upload') : (p.doctorId?.name || 'Unknown Doctor')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        p.uploadedByParent
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {p.uploadedByParent ? '📄 Report' : '💊 Prescription'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.medicines && p.medicines.length > 0
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">{p.medicines.length} Medicines</span>
                        : <span className="text-gray-400 text-xs">No Medicines</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {p.fileUrl ? (
                        <a href={p.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Download className="h-4 w-4" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRx(p)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id)}
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

      <PrescriptionDrawer
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        editingRxId={editingRxId}
        rxData={rxData}
        setRxData={setRxData}
        handleSaveRx={handleSaveRx}
        addMedicineRow={addMedicineRow}
        removeMedicineRow={removeMedicineRow}
        updateMedicine={updateMedicine}
        babies={babies}
      />

      {/* Record Detail Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRx(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Record Details</h2>
              <button onClick={() => setSelectedRx(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 overflow-y-auto space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                    {selectedRx.uploadedByParent ? (
                      selectedRx.babyId?.parentId?.avatar ? (
                        <img src={selectedRx.babyId.parentId.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-purple-500 font-bold text-sm">P</span>
                      )
                    ) : selectedRx.doctorId?.avatar ? (
                      <img src={selectedRx.doctorId.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-500 font-bold text-sm">Dr</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{selectedRx.uploadedByParent ? 'Uploaded By' : 'Doctor'}</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRx.uploadedByParent ? (selectedRx.babyId?.parentId?.name ? `${selectedRx.babyId.parentId.name} (Parent)` : 'Parent Upload') : (selectedRx.doctorId?.name || 'Unknown Doctor')}</p>
                    <p className="text-xs text-blue-500">{selectedRx.babyId?.name ? `Patient: ${selectedRx.babyId.name}` : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(selectedRx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Type */}
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                selectedRx.uploadedByParent ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>{selectedRx.uploadedByParent ? '📄 Parent Report' : '💊 Doctor Prescription'}</span>

              {/* Medical Notes */}
              <div className="p-4 bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-blue-500" /><h4 className="text-sm font-bold text-gray-900">Medical Notes</h4></div>
                <p className="text-sm text-gray-600">{selectedRx.medicalNotes || <span className="text-gray-400 italic">No medical notes provided.</span>}</p>
              </div>

              {/* Diet & Nutrition */}
              {selectedRx.nutritionRecommendations && (
                <div className="p-4 bg-white border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2"><Utensils className="w-4 h-4 text-orange-500" /><h4 className="text-sm font-bold text-gray-900">Diet & Nutrition</h4></div>
                  <p className="text-sm text-gray-600">{selectedRx.nutritionRecommendations}</p>
                </div>
              )}

              {/* Vitals */}
              {selectedRx.vitals && (selectedRx.vitals.weight || selectedRx.vitals.temperature || selectedRx.vitals.bp) && (
                <div className="p-4 bg-white border border-gray-100 rounded-xl">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Vitals</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRx.vitals.weight && <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500 font-semibold">Weight</p><p className="text-sm font-bold">{selectedRx.vitals.weight}</p></div>}
                    {selectedRx.vitals.temperature && <div className="text-center p-2 bg-orange-50 rounded-lg"><p className="text-xs text-gray-500 font-semibold">Temp</p><p className="text-sm font-bold">{selectedRx.vitals.temperature}</p></div>}
                    {selectedRx.vitals.bp && <div className="text-center p-2 bg-red-50 rounded-lg"><p className="text-xs text-gray-500 font-semibold">BP</p><p className="text-sm font-bold">{selectedRx.vitals.bp}</p></div>}
                  </div>
                </div>
              )}

              {/* Medicines */}
              {selectedRx.medicines && selectedRx.medicines.length > 0 && (
                <div className="p-4 bg-white border border-gray-100 rounded-xl">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">💊 Medicines ({selectedRx.medicines.length})</h4>
                  <div className="space-y-2">
                    {selectedRx.medicines.map((med: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{med.dosage} · {med.frequency} · {med.duration}</p>
                        {med.instructions && <p className="text-xs text-blue-600 mt-0.5">{med.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Visit */}
              {selectedRx.nextVisitDate && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <div><p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Next Visit</p><p className="text-sm font-bold text-gray-900">{new Date(selectedRx.nextVisitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                </div>
              )}

              {/* File Download */}
              {selectedRx.fileUrl && (
                <a href={selectedRx.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" /> Download Document
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
