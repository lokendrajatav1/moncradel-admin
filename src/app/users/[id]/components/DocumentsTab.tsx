"use client";

import { FileText, Stethoscope, Truck, Utensils } from 'lucide-react';

interface DocumentsTabProps {
  user: any;
}

export default function DocumentsTab({ user }: DocumentsTabProps) {
  const profile = user.profile || {};
  
  const renderDoctorDocs = () => (
    <>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Medical Registration Number</p>
        <p className="font-semibold text-gray-900">{profile.registrationNumber || 'N/A'}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Degrees</p>
        <p className="font-semibold text-gray-900">{profile.degrees?.length > 0 ? profile.degrees.join(', ') : 'N/A'}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Qualifications</p>
        <p className="font-semibold text-gray-900">{profile.qualifications?.length > 0 ? profile.qualifications.join(', ') : 'N/A'}</p>
      </div>
    </>
  );

  const renderDeliveryDocs = () => (
    <>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Driving License Number</p>
        <p className="font-semibold text-gray-900">{profile.drivingLicenseNumber || 'N/A'}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Aadhar Number</p>
        <p className="font-semibold text-gray-900">{profile.aadharNumber || 'N/A'}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Vehicle Details</p>
        <p className="font-semibold text-gray-900">{profile.vehicleType ? `${profile.vehicleType} (${profile.vehicleNumber || 'N/A'})` : 'N/A'}</p>
      </div>
    </>
  );

  const renderKitchenDocs = () => (
    <>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">FSSAI License Number</p>
        <p className="font-semibold text-gray-900">{profile.fssaiLicenseNumber || 'N/A'}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">GST Number</p>
        <p className="font-semibold text-gray-900">{profile.gstNumber || 'N/A'}</p>
      </div>
    </>
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-indigo-600" /> Identity & Verification Documents
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {user.role === 'doctor' && renderDoctorDocs()}
        {user.role === 'delivery' && renderDeliveryDocs()}
        {user.role === 'kitchen' && renderKitchenDocs()}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500 italic">
          Note: Currently showing document identification numbers. Image uploads are not configured in the database yet.
        </p>
      </div>
    </div>
  );
}
