"use client";

import { useRouter } from 'next/navigation';
import { Baby } from './types';

interface OverviewTabProps {
  baby: Baby;
}

export default function OverviewTab({ baby }: OverviewTabProps) {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Basic Details</h3>
          <p className="text-gray-900 font-medium text-lg">{baby.name}</p>
          <p className="text-gray-600">{baby.ageInMonths} months old</p>
          <p className="text-gray-600">Initial Weight: {baby.weight || 'N/A'} kg</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Parent Information</h3>
          <p 
            className="text-blue-600 font-medium hover:underline cursor-pointer" 
            onClick={() => baby.parentId && router.push(`/users/${baby.parentId._id}`)}
          >
            {baby.parentId?.name || 'Unknown'}
          </p>
          <p className="text-gray-600">{baby.parentId?.phone || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
          {baby.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {baby.allergies.map((a, i) => (
                <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
                  {a}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">None recorded</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Dietary Preferences / Diet</h3>
          {baby.diet ? (
            <p className="text-gray-900">{baby.diet}</p>
          ) : (
            <p className="text-sm text-gray-500">None recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
