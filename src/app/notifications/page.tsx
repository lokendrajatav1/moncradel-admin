"use client";

import { useState, useEffect } from 'react';
import { BellRing, Send, Trash2, Inbox, Ticket, Check } from 'lucide-react';
import api from '@/utils/api';
import { showSuccess, showError, showLoading, hideAlert, confirmDelete } from '@/utils/alert';

interface Broadcast {
  _id: string;
  title: string;
  message: string;
  audience: string;
  sentCount: number;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'inbox'>('broadcasts');
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    audience: 'All Users',
    title: '',
    message: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'broadcasts') {
        const { data } = await api.get('/notifications/broadcast');
        if (data.success) setHistory(data.data);
      } else {
        const { data } = await api.get('/notifications');
        if (data.success) setInbox(data.data);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const handleNewNotification = () => {
      fetchData();
    };
    window.addEventListener('new_notification', handleNewNotification);

    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
    };
  }, [activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading('Sending broadcast...');
      const { data } = await api.post('/notifications/broadcast', formData);
      if (data.success) {
        hideAlert();
        setFormData({ audience: 'All Users', title: '', message: '' });
        fetchData();
        showSuccess(`Broadcast sent successfully to ${data.data.sentCount} users!`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to send broadcast');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirmDelete(`Broadcast "${title}"`);
    if (isConfirmed) {
      try {
        showLoading('Deleting broadcast...');
        const { data } = await api.delete(`/notifications/broadcast/${id}`);
        if (data.success) {
          hideAlert();
          setHistory(history.filter(b => b._id !== id));
          showSuccess('Broadcast deleted successfully!');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete broadcast');
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setInbox(inbox.map(n => n._id === id ? { ...n, isRead: true } : n));
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {}
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Notifications Hub</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'broadcasts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Send Broadcasts
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            My Inbox
            {inbox.filter(n => !n.isRead).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {inbox.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'broadcasts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Notification Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" /> Send Broadcast
            </h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select 
                  required
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All Users">All Users</option>
                  <option value="Parents Only">Parents Only</option>
                  <option value="Active Subscribers">Active Subscribers</option>
                  <option value="Doctors Only">Doctors Only</option>
                  <option value="Kitchen Staff Only">Kitchen Staff Only</option>
                  <option value="Delivery Drivers Only">Delivery Drivers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekend Special!" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Type your message here..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-2"
              >
                Send Now
              </button>
            </form>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 shrink-0">
              <BellRing className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Broadcast History</h2>
            </div>
            <div className="overflow-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white border-dashed border-gray-300 border m-4 rounded-xl">
                  No broadcasts sent yet.
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Message</th>
                      <th className="px-6 py-4 font-semibold">Audience</th>
                      <th className="px-6 py-4 font-semibold">Time</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div className="max-w-[200px] truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 font-normal max-w-[200px] truncate" title={item.message}>
                            {item.message}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                            {item.audience}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-green-600 font-medium flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                            {item.status}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Sent to {item.sentCount} users
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(item._id, item.title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Inbox Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 shrink-0">
            <Inbox className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Received Notifications</h2>
          </div>
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading inbox...</div>
            ) : inbox.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white border-dashed border-gray-300 border m-4 rounded-xl flex flex-col items-center">
                <Inbox className="h-12 w-12 text-gray-300 mb-3" />
                <p>Your inbox is empty.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-12"></th>
                    <th className="px-6 py-4 font-semibold">Notification</th>
                    <th className="px-6 py-4 font-semibold">Time Received</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inbox.map((item) => (
                    <tr key={item._id} className={`transition-colors ${!item.isRead ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!item.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          <Ticket className="h-4 w-4" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${!item.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {item.title}
                        </div>
                        <div className={`text-xs mt-1 ${!item.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                          {item.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {!item.isRead ? (
                          <button 
                            onClick={() => handleMarkAsRead(item._id)}
                            className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                          >
                            Mark as Read
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center justify-end gap-1 font-medium">
                            <Check className="h-3.5 w-3.5" /> Read
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
