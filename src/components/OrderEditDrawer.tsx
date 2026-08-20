import React from 'react';
import { X } from 'lucide-react';
import { AsyncPaginate } from 'react-select-async-paginate';

interface Order {
  _id: string;
  parentId: { _id: string; name: string; email: string; phone?: string };
  // ... (we only need _id for the title)
}

interface OrderEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: any | null;
  formData: any;
  setFormData: (data: any) => void;
  handleEditSubmit: (e: React.FormEvent) => void;
  selectedKitchenOption: {value: string, label: string} | null;
  setSelectedKitchenOption: (option: {value: string, label: string} | null) => void;
  loadKitchenOptions: (inputValue: string, loadedOptions: readonly any[], additional: any) => Promise<{ options: any[]; hasMore: boolean; additional: any; }>;
  selectedDeliveryOption: {value: string, label: string} | null;
  setSelectedDeliveryOption: (option: {value: string, label: string} | null) => void;
  loadDeliveryOptions: (inputValue: string, loadedOptions: readonly any[], additional: any) => Promise<{ options: any[]; hasMore: boolean; additional: any; }>;
}

export default function OrderEditDrawer({
  isOpen,
  onClose,
  selectedOrder,
  formData,
  setFormData,
  handleEditSubmit,
  selectedKitchenOption,
  setSelectedKitchenOption,
  loadKitchenOptions,
  selectedDeliveryOption,
  setSelectedDeliveryOption,
  loadDeliveryOptions
}: OrderEditDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-white/70 transition-opacity" 
        onClick={onClose} 
      />
      <section className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Update Order #{selectedOrder?._id?.substring(selectedOrder._id.length - 6).toUpperCase()}
              </h2>
              <button
                onClick={onClose}
                type="button"
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Content */}
            <form onSubmit={handleEditSubmit} className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Section */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-3">Order Status</h3>
                  <div>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {formData.status === 'cancelled' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cancellation Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.cancellationReason}
                        onChange={e => setFormData({...formData, cancellationReason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Reason for cancellation..."
                        rows={2}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Assignment Details */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-3">Assignment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Kitchen</label>
                      <AsyncPaginate 
                        debounceTimeout={0}
                        value={selectedKitchenOption}
                        loadOptions={loadKitchenOptions}
                        additional={{ page: 1 }}
                        onChange={(option: any) => {
                          setSelectedKitchenOption(option);
                          setFormData({ ...formData, kitchenId: option ? option.value : '' });
                        }}
                        placeholder="Search Kitchen..."
                        className="text-sm"
                        isClearable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        styles={{
                          control: (base) => ({ ...base, borderColor: '#D1D5DB', borderRadius: '0.5rem', minHeight: '42px' }),
                          menuPortal: base => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Delivery Partner</label>
                      <AsyncPaginate 
                        debounceTimeout={0}
                        value={selectedDeliveryOption}
                        loadOptions={loadDeliveryOptions}
                        additional={{ page: 1 }}
                        onChange={(option: any) => {
                          setSelectedDeliveryOption(option);
                          setFormData({ ...formData, deliveryId: option ? option.value : '' });
                        }}
                        placeholder="Search Delivery..."
                        className="text-sm"
                        isClearable
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        styles={{
                          control: (base) => ({ ...base, borderColor: '#D1D5DB', borderRadius: '0.5rem', minHeight: '42px' }),
                          menuPortal: base => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Update Address */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-3">Update Delivery Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <input 
                        type="text" 
                        value={formData.street} 
                        onChange={e => setFormData({...formData, street: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={e => setFormData({...formData, city: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input 
                        type="text" 
                        value={formData.state} 
                        onChange={e => setFormData({...formData, state: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input 
                        type="text" 
                        value={formData.zipCode} 
                        onChange={e => setFormData({...formData, zipCode: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 shrink-0 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
