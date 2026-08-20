"use client";

import { useState, useEffect } from "react";
import { Clock, Moon, Droplets, Coffee, AlertCircle, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { showError, showSuccess } from "@/utils/alert";

interface ActivityLog {
  _id: string;
  type: 'sleep' | 'diaper' | 'feeding' | 'other';
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  details?: string;
  amount?: number;
  unit?: string;
}

export default function ActivityLogsTab({ babyId }: { babyId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [babyId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/activity-logs/baby/${babyId}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const res = await api.delete(`/activity-logs/${id}`);
      if (res.data.success) {
        showSuccess("Log deleted");
        setLogs(logs.filter(l => l._id !== id));
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "Failed to delete log");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading logs...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Activity & Health Logs</h2>
          <p className="text-sm text-gray-500">Daily routine data logged by parents.</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">No Logs Found</h3>
          <p className="text-sm text-gray-500">The parents haven't logged any activities yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Start Time</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Duration/Amount</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        log.type === 'sleep' ? 'bg-indigo-100 text-indigo-600' :
                        log.type === 'feeding' ? 'bg-emerald-100 text-emerald-600' :
                        log.type === 'diaper' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {log.type === 'sleep' && <Moon className="w-4 h-4" />}
                        {log.type === 'feeding' && <Coffee className="w-4 h-4" />}
                        {log.type === 'diaper' && <Droplets className="w-4 h-4" />}
                        {log.type === 'other' && <AlertCircle className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{log.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {new Date(log.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(log.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {log.endTime && ` - ${new Date(log.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {log.details ? (
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {log.details}
                      </span>
                    ) : <span className="text-gray-400 text-sm">-</span>}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                    {log.durationMinutes ? `${log.durationMinutes} mins` : log.amount ? `${log.amount} ${log.unit || ''}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => deleteLog(log._id)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Delete Log">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
