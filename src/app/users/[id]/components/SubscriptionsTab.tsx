"use client";

import { CreditCard } from 'lucide-react';

interface SubscriptionsTabProps {
  subscriptions: any[];
}

export default function SubscriptionsTab({ subscriptions }: SubscriptionsTabProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" /> Active Subscriptions
        </h3>
        <p className="text-sm text-gray-500">No active subscriptions found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-purple-600" /> Active Subscriptions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map((sub) => (
          <div key={sub._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 capitalize">{sub.planId?.title || 'Unknown Plan'}</h4>
              <p className="text-xs text-gray-500 mt-1">Baby: <span className="font-medium text-gray-700">{sub.babyId?.name || 'Unknown'}</span></p>
              <p className="text-xs text-gray-500 mt-1">Ends: {new Date(sub.endDate).toLocaleDateString()}</p>
            </div>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${sub.status === 'active' ? 'bg-green-100 text-green-700' :
                sub.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
              {sub.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
