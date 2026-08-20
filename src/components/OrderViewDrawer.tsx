import React from 'react';
import { X, Clock, Activity, Package, Truck, CheckCircle, XCircle, Phone } from 'lucide-react';

interface Order {
  _id: string;
  parentId: { _id: string; name: string; email: string; phone?: string };
  babyId?: { _id: string; name: string };
  items?: Array<{
    itemType: string;
    mealId?: { _id: string; name: string; price: number; imageUrl: string };
    productId?: { _id: string; name: string; price: number; imageUrl: string };
    quantity: number;
    priceAtAddition: number;
  }>;
  kitchenId?: { _id: string; name: string; phone?: string };
  deliveryId?: { _id: string; name: string; phone?: string };
  isOtpRequired?: boolean;
  deliveryOtp?: string;
  status: string;
  createdAt: string;
  preparingAt?: string;
  readyAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  specialInstructions?: string;
  proofOfDeliveryImageUrl?: string;
  totalAmount: number;
  cancellationReason?: string;
  deliveryAddress?: { street: string; city: string; state: string; zipCode: string; phone?: string };
}

interface OrderViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderViewDrawer({ isOpen, onClose, order }: OrderViewDrawerProps) {
  if (!isOpen) return null;

  const getItemString = (o: Order) => {
    if (!o.items || o.items.length === 0) return 'Unknown Item';
    return o.items.map(item => {
      if (item.itemType === 'meal' && item.mealId) return `${item.quantity}x ${item.mealId.name}`;
      if (item.itemType === 'product' && item.productId) return `${item.quantity}x ${item.productId.name}`;
      return 'Unknown Item';
    }).join(', ');
  };

  const getPrice = (o: Order) => {
    return o.totalAmount || 0;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-white/70 transition-opacity" 
        onClick={onClose} 
      />
      <section className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <h2 className="text-lg font-semibold text-gray-900">
                Order #{order?._id?.substring(order._id.length - 6).toUpperCase()}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            {order && (
              <div className="flex-1 px-6 py-6 space-y-8">
                {/* Order Status Flow */}
                {order.status !== 'cancelled' ? (
                  <div className="relative pt-2 pb-4 px-2">
                    {/* Background Line */}
                    <div className="absolute top-7 left-[10%] w-[80%] h-1 bg-gray-200 rounded"></div>
                    {/* Progress Line */}
                    <div 
                      className="absolute top-7 left-[10%] h-1 bg-green-500 rounded transition-all duration-500"
                      style={{ width: `${(Math.max(0, ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(order.status)) / 4) * 80}%` }}
                    ></div>
                    
                    <div className="relative flex justify-between z-10">
                      {[
                        { id: 'pending', label: 'Pending', Icon: Clock, time: order.createdAt },
                        { id: 'preparing', label: 'Preparing', Icon: Activity, time: order.preparingAt },
                        { id: 'ready', label: 'Ready', Icon: Package, time: order.readyAt },
                        { id: 'out_for_delivery', label: 'On Way', Icon: Truck, time: order.outForDeliveryAt },
                        { id: 'delivered', label: 'Delivered', Icon: CheckCircle, time: order.deliveredAt }
                      ].map((step, idx) => {
                        const currentIndex = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(order.status);
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        const Icon = step.Icon;
                        
                        return (
                          <div key={step.id} className="flex flex-col items-center w-16 bg-white">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-2 font-medium text-center leading-tight ${isCurrent ? 'text-green-600 font-bold' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </span>
                            {step.time && (
                              <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight break-words w-full">
                                {new Date(step.time).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                   <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center justify-center font-medium gap-2">
                     <XCircle className="w-5 h-5" /> Order Cancelled
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-gray-500">Customer Name</p>
                    <p className="font-medium text-gray-900">{order.parentId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Customer Email</p>
                    <p className="font-medium text-gray-900">{order.parentId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Customer Phone</p>
                    <p className="font-medium text-gray-900">{order.parentId?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Baby Name</p>
                    <p className="font-medium text-gray-900">{order.babyId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Order Date</p>
                    <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Item Name</p>
                    <p className="font-medium text-gray-900">{getItemString(order)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-bold text-gray-900">₹{getPrice(order)}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-gray-500 font-medium">Delivery Verification Type:</p>
                      {order.isOtpRequired ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                          OTP REQUIRED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                          PHOTO PROOF
                        </span>
                      )}
                    </div>
                  </div>
                  {order.isOtpRequired && order.deliveryOtp && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center justify-between col-span-2">
                      <div>
                        <p className="text-sm text-yellow-800 font-medium">Customer OTP Code</p>
                        <p className="text-xs text-yellow-600">Provide this code to the delivery partner if SMS fails</p>
                      </div>
                      <p className="text-2xl font-mono font-bold tracking-widest text-yellow-900">{order.deliveryOtp}</p>
                    </div>
                  )}
                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500">Assigned Kitchen</p>
                        <p className="font-medium text-gray-900">
                          {order.kitchenId ? `${order.kitchenId.name} ${order.kitchenId.phone ? `(${order.kitchenId.phone})` : ''}` : 'Not Assigned Yet'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delivery Partner</p>
                        <p className="font-medium text-gray-900">
                          {order.deliveryId ? `${order.deliveryId.name} ${order.deliveryId.phone ? `(${order.deliveryId.phone})` : ''}` : 'Not Assigned Yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <p className="text-gray-500 mb-1">Delivery Address</p>
                    {order.deliveryAddress?.street ? (
                      <p className="font-medium text-gray-900 leading-relaxed">
                        {order.deliveryAddress.street}<br/>
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        {order.deliveryAddress.phone && (
                          <><br/><span className="flex items-center gap-1 mt-1 text-gray-600"><Phone className="w-3 h-3"/> {order.deliveryAddress.phone}</span></>
                        )}
                      </p>
                    ) : (
                      <p className="font-medium text-gray-400 italic">No delivery address provided.</p>
                    )}
                    {order.status === 'cancelled' && order.cancellationReason && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Cancellation Reason</p>
                        <p className="font-medium text-red-600">{order.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Drawer Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
