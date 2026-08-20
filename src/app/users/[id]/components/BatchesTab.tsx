"use client";

import { Utensils } from 'lucide-react';

interface BatchesTabProps {
  batches: any[];
}

export default function BatchesTab({ batches }: BatchesTabProps) {
  if (batches.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Utensils className="h-5 w-5 text-red-600" /> Assigned Batches
        </h3>
        <p className="text-sm text-gray-500">No batches assigned to this kitchen.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Utensils className="h-5 w-5 text-red-600" /> Assigned Batches
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Batch ID</th>
              <th className="px-4 py-3">Meal</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3 rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.map((batch: any) => (
              <tr key={batch._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{batch.batchId || batch._id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-3">{batch.mealId?.name || 'Unknown Meal'}</td>
                <td className="px-4 py-3">{batch.quantity}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                    batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                    batch.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {batch.status}
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
