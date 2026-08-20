"use client";

import { IndianRupee } from 'lucide-react';

interface EarningsTabProps {
  earnings: any[];
}

export default function EarningsTab({ earnings }: EarningsTabProps) {
  if (earnings.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-600" /> Earnings & Payouts
        </h3>
        <p className="text-sm text-gray-500">No earnings found for this staff member.</p>
      </div>
    );
  }

  // Calculate totals
  const totalEarned = earnings.reduce((acc, e) => acc + e.amount, 0);
  const pendingAmount = earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const paidAmount = totalEarned - pendingAmount;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalEarned.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">₹{paidAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Pending Payout</p>
          <p className="text-2xl font-bold text-orange-600">₹{pendingAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-600" /> Recent Earnings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {earnings.map((earning: any) => (
                <tr key={earning._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{new Date(earning.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{earning.description || 'Service Earning'}</td>
                  <td className="px-4 py-3 font-semibold">₹{earning.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                      earning.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
