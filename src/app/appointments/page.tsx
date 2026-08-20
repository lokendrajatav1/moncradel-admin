"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit, Trash2 } from 'lucide-react';
import { showError, showLoading, hideAlert, showSuccess, confirmDelete } from '@/utils/alert';
import api from '@/utils/api';
import Modal from '@/components/Modal';
import { formatTime12Hour } from '@/utils/dateFormatter';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { downloadCSV } from '@/utils/exportCsv';
import { AsyncPaginate } from 'react-select-async-paginate';

interface Appointment {
  _id: string;
  parentId: { _id: string, name: string, phone: string };
  doctorId: { _id: string, name: string };
  babyId?: { _id: string, name: string, ageInMonths: number };
  date: string;
  time: string;
  status: string;
  meetingLink?: string;
  notes?: string;
  doctorNotes?: string;
  cancellationReason?: string;
  bookedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form Data
  const [babies, setBabies] = useState<{_id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({ 
    parentId: '', doctorId: '', babyId: '', date: '', time: '', notes: '', doctorNotes: '', status: 'scheduled', cancellationReason: '' 
  });
  const [selectedParentOption, setSelectedParentOption] = useState<{value: string, label: string} | null>(null);
  const [selectedDoctorOption, setSelectedDoctorOption] = useState<{value: string, label: string} | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/appointments?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (statusFilter !== 'All') query += `&status=${statusFilter.toLowerCase()}`;
      
      if (dateFilter !== 'All Time') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateFilter === 'Today') query += `&date=${todayStr}`;
        if (dateFilter === 'Upcoming') query += `&date[gte]=${todayStr}`;
        if (dateFilter === 'Past') query += `&date[lt]=${todayStr}`;
      }

      const { data } = await api.get(query);
      if (data.success) {
        setAppointments(data.data);
        setTotalAppointments(data.total || 0);
      }
    } catch (error: any) {
      showError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter, dateFilter]);

  // We will load babies dynamically when a parent is selected
  const fetchBabiesForParent = async (parentId: string) => {
    try {
      const { data } = await api.get(`/babies?parentId=${parentId}`);
      if (data.success) {
        setBabies(data.data);
        // Auto-select the baby if the parent only has one
        if (data.data.length === 1) {
          setFormData(prev => ({ ...prev, babyId: prev.babyId || data.data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch babies for parent');
    }
  };

  useEffect(() => {
    if (formData.parentId && isAddModalOpen) {
      fetchBabiesForParent(formData.parentId);
    } else {
      setBabies([]);
    }
  }, [formData.parentId, isAddModalOpen]);

  // Debounce utility for React-Select-Async-Paginate Loaders
  const makeDebouncedPaginatedLoader = (role: string) => {
    let timeoutId: NodeJS.Timeout;
    return (inputValue: string, loadedOptions: readonly any[], additional?: { page: number }) => {
      const page = additional?.page || 1;
      return new Promise<{ options: any[], hasMore: boolean, additional: { page: number } }>((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const res = await api.get(`/users?role=${role}&name[regex]=${inputValue}&name[options]=i&limit=20&page=${page}`);
            if (res.data.success) {
              const options = res.data.data.map((u: any) => ({ value: u._id, label: u.name }));
              const hasMore = res.data.data.length === 20;
              resolve({ options, hasMore, additional: { page: page + 1 } });
            } else {
              resolve({ options: [], hasMore: false, additional: { page } });
            }
          } catch (err) {
            resolve({ options: [], hasMore: false, additional: { page } });
          }
        }, 400); // 400ms debounce
      });
    };
  };

  const loadParentOptions = makeDebouncedPaginatedLoader('parent');
  const loadDoctorOptions = makeDebouncedPaginatedLoader('doctor');



  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch available slots when doctor or date changes in the form
  useEffect(() => {
    if (formData.doctorId && formData.date && isAddModalOpen) {
      setIsLoadingSlots(true);
      api.get(`/doctors/${formData.doctorId}/available-slots?date=${formData.date}`)
        .then(res => {
          if (res.data.success) {
            setAvailableSlots(res.data.data);
            // If the current selected time is not in the new slots (and it's not an edit of that exact time), clear it
            if (formData.time && !res.data.data.includes(formData.time) && !selectedAppointmentId) {
              setFormData(prev => ({ ...prev, time: '' }));
            }
          }
        })
        .catch(() => {
           setAvailableSlots([]);
        })
        .finally(() => setIsLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.date, isAddModalOpen, selectedAppointmentId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(totalAppointments / itemsPerPage));

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Date in past (only for new appointments)
    if (!selectedAppointmentId) {
      const selectedDate = new Date(formData.date).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return showError('Cannot book an appointment in the past.');
      }
    }

    if (formData.status === 'cancelled' && formData.cancellationReason.trim() === '') {
      return showError('Cancellation reason is required.');
    }

    try {
      showLoading(selectedAppointmentId ? 'Updating appointment...' : 'Booking appointment...');
      const response = selectedAppointmentId 
        ? await api.put(`/appointments/${selectedAppointmentId}`, formData)
        : await api.post('/appointments', formData);
      
      if (response.data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setFormData({ parentId: '', doctorId: '', babyId: '', date: '', time: '', notes: '', doctorNotes: '', status: 'scheduled', cancellationReason: '' });
        setSelectedAppointmentId(null);
        fetchAppointments();
        showSuccess(selectedAppointmentId ? 'Appointment updated successfully!' : 'Appointment booked successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || (selectedAppointmentId ? 'Failed to update appointment' : 'Failed to book appointment'));
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    const confirmed = await confirmDelete('Appointment');
    if (!confirmed) return;
    try {
      showLoading('Deleting...');
      await api.delete(`/appointments/${id}`);
      hideAlert();
      showSuccess('Appointment deleted');
      fetchAppointments();
    } catch (error) {
      hideAlert();
      showError('Failed to delete appointment');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button 
          onClick={() => {
            setSelectedAppointmentId(null);
            setSelectedParentOption(null);
            setSelectedDoctorOption(null);
            setFormData({ parentId: '', doctorId: '', babyId: '', date: '', time: '', notes: '', doctorNotes: '', status: 'scheduled', cancellationReason: '' });
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Book Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0 flex gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Past">Past</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading && appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No appointments found.</div>
          ) : (
            <>
              <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Parent</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Baby</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Doctor</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Date & Time</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {apt.parentId?.name || 'Unknown'}
                      <div className="text-xs text-gray-500 font-normal">{apt.parentId?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{apt.babyId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-700">{apt.doctorId?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">{new Date(apt.date).toLocaleDateString()} at {formatTime12Hour(apt.time)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                        apt.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                        apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedAppointment(apt); setIsViewModalOpen(true); }}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors font-medium text-xs whitespace-nowrap"
                          title="View Details"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAppointmentId(apt._id);
                            
                            const parentId = apt.parentId?._id || (apt as any).parentId || '';
                            const doctorId = apt.doctorId?._id || (apt as any).doctorId || '';
                            
                            setSelectedParentOption(apt.parentId ? { value: parentId, label: apt.parentId.name || 'Unknown' } : null);
                            setSelectedDoctorOption(apt.doctorId ? { value: doctorId, label: apt.doctorId.name || 'Unknown' } : null);

                            setFormData({
                              parentId,
                              doctorId,
                              babyId: apt.babyId?._id || (apt as any).babyId || '',
                              date: apt.date && !isNaN(new Date(apt.date).getTime()) ? new Date(apt.date).toISOString().split('T')[0] : '',
                              time: apt.time,
                              notes: apt.notes || '',
                              doctorNotes: apt.doctorNotes || '',
                              status: apt.status || 'scheduled',
                              cancellationReason: apt.cancellationReason || ''
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAppointment(apt._id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
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
            {loading && appointments.length > 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
                <div className="animate-pulse text-blue-600 font-medium">Loading...</div>
              </div>
            )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 hidden sm:inline">Rows per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="hidden sm:inline">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalAppointments)} of {totalAppointments} appointments</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 bg-white"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedAppointment && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Appointment Details">
          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Parent</h4>
                <p>{selectedAppointment.parentId?.name}</p>
                <p className="text-gray-500">{selectedAppointment.parentId?.phone}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Baby</h4>
                <p>{selectedAppointment.babyId?.name} ({selectedAppointment.babyId?.ageInMonths} months)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Doctor</h4>
                <p>{selectedAppointment.doctorId?.name}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Date & Time</h4>
                <p>{new Date(selectedAppointment.date).toLocaleDateString()} at {formatTime12Hour(selectedAppointment.time)}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Status</h4>
              <p className="capitalize">{selectedAppointment.status}</p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedAppointment.bookedAt && (
                  <div><span className="font-medium">Booked:</span> {new Date(selectedAppointment.bookedAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                )}
                {selectedAppointment.completedAt && (
                  <div><span className="font-medium text-green-600">Completed:</span> {new Date(selectedAppointment.completedAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                )}
                {selectedAppointment.cancelledAt && (
                  <div><span className="font-medium text-red-600">Cancelled:</span> {new Date(selectedAppointment.cancelledAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                )}
              </div>
            </div>

            {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
              <div>
                <h4 className="font-semibold text-gray-900">Cancellation Reason</h4>
                <p className="text-gray-700">{selectedAppointment.cancellationReason}</p>
              </div>
            )}
            {selectedAppointment.meetingLink && (
              <div>
                <h4 className="font-semibold text-gray-900">Meeting Link</h4>
                <a href={selectedAppointment.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                  {selectedAppointment.meetingLink}
                </a>
              </div>
            )}
            {selectedAppointment.notes && (
              <div>
                <h4 className="font-semibold text-gray-900">Notes from Parent</h4>
                <p className="text-gray-700">{selectedAppointment.notes}</p>
              </div>
            )}
            {selectedAppointment.doctorNotes && (
              <div>
                <h4 className="font-semibold text-gray-900">Doctor's Notes</h4>
                <p className="text-gray-700">{selectedAppointment.doctorNotes}</p>
              </div>
            )}
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Appointment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={selectedAppointmentId ? "Edit Appointment" : "Book New Appointment"} maxWidth="max-w-2xl">
        <form onSubmit={handleAppointmentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <AsyncPaginate 
                debounceTimeout={0} // We are handling debounce manually
                value={selectedParentOption}
                loadOptions={loadParentOptions}
                additional={{ page: 1 }}
                onChange={(option: {value: string, label: string} | null) => {
                  setSelectedParentOption(option);
                  setFormData({ ...formData, parentId: option ? option.value : '', babyId: '' });
                }}
                placeholder="Search Parent..."
                className="text-sm"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                styles={{
                  control: (base) => ({ ...base, borderColor: '#D1D5DB', borderRadius: '0.5rem', minHeight: '42px' }),
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baby</label>
              <select required value={formData.babyId} onChange={(e) => setFormData({...formData, babyId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select Baby...</option>
                {babies.filter(b => !formData.parentId || (b as any).parentId?._id === formData.parentId || (b as any).parentId === formData.parentId).map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <AsyncPaginate 
              debounceTimeout={0}
              value={selectedDoctorOption}
              loadOptions={loadDoctorOptions}
              additional={{ page: 1 }}
              onChange={(option: {value: string, label: string} | null) => {
                setSelectedDoctorOption(option);
                setFormData({ ...formData, doctorId: option ? option.value : '' });
              }}
              placeholder="Search Doctor..."
              className="text-sm"
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              styles={{
                control: (base) => ({ ...base, borderColor: '#D1D5DB', borderRadius: '0.5rem', minHeight: '42px' }),
                menuPortal: base => ({ ...base, zIndex: 9999 })
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                selected={formData.date ? new Date(formData.date) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setFormData({
                      ...formData,
                      date: `${year}-${month}-${day}`
                      // Note: We don't clear the time here immediately to allow the effect to check if the new date has the same time slot available
                    });
                  } else {
                    setFormData({ ...formData, date: '' });
                  }
                }}
                dateFormat="MMMM d, yyyy"
                wrapperClassName="w-full"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date"
                minDate={!selectedAppointmentId ? new Date() : undefined}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <div className="relative">
                <select 
                  required 
                  value={formData.time} 
                  onChange={(e) => setFormData({...formData, time: e.target.value})} 
                  disabled={!formData.doctorId || !formData.date || isLoadingSlots}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select Time...</option>
                  {/* If we are editing and the current time is set, ensure it's an option even if not in 'availableSlots' (since it's already booked by this appointment) */}
                  {selectedAppointmentId && formData.time && !availableSlots.includes(formData.time) && (
                     <option value={formData.time}>{formData.time} (Current)</option>
                  )}
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                  {!isLoadingSlots && formData.doctorId && formData.date && availableSlots.length === 0 && !selectedAppointmentId && (
                    <option value="" disabled>No slots available</option>
                  )}
                </select>
                {isLoadingSlots && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {formData.status === 'cancelled' && (
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">Cancellation Reason</label>
              <textarea required value={formData.cancellationReason} onChange={(e) => setFormData({...formData, cancellationReason: e.target.value})} className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="Why is it cancelled?" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes from Parent (Optional)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Reason for visit or special instructions..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
            <textarea value={formData.doctorNotes} onChange={(e) => setFormData({...formData, doctorNotes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Add any medical notes or observations..." />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
              {selectedAppointmentId ? "Update Appointment" : "Book Appointment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
