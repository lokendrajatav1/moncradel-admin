"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, Eye, Download, Ban, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { confirmDelete, confirmAction, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import { downloadCSV } from '@/utils/exportCsv';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  verificationStatus?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filter State
  const [verificationFilter, setVerificationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: '', password: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `/users?page=${currentPage}&limit=${itemsPerPage}`;
      if (verificationFilter) url += `&verificationStatus=${verificationFilter}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      const { data } = await api.get(url);
      if (data.success) {
        setUsers(data.data);
        setTotalUsers(data.count || 0);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, verificationFilter, roleFilter]);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmDelete(name);
    if (isConfirmed) {
      try {
        showLoading('Deleting user...');
        const { data } = await api.delete(`/users/${id}`);
        if (data.success) {
          hideAlert();
          setUsers(users.filter(u => u._id !== id));
          showSuccess('User deleted successfully!');
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const isConfirmed = await confirmAction(
      currentStatus ? 'Suspend User?' : 'Activate User?',
      `Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} ${name}?`,
      'Yes, do it!'
    );

    if (isConfirmed) {
      try {
        showLoading('Updating status...');
        const { data } = await api.put(`/users/${id}`, { isActive: !currentStatus });
        if (data.success) {
          hideAlert();
          setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
          showSuccess(`User ${!currentStatus ? 'activated' : 'suspended'} successfully!`);
        }
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to update status');
      }
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', role: '', password: '' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, password: '' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showLoading(editingUser ? 'Updating user...' : 'Creating user...');

      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete (payload as any).password; // Don't update password on edit if it's left blank
      }

      let data;
      if (editingUser) {
        const response = await api.put(`/users/${editingUser._id}`, payload);
        data = response.data;
      } else {
        const response = await api.post('/users/register', payload);
        data = response.data;
      }

      if (data.success) {
        hideAlert();
        setIsAddModalOpen(false);
        setFormData({ name: '', email: '', phone: '', role: '', password: '' });
        setEditingUser(null);
        fetchUsers(); // Refresh list
        showSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'parent': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Parent</span>;
      case 'doctor': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Doctor</span>;
      case 'delivery': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Delivery</span>;
      case 'kitchen': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Kitchen</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{role}</span>;
    }
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(totalUsers / itemsPerPage));

  const handleExportCSV = () => {
    const exportData = users.map(user => ({
      'User ID': user._id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Role': user.role,
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Joined Date': new Date(user.createdAt).toLocaleString()
    }));
    downloadCSV(exportData, 'Users_Export');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Add New User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 min-w-0 w-full">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 shrink-0 gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 focus:ring-0 bg-white"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="parent">Parents</option>
              <option value="doctor">Doctors</option>
              <option value="delivery">Delivery Partners</option>
              <option value="kitchen">Kitchen Staff</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 focus:ring-0 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <table className="w-full min-w-[1000px] text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10 whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Name</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Email</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Phone</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Role</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Verification</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 whitespace-nowrap">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/users/${user._id}`} className="text-blue-600 hover:underline">
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.phone || '-'}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${user.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.verificationStatus === 'approved' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center w-max gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : user.verificationStatus === 'rejected' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center w-max gap-1">
                          <Ban className="w-3 h-3" /> Rejected
                        </span>
                      ) : user.verificationStatus === 'pending' ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center w-max gap-1">
                          Pending
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/users/${user._id}`}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive, user.name)}
                          className={`p-1.5 rounded-md transition-colors ${user.isActive
                              ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                          title={user.isActive ? "Suspend User" : "Activate User"}
                        >
                          {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0 gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 hidden sm:inline">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              required
              type="tel"
              maxLength={10}
              pattern="[0-9]{10}"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingUser && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
            </label>
            <input
              required={!editingUser}
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={editingUser ? "Leave blank to ignore" : "Min 6 characters"}
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Role...</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
              <option value="doctor">Doctor</option>
              <option value="delivery">Delivery Partner</option>
              <option value="kitchen">Kitchen Staff</option>
            </select>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
