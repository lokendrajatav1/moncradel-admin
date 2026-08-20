"use client";

import { useEffect, useState } from 'react';
import { Users, ShoppingBag, IndianRupee, TrendingUp, Trophy } from 'lucide-react';
import api from '@/utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    { title: 'Total Revenue', value: analytics ? `₹${analytics.revenue.total.toLocaleString()}` : '—', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Users', value: analytics ? analytics.users.total.toLocaleString() : '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Orders Today', value: analytics ? analytics.orders.today.toLocaleString() : '—', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Pending Orders', value: analytics ? analytics.orders.pending.toLocaleString() : '—', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const chartData = analytics?.weeklyRevenue || [];
  const recentOrders = analytics?.recentOrders || [];
  const topMeals = analytics?.topMeals || [];
  const userGrowthData = analytics?.userGrowth || [];
  const salesByCategoryData = analytics?.salesByCategory || [];
  const orderStatusData = analytics?.orderStatusDistribution || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CF2', '#EF6B6B'];
  const STATUS_COLORS: Record<string, string> = {
    pending: '#F59E0B',
    preparing: '#3B82F6',
    ready: '#10B981',
    out_for_delivery: '#8B5CF6',
    delivered: '#059669',
    cancelled: '#EF4444',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? <span className="text-gray-300 animate-pulse">...</span> : stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Weekly Revenue Overview</h2>
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real Recent Orders */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order._id} className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                      {order.parentId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
                        {order.items && order.items.length > 0
                          ? order.items.map((i: any) => i.itemType === 'meal' ? i.mealId?.name : i.productId?.name).filter(Boolean).join(', ')
                          : 'Unknown Item'}
                      </p>
                      <p className="text-xs text-gray-500">{order.parentId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <a href="/orders" className="block w-full mt-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-center">
            View All Orders →
          </a>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Meals */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Top Selling Meals
          </h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : topMeals.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No meal data yet.</div>
          ) : (
            <div className="space-y-4">
              {topMeals.map((meal: any, index: number) => (
                <div key={meal.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-600'}`}>
                      #{index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{meal.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    {meal.count} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* User Growth Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6">User Growth (Last 6 Months)</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : userGrowthData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                  <Tooltip
                    cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sales by Category (Age Group) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sales by Age Group</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : salesByCategoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCategoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status Breakdown</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : orderStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name.replace(/_/g, ' ')} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {orderStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    formatter={(value: number, name: string) => [value, name.replace(/_/g, ' ')]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
