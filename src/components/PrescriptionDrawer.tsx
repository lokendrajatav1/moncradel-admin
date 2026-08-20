import React from 'react';
import { X, Plus, FileText, Trash2, HeartPulse, Pill, FileEdit, User } from 'lucide-react';

interface PrescriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingRxId: string | null;
  rxData: any;
  setRxData: (data: any) => void;
  handleSaveRx: (e: React.FormEvent) => void;
  addMedicineRow: () => void;
  removeMedicineRow: (index: number) => void;
  updateMedicine: (index: number, field: string, value: string) => void;
  babies?: { _id: string; name: string }[]; // Optional: if provided, shows a dropdown to select a baby
}

export default function PrescriptionDrawer({
  isOpen,
  onClose,
  editingRxId,
  rxData,
  setRxData,
  handleSaveRx,
  addMedicineRow,
  removeMedicineRow,
  updateMedicine,
  babies
}: PrescriptionDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      {/* Drawer */}
      <section className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-4xl transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-rose-500" />
                  {editingRxId ? "Edit Medical Record" : "New Medical Record"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details for the prescription and medical notes.</p>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <form id="rx-form" onSubmit={handleSaveRx} className="space-y-10">
                
                {/* Baby Selector (if babies prop is provided) */}
                {babies && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <User className="h-4 w-4 text-purple-500" /> Patient Details
                    </h3>
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Baby</label>
                      <select 
                        required 
                        value={rxData.babyId || ''}
                        onChange={(e) => setRxData({...rxData, babyId: e.target.value})}
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
                      >
                        <option value="">Select a patient...</option>
                        {babies.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Vitals & Next Visit */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <HeartPulse className="h-4 w-4 text-rose-400" /> Vitals & Schedule
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Weight</label>
                      <input type="text" placeholder="e.g. 8.5 kg" value={rxData.vitals.weight} onChange={e => setRxData({...rxData, vitals: {...rxData.vitals, weight: e.target.value}})} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Temperature</label>
                      <input type="text" placeholder="e.g. 98.6 F" value={rxData.vitals.temperature} onChange={e => setRxData({...rxData, vitals: {...rxData.vitals, temperature: e.target.value}})} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Blood Pressure</label>
                      <input type="text" placeholder="e.g. 120/80" value={rxData.vitals.bp} onChange={e => setRxData({...rxData, vitals: {...rxData.vitals, bp: e.target.value}})} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Visit Date</label>
                      <input type="date" value={rxData.nextVisitDate} onChange={e => setRxData({...rxData, nextVisitDate: e.target.value})} className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Medicines Table */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" /> Prescribed Medicines
                    </h3>
                    <button type="button" onClick={addMedicineRow} className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
                      <Plus className="h-3 w-3" /> Add Medicine
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-1/4">Medicine Name</th>
                          <th className="px-4 py-3 font-semibold">Dosage</th>
                          <th className="px-4 py-3 font-semibold">Frequency</th>
                          <th className="px-4 py-3 font-semibold">Duration</th>
                          <th className="px-4 py-3 font-semibold w-1/4">Instructions</th>
                          <th className="px-4 py-3 font-semibold w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {rxData.medicines.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                              No medicines added. Click "Add Medicine" to prescribe.
                            </td>
                          </tr>
                        ) : (
                          rxData.medicines.map((med: any, idx: number) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-3 py-2">
                                <input type="text" placeholder="Name" required value={med.name} onChange={e => updateMedicine(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="text" placeholder="e.g. 5ml" required value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} className="w-full px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="text" placeholder="1-0-1" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} className="w-full px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="text" placeholder="5 Days" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} className="w-full px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="text" placeholder="After meal" value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} className="w-full px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors" />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button type="button" onClick={() => removeMedicineRow(idx)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Medical Notes & Diagnosis</h3>
                    <textarea value={rxData.medicalNotes} onChange={e => setRxData({ ...rxData, medicalNotes: e.target.value })} className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors resize-none" rows={4} placeholder="Enter observations..."></textarea>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Diet & Nutrition</h3>
                    <textarea value={rxData.nutritionRecommendations} onChange={e => setRxData({ ...rxData, nutritionRecommendations: e.target.value })} className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors resize-none" rows={4} placeholder="Dietary recommendations..."></textarea>
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Attached Document <span className="text-gray-400 font-normal">(Optional)</span></h3>
                  <div className="flex items-center gap-4">
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Choose File
                      <input id="file-upload" type="file" className="sr-only" onChange={e => setRxData({ ...rxData, file: e.target.files?.[0] || null })} />
                    </label>
                    <span className="text-sm text-gray-500">
                      {rxData.file ? <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">{rxData.file.name}</span> : "No file chosen"}
                    </span>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="rx-form"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"
              >
                {editingRxId ? "Update Prescription" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
