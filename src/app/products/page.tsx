"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';
import Link from 'next/link';
import ProductViewDrawer from '@/components/ProductViewDrawer';

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.data) {
        setProducts(res.data.data);
        setTotalItems(res.data.count || res.data.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
      showError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery]);

  const openViewDrawer = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirmDelete(name);
    if (isConfirmed) {
      try {
        showLoading('Deleting product...');
        const { data } = await api.delete(`/products/${id}`);
        if (data.success) {
          hideAlert();
          fetchProducts();
          showSuccess('Product deleted successfully!');
        }
      } catch (error: any) {
        hideAlert();
        showError('Failed to delete product');
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">E-Commerce Products</h1>
        <div className="flex gap-3">
          <Link
            href="/products/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Product Info</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Category & Brand</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Price (₹)</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Stock</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="w-max px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {product.category || 'Uncategorized'}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {product.brand || 'No Brand'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.discountedPrice > 0 && product.discountedPrice < product.price ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-green-600">₹{product.discountedPrice}</span>
                          <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">₹{product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {product.stockQuantity || 0} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewDrawer(product)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/products/edit/${product._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
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
        {!loading && totalItems > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 bg-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 hidden sm:inline">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
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

      <ProductViewDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
