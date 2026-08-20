"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Filter, Plus, Edit, XCircle, Clock, Package, Truck, CheckCircle, Activity, Phone, Download } from 'lucide-react';
import api from '@/utils/api';
import { showError, showSuccess, hideAlert, showLoading } from '@/utils/alert';
import Modal from '@/components/Modal';
import OrderViewDrawer from '@/components/OrderViewDrawer';
import OrderEditDrawer from '@/components/OrderEditDrawer';
import Swal from 'sweetalert2';
import { downloadCSV } from '@/utils/exportCsv';
import { AsyncPaginate } from 'react-select-async-paginate';
import Select from 'react-select';

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

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Dropdown Data
  const [babies, setBabies] = useState<any[]>([]);

  // Selected Option States for Async Selects
  const [selectedParentOption, setSelectedParentOption] = useState<{ value: string, label: string } | null>(null);
  const [selectedKitchenOption, setSelectedKitchenOption] = useState<{ value: string, label: string } | null>(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<{ value: string, label: string } | null>(null);
  const [selectedItemOption, setSelectedItemOption] = useState<{ value: string, label: string, price?: number } | null>(null);

  const [formData, setFormData] = useState({
    parentId: '',
    babyId: '',
    itemType: 'meal',
    itemId: '',
    status: 'pending',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    cancellationReason: '',
    kitchenId: '',
    deliveryId: ''
  });

  // Fetch babies dynamically when parentId changes
  const fetchBabiesForParent = async (parentId: string) => {
    try {
      const { data } = await api.get(`/babies?parentId=${parentId}`);
      if (data.success) {
        setBabies(data.data);
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
    return (inputValue: string, loadedOptions: readonly any[], additional: any) => {
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
  const loadKitchenOptions = makeDebouncedPaginatedLoader('kitchen');
  const loadDeliveryOptions = makeDebouncedPaginatedLoader('delivery');

  const loadItemOptions = (itemType: string) => {
    let timeoutId: NodeJS.Timeout;
    return (inputValue: string, loadedOptions: readonly any[], additional: any) => {
      const page = additional?.page || 1;
      return new Promise<{ options: any[], hasMore: boolean, additional: { page: number } }>((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const endpoint = itemType === 'meal' ? '/meals' : '/products';
            const res = await api.get(`${endpoint}?search=${inputValue}&limit=20&page=${page}`);
            if (res.data.success) {
              const options = res.data.data.map((m: any) => ({ value: m._id, label: `${m.name} - ₹${m.discountedPrice > 0 ? m.discountedPrice : m.price}`, price: m.discountedPrice > 0 ? m.discountedPrice : m.price }));
              const hasMore = res.data.data.length === 20;
              resolve({ options, hasMore, additional: { page: page + 1 } });
            } else {
              resolve({ options: [], hasMore: false, additional: { page } });
            }
          } catch (err) {
            resolve({ options: [], hasMore: false, additional: { page } });
          }
        }, 400);
      });
    };
  };

  // Fetch orders when dependencies change
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = `/orders?page=${currentPage}&limit=${itemsPerPage}&sort=-createdAt`;

      if (activeTab !== 'All') {
        query += `&status=${activeTab}`;
      }

      if (dateFilter !== 'All Time') {
        const now = new Date();
        let start, end;
        if (dateFilter === 'Today') {
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
        } else if (dateFilter === 'Last 7 Days') {
          start = new Date(now.setDate(now.getDate() - 7));
          end = new Date();
        } else if (dateFilter === 'This Month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        if (start && end) {
          query += `&createdAt[gte]=${start.toISOString()}&createdAt[lte]=${end.toISOString()}`;
        }
      }

      if (debouncedSearch) {
        query += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      const ordersRes = await api.get(query);
      setOrders(ordersRes.data.data);
      setTotalOrdersCount(ordersRes.data.total || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, activeTab, dateFilter, debouncedSearch, refreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, dateFilter, itemsPerPage]);

  const openAddModal = () => {
    setSelectedParentOption(null);
    setSelectedKitchenOption(null);
    setSelectedDeliveryOption(null);
    setSelectedItemOption(null);
    setFormData({
      parentId: '',
      babyId: '',
      itemType: 'meal',
      itemId: '',
      status: 'pending',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      cancellationReason: '',
      kitchenId: '',
      deliveryId: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedParentOption(order.parentId ? { value: order.parentId._id, label: order.parentId.name } : null);
    setSelectedKitchenOption(order.kitchenId ? { value: order.kitchenId._id, label: order.kitchenId.name } : null);
    setSelectedDeliveryOption(order.deliveryId ? { value: order.deliveryId._id, label: order.deliveryId.name } : null);
    setFormData({
      parentId: order.parentId?._id || '',
      babyId: order.babyId?._id || '',
      itemType: 'meal',
      itemId: '',
      status: order.status,
      street: order.deliveryAddress?.street || '',
      city: order.deliveryAddress?.city || '',
      state: order.deliveryAddress?.state || '',
      zipCode: order.deliveryAddress?.zipCode || '',
      phone: order.deliveryAddress?.phone || '',
      cancellationReason: order.cancellationReason || '',
      kitchenId: order.kitchenId?._id || '',
      deliveryId: order.deliveryId?._id || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleParentSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedParentId = e.target.value;
    const parentBabies = babies.filter((b: any) => b.parentId?._id === selectedParentId || b.parentId === selectedParentId);

    let street = '', city = '', state = '', zipCode = '', phone = '';

    if (selectedParentId) {
      try {
        // Fetch addresses for this parent
        const res = await api.get(`/addresses?userId=${selectedParentId}`);
        const addresses = res.data.data;

        if (addresses && addresses.length > 0) {
          // Find default address, or fallback to the first one
          const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
          street = defaultAddr.street || '';
          city = defaultAddr.city || '';
          state = defaultAddr.state || '';
          zipCode = defaultAddr.zipCode || '';
          phone = defaultAddr.phone || '';
        } else {
          // Fallback to last order logic if no addresses found
          const lastOrder = orders.find(o => (o.parentId?._id === selectedParentId || (o.parentId as any) === selectedParentId) && o.deliveryAddress?.street);
          if (lastOrder) {
            street = lastOrder.deliveryAddress?.street || '';
            city = lastOrder.deliveryAddress?.city || '';
            state = lastOrder.deliveryAddress?.state || '';
            zipCode = lastOrder.deliveryAddress?.zipCode || '';
            phone = lastOrder.deliveryAddress?.phone || '';
          }
        }
      } catch (err) {
        console.error('Error fetching parent addresses:', err);
      }
    }

    setFormData(prev => ({
      ...prev,
      parentId: selectedParentId,
      babyId: parentBabies.length === 1 ? parentBabies[0]._id : '',
      street,
      city,
      state,
      zipCode,
      phone
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentId || !formData.itemId) {
      return showError('Please select a parent and an item.');
    }

    try {
      showLoading('Creating Order...');
      const selectedItemPrice = selectedItemOption?.price || 0;

      const payload: any = {
        parentId: formData.parentId,
        items: [{
          itemType: formData.itemType,
          quantity: 1,
          priceAtAddition: selectedItemPrice,
          ...(formData.itemType === 'meal' ? { mealId: formData.itemId } : { productId: formData.itemId })
        }],
        deliveryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone
        }
      };
      if (formData.babyId) payload.babyId = formData.babyId;

      await api.post('/orders', payload);
      hideAlert();
      setIsAddModalOpen(false);
      showSuccess('Order created successfully!');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to create order');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      if (formData.status === 'cancelled' && !formData.cancellationReason) {
        return showError('Please provide a cancellation reason.');
      }

      showLoading('Updating Order...');
      const payload: any = {
        status: formData.status,
        deliveryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone
        }
      };

      if (formData.status === 'cancelled') {
        payload.cancellationReason = formData.cancellationReason;
      }

      if (formData.kitchenId) payload.kitchenId = formData.kitchenId;
      if (formData.deliveryId) payload.deliveryId = formData.deliveryId;

      await api.patch(`/orders/${selectedOrder._id}/status`, payload);
      hideAlert();
      setIsEditModalOpen(false);
      showSuccess('Order updated successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update order');
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel order #${order._id.substring(order._id.length - 6).toUpperCase()}? Please provide a reason.`,
      input: 'text',
      inputPlaceholder: 'Reason for cancellation...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      preConfirm: (reason) => {
        if (!reason) {
          Swal.showValidationMessage('You need to provide a reason');
        }
        return reason;
      }
    });

    if (result.isConfirmed) {
      try {
        showLoading('Cancelling Order...');
        await api.patch(`/orders/${order._id}/status`, {
          status: 'cancelled',
          cancellationReason: result.value
        });
        hideAlert();
        showSuccess('Order cancelled successfully');
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case 'preparing': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Preparing</span>;
      case 'ready': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Ready</span>;
      case 'out_for_delivery': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Out for Delivery</span>;
      case 'delivered': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Delivered</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Cancelled</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">{status}</span>;
    }
  };

  const tabs = ['All', 'pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  const totalPages = Math.max(1, Math.ceil(totalOrdersCount / itemsPerPage));

  const getItemString = (order: Order) => {
    if (!order.items || order.items.length === 0) return 'Unknown Item';
    return order.items.map(item => {
      if (item.itemType === 'meal' && item.mealId) return `${item.quantity}x ${item.mealId.name}`;
      if (item.itemType === 'product' && item.productId) return `${item.quantity}x ${item.productId.name}`;
      return 'Unknown Item';
    }).join(', ');
  };

  const getPrice = (order: Order) => {
    return order.totalAmount || 0;
  };

  const handleExportCSV = () => {
    const exportData = orders.map(order => ({
      'Order ID': order._id,
      'Customer Name': order.parentId?.name || 'Unknown',
      'Customer Email': order.parentId?.email || '',
      'Customer Phone': order.deliveryAddress?.phone || order.parentId?.phone || '',
      'Item Ordered': getItemString(order),
      'Total Amount (₹)': getPrice(order),
      'Status': order.status,
      'Order Date': new Date(order.createdAt).toLocaleString(),
      'Delivery Address': order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}` : '',
      'Kitchen Partner': order.kitchenId?.name || '',
      'Delivery Partner': order.deliveryId?.name || ''
    }));

    downloadCSV(exportData, 'Orders_Export');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Create Manual Order
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`pb-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading && orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found.</div>
          ) : (
            <>
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white text-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Order ID</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Customer</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Items</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Total</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Date</th>
                    <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">
                        #{order._id.substring(order._id.length - 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{order.parentId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 truncate max-w-xs">{getItemString(order)}</td>
                      <td className="px-6 py-4 font-medium">₹{getPrice(order)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-1">
                        <button onClick={() => openViewModal(order)} className="p-1.5 text-gray-500 hover:bg-gray-100 bg-gray-50 rounded-md transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditModal(order)} className="p-1.5 text-blue-600 hover:bg-blue-100 bg-blue-50 rounded-md transition-colors" title="Edit Order Status">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleCancelOrder(order)} className="p-1.5 text-red-600 hover:bg-red-100 bg-red-50 rounded-md transition-colors" title="Cancel Order">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && orders.length > 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]">
                  <div className="animate-pulse text-blue-600 font-medium">Loading...</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {totalOrdersCount > 0 && (
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
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrdersCount)} of {totalOrdersCount} orders</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Manual Order" maxWidth="max-w-2xl">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent *</label>
            <AsyncPaginate
              debounceTimeout={0}
              value={selectedParentOption}
              loadOptions={loadParentOptions}
              additional={{ page: 1 }}
              onChange={(option: { value: string, label: string } | null) => {
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Baby (Optional)</label>
            <select value={formData.babyId} onChange={e => setFormData({ ...formData, babyId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value="">Select Baby</option>
              {babies.filter(b => b.parentId?._id === formData.parentId || b.parentId === formData.parentId).map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <select
                value={formData.itemType}
                onChange={e => {
                  setFormData({ ...formData, itemType: e.target.value, itemId: '' });
                  setSelectedItemOption(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="meal">Meal</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
              <AsyncPaginate
                key={formData.itemType} // Force remount to clear options/cache when itemType changes
                debounceTimeout={0}
                value={selectedItemOption}
                loadOptions={loadItemOptions(formData.itemType)}
                additional={{ page: 1 }}
                onChange={(option: {value: string, label: string, price?: number} | null) => {
                  setSelectedItemOption(option);
                  setFormData({ ...formData, itemId: option ? option.value : '' });
                }}
                placeholder={`Search ${formData.itemType}...`}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input type="text" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input type="text" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Create Order</button>
          </div>
        </form>
      </Modal>

      <OrderEditDrawer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedOrder={selectedOrder}
        formData={formData}
        setFormData={setFormData}
        handleEditSubmit={handleEditSubmit}
        selectedKitchenOption={selectedKitchenOption}
        setSelectedKitchenOption={setSelectedKitchenOption}
        loadKitchenOptions={loadKitchenOptions}
        selectedDeliveryOption={selectedDeliveryOption}
        setSelectedDeliveryOption={setSelectedDeliveryOption}
        loadDeliveryOptions={loadDeliveryOptions}
      />

      <OrderViewDrawer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
      />

    </div>
  );
}
