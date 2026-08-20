"use client";

import { useState, useEffect, useCallback } from 'react';
import { Pill, FileText, Calendar, UserCircle, Download, Edit, Trash2, Plus, X, Printer, Activity } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert, confirmDelete } from '@/utils/alert';
import PrescriptionDrawer from '@/components/PrescriptionDrawer';
import { Prescription } from './types';

interface PrescriptionsTabProps {
  babyId: string;
}

export default function PrescriptionsTab({ babyId }: PrescriptionsTabProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initialRxData = {
    medicalNotes: '',
    nutritionRecommendations: '',
    medicines: [] as { name: string; dosage: string; frequency: string; duration: string; instructions: string }[],
    vitals: { weight: '', temperature: '', bp: '' },
    nextVisitDate: '',
    file: null as File | null
  };
  const [rxData, setRxData] = useState(initialRxData);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const rxRes = await api.get(`/prescriptions/baby/${babyId}`);
      if (rxRes.data.success) {
        setPrescriptions(rxRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions', error);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const openAddModal = () => {
    setEditingRxId(null);
    setRxData(initialRxData);
    setIsRxModalOpen(true);
  };

  const openEditModal = (rx: Prescription) => {
    setEditingRxId(rx._id);
    setRxData({
      medicalNotes: rx.medicalNotes || '',
      nutritionRecommendations: rx.nutritionRecommendations || '',
      medicines: rx.medicines?.map(m => ({
        name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions
      })) || [],
      vitals: rx.vitals || { weight: '', temperature: '', bp: '' },
      nextVisitDate: rx.nextVisitDate ? new Date(rx.nextVisitDate).toISOString().split('T')[0] : '',
      file: null
    });
    setIsRxModalOpen(true);
  };

  const handleDeleteRx = async (id: string) => {
    const isConfirmed = await confirmDelete('this medical record');
    if (isConfirmed) {
      try {
        showLoading('Deleting record...');
        const res = await api.delete(`/prescriptions/${id}`);
        if (res.data.success) {
          hideAlert();
          setPrescriptions(prescriptions.filter(rx => rx._id !== id));
          showSuccess('Record deleted successfully');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingRxId ? 'Updating record...' : 'Uploading prescription...');
      const formData = new FormData();
      if (!editingRxId) formData.append('babyId', babyId);
      if (rxData.medicalNotes) formData.append('medicalNotes', rxData.medicalNotes);
      if (rxData.nutritionRecommendations) formData.append('nutritionRecommendations', rxData.nutritionRecommendations);
      if (rxData.medicines.length > 0) formData.append('medicines', JSON.stringify(rxData.medicines));
      if (rxData.vitals.weight || rxData.vitals.temperature || rxData.vitals.bp) formData.append('vitals', JSON.stringify(rxData.vitals));
      if (rxData.nextVisitDate) formData.append('nextVisitDate', rxData.nextVisitDate);
      if (rxData.file) formData.append('file', rxData.file);

      let res;
      if (editingRxId) {
        res = await api.put(`/prescriptions/${editingRxId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/prescriptions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      if (res.data.success) {
        if (editingRxId) {
          setPrescriptions(prescriptions.map(rx => rx._id === editingRxId ? res.data.data : rx));
        } else {
          setPrescriptions([res.data.data, ...prescriptions]);
        }
        setIsRxModalOpen(false);
        setRxData(initialRxData);
        hideAlert();
        showSuccess(`Prescription ${editingRxId ? 'updated' : 'added'} successfully`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to save prescription');
    }
  };

  const addMedicineRow = () => {
    setRxData({
      ...rxData,
      medicines: [...rxData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicineRow = (index: number) => {
    const newMeds = [...rxData.medicines];
    newMeds.splice(index, 1);
    setRxData({ ...rxData, medicines: newMeds });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMeds = [...rxData.medicines];
    (newMeds[index] as any)[field] = value;
    setRxData({ ...rxData, medicines: newMeds });
  };

  const printPrescription = (rx: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Prescription - ${rx._id}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #be123c; margin: 0; }
            .clinic-tagline { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .box { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; width: 48%; }
            .title { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 5px; }
            .value { font-size: 15px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f9fafb; font-size: 13px; color: #6b7280; font-weight: 600; }
            td { font-size: 14px; }
            .notes-section { margin-top: 30px; }
            .notes-box { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
            .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .signature { margin-top: 60px; text-align: right; }
            .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 5px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1 class="clinic-name">moncradle Pediatric Care</h1>
            <p class="clinic-tagline">Comprehensive Care for Your Little Ones</p>
          </div>
          
          <div class="row">
            <div class="box">
              <div class="title">Doctor</div>
              <div class="value">Dr. ${rx.doctorId?.name || 'Unknown'}</div>
              <div class="title" style="margin-top: 10px;">Date</div>
              <div class="value">${new Date(rx.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="box">
              <div class="title">Vitals</div>
              <div style="display: flex; gap: 15px; margin-top: 5px;">
                <div><span style="color:#6b7280; font-size:12px;">Wt:</span> <span class="value">${rx.vitals?.weight || '-'}</span></div>
                <div><span style="color:#6b7280; font-size:12px;">Temp:</span> <span class="value">${rx.vitals?.temperature || '-'}</span></div>
                <div><span style="color:#6b7280; font-size:12px;">BP:</span> <span class="value">${rx.vitals?.bp || '-'}</span></div>
              </div>
            </div>
          </div>

          <h3 style="color:#be123c; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Rx Medicines</h3>
          ${rx.medicines && rx.medicines.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${rx.medicines.map(m => `
                  <tr>
                    <td style="font-weight:600;">${m.name}</td>
                    <td>${m.dosage}</td>
                    <td>${m.frequency}</td>
                    <td>${m.duration}</td>
                    <td>${m.instructions}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color:#6b7280; font-style:italic;">No medicines prescribed.</p>'}

          <div class="notes-section">
            ${rx.medicalNotes ? `
              <div class="title">Medical Notes & Diagnosis</div>
              <div class="notes-box">${rx.medicalNotes}</div>
            ` : ''}
            
            ${rx.nutritionRecommendations ? `
              <div class="title">Diet & Nutrition</div>
              <div class="notes-box">${rx.nutritionRecommendations}</div>
            ` : ''}
          </div>

          ${rx.nextVisitDate ? `
            <div style="margin-top: 30px; font-weight: bold; color: #be123c;">
              Next Visit: ${new Date(rx.nextVisitDate).toLocaleDateString()}
            </div>
          ` : ''}

          <div class="signature">
            <div class="signature-line">
              Dr. ${rx.doctorId?.name || 'Signature'}
            </div>
          </div>

          <div class="footer">
            Generated by moncradle Health System • This is a digital prescription.
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <Pill className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Prescriptions & Medical Notes</h3>
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm">
            + Add Record
          </button>
        </div>
        <div className="p-6 flex-1 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mr-3"></div>
              Loading medical records...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
              <Pill className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No medical records found.</p>
              <p className="text-sm text-gray-400 mt-1">Add a prescription or note to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map(rx => (
                <div key={rx._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm overflow-hidden">
                        {rx.uploadedByParent ? (
                          rx.babyId?.parentId?.avatar ? (
                            <img src={rx.babyId.parentId.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-purple-500 font-bold">P</span>
                          )
                        ) : rx.doctorId?.avatar ? (
                          <img src={rx.doctorId.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{rx.uploadedByParent ? "Uploaded By" : "Doctor"}</p>
                        <h4 className="font-bold text-gray-900 leading-none">{rx.uploadedByParent ? (rx.babyId?.parentId?.name ? `${rx.babyId.parentId.name} (Parent)` : "Parent Upload") : (rx.doctorId?.name || 'Unknown')}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(rx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => printPrescription(rx)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-200 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5" title="Print Prescription">
                        <Printer className="h-4 w-4" /> Print
                      </button>
                      <div className="h-6 w-px bg-gray-200 mx-1"></div>
                      <button onClick={() => openEditModal(rx)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Record">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteRx(rx._id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Record">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Vitals & Next Visit */}
                    {(rx.vitals?.weight || rx.vitals?.temperature || rx.vitals?.bp || rx.nextVisitDate) && (
                      <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-gray-100">
                        {rx.vitals?.weight && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium uppercase">Wt:</span>
                            <span className="text-sm font-semibold text-gray-800">{rx.vitals.weight}</span>
                          </div>
                        )}
                        {rx.vitals?.temperature && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium uppercase">Temp:</span>
                            <span className="text-sm font-semibold text-gray-800">{rx.vitals.temperature}</span>
                          </div>
                        )}
                        {rx.vitals?.bp && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium uppercase">BP:</span>
                            <span className="text-sm font-semibold text-gray-800">{rx.vitals.bp}</span>
                          </div>
                        )}
                        {rx.nextVisitDate && (
                          <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 ml-auto">
                            <Calendar className="h-4 w-4 text-rose-500" />
                            <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">Next Visit:</span>
                            <span className="text-sm font-semibold text-rose-800">
                              {new Date(rx.nextVisitDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Medicines Table */}
                    {rx.medicines && rx.medicines.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Pill className="h-3.5 w-3.5" /> Prescribed Medicines
                        </h5>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                              <tr>
                                <th className="px-4 py-2 font-semibold">Medicine</th>
                                <th className="px-4 py-2 font-semibold">Dosage</th>
                                <th className="px-4 py-2 font-semibold">Frequency</th>
                                <th className="px-4 py-2 font-semibold">Duration</th>
                                <th className="px-4 py-2 font-semibold">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {rx.medicines.map((med, idx) => (
                                <tr key={idx} className="bg-white">
                                  <td className="px-4 py-3 font-semibold text-gray-900">{med.name}</td>
                                  <td className="px-4 py-3 text-gray-700">{med.dosage}</td>
                                  <td className="px-4 py-3 text-gray-700">{med.frequency}</td>
                                  <td className="px-4 py-3 text-gray-700">{med.duration}</td>
                                  <td className="px-4 py-3 text-gray-500 italic">{med.instructions || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {(rx.medicalNotes || rx.nutritionRecommendations) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {rx.medicalNotes && (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h5 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                              Medical Notes & Diagnosis
                            </h5>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{rx.medicalNotes}</p>
                          </div>
                        )}
                        {rx.nutritionRecommendations && (
                          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <h5 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                              Diet & Nutrition Recs
                            </h5>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{rx.nutritionRecommendations}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document */}
                    {rx.fileUrl && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <a
                          href={rx.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-rose-600 transition-colors shadow-sm"
                        >
                          <FileText className="h-4 w-4 text-rose-500" />
                          View Attached Document
                          <Download className="h-3.5 w-3.5 ml-1 opacity-50" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
      />
    </>
  );
}
