"use client";

import { useState, useEffect } from 'react';
import ProductForm from '@/components/ProductForm';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    // Optionally fetch existing products to populate category datalist
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products?limit=100');
        if (res.data && res.data.data) {
          const categories = Array.from(new Set(res.data.data.map((p: any) => p.category).filter(Boolean))) as string[];
          setExistingCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="w-full space-y-6">
      <div>
        <button onClick={() => router.push('/products')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500 mt-1">Create a new product listing in your store.</p>
      </div>
      <ProductForm existingCategories={existingCategories} />
    </div>
  );
}
