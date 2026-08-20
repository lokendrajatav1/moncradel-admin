"use client";

import { useState, useEffect, useCallback } from 'react';
import { Syringe, CheckCircle2, Activity, Calendar, UserCircle, FileText, Loader2, Edit2, XCircle } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, showLoading, hideAlert, confirmAction } from '@/utils/alert';
import Modal from '@/components/Modal';
import { Baby } from './types';

interface VaccineScheduleItem {
  _id?: string;
  name: string;
  dueMonths: number;
  dueAgeLabel?: string;
  description: string;
  computedStatus: string;
  record: any;
}

export default function VaccinationsTab({ baby }: VaccinationsTabProps) {
  const [schedule, setSchedule] = useState<VaccineScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const [formData, setFormData] = useState({
    vaccineName: "", // only used for custom
    givenDate: new Date().toISOString().split('T')[0],
    rescheduledDate: new Date().toISOString().split('T')[0],
    administeredBy: "",
    notes: ""
  });
  const [activeModalTab, setActiveModalTab] = useState<'given' | 'reschedule'>('given');

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vaccinations/${baby._id}/schedule`);
      
      if (res.data.success) {
        setSchedule(res.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch vaccinations", error);
    } finally {
      setLoading(false);
    }
  }, [baby._id]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openVaccineModal = (vaccineName: string) => {
    const existingRecord = schedule.find(r => r.name === vaccineName)?.record;
    setSelectedVaccine(vaccineName);
    setIsCustomMode(false);
    setFormData({
      vaccineName: vaccineName,
      givenDate: existingRecord?.givenDate ? new Date(existingRecord.givenDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rescheduledDate: existingRecord?.rescheduledDueDate ? new Date(existingRecord.rescheduledDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      administeredBy: existingRecord?.administeredBy || "",
      notes: existingRecord?.notes || ""
    });
    setActiveModalTab('given');
    setIsModalOpen(true);
  };

  const openRescheduleModal = (vaccineName: string) => {
    openVaccineModal(vaccineName);
    setActiveModalTab('reschedule');
  };

  const handleSkip = async (vaccineName: string) => {
    const isConfirmed = await confirmAction('Skip Vaccine?', `Are you sure you want to mark ${vaccineName} as skipped?`, 'Yes, Skip');
    if (isConfirmed) {
      try {
        showLoading('Skipping vaccine...');
        const res = await api.post(`/vaccinations/${baby._id}`, {
          vaccineName,
          isSkipped: true
        });
        if (res.data.success) {
          hideAlert();
          showSuccess('Vaccine skipped successfully');
          await fetchRecords();
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || "Failed to skip vaccination");
      }
    }
  };

  const handleMissed = async (vaccineName: string) => {
    const isConfirmed = await confirmAction('Mark as Missed?', `Are you sure you want to mark ${vaccineName} as missed?`, 'Yes, Mark Missed');
    if (isConfirmed) {
      try {
        showLoading('Marking vaccine as missed...');
        const res = await api.post(`/vaccinations/${baby._id}`, {
          vaccineName,
          status: 'missed'
        });
        if (res.data.success) {
          hideAlert();
          showSuccess('Vaccine marked as missed');
          await fetchRecords();
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || "Failed to mark as missed");
      }
    }
  };

  const openCustomModal = () => {
    setSelectedVaccine(null);
    setIsCustomMode(true);
    setFormData({
      vaccineName: "",
      givenDate: new Date().toISOString().split('T')[0],
      administeredBy: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const handleMarkGiven = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomMode && !selectedVaccine) return;
    if (isCustomMode && !formData.vaccineName) {
      showError("Please enter a custom vaccine name");
      return;
    }

    try {
      showLoading(activeModalTab === 'given' ? 'Recording vaccination...' : 'Rescheduling vaccination...');
      const targetVaccineName = isCustomMode ? formData.vaccineName : selectedVaccine!;
      
      const payload: any = {
        vaccineName: targetVaccineName,
      };

      if (activeModalTab === 'given') {
        payload.status = "given";
        payload.givenDate = formData.givenDate ? new Date(formData.givenDate).toISOString() : undefined;
        payload.administeredBy = formData.administeredBy;
        payload.notes = formData.notes;
      } else {
        payload.rescheduledDueDate = formData.rescheduledDate ? new Date(formData.rescheduledDate).toISOString() : undefined;
      }

      if (isCustomMode) {
        payload.isCustom = true;
        payload.customDescription = "Custom prescribed by doctor";
      }

      const res = await api.post(`/vaccinations/${baby._id}`, payload);
      
      if (res.data.success) {
        hideAlert();
        showSuccess('Vaccination recorded successfully');
        await fetchRecords();
        setIsModalOpen(false);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || "Failed to update vaccination");
    }
  };



  if (loading) {
    return <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Immunization Schedule</h2>
          <p className="text-sm text-gray-500">Track and manage vaccinations based on the IAP/WHO schedule.</p>
        </div>
      </div>

      <div className="space-y-8">
        {Array.from(new Set(schedule.map(v => v.dueMonths))).sort((a, b) => a - b).map(dueMonths => {
          const vaccinesInGroup = schedule.filter(v => v.dueMonths === dueMonths);
          
          // Use the label from the API, fallback to raw months if not provided
          const groupTitle = vaccinesInGroup[0]?.dueAgeLabel || `${dueMonths} Months`;

          const allGiven = vaccinesInGroup.every(v => v.computedStatus === "given" || v.computedStatus === "skipped" || v.computedStatus === "missed");

          return (
            <div key={dueMonths} className="relative">
              {/* Timeline Connector */}
              <div className="absolute left-[15px] top-[30px] bottom-[-40px] w-0.5 bg-gray-100 z-0"></div>

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border-2 bg-white ${
                  allGiven ? "text-green-600 border-green-200" : "text-gray-500 border-gray-200"
                }`}>
                  {allGiven ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                </div>
                <h3 className="font-bold text-gray-800">{groupTitle}</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ml-12">
                {vaccinesInGroup.map((vaccine, i) => {
                  const status = vaccine.computedStatus;
                  const record = vaccine.record;

                  return (
                    <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${
                      status === "given" ? "bg-green-50/50 border-green-100" :
                      status.includes("overdue") ? "bg-red-50/50 border-red-100" :
                      status.includes("due") ? "bg-amber-50/50 border-amber-100" :
                      status.includes("upcoming") ? "bg-orange-50/50 border-orange-100" :
                      status === "skipped" ? "bg-gray-50 border-gray-200 opacity-75" :
                      "bg-white border-gray-100 hover:border-blue-200 transition-colors"
                    }`}>
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className={`font-bold text-sm ${status === 'skipped' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{vaccine.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            status === "given" ? "bg-green-100 text-green-700" :
                            status === "missed" ? "bg-red-800 text-white" :
                            status.includes("overdue") ? "bg-red-100 text-red-700" :
                            status.includes("due") ? "bg-amber-100 text-amber-700" :
                            status.includes("upcoming") ? "bg-orange-100 text-orange-700" :
                            status === "skipped" ? "bg-gray-200 text-gray-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {status === "given" ? "Given" : 
                             status === "missed" ? "Missed" :
                             status === "skipped" ? "Skipped" :
                             status === "rescheduled_overdue" ? "Overdue (Rescheduled)" :
                             status === "rescheduled_due" ? "Due Now (Rescheduled)" :
                             status === "rescheduled_upcoming" ? "Soon (Rescheduled)" :
                             status === "rescheduled_future" ? "Rescheduled" :
                             status === "overdue" ? "Overdue" : 
                             status === "due" ? "Due Now" : 
                             status === "upcoming" ? "Soon" : "Upcoming"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{vaccine.description}</p>
                        {status.includes("rescheduled") && (record as any)?.rescheduledDueDate && (
                          <div className="mb-3 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                            New Date: {new Date((record as any).rescheduledDueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {status === "given" && record ? (
                        <div className="bg-white/60 rounded-lg p-3 text-xs space-y-1.5 border border-green-100 mb-3">
                          {record.givenDate && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-3 h-3 text-green-600" />
                              <span className="font-semibold text-green-800">Date:</span> 
                              {new Date(record.givenDate).toLocaleDateString()}
                            </div>
                          )}
                          {record.administeredBy && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <UserCircle className="w-3 h-3 text-blue-500" />
                              <span>{record.administeredBy}</span>
                            </div>
                          )}
                          {record.notes && (
                            <div className="flex items-start gap-2 text-gray-700">
                              <FileText className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                              <span className="italic">{record.notes}</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {status !== "given" && status !== "missed" && status !== "skipped" && (
                        <div className="mt-auto flex flex-col gap-2">
                          <button
                            onClick={() => openVaccineModal(vaccine.name)}
                            className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Given
                          </button>
                          <div className="flex justify-between items-center px-1">
                            <button
                              onClick={() => openRescheduleModal(vaccine.name)}
                              className="text-[10.5px] font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              Reschedule
                            </button>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleMissed(vaccine.name)}
                                className="text-red-400 hover:text-red-600 p-1 rounded transition-colors bg-white border border-transparent hover:border-red-100 hover:bg-red-50"
                                title="Mark as Missed"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleSkip(vaccine.name)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50"
                                title="Skip"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {status === "given" && (
                        <button
                          onClick={() => openVaccineModal(vaccine.name)}
                          className="mt-auto w-full py-1.5 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 bg-white border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Details
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Vaccination Details">
        <form onSubmit={handleMarkGiven} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
            <p className="text-sm text-blue-800">Target Vaccine: <span className="font-bold">{selectedVaccine}</span></p>
          </div>

          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              className={`pb-2 px-4 text-sm font-medium border-b-2 ${activeModalTab === 'given' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveModalTab('given')}
            >
              Record as Given
            </button>
            <button
              type="button"
              className={`pb-2 px-4 text-sm font-medium border-b-2 ${activeModalTab === 'reschedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveModalTab('reschedule')}
            >
              Reschedule Date
            </button>
          </div>

          {activeModalTab === 'given' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered *</label>
                <input 
                  type="date" 
                  required
                  value={formData.givenDate}
                  onChange={(e) => setFormData({...formData, givenDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Administered By / Clinic Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Smith / Apollo Clinic"
                  value={formData.administeredBy}
                  onChange={(e) => setFormData({...formData, administeredBy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Batch Number</label>
                <textarea 
                  placeholder="Enter batch number or observe any reactions..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Target Date *</label>
                <input 
                  type="date" 
                  required
                  value={formData.rescheduledDate}
                  onChange={(e) => setFormData({...formData, rescheduledDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                Rescheduling will shift when this vaccine appears as "Due" for the baby. It will not mark it as given.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {activeModalTab === 'given' ? 'Save Record' : 'Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
