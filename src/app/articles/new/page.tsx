import ArticleForm from '@/components/ArticleForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewArticlePage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/articles" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
        <p className="text-gray-500 mt-1">Write and publish a new blog post for the parents.</p>
      </div>
      <ArticleForm />
    </div>
  );
}
