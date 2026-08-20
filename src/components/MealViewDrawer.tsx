import React from 'react';
import { ChefHat, Tag, Layers, Star, X, Edit, List } from 'lucide-react';
import Link from 'next/link';

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

interface MealViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meal: Meal | null;
}

export default function MealViewDrawer({ isOpen, onClose, meal }: MealViewDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-white/70 transition-opacity" 
        onClick={onClose} 
      />
      <section className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">Meal Details</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            {meal && (
              <div className="flex-1 px-6 py-6 space-y-8">
                {/* Header Info */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    {(meal.images && meal.images.length > 0) ? (
                      <img src={meal.images[0]} alt={meal.name} className="w-full h-full object-cover" />
                    ) : meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ChefHat className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate" title={meal.name}>{meal.name}</h3>
                    <p className="text-sm text-gray-500 mb-2 truncate" title={meal._id}>ID: {meal._id}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${meal.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {meal.isActive ? 'Active' : 'Draft'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${meal.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {meal.inStock ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="font-medium text-gray-900">{meal.category || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Suitable For Age Group</p>
                      <p className="font-medium text-gray-900">{meal.suitableForAgeGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Nutritional Information */}
                {meal.nutritionalInfo && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Nutritional Information</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-orange-600">{meal.nutritionalInfo.calories}</p>
                        <p className="text-xs text-orange-800 mt-1">Calories</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-blue-600">{meal.nutritionalInfo.protein}g</p>
                        <p className="text-xs text-blue-800 mt-1">Protein</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-600">{meal.nutritionalInfo.carbs}g</p>
                        <p className="text-xs text-green-800 mt-1">Carbs</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-center">
                        <p className="text-xl font-bold text-yellow-600">{meal.nutritionalInfo.fat}g</p>
                        <p className="text-xs text-yellow-800 mt-1">Fat</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Regular Price</p>
                      <p className="font-bold text-gray-900 text-lg">₹{meal.price}</p>
                    </div>
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Discount Price</p>
                      <p className="font-bold text-blue-700 text-lg">{meal.discountedPrice ? `₹${meal.discountedPrice}` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Ingredients</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {meal.ingredients && meal.ingredients.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {meal.ingredients.map((ing, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{ing}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No ingredients specified.</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Description</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{meal.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Extra Images */}
                {meal.images && meal.images.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Additional Images</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {meal.images.slice(1).map((img, idx) => (
                        <div key={idx} className="w-20 h-20 shrink-0 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                          <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Drawer Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {meal && (
                <Link
                  href={`/meals/edit/${meal._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Meal
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
