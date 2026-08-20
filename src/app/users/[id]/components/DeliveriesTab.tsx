"use client";

import { Package } from 'lucide-react';

interface DeliveriesTabProps {
  orders: any[];
}

export default function DeliveriesTab({ orders }: DeliveriesTabProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" /> Assigned Deliveries
        </h3>
        <p className="text-sm text-gray-500">No orders assigned to this delivery partner.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-orange-600" /> Assigned Deliveries
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((ord: any) => (
              <tr key={ord._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{ord.orderId || ord._id.slice(-6).toUpperCase()}</td>
                <td className="px-4 py-3">{ord.userId?.name || 'Unknown'}</td>
                <td className="px-4 py-3">₹{ord.totalAmount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${
                    ord.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                    ord.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ord.orderStatus}
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
