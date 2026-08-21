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

interface Meal {
  _id?: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  suitableForAgeGroup: string;
  category?: string;
  ingredients: string[];
  inStock: boolean;
  isActive: boolean;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  images?: string[];
  tags?: string[];
  allergens?: string[];
}

interface MealFormProps {
  initialData?: Meal;
}

type FormImage = {
  id: string;
  type: 'existing' | 'new';
  url: string;
  file?: File;
};

export default function MealForm({ initialData }: MealFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<Meal>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    discountedPrice: initialData?.discountedPrice || 0,
    suitableForAgeGroup: initialData?.suitableForAgeGroup || '',
    category: initialData?.category || '',
    ingredients: initialData?.ingredients || [],
    inStock: initialData?.inStock ?? true,
    isActive: initialData?.isActive ?? true,
    nutritionalInfo: initialData?.nutritionalInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    tags: initialData?.tags || [],
    allergens: initialData?.allergens || []
  });
  
  const [images, setImages] = useState<FormImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for text fields
  const parseArrayData = (arr?: string[]) => {
    if (!arr || arr.length === 0) return '';
    try {
      if (arr.length === 1 && arr[0].startsWith('[')) {
        const parsed = JSON.parse(arr[0]);
        if (Array.isArray(parsed)) return parsed.join(', ');
      }
    } catch (e) {}
    return arr.join(', ');
  };

  const [ingredientsText, setIngredientsText] = useState(parseArrayData(initialData?.ingredients));
  const [tagsText, setTagsText] = useState(parseArrayData(initialData?.tags));
  const [allergensText, setAllergensText] = useState(parseArrayData(initialData?.allergens));

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
    e.preventDefault();
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
      showLoading(initialData ? 'Updating meal...' : 'Creating meal...');
      
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', formData.price.toString());
      if (formData.discountedPrice) {
        payload.append('discountedPrice', formData.discountedPrice.toString());
      }
      payload.append('suitableForAgeGroup', formData.suitableForAgeGroup);
      if (formData.category) {
        payload.append('category', formData.category);
      }
      payload.append('inStock', String(formData.inStock));
      
      const ingredientsArray = ingredientsText.split(',').map(i => i.trim()).filter(i => i);
      payload.append('ingredients', JSON.stringify(ingredientsArray));
      
      const tagsArray = tagsText.split(',').map(i => i.trim()).filter(i => i);
      payload.append('tags', JSON.stringify(tagsArray));
      
      const allergensArray = allergensText.split(',').map(i => i.trim()).filter(i => i);
      payload.append('allergens', JSON.stringify(allergensArray));
      
      payload.append('nutritionalInfo', JSON.stringify(formData.nutritionalInfo));
      payload.append('isActive', String(formData.isActive));

      const imageOrder = images.map(img => {
        if (img.type === 'existing') return { type: 'existing', url: img.url };
        return { type: 'new' };
      });
      payload.append('imageOrder', JSON.stringify(imageOrder));

      images.filter(img => img.type === 'new' && img.file).forEach(img => {
        payload.append('images', img.file!);
      });

      if (initialData?._id) {
        await api.put(`/meals/${initialData._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/meals', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      showSuccess(initialData ? 'Meal updated successfully!' : 'Meal created successfully!');
      setTimeout(() => {
        hideAlert();
        router.push('/meals');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to save meal';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name *</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Apple Puree" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input required type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹)</label>
            <input type="number" min="0" value={formData.discountedPrice || ''} onChange={(e) => setFormData({...formData, discountedPrice: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
          </div>
        </div>



        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input type="text" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="e.g. Purees, Solid Food" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suitable For Age Group *</label>
            <select required value={formData.suitableForAgeGroup} onChange={(e) => setFormData({...formData, suitableForAgeGroup: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select Age Group</option>
              <option value="0-6 months">0-6 months</option>
              <option value="6-12 months">6-12 months</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3+ years">3+ years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated) *</label>
            <input required type="text" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rice, Dal, Ghee" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Warm, Soft, Immunity" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma separated)</label>
            <input type="text" value={allergensText} onChange={(e) => setAllergensText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Dairy, Nuts, Gluten" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="inStockToggle"
            checked={formData.inStock}
            onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
          />
          <label htmlFor="inStockToggle" className="text-sm font-medium text-gray-700">Currently Available in Kitchen</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isActiveToggle"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
            />
            <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700">Visible to Customers</label>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Nutritional Information (per serving)</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Calories (kcal)</label>
              <input type="number" min="0" value={formData.nutritionalInfo.calories} onChange={(e) => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, calories: Number(e.target.value)}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Protein (g)</label>
              <input type="number" min="0" value={formData.nutritionalInfo.protein} onChange={(e) => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, protein: Number(e.target.value)}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Carbs (g)</label>
              <input type="number" min="0" value={formData.nutritionalInfo.carbs} onChange={(e) => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, carbs: Number(e.target.value)}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fat (g)</label>
              <input type="number" min="0" value={formData.nutritionalInfo.fat} onChange={(e) => setFormData({...formData, nutritionalInfo: {...formData.nutritionalInfo, fat: Number(e.target.value)}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Images <span className="text-gray-400 font-normal">(Drag to reorder, up to 5 images)</span></label>
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
                    showError('You can only upload up to 5 images per meal.');
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
                  <img src={img.url} alt="Preview" className="h-[96px] w-[96px] object-cover rounded-md shadow-sm pointer-events-none" />
                  
                  {idx === 0 && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm pointer-events-none">PRIMARY</div>
                  )}

                  {img.type === 'new' && idx !== 0 && (
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm pointer-events-none">NEW</div>
                  )}

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
          <button type="button" disabled={isSubmitting} onClick={() => router.push('/meals')} className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-70">
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {initialData ? (isSubmitting ? 'Updating...' : 'Update Meal') : (isSubmitting ? 'Creating...' : 'Create Meal')}
          </button>
        </div>
      </form>
    </div>
  );
}
