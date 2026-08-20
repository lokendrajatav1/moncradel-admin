"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '@/utils/api';
import { showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';

interface BannerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function BannerForm({ isOpen, onClose, onSuccess, initialData }: BannerFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    isActive: true,
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        link: initialData.link || '',
        isActive: initialData.isActive ?? true,
      });
      setPreview(initialData.imageUrl || '');
      setImage(null);
    } else {
      setFormData({
        title: '',
        link: '',
        isActive: true,
      });
      setPreview('');
      setImage(null);
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialData && !image) {
      showError('Please select a banner image');
      return;
    }

    try {
      showLoading(initialData ? 'Updating Banner...' : 'Creating Banner...');
      
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('link', formData.link);
      payload.append('isActive', String(formData.isActive));
      
      if (image) {
        payload.append('image', image);
      }

      let res;
      if (initialData) {
        res = await api.put(`/banners/${initialData._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/banners', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        hideAlert();
        showSuccess(initialData ? 'Banner updated successfully!' : 'Banner created successfully!');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      hideAlert();
      console.error(error);
      showError(error.response?.data?.message || 'Failed to save banner');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Banner' : 'Upload New Banner'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="bannerForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title *</label>
              <input 
                required 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g. Summer Special 50% Off" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link (Optional)</label>
              <input 
                type="text" 
                value={formData.link} 
                onChange={(e) => setFormData({...formData, link: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="e.g. /products/sale" 
              />
              <p className="text-xs text-gray-500 mt-1">Where the user goes when they click the banner.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden h-48 flex items-center justify-center bg-gray-50"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />
              </div>
              {preview && (
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 font-medium hover:underline">
                    Change Image
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActiveToggle"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
              />
              <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700">Active (Visible on website)</label>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="bannerForm"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {initialData ? 'Update Banner' : 'Upload Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
