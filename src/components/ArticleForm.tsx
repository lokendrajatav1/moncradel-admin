"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Save, X, Image as ImageIcon } from 'lucide-react';
import { showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface ArticleFormProps {
  initialData?: any;
}

export default function ArticleForm({ initialData }: ArticleFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Nutrition',
    tags: '',
    isPublished: false,
    content: ''
  });
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Nutrition',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        isPublished: initialData.isPublished || false,
        content: initialData.content || ''
      });
      if (initialData.coverImage) {
        setCoverImagePreview(initialData.coverImage);
      }
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showError('Error', 'Title and Content are required');
      return;
    }

    setSubmitting(true);
    showLoading(initialData ? 'Updating Article...' : 'Creating Article...');

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      payload.append('isPublished', String(formData.isPublished));
      payload.append('content', formData.content);
      
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      tagsArray.forEach(tag => payload.append('tags[]', tag));

      if (coverImage) {
        payload.append('image', coverImage);
      }

      if (initialData) {
        await api.put(`/articles/${initialData._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSuccess('Updated!', 'Article has been updated successfully');
      } else {
        await api.post('/articles', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSuccess('Created!', 'Article has been created successfully');
      }
      
      router.push('/articles');
    } catch (error: any) {
      hideAlert();
      console.error('Error saving article:', error);
      showError('Error', error.response?.data?.message || 'Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 max-w-4xl">
      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            placeholder="e.g., Best superfoods for 6-month-old babies"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Nutrition">Nutrition</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Parenting Tips">Parenting Tips</option>
              <option value="Milestones">Milestones</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., food, health, baby"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-32 h-32 border border-gray-300 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group">
              {coverImagePreview ? (
                <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Choose Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <p className="mt-2 text-xs text-gray-500">Recommended size: 1200 x 630 pixels. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <div className="bg-white" style={{ minHeight: '300px' }}>
            <ReactQuill 
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              modules={quillModules}
              style={{ height: '350px', marginBottom: '50px' }}
            />
          </div>
        </div>

        {/* Publish Status */}
        <div className="pt-4 flex items-center">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            checked={formData.isPublished}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
            Publish this article immediately
          </label>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/articles')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {initialData ? 'Update Article' : 'Save Article'}
          </button>
        </div>
        
      </div>
    </form>
  );
}
