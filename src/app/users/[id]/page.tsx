"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2, ShieldX, ArrowLeft, Mail, Phone, Calendar, User as UserIcon, Edit, Trash2, MapPin, Plus, Baby as BabyIcon, CreditCard, Package, Utensils, Key, Ban } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/utils/api';
import { showError, showLoading, hideAlert, showSuccess, confirmDelete, confirmAction } from '@/utils/alert';
import Swal from 'sweetalert2';
import AppointmentsTab from './components/AppointmentsTab';
import DeliveriesTab from './components/DeliveriesTab';
import BatchesTab from './components/BatchesTab';
import BabiesTab from './components/BabiesTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import OrderHistoryTab from './components/OrderHistoryTab';
import EarningsTab from './components/EarningsTab';
import ReviewsTab from './components/ReviewsTab';
import DocumentsTab from './components/DocumentsTab';
interface Subscription {
  _id: string;
  babyId: { _id: string, name: string };
  planId: { _id: string, title: string, price: number, durationInDays: number };
  endDate: string;
  status: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: any;
  avatar?: string;
}

interface Address {
  _id: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

interface Baby {
  _id: string;
  name: string;
  ageInMonths: number;
  weightInKg?: number;
  allergies: string[];
  dietaryPreferences: string[];
  isActive: boolean;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Quick Actions State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  const getTabs = () => {
    const t = [{ id: 'overview', label: 'Overview' }];
    if (user?.role === 'parent' || user?.role === 'user') {
      t.push({ id: 'order_history', label: 'Order History' });
      if (babies.length > 0) t.push({ id: 'babies', label: 'Linked Babies' });
      if (subscriptions.length > 0) t.push({ id: 'subscriptions', label: 'Subscriptions' });
      if (addresses.length > 0) t.push({ id: 'addresses', label: 'Addresses' });
    } else if (user?.role === 'doctor') {
      t.push({ id: 'documents', label: 'Documents' });
      t.push({ id: 'appointments', label: 'Appointments' });
      t.push({ id: 'earnings', label: 'Earnings' });
      t.push({ id: 'reviews', label: 'Reviews' });
    } else if (user?.role === 'delivery') {
      t.push({ id: 'documents', label: 'Documents' });
      t.push({ id: 'deliveries', label: 'Deliveries' });
      t.push({ id: 'earnings', label: 'Earnings' });
      t.push({ id: 'reviews', label: 'Reviews' });
    } else if (user?.role === 'kitchen') {
      t.push({ id: 'documents', label: 'Documents' });
      t.push({ id: 'batches', label: 'Assigned Batches' });
      t.push({ id: 'earnings', label: 'Earnings' });
      t.push({ id: 'reviews', label: 'Reviews' });
    }
    return t;
  };

  // Add Address State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    title: 'Home',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false
  });

  // Profile Edit State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});

  // Basic User Info Edit State
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [userEditFormData, setUserEditFormData] = useState<{name: string, email: string, phone: string, avatarFile: File | null}>({ name: '', email: '', phone: '', avatarFile: null });

  const handleVerification = async (status: 'approved' | 'rejected') => {
    let reason = '';
    if (status === 'rejected') {
      const { value, isDismissed } = await Swal.fire({
        title: 'Reject Profile',
        input: 'textarea',
        inputLabel: 'Reason for rejection (sent to user)',
        inputPlaceholder: 'e.g. Aadhar card image is too blurry...',
        showCancelButton: true,
        inputValidator: (val) => {
          if (!val) return 'You need to provide a reason!';
        }
      });
      if (isDismissed) return;
      reason = value;
    } else {
      const isConfirmed = await confirmAction('Approve Profile?', 'This will allow the user to go online and receive orders.', 'Yes, Approve');
      if (!isConfirmed) return;
    }

    try {
      showLoading(`Marking as ${status}...`);
      const { data } = await api.put(`/users/${userId}/verify`, { status, reason });
      if (data.success) {
        hideAlert();
        setUser(prev => prev ? {
          ...prev,
          profile: data.data,
          isActive: status === 'approved' // Automatically sync with user isActive
        } : null);
        showSuccess(`Profile ${status} successfully!`);
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to verify profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Frontend Validations
    if (user.role === 'doctor') {
      if (!profileFormData.specialization?.trim()) return showError('Specialization is required');
      if (profileFormData.experienceYears === undefined || profileFormData.experienceYears < 0) return showError('Valid experience years required');
      if (!profileFormData.clinicName?.trim()) return showError('Clinic Name is required');
      if (!profileFormData.registrationNumber?.trim()) return showError('Registration Number is required');
      if (profileFormData.consultationFee === undefined || profileFormData.consultationFee < 0) return showError('Valid Consultation Fee is required');
      
      if (typeof profileFormData.qualifications === 'string') {
        profileFormData.qualifications = profileFormData.qualifications.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (typeof profileFormData.languagesSpoken === 'string') {
        profileFormData.languagesSpoken = profileFormData.languagesSpoken.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (profileFormData.bankDetails && (profileFormData.bankDetails.accountName || profileFormData.bankDetails.bankName || profileFormData.bankDetails.accountNumber || profileFormData.bankDetails.ifscCode)) {
        if (!profileFormData.bankDetails.accountName?.trim() || !profileFormData.bankDetails.bankName?.trim() || !profileFormData.bankDetails.accountNumber?.trim() || !profileFormData.bankDetails.ifscCode?.trim()) {
          return showError('All Bank Details are required if any bank detail is provided');
        }
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(profileFormData.bankDetails.ifscCode.toUpperCase())) return showError('Invalid IFSC Code format');
      }

    } else if (user.role === 'kitchen') {
      if (!profileFormData.kitchenName?.trim()) return showError('Kitchen Name is required');
      if (!profileFormData.ownerName?.trim()) return showError('Owner Name is required');
      if (profileFormData.preparationCapacityPerDay === undefined || profileFormData.preparationCapacityPerDay <= 0) return showError('Valid Capacity is required');
      
      if (!profileFormData.fssaiLicenseNumber?.trim()) return showError('FSSAI License is required');
      const fssaiRegex = /^\d{14}$/;
      if (!fssaiRegex.test(profileFormData.fssaiLicenseNumber)) return showError('FSSAI License must be 14 digits');

      if (profileFormData.gstNumber) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(profileFormData.gstNumber.toUpperCase())) return showError('Invalid GST Number format');
      }

      if (typeof profileFormData.cuisineTypes === 'string') {
        profileFormData.cuisineTypes = profileFormData.cuisineTypes.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      if (!profileFormData.bankDetails?.accountName?.trim() || !profileFormData.bankDetails?.bankName?.trim() || !profileFormData.bankDetails?.accountNumber?.trim() || !profileFormData.bankDetails?.ifscCode?.trim()) {
        return showError('All Bank Details are required');
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(profileFormData.bankDetails.ifscCode.toUpperCase())) return showError('Invalid IFSC Code format');

    } else if (user.role === 'delivery') {
      if (!profileFormData.vehicleType?.trim()) profileFormData.vehicleType = 'bike';
      if (!profileFormData.vehicleNumber?.trim()) return showError('Vehicle Number is required');
      
      if (!profileFormData.aadharNumber?.trim()) return showError('Aadhar Number is required');
      const aadharRegex = /^\d{12}$/;
      if (!aadharRegex.test(profileFormData.aadharNumber)) return showError('Aadhar Number must be exactly 12 digits');

      if (!profileFormData.drivingLicenseNumber?.trim() || profileFormData.drivingLicenseNumber.length < 10) {
        return showError('Valid Driving License Number is required');
      }

      if (profileFormData.insuranceExpiryDate) {
        profileFormData.insuranceExpiryDate = new Date(profileFormData.insuranceExpiryDate).toISOString().split('T')[0];
      }

      if (!profileFormData.emergencyContact?.name?.trim() || !profileFormData.emergencyContact?.relation?.trim() || !profileFormData.emergencyContact?.phone?.trim()) {
        return showError('All Emergency Contact details are required');
      }
      
      if (!profileFormData.bankDetails?.accountName?.trim() || !profileFormData.bankDetails?.bankName?.trim() || !profileFormData.bankDetails?.accountNumber?.trim() || !profileFormData.bankDetails?.ifscCode?.trim()) {
        return showError('All Bank Details are required');
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(profileFormData.bankDetails.ifscCode.toUpperCase())) return showError('Invalid IFSC Code format');
    }

    try {
      showLoading('Updating profile...');

      let endpoint = '';
      if (user.role === 'doctor') endpoint = `/doctors/${userId}`;
      else if (user.role === 'delivery') endpoint = `/delivery-partners/${userId}`;
      else if (user.role === 'kitchen') endpoint = `/kitchen-partners/${userId}`;
      else return showError('Unknown role for profile update');

      const res = await api.put(endpoint, profileFormData);

      // Update the base User model's status as well if it changed
      if (profileFormData.isActive !== undefined && profileFormData.isActive !== user.isActive) {
        await api.put(`/users/${userId}`, { isActive: profileFormData.isActive });
      }

      if (res.data.success) {
        hideAlert();
        setIsProfileModalOpen(false);
        setUser(prev => prev ? {
          ...prev,
          profile: res.data.data,
          isActive: profileFormData.isActive !== undefined ? profileFormData.isActive : prev.isActive
        } : null);
        showSuccess('Profile updated successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleUserEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!userEditFormData.name.trim()) return showError('Name is required');
    if (!userEditFormData.email.trim()) return showError('Email is required');

    try {
      showLoading('Updating user info...');
      
      const formData = new FormData();
      formData.append('name', userEditFormData.name);
      formData.append('email', userEditFormData.email);
      if (userEditFormData.phone) formData.append('phone', userEditFormData.phone);
      if (userEditFormData.avatarFile) {
        formData.append('avatar', userEditFormData.avatarFile);
      }

      const { data } = await api.put(`/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (data.success) {
        hideAlert();
        setIsUserEditModalOpen(false);
        setUser(prev => prev ? { 
          ...prev, 
          name: userEditFormData.name, 
          email: userEditFormData.email, 
          phone: userEditFormData.phone,
          avatar: data.data.avatar || prev.avatar 
        } : null);
        showSuccess('User updated successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend Validation
    if (!addressFormData.title.trim()) return showError('Title is required');
    if (!addressFormData.street.trim()) return showError('Street is required');
    if (!addressFormData.city.trim()) return showError('City is required');
    if (!addressFormData.state.trim()) return showError('State is required');

    const zipRegex = /^\d{6}$/;
    if (!zipRegex.test(addressFormData.zipCode.trim())) {
      return showError('Zip Code must be exactly 6 digits');
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(addressFormData.phone.trim())) {
      return showError('Phone must be exactly 10 digits');
    }

    try {
      showLoading(selectedAddressId ? 'Updating address...' : 'Adding address...');
      const payload = { ...addressFormData, userId };

      let data;
      if (selectedAddressId) {
        const res = await api.put(`/addresses/${selectedAddressId}`, payload);
        data = res.data;
      } else {
        const res = await api.post('/addresses', payload);
        data = res.data;
      }

      if (data.success) {
        hideAlert();
        setIsAddressModalOpen(false);
        setAddressFormData({ title: 'Home', street: '', city: '', state: '', zipCode: '', phone: '', isDefault: false });
        setSelectedAddressId(null);
        const addressRes = await api.get(`/addresses?userId=${userId}`);
        if (addressRes.data.success) {
          setAddresses(addressRes.data.data);
        }
        showSuccess(selectedAddressId ? 'Address updated successfully' : 'Address added successfully');
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || (selectedAddressId ? 'Failed to update address' : 'Failed to add address'));
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    const isConfirmed = await confirmDelete('Address');
    if (!isConfirmed) return;
    try {
      showLoading('Deleting address...');
      const res = await api.delete(`/addresses/${addrId}`);
      if (res.data.success) {
        hideAlert();
        showSuccess('Address deleted successfully');
        setAddresses(prev => prev.filter(a => a._id !== addrId));
      }
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to delete address');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch User Details
        const userRes = await api.get(`/users/${userId}`);
        if (userRes.data.success) {
          setUser(userRes.data.data);
        }
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleToggleSuspend = async () => {
    try {
      const confirm = await confirmAction(
        user!.isActive ? 'Suspend User?' : 'Activate User?',
        user!.isActive ? 'This user will no longer be able to log in.' : 'This user will regain access to their account.',
        user!.isActive ? 'Yes, Suspend' : 'Yes, Activate'
      );
      if (confirm) {
        showLoading(user!.isActive ? 'Suspending...' : 'Activating...');
        const res = await api.put(`/users/${userId}`, { isActive: !user!.isActive });
        hideAlert();
        if (res.data.success) {
          showSuccess(user!.isActive ? 'Account suspended' : 'Account activated');
          setUser({ ...user!, isActive: !user!.isActive });
        } else {
          showError(res.data.message || 'Failed to update status');
        }
      }
    } catch (e: any) {
      hideAlert();
      showError(e.response?.data?.message || 'An error occurred');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      showLoading('Updating password...');
      const res = await api.put(`/users/${userId}`, { password: newPassword });
      hideAlert();
      if (res.data.success) {
        showSuccess('Password updated successfully');
        setIsPasswordModalOpen(false);
        setNewPassword('');
      } else {
        showError(res.data.message || 'Failed to update password');
      }
    } catch (e: any) {
      hideAlert();
      showError(e.response?.data?.message || 'An error occurred');
    }
  };

  // Tab-wise lazy fetching
  useEffect(() => {
    if (!user) return; // Don't fetch until user is loaded

    const fetchTabData = async () => {
      try {
        if (activeTab === 'addresses') {
          const res = await api.get(`/addresses?userId=${userId}`);
          if (res.data.success) setAddresses(res.data.data);
        } else if (activeTab === 'babies') {
          const res = await api.get(`/babies?parentId=${userId}`);
          if (res.data.success) setBabies(res.data.data);
        } else if (activeTab === 'subscriptions') {
          const res = await api.get(`/subscriptions?parentId=${userId}`);
          if (res.data.success) setSubscriptions(res.data.data);
        } else if (activeTab === 'appointments') {
          const res = await api.get(`/appointments?doctorId=${userId}`);
          if (res.data.success) setAppointments(res.data.data);
        } else if (activeTab === 'deliveries') {
          const res = await api.get(`/orders?deliveryId=${userId}`);
          if (res.data.success) setOrders(res.data.data);
        } else if (activeTab === 'order_history') {
          const res = await api.get(`/orders?parentId=${userId}`);
          if (res.data.success) setOrders(res.data.data);
        } else if (activeTab === 'earnings') {
          const res = await api.get(`/earnings?staffId=${userId}`);
          if (res.data.success) setEarnings(res.data.data);
        } else if (activeTab === 'reviews') {
          const res = await api.get(`/reviews?targetId=${user.profile?._id}`);
          if (res.data.success) setReviews(res.data.data);
        } else if (activeTab === 'batches') {
          const res = await api.get(`/batches?kitchenId=${userId}`);
          if (res.data.success) setBatches(res.data.data);
        }
      } catch (e) {
        console.error(`Failed to fetch data for tab: ${activeTab}`, e);
      }
    };

    fetchTabData();
  }, [activeTab, user, userId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading user details...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">User not found</div>;
  }

  return (
    <div className="flex flex-col pb-12">
      <div className="shrink-0 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => router.push('/users')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {user?.name ? `${user.name}'s Profile` : 'User Profile'}
            {!user.isActive && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium border border-red-200">
                Suspended
              </span>
            )}
            {user?.profile?.verificationStatus === 'approved' && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${user.email}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-4 h-4" /> Email User
          </a>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Key className="w-4 h-4" /> Reset Password
          </button>
          {user?.profile?.verificationStatus === 'approved' && (
            <button
              onClick={() => handleVerification('rejected')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <ShieldX className="w-4 h-4" /> Revoke Verification
            </button>
          )}
          <button
            onClick={handleToggleSuspend}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
              user.isActive 
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            }`}
          >
            {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {user.isActive ? 'Suspend Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {user && ['doctor', 'delivery', 'kitchen'].includes(user.role) && user.profile?.verificationStatus !== 'approved' && (
        <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            user.profile?.verificationStatus === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
          <div>
            <div className="flex items-center gap-2">
              {user.profile?.verificationStatus === 'rejected' ? <ShieldX className="h-5 w-5 text-red-600" /> :
                  <ShieldAlert className="h-5 w-5 text-yellow-600" />}
              <h3 className={`font-semibold ${user.profile?.verificationStatus === 'rejected' ? 'text-red-800' :
                    'text-yellow-800'
                }`}>
                Profile Status: {user.profile?.verificationStatus?.toUpperCase() || 'PENDING'}
              </h3>
            </div>
            {user.profile?.verificationStatus === 'rejected' && user.profile?.rejectionReason && (
              <p className="mt-1 text-sm text-red-600"><span className="font-semibold">Reason:</span> {user.profile.rejectionReason}</p>
            )}
            {user.profile?.verificationStatus === 'pending' && (
              <p className="mt-1 text-sm text-yellow-700">This profile is waiting for admin verification before they can go online.</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user.profile?.verificationStatus === 'pending' && (
              <button
                onClick={() => handleVerification('approved')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Approve Profile
              </button>
            )}
            {user.profile?.verificationStatus === 'pending' && (
              <button
                onClick={() => handleVerification('rejected')}
                className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Reject Profile
              </button>
            )}
            {user.profile?.verificationStatus === 'rejected' && (
              <button
                onClick={() => handleVerification('approved')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Re-evaluate & Approve
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex shrink-0 gap-4 overflow-x-auto">
        {getTabs().map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              router.push(`?tab=${tab.id}`, { scroll: false });
            }}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 h-fit">
          <div className="flex items-center gap-4 mb-6">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
            ) : (
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <button
                  onClick={() => {
                    setUserEditFormData({ name: user.name, email: user.email, phone: user.phone || '', avatarFile: null });
                    setIsUserEditModalOpen(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit User Info"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium capitalize ${user.role === 'parent' ? 'bg-blue-100 text-blue-700' :
                  user.role === 'doctor' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections based on role */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Professional Details Section (Doctor, Kitchen, Delivery) */}
          {(user.role === 'doctor' || user.role === 'kitchen' || user.role === 'delivery') && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-indigo-600" /> Professional Details
                </h3>
                <button
                  onClick={() => {
                    setProfileFormData({ ...(user.profile || {}), isActive: user.isActive });
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  <Edit className="h-4 w-4" /> {user.profile ? 'Edit Details' : 'Add Details'}
                </button>
              </div>

              {!user.profile ? (
                <p className="text-sm text-gray-500">Profile data not initialized.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.role === 'doctor' && (
                    <>
                      <div className="col-span-1 md:col-span-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Professional Details</p></div>
                      <div><p className="text-xs text-gray-500">Specialization</p><p className="font-medium text-gray-900">{user.profile.specialization || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Experience</p><p className="font-medium text-gray-900">{user.profile.experienceYears ? `${user.profile.experienceYears} Years` : 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Qualifications</p><p className="font-medium text-gray-900">{user.profile.qualifications?.join(', ') || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Languages</p><p className="font-medium text-gray-900">{user.profile.languagesSpoken?.join(', ') || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Clinic Name</p><p className="font-medium text-gray-900">{user.profile.clinicName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Reg. Number</p><p className="font-medium text-gray-900">{user.profile.registrationNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Fee</p><p className="font-medium text-gray-900">₹{user.profile.consultationFee || 0}</p></div>
                      <div>
                        <p className="text-xs text-gray-500">Status & Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${user.profile.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.profile.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                          <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">★ {user.profile.rating || '0.0'}</span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 mt-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Bank Details</p></div>
                      <div><p className="text-xs text-gray-500">Account Name</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.accountName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Bank Name</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.bankName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Account No.</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.accountNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">IFSC Code</p><p className="font-medium text-gray-900 uppercase">{user.profile.bankDetails?.ifscCode || 'N/A'}</p></div>
                    </>
                  )}
                  {user.role === 'kitchen' && (
                    <>
                      <div className="col-span-1 md:col-span-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Kitchen Overview</p></div>
                      <div><p className="text-xs text-gray-500">Kitchen Name</p><p className="font-medium text-gray-900">{user.profile.kitchenName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Owner Name</p><p className="font-medium text-gray-900">{user.profile.ownerName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">FSSAI License</p><p className="font-medium text-gray-900">{user.profile.fssaiLicenseNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">GST Number</p><p className="font-medium text-gray-900">{user.profile.gstNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Cuisine Types</p><p className="font-medium text-gray-900">{user.profile.cuisineTypes?.join(', ') || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Capacity/Day</p><p className="font-medium text-gray-900">{user.profile.preparationCapacityPerDay || 0} meals</p></div>
                      <div><p className="text-xs text-gray-500">Operating Hours</p><p className="font-medium text-gray-900">{user.profile.operatingHours?.openTime || '--:--'} to {user.profile.operatingHours?.closeTime || '--:--'}</p></div>
                      <div>
                        <p className="text-xs text-gray-500">Status & Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${user.profile.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.profile.isOpen ? 'Open' : 'Closed'}
                          </span>
                          <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">★ {user.profile.rating || '0.0'}</span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 mt-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Bank Details</p></div>
                      <div><p className="text-xs text-gray-500">Account Name</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.accountName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Bank Name</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.bankName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Account No.</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.accountNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">IFSC Code</p><p className="font-medium text-gray-900 uppercase">{user.profile.bankDetails?.ifscCode || 'N/A'}</p></div>
                    </>
                  )}
                  {user.role === 'delivery' && (
                    <>
                      <div className="col-span-1 md:col-span-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Vehicle & Compliance</p></div>
                      <div><p className="text-xs text-gray-500">Vehicle Type</p><p className="font-medium text-gray-900 capitalize">{user.profile.vehicleType || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Vehicle No.</p><p className="font-medium text-gray-900 uppercase">{user.profile.vehicleNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Driving License</p><p className="font-medium text-gray-900 uppercase">{user.profile.drivingLicenseNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Aadhar</p><p className="font-medium text-gray-900">{user.profile.aadharNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="font-medium text-gray-900">{user.profile.insuranceExpiryDate ? new Date(user.profile.insuranceExpiryDate).toLocaleDateString() : 'N/A'}</p></div>
                      <div>
                        <p className="text-xs text-gray-500">Status & Rating</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${user.profile.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {user.profile.isOnline ? 'Online' : 'Offline'}
                          </span>

                          <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">★ {user.profile.rating || '0.0'}</span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 mt-2 mb-2"><p className="font-semibold text-gray-900 text-sm">Emergency & Banking</p></div>
                      <div><p className="text-xs text-gray-500">Emg. Contact Name</p><p className="font-medium text-gray-900">{user.profile.emergencyContact?.name || 'N/A'} ({user.profile.emergencyContact?.relation || 'N/A'})</p></div>
                      <div><p className="text-xs text-gray-500">Emg. Phone</p><p className="font-medium text-gray-900">{user.profile.emergencyContact?.phone || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Bank Name</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.bankName || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Account No.</p><p className="font-medium text-gray-900">{user.profile.bankDetails?.accountNumber || 'N/A'}</p></div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'babies' && (
        <div className="pt-2">
          {/* Babies Section (only relevant for parents) */}
          {(user.role === 'parent' || user.role === 'user' || babies.length > 0) && (
            <BabiesTab babies={babies} />
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="pt-2">
          {/* Subscriptions Section (only relevant for parents) */}
          {(user.role === 'parent' || user.role === 'user' || subscriptions.length > 0) && (
            <SubscriptionsTab subscriptions={subscriptions} />
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="pt-2">
          {/* Addresses Section (only relevant for parents) */}
          {(user.role === 'parent' || user.role === 'user' || addresses.length > 0) && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" /> Saved Addresses
                </h3>
                <button
                  onClick={() => {
                    setSelectedAddressId(null);
                    setAddressFormData({ title: 'Home', street: '', city: '', state: '', zipCode: '', phone: '', isDefault: false });
                    setIsAddressModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Address
                </button>
              </div>
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">No addresses saved.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 relative group">
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {addr.isDefault && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAddressId(addr._id);
                            setAddressFormData({
                              title: addr.title,
                              street: addr.street,
                              city: addr.city,
                              state: addr.state || '',
                              zipCode: addr.zipCode,
                              phone: addr.phone,
                              isDefault: addr.isDefault
                            });
                            setIsAddressModalOpen(true);
                          }}
                          className="p-1.5 bg-white text-gray-400 hover:text-blue-600 rounded-md border border-gray-200 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                          title="Edit Address"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-md border border-gray-200 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                          title="Delete Address"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <h4 className="font-semibold text-gray-900 pr-20">{addr.title}</h4>
                      <p className="text-sm text-gray-600 mt-2">{addr.street}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="pt-2">
          {/* Appointments Section (only relevant for doctors) */}
          {(user.role === 'doctor' || appointments.length > 0) && (
            <AppointmentsTab appointments={appointments} />
          )}
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="pt-2">
          {/* Orders Section (only relevant for delivery) */}
          {(user.role === 'delivery' || orders.length > 0) && (
            <DeliveriesTab orders={orders} />
          )}
        </div>
      )}

      {activeTab === 'order_history' && (
        <div className="pt-2">
          {(user.role === 'parent' || user.role === 'user') && (
            <OrderHistoryTab orders={orders} />
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="pt-2">
          {['doctor', 'delivery', 'kitchen'].includes(user.role) && (
            <EarningsTab earnings={earnings} />
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="pt-2">
          {['doctor', 'delivery', 'kitchen'].includes(user.role) && (
            <ReviewsTab reviews={reviews} />
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="pt-2">
          {['doctor', 'delivery', 'kitchen'].includes(user.role) && (
            <DocumentsTab user={user} />
          )}
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="pt-2">
          {/* Batches Section (only relevant for kitchen) */}
          {(user.role === 'kitchen' || batches.length > 0) && (
            <BatchesTab batches={batches} />
          )}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title={selectedAddressId ? "Edit Address" : "Add New Address"}>
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <select value={addressFormData.title} onChange={e => setAddressFormData({ ...addressFormData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
            <input required type="text" value={addressFormData.street} onChange={e => setAddressFormData({ ...addressFormData, street: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="123 Main St..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              <input required type="text" value={addressFormData.city} onChange={e => setAddressFormData({ ...addressFormData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
              <input required type="text" value={addressFormData.state} onChange={e => setAddressFormData({ ...addressFormData, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code <span className="text-red-500">*</span></label>
              <input required type="text" maxLength={6} value={addressFormData.zipCode} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAddressFormData({ ...addressFormData, zipCode: val });
              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="e.g. 476111" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
              <input required type="tel" maxLength={10} value={addressFormData.phone} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAddressFormData({ ...addressFormData, phone: val });
              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="10-digit mobile number" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" checked={addressFormData.isDefault} onChange={e => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsAddressModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save Address</button>
          </div>
        </form>
      </Modal>

      {/* Edit User Info Modal */}
      <Modal isOpen={isUserEditModalOpen} onClose={() => setIsUserEditModalOpen(false)} title="Edit Basic User Info">
        <form onSubmit={handleUserEditSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {userEditFormData.avatarFile ? (
                <img src={URL.createObjectURL(userEditFormData.avatarFile)} alt="Preview" className="h-20 w-20 rounded-full object-cover border" />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Current" className="h-20 w-20 rounded-full object-cover border" />
              ) : (
                <div className="h-20 w-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center border text-xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full border shadow-sm cursor-pointer hover:bg-gray-50">
                <Edit className="h-3 w-3 text-gray-600" />
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setUserEditFormData({ ...userEditFormData, avatarFile: e.target.files[0] });
                  }
                }} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input required type="text" value={userEditFormData.name} onChange={e => setUserEditFormData({ ...userEditFormData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input required type="email" value={userEditFormData.email} onChange={e => setUserEditFormData({ ...userEditFormData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={userEditFormData.phone} onChange={e => setUserEditFormData({ ...userEditFormData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" placeholder="10-digit number" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsUserEditModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title={`Edit ${user.role} Profile`} maxWidth="max-w-3xl">
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {user.role === 'doctor' && (
            <>
              <div className="mb-2"><h4 className="font-semibold text-gray-800">Professional Details</h4></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization <span className="text-red-500">*</span></label>
                <input type="text" value={profileFormData.specialization || ''} onChange={e => setProfileFormData({ ...profileFormData, specialization: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Pediatrician, Dentist" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications (comma separated)</label>
                <input type="text" value={Array.isArray(profileFormData.qualifications) ? profileFormData.qualifications.join(', ') : (profileFormData.qualifications || '')} onChange={e => setProfileFormData({ ...profileFormData, qualifications: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. MBBS, MD, BDS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken (comma separated)</label>
                <input type="text" value={Array.isArray(profileFormData.languagesSpoken) ? profileFormData.languagesSpoken.join(', ') : (profileFormData.languagesSpoken || '')} onChange={e => setProfileFormData({ ...profileFormData, languagesSpoken: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. English, Hindi, Marathi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years) <span className="text-red-500">*</span></label>
                  <input type="number" value={profileFormData.experienceYears || ''} onChange={e => setProfileFormData({ ...profileFormData, experienceYears: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) <span className="text-red-500">*</span></label>
                  <input type="number" value={profileFormData.consultationFee || ''} onChange={e => setProfileFormData({ ...profileFormData, consultationFee: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name <span className="text-red-500">*</span></label>
                <input type="text" value={profileFormData.clinicName || ''} onChange={e => setProfileFormData({ ...profileFormData, clinicName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. City Care Clinic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reg. Number <span className="text-red-500">*</span></label>
                <input type="text" value={profileFormData.registrationNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, registrationNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. MMC-12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Doctor</label>
                <textarea rows={3} value={profileFormData.about || ''} onChange={e => setProfileFormData({ ...profileFormData, about: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description..." />
              </div>


              <div className="mb-2 mt-4"><h4 className="font-semibold text-gray-800">Weekly Schedule (Shifts)</h4></div>
              
              <div className="mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100 flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-800">Slot Duration (minutes)</label>
                <select 
                  value={profileFormData.slotDuration || 30} 
                  onChange={e => setProfileFormData({ ...profileFormData, slotDuration: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-32"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>

              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const dayAvail = profileFormData.availability?.find((a: any) => a.dayOfWeek === day);
                const shift = dayAvail && dayAvail.shifts && dayAvail.shifts.length > 0 ? dayAvail.shifts[0] : { startTime: '', endTime: '' };
                
                const updateShift = (field: 'startTime' | 'endTime', value: string) => {
                   let avail = [...(profileFormData.availability || [])];
                   const idx = avail.findIndex((a: any) => a.dayOfWeek === day);
                   
                   let newShifts = [...(shift.startTime || shift.endTime ? [{...shift}] : [])];
                   if (newShifts.length === 0) newShifts = [{ startTime: '', endTime: '' }];
                   newShifts[0][field] = value;
                   
                   if (idx >= 0) {
                     avail[idx].shifts = newShifts;
                   } else {
                     avail.push({ dayOfWeek: day, shifts: newShifts });
                   }
                   setProfileFormData({ ...profileFormData, availability: avail });
                };

                const TIME_OPTIONS = [];
                for (let i = 0; i < 24; i++) {
                  for (let j = 0; j < 60; j += 30) {
                    const h24 = String(i).padStart(2, '0');
                    const m = String(j).padStart(2, '0');
                    const ampm = i >= 12 ? 'PM' : 'AM';
                    const displayH = i % 12 || 12;
                    const label = `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
                    const value = `${h24}:${m}`;
                    TIME_OPTIONS.push({ label, value });
                  }
                }

                return (
                  <div key={day} className="flex items-center gap-4 mb-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <label className="w-24 text-sm font-bold text-gray-800">{day}</label>
                    <div className="flex items-center gap-2">
                       <select 
                         value={shift.startTime} 
                         onChange={e => updateShift('startTime', e.target.value)} 
                         className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
                       >
                         <option value="">Start Time</option>
                         {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                       </select>
                       <span className="text-gray-500 text-sm font-medium">to</span>
                       <select 
                         value={shift.endTime} 
                         onChange={e => updateShift('endTime', e.target.value)} 
                         className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
                       >
                         <option value="">End Time</option>
                         {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                       </select>
                    </div>
                  </div>
                );
              })}

              <div className="mb-2 mt-4"><h4 className="font-semibold text-gray-800">Bank Details (Payouts)</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.accountName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.bankName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, bankName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={18} value={profileFormData.bankDetails?.accountNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountNumber: e.target.value.replace(/\D/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 123456789012" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={11} value={profileFormData.bankDetails?.ifscCode || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. SBIN0001234" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isAvailable" checked={profileFormData.isAvailable || false} onChange={e => setProfileFormData({ ...profileFormData, isAvailable: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isAvailable" className="text-sm text-gray-700 font-medium">Doctor is currently Available</label>
              </div>
            </>
          )}

          {user.role === 'kitchen' && (
            <>
              <div className="mb-2"><h4 className="font-semibold text-gray-800">Kitchen Overview</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileFormData.kitchenName || ''} onChange={e => setProfileFormData({ ...profileFormData, kitchenName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Spice Route" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileFormData.ownerName || ''} onChange={e => setProfileFormData({ ...profileFormData, ownerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI License <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={14} value={profileFormData.fssaiLicenseNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, fssaiLicenseNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="14-digit license no." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input type="text" value={profileFormData.gstNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, gstNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. 22AAAAA0000A1Z5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Types (comma separated)</label>
                <input type="text" value={Array.isArray(profileFormData.cuisineTypes) ? profileFormData.cuisineTypes.join(', ') : (profileFormData.cuisineTypes || '')} onChange={e => setProfileFormData({ ...profileFormData, cuisineTypes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Indian, Chinese, Italian" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Meals) <span className="text-red-500">*</span></label>
                  <input type="number" value={profileFormData.preparationCapacityPerDay || ''} onChange={e => setProfileFormData({ ...profileFormData, preparationCapacityPerDay: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
                  <input type="time" value={profileFormData.operatingHours?.openTime || ''} onChange={e => setProfileFormData({ ...profileFormData, operatingHours: { ...profileFormData.operatingHours, openTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
                  <input type="time" value={profileFormData.operatingHours?.closeTime || ''} onChange={e => setProfileFormData({ ...profileFormData, operatingHours: { ...profileFormData.operatingHours, closeTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="mb-2 mt-4"><h4 className="font-semibold text-gray-800">Bank Details (Payouts)</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.accountName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.bankName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, bankName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={18} value={profileFormData.bankDetails?.accountNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountNumber: e.target.value.replace(/\D/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 123456789012" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={11} value={profileFormData.bankDetails?.ifscCode || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. SBIN0001234" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isOpen" checked={profileFormData.isOpen || false} onChange={e => setProfileFormData({ ...profileFormData, isOpen: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isOpen" className="text-sm text-gray-700 font-medium">Kitchen is Open for Orders</label>
              </div>
            </>
          )}

          {user.role === 'delivery' && (
            <>
              <div className="mb-2"><h4 className="font-semibold text-gray-800">Vehicle & Compliance</h4></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type <span className="text-red-500">*</span></label>
                  <select value={profileFormData.vehicleType || 'bike'} onChange={e => setProfileFormData({ ...profileFormData, vehicleType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Cycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={15} value={profileFormData.vehicleNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, vehicleNumber: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="MH 12 AB 1234" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driving License Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={16} value={profileFormData.drivingLicenseNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, drivingLicenseNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. MH1220110000000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={12} value={profileFormData.aadharNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, aadharNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12-digit Aadhar no." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry Date</label>
                <input type="date" value={profileFormData.insuranceExpiryDate ? new Date(profileFormData.insuranceExpiryDate).toISOString().split('T')[0] : ''} onChange={e => setProfileFormData({ ...profileFormData, insuranceExpiryDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="mb-2 mt-4"><h4 className="font-semibold text-gray-800">Emergency & Banking</h4></div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emg. Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.emergencyContact?.name || ''} onChange={e => setProfileFormData({ ...profileFormData, emergencyContact: { ...profileFormData.emergencyContact, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ramesh" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emg. Relation <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={30} value={profileFormData.emergencyContact?.relation || ''} onChange={e => setProfileFormData({ ...profileFormData, emergencyContact: { ...profileFormData.emergencyContact, relation: e.target.value.replace(/[^a-zA-Z\s]/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Brother" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emg. Phone <span className="text-red-500">*</span></label>
                  <input type="tel" maxLength={10} value={profileFormData.emergencyContact?.phone || ''} onChange={e => setProfileFormData({ ...profileFormData, emergencyContact: { ...profileFormData.emergencyContact, phone: e.target.value.replace(/\D/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="10-digit number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.accountName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={18} value={profileFormData.bankDetails?.accountNumber || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, accountNumber: e.target.value.replace(/\D/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 123456789012" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={50} value={profileFormData.bankDetails?.bankName || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, bankName: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                  <input type="text" maxLength={11} value={profileFormData.bankDetails?.ifscCode || ''} onChange={e => setProfileFormData({ ...profileFormData, bankDetails: { ...profileFormData.bankDetails, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="e.g. SBIN0001234" />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isOnline" checked={profileFormData.isOnline || false} onChange={e => setProfileFormData({ ...profileFormData, isOnline: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="isOnline" className="text-sm text-gray-700 font-medium">Currently Online</label>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Profile</button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Reset User Password">
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">You are setting a new password manually for this user. They can use this to log in immediately.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
            <input 
              required 
              type="text" 
              minLength={6}
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
              placeholder="e.g. Temp@1234" 
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Reset Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
