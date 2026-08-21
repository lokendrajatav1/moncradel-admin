"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import { X, Image as ImageIcon, GripVertical } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  brand: string;
  sku: string;
  discountedPrice: number;
  ageGroup: string;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl?: string;
  images?: string[];
}

interface ProductFormProps {
  initialData?: Product;
  existingCategories?: string[];
}

type FormImage = {
  id: string;
  type: 'existing' | 'new';
  url: string;
  file?: File;
};

export default function ProductForm({ initialData, existingCategories = [] }: ProductFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Product>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    stockQuantity: initialData?.stockQuantity || 0,
    category: initialData?.category || '',
    brand: initialData?.brand || '',
    sku: initialData?.sku || '',
    discountedPrice: initialData?.discountedPrice || 0,
    ageGroup: initialData?.ageGroup || '',
    isFeatured: initialData?.isFeatured ?? false,
    isActive: initialData?.isActive ?? true
  });

  const [images, setImages] = useState<FormImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.images && initialData.images.length > 0) {
        setImages(initialData.images.map(url => ({ id: url, type: 'existing', url })));
      } else if (initialData.imageUrl) {
        setImages([{ id: initialData.imageUrl, type: 'existing', url: initialData.imageUrl }]);
      }
    }
  }, [initialData]);

  const handleRemoveImage = (idToRemove: string) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    // Use setTimeout to ensure the dragged element doesn't disappear immediately
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.4';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setImages(prev => {
      const draggedIndex = prev.findIndex(img => img.id === draggedId);
      const targetIndex = prev.findIndex(img => img.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newImages = [...prev];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(targetIndex, 0, draggedItem);
      return newImages;
    });
    setDraggedId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      showLoading(initialData ? 'Updating product...' : 'Creating product...');

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', formData.price.toString());
      payload.append('stockQuantity', formData.stockQuantity.toString());
      payload.append('category', formData.category);
      payload.append('brand', formData.brand);
      payload.append('sku', formData.sku);
      payload.append('discountedPrice', formData.discountedPrice.toString());
      payload.append('ageGroup', formData.ageGroup);
      payload.append('isFeatured', String(formData.isFeatured));
      payload.append('isActive', String(formData.isActive));

      // Compute final exact order of images to tell backend
      const imageOrder = images.map(img => {
        if (img.type === 'existing') return { type: 'existing', url: img.url };
        return { type: 'new' };
      });
      payload.append('imageOrder', JSON.stringify(imageOrder));

      // Append new files
      images.filter(img => img.type === 'new' && img.file).forEach(img => {
        payload.append('images', img.file!);
      });

      if (initialData?._id) {
        await api.put(`/products/${initialData._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      showSuccess(initialData ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        hideAlert();
        router.push('/products');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to save product';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Diapers" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Pampers" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price (₹) *</label>
            <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹)</label>
            <input type="number" min="0" value={formData.discountedPrice} onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0 if no sale" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input required type="number" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. DIA-001" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <input
              required
              type="text"
              list="category-options"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type or select a category..."
            />
            <datalist id="category-options">
              {existingCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
            <select value={formData.ageGroup} onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select Age Group (Optional)</option>
              <option value="0-3 Months">0-3 Months</option>
              <option value="3-6 Months">3-6 Months</option>
              <option value="6-12 Months">6-12 Months</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3+ Years">3+ Years</option>
              <option value="All Ages">All Ages</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700">Visible to Customers</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeaturedToggle"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="isFeaturedToggle" className="text-sm font-medium text-gray-700">Feature on Home Page</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images <span className="text-gray-400 font-normal">(Drag to reorder, up to 5 images)</span></label>
          <div className="flex items-start gap-4 mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) {
                  const files = Array.from(e.target.files);
                  if (images.length + files.length > 5) {
                    showError('You can only upload up to 5 images per product.');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                  }

                  const newImages: FormImage[] = files.map(file => ({
                    id: Math.random().toString(36).substring(7),
                    type: 'new',
                    url: URL.createObjectURL(file),
                    file
                  }));
                  setImages(prev => [...prev, ...newImages]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center min-w-[100px] h-[100px] border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Add Images</span>
            </label>

            {/* Draggable Previews */}
            <div className="flex items-center gap-3 flex-wrap">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, img.id)}
                  className={`relative inline-block group cursor-grab active:cursor-grabbing border-2 rounded-lg transition-all ${draggedId === img.id ? 'border-dashed border-gray-400 opacity-50' : 'border-transparent hover:border-gray-200'}`}
                >
                  {/* pointer-events-none on image prevents drag issues in some browsers */}
                  <img src={img.url} alt="Preview" className="h-[96px] w-[96px] object-cover rounded-md shadow-sm pointer-events-none" />

                  {/* Primary Badge */}
                  {idx === 0 && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm pointer-events-none">PRIMARY</div>
                  )}

                  {/* New Badge */}
                  {img.type === 'new' && idx !== 0 && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm pointer-events-none">NEW</div>
                  )}

                  {/* Drag Grip Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center pointer-events-none">
                    <GripVertical className="text-white w-6 h-6" />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(img.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100 z-10"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (A+ Content) *</label>
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(content) => setFormData({ ...formData, description: content })}
            className="h-64 mb-12"
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                ['link'],
                ['clean']
              ],
            }}
          />
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" disabled={isSubmitting} onClick={() => router.push('/products')} className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-70">
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {initialData ? (isSubmitting ? 'Updating...' : 'Update Product') : (isSubmitting ? 'Creating...' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
