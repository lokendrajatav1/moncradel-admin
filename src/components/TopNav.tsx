"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, Check, CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import api from '@/utils/api';

// Helper for relative time
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function TopNav({ isCollapsed }: { isCollapsed: boolean }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchNotifs();
    
    // Listen for real-time incoming push notifications via Socket/FCM
    const handleNewNotification = () => {
      fetchNotifs();
    };
    window.addEventListener('new_notification', handleNewNotification);

    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      // Call API to mark all as read if your backend supports it, 
      // or loop through unread. For now we visually mark them read.
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      for (const id of unreadIds) {
         api.patch(`/notifications/${id}/read`).catch(() => {});
      }
    } catch(error) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    setIsDropdownOpen(false);
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, log out!'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  return (
    <header className={`h-16 bg-white border-b border-gray-200 fixed top-0 right-0 z-50 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`}>
      <div className="flex h-full items-center justify-between px-8">

        {/* Search */}
        <div className="flex items-center w-96 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, users..."
            className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-700"
          />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1 z-50 flex flex-col max-h-[450px] overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors">
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">All caught up!</p>
                      <p className="text-xs text-gray-500 mt-1">Check back later for new alerts.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${!n.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Ticket className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {n.title}
                            </h4>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${!n.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                              {timeAgo(n.createdAt)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <div className="shrink-0 flex items-center">
                              <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                  <Link href="/notifications" onClick={() => setIsNotifOpen(false)} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    View Broadcast Hub
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'admin@moncradle.com'}</p>
              </div>
              <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@moncradle.com'}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
