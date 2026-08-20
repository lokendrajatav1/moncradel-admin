"use client";

import { useState, useEffect } from 'react';
import { Save, ShieldAlert } from 'lucide-react';
import { showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    base_delivery_fee: '40',
    free_delivery_threshold: '500',
    gst_rate: '5',
    platform_fee: '10',
    maintenance_mode: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data.success && data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      } catch (error) {
        // Settings might not exist yet — defaults will be used
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      showLoading('Saving settings...');
      // Save each key individually (backend uses upsert)
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          api.post('/settings', { key, value: String(value) })
        )
      );
      hideAlert();
      showSuccess('Settings saved successfully!');
    } catch (error: any) {
      hideAlert();
      showError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure platform-wide defaults</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-8">

        {/* Delivery Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Delivery Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.base_delivery_fee}
                onChange={(e) => set('base_delivery_fee', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                value={settings.free_delivery_threshold}
                onChange={(e) => set('free_delivery_threshold', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Tax & Fees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={settings.gst_rate}
                onChange={(e) => set('gst_rate', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (₹)</label>
              <input
                type="number"
                value={settings.platform_fee}
                onChange={(e) => set('platform_fee', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Danger Zone
          </h2>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <h3 className="font-semibold text-red-900">Maintenance Mode</h3>
              <p className="text-sm text-red-700">Disable customer app and kitchen app during updates.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => set('maintenance_mode', e.target.checked ? 'true' : 'false')}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
