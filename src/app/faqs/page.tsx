"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, MessageCircleQuestion } from 'lucide-react';
import FaqForm from '@/components/FaqForm';
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
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Faq {
  _id: string;
  question: string;
  answer: string;
  targetApp: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

function SortableFaqItem({ faq, handleEdit, handleDelete }: { faq: Faq, handleEdit: any, handleDelete: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: faq._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-xl border ${isDragging ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} shadow-sm p-4 flex gap-4 hover:shadow-md transition-all relative group`}>
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 flex items-center justify-center shrink-0 mt-1"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{faq.question}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
              {faq.targetApp}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
              {faq.category}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {faq.isActive ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-4xl">{faq.answer}</p>
      </div>

      <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleEdit(faq)} className="p-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(faq._id, faq.question)} className="p-2 bg-gray-50 text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-gray-100">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  // Filters
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faqs');
      if (res.data && res.data.success) {
        setFaqs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch faqs', error);
      showError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddNew = () => {
    setEditingFaq(null);
    setIsModalOpen(true);
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, question: string) => {
    const isConfirmed = await confirmDelete(question);
    if (isConfirmed) {
      try {
        showLoading('Deleting FAQ...');
        const { data } = await api.delete(`/faqs/${id}`);
        if (data.success) {
          hideAlert();
          showSuccess('FAQ deleted successfully!');
          fetchFaqs();
        }
      } catch (error: any) {
        hideAlert();
        showError('Failed to delete FAQ');
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((item) => item._id === active.id);
      const newIndex = faqs.findIndex((item) => item._id === over.id);

      const reorderedFaqs = arrayMove(faqs, oldIndex, newIndex);
      setFaqs(reorderedFaqs);

      try {
        const faqIds = reorderedFaqs.map(f => f._id);
        await api.put('/faqs/reorder', { faqIds });
      } catch (err) {
        console.error('Failed to save FAQ order', err);
        showError('Failed to save new order');
        fetchFaqs(); // Revert back on error
      }
    }
  };

  // Filter the FAQs locally before rendering
  const filteredFaqs = faqs.filter(f => {
    if (filterApp !== 'all' && f.targetApp !== filterApp) return false;
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FAQs Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Manage FAQs across Parent, Doctor, Kitchen, and Delivery Apps.</p>
          </div>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={filterApp} onChange={e => setFilterApp(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Apps</option>
          <option value="parent">Parent App</option>
          <option value="doctor">Doctor App</option>
          <option value="kitchen">Kitchen Partner</option>
          <option value="delivery">Delivery Partner</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Categories</option>
          <option value="general">General (Help & Support)</option>
          <option value="subscriptions">Subscriptions</option>
          <option value="orders">Orders</option>
          <option value="health">Health</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-medium">Loading FAQs...</div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MessageCircleQuestion className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No FAQs Found</h3>
          <p className="text-gray-500 mb-6 max-w-md">You haven't added any FAQs matching the selected filters yet. Create your first one to help your users!</p>
          <button 
            onClick={handleAddNew}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create FAQ
          </button>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3">
            <SortableContext 
              items={filteredFaqs.map(f => f._id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredFaqs.map((faq) => (
                <SortableFaqItem 
                  key={faq._id} 
                  faq={faq} 
                  handleEdit={handleEdit} 
                  handleDelete={handleDelete} 
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {isModalOpen && (
        <FaqForm 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchFaqs}
          initialData={editingFaq}
        />
      )}
    </div>
  );
}
