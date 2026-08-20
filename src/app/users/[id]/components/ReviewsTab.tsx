"use client";

import { Star, MessageSquare } from 'lucide-react';

interface ReviewsTabProps {
  reviews: any[];
}

export default function ReviewsTab({ reviews }: ReviewsTabProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" /> Reviews & Ratings
        </h3>
        <p className="text-sm text-gray-500">No reviews found for this user yet.</p>
      </div>
    );
  }

  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
          <div className="flex items-center text-yellow-400 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-4 h-4 ${star <= Math.round(Number(averageRating)) ? 'fill-current' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-sm text-gray-500 mt-1">Based on {reviews.length} reviews</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" /> Recent Reviews
        </h3>
        <div className="space-y-6">
          {reviews.map((review: any) => (
            <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{review.parentId?.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center bg-green-50 px-2 py-1 rounded border border-green-100">
                  <span className="text-sm font-bold text-green-700 mr-1">{review.rating}</span>
                  <Star className="w-3 h-3 text-green-600 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 text-sm mt-2">{review.comment || 'No comment provided.'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
