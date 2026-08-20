"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Eye } from 'lucide-react';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import MealViewDrawer from '@/components/MealViewDrawer';

interface Meal {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  suitableForAgeGroup: string;
  category?: string;
  ingredients: string[];
  inStock: boolean;
  isActive: boolean;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  images?: string[];
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalMeals, setTotalMeals] = useState(0);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/meals?page=${currentPage}&limit=${itemsPerPage}&search=${search}`);
      if (data.success) {
        setMeals(data.data);
        setTotalMeals(data.count || 0);
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search]);

  const openViewDrawer = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMeals();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchMeals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmDelete(name);
    if (isConfirmed) {
      try {
        showLoading('Deleting meal...');
        await api.delete(`/meals/${id}`);
        hideAlert();
        fetchMeals();
        showSuccess('Meal deleted successfully!');
      } catch (error: any) {
        hideAlert();
        showError(error.response?.data?.message || 'Failed to delete meal');
      }
    }
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(totalMeals / itemsPerPage));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Meals Menu</h1>
        <Link 
          href="/meals/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Meal
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search meals..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No meals found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Meal Info</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Age Group</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Price</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Kitchen Status</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meals.map((meal) => (
                  <tr key={meal._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {meal.images && meal.images.length > 0 ? (
                          <img src={meal.images[0]} alt={meal.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : meal.imageUrl ? (
                          <img src={meal.imageUrl} alt={meal.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="h-5 w-5 text-orange-400" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 block">{meal.name}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                            {meal.ingredients?.join(', ')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {meal.suitableForAgeGroup || 'All Ages'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {meal.discountedPrice && meal.discountedPrice > 0 && meal.discountedPrice < meal.price ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-green-600">₹{meal.discountedPrice}</span>
                          <span className="text-xs text-gray-400 line-through">₹{meal.price}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">₹{meal.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        meal.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {meal.inStock ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewDrawer(meal)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link 
                          href={`/meals/edit/${meal._id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(meal._id, meal.name)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && meals.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 hidden sm:inline">Rows per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                     setItemsPerPage(Number(e.target.value));
                     setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMeals)} of {totalMeals}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <MealViewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        meal={selectedMeal}
      />
    </div>
  );
}
