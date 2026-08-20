"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import api from '@/utils/api';
import { ArrowLeft } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        // Fetch product
        const res = await api.get(`/products/${params.id}`);
        setProduct(res.data.data);
        
        // Fetch categories (optional, for datalist)
        const catsRes = await api.get('/products?limit=100');
        if (catsRes.data && catsRes.data.data) {
          const categories = Array.from(new Set(catsRes.data.data.map((p: any) => p.category).filter(Boolean))) as string[];
          setExistingCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProductAndCategories();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Product not found</h3>
        <button onClick={() => router.push('/products')} className="mt-4 text-blue-600 hover:underline">Go back to Products</button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <button onClick={() => router.push('/products')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-500 mt-1">Update information for <span className="font-semibold text-gray-700">{product.name}</span></p>
      </div>
      <ProductForm initialData={product} existingCategories={existingCategories} />
    </div>
  );
}
