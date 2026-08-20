"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArticleForm from '@/components/ArticleForm';
import api from '@/utils/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/articles/${params.id}`);
        setArticle(res.data.data);
      } catch (error) {
        console.error('Failed to fetch article:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Article not found</h3>
        <Link href="/articles" className="mt-4 inline-block text-blue-600 hover:underline">
          Go back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/articles" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-500 mt-1">Update information for <span className="font-semibold text-gray-700">{article.title}</span></p>
      </div>
      <ArticleForm initialData={article} />
    </div>
  );
}
