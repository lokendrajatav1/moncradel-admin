import React from 'react';
import { Package, Tag, Layers, Hash, Star, X, Edit } from 'lucide-react';
import Link from 'next/link';

interface Product {
  _id: string;
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

interface ProductViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function ProductViewDrawer({ isOpen, onClose, product }: ProductViewDrawerProps) {
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
              <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            {product && (
              <div className="flex-1 px-6 py-6 space-y-8">
                {/* Header Info */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    {(product.images && product.images.length > 0) ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2 truncate" title={product._id}>ID: {product._id}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                      {product.isFeatured && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-purple-700" /> Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Tag className="w-3 h-3" /> Category</p>
                      <p className="font-medium text-gray-900 truncate" title={product.category}>{product.category || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Layers className="w-3 h-3" /> Brand</p>
                      <p className="font-medium text-gray-900 truncate" title={product.brand}>{product.brand || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Hash className="w-3 h-3" /> SKU</p>
                      <p className="font-medium text-gray-900 truncate" title={product.sku}>{product.sku || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Age Group</p>
                      <p className="font-medium text-gray-900">{product.ageGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing and Stock */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Pricing & Stock</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Regular Price</p>
                      <p className="font-bold text-gray-900 text-lg">₹{product.price}</p>
                    </div>
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Discount Price</p>
                      <p className="font-bold text-blue-700 text-lg">{product.discountedPrice ? `₹${product.discountedPrice}` : 'N/A'}</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg col-span-2 flex justify-between items-center">
                      <p className="text-sm text-gray-500 font-medium">Available Stock</p>
                      <p className={`font-bold text-lg ${product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {product.stockQuantity || 0} units
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Description</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Extra Images */}
                {product.images && product.images.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Additional Images</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {product.images.slice(1).map((img, idx) => (
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
              {product && (
                <Link
                  href={`/products/edit/${product._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Product
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
