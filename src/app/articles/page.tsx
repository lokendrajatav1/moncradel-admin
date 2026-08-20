"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';
import api from '@/utils/api';

interface Article {
  _id: string;
  title: string;
  category: string;
  coverImage?: string;
  isPublished: boolean;
  createdAt: string;
  tags?: string[];
}

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalArticles, setTotalArticles] = useState(0);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/articles?page=${currentPage}&limit=${itemsPerPage}&search=${search}`);
      if (data.success) {
        setArticles(data.data);
        setTotalArticles(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      showError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchArticles();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchArticles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirmDelete(title);
    if (isConfirmed) {
      showLoading('Deleting...');
      try {
        await api.delete(`/articles/${id}`);
        showSuccess('Article has been deleted.');
        fetchArticles();
      } catch (error) {
        hideAlert();
        showError('Failed to delete article');
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalArticles / itemsPerPage));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Articles & Blog</h1>
        <Link 
          href="/articles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Article
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No articles found.</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Article Info</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Category</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Date</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 font-semibold text-right border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <tr key={article._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {article.coverImage ? (
                          <img src={article.coverImage} alt={article.title} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="h-5 w-5 text-indigo-400" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 block truncate max-w-xs">{article.title}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                            {article.tags?.join(', ') || 'No tags'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/articles/edit/${article._id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(article._id, article.title)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
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
        {!loading && articles.length > 0 && (
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalArticles)} of {totalArticles}
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
    </div>
  );
}
