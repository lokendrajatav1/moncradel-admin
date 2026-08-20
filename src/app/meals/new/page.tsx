"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MealForm from '@/components/MealForm';

export default function NewMealPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Kitchen Meal</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new meal and set its dietary details.</p>
      </div>
      
      <MealForm />
    </div>
  );
}
