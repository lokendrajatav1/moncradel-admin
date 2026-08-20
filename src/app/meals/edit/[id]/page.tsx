"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MealForm from '@/components/MealForm';
import api from '@/utils/api';
import { showError } from '@/utils/alert';

export default function EditMealPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [mealData, setMealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const { data } = await api.get(`/meals/${id}`);
        if (data.success) {
          setMealData(data.data);
        }
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to fetch meal details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMeal();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-gray-500 animate-pulse">Loading meal data...</div>
      </div>
    );
  }

  if (!mealData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Meal Not Found</h3>
        <Link href="/meals" className="text-blue-600 hover:underline">Return to meals list</Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <Link 
          href="/meals"
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meals
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Meal</h1>
        <p className="text-sm text-gray-500 mt-1">Update details for {mealData.name}</p>
      </div>
      
      <MealForm initialData={mealData} />
    </div>
  );
}
