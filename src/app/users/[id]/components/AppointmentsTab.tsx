"use client";

import { Calendar } from 'lucide-react';

interface AppointmentsTabProps {
  appointments: any[];
}

export default function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  if (appointments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" /> Appointments
        </h3>
        <p className="text-sm text-gray-500">No appointments found for this doctor.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-indigo-600" /> Appointments
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Date & Time</th>
              <th className="px-4 py-3">Patient/Baby</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((apt: any) => (
              <tr key={apt._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {new Date(apt.date).toLocaleDateString()} <br/>
                  <span className="text-xs text-gray-500 font-normal">{apt.timeSlot}</span>
                </td>
                <td className="px-4 py-3">{apt.babyId?.name || 'Unknown'}</td>
                <td className="px-4 py-3 capitalize">{apt.type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                    apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
