"use client";

import { Baby as BabyIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BabiesTabProps {
  babies: any[];
}

export default function BabiesTab({ babies }: BabiesTabProps) {
  const router = useRouter();

  if (babies.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BabyIcon className="h-5 w-5 text-blue-600" /> Linked Babies
        </h3>
        <p className="text-sm text-gray-500">No babies linked to this account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BabyIcon className="h-5 w-5 text-blue-600" /> Linked Babies
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {babies.map((baby) => (
          <div key={baby._id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => router.push(`/babies/${baby._id}`)}>
            <h4 className="font-semibold text-gray-900">{baby.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{baby.ageInMonths} months old</p>
            {baby.weightInKg && <p className="text-xs text-gray-500 mt-1">Weight: {baby.weightInKg} kg</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
