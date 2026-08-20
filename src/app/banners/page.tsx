"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Link as LinkIcon, GripVertical } from 'lucide-react';
import BannerForm from '@/components/BannerForm';
import api from '@/utils/api';
import { confirmDelete, showSuccess, showError, showLoading, hideAlert } from '@/utils/alert';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  createdAt: string;
}

function SortableBannerCard({ banner, handleEdit, handleDelete }: { banner: Banner, handleEdit: any, handleDelete: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: banner._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-xl border ${isDragging ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative`}>
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>
      <div className="relative h-48 bg-gray-100 group">
        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={() => handleEdit(banner)} className="p-2 bg-white text-blue-600 rounded-full hover:scale-110 transition-transform">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(banner._id, banner.title)} className="p-2 bg-white text-red-600 rounded-full hover:scale-110 transition-transform">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {!banner.isActive && (
          <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            Hidden
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-bold text-gray-900 truncate" title={banner.title}>{banner.title}</h3>
          {banner.link ? (
            <a href={banner.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-1 truncate">
              <LinkIcon className="w-3 h-3 shrink-0" />
              {banner.link}
            </a>
          ) : (
            <p className="text-sm text-gray-400 mt-1 italic">No target link</p>
          )}
        </div>
        <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
          <span className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
            banner.isActive ? 'text-green-600' : 'text-gray-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${banner.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {banner.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-[11px] text-gray-400">
            {new Date(banner.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners');
      if (res.data && res.data.success) {
        setBanners(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch banners', error);
      showError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAddNew = () => {
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = await confirmDelete(title);
    if (isConfirmed) {
      try {
        showLoading('Deleting banner...');
        const { data } = await api.delete(`/banners/${id}`);
        if (data.success) {
          hideAlert();
          showSuccess('Banner deleted successfully!');
          fetchBanners();
        }
      } catch (error: any) {
        hideAlert();
        showError('Failed to delete banner');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((item) => item._id === active.id);
      const newIndex = banners.findIndex((item) => item._id === over.id);

      const reorderedBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(reorderedBanners);

      // Save new order to backend
      try {
        const bannerIds = reorderedBanners.map(b => b._id);
        await api.put('/banners/reorder', { bannerIds });
      } catch (err) {
        console.error('Failed to save banner order', err);
        showError('Failed to save new order');
        fetchBanners(); // Revert back on error
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners (CMS)</h1>
          <p className="text-sm text-gray-500 mt-1">Drag and drop to reorder your homepage promotional banners.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Upload Banner
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-medium">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Banners Yet</h3>
          <p className="text-gray-500 mb-4 max-w-sm">Upload your first promotional banner to showcase offers and updates to your customers.</p>
          <button 
            onClick={handleAddNew}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload First Banner
          </button>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SortableContext 
              items={banners.map(b => b._id)}
              strategy={rectSortingStrategy}
            >
              {banners.map((banner) => (
                <SortableBannerCard 
                  key={banner._id} 
                  banner={banner} 
                  handleEdit={handleEdit} 
                  handleDelete={handleDelete} 
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {isModalOpen && (
        <BannerForm 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchBanners}
          initialData={editingBanner}
        />
      )}
    </div>
  );
}
