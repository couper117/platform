import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Plus, Edit2, Trash2, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';

const AdminNewsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'NEWS', excerpt: '', body: '', published: true });

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data } = await apiClient.get('/news');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-news']);
      alert('Article deleted');
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">News <span className="text-red">Publisher</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage platform-wide announcements and news</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Write Article</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['Article Title', 'Category', 'Views', 'Date', 'Status', 'Actions']}>
          {news?.map(article => (
            <tr key={article.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center space-x-4 max-w-md">
                  <div className="w-12 h-8 rounded bg-surface-3 dark:bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {article.coverImage ? <img src={article.coverImage} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="opacity-20" />}
                  </div>
                  <span className="font-bold text-sm uppercase tracking-tight line-clamp-1">{article.title}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-60 uppercase">{article.category}</td>
              <td className="px-6 py-5 text-sm font-mono opacity-40">{article.views}</td>
              <td className="px-6 py-5 text-[10px] font-bold opacity-40">{new Date(article.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-5">
                <span className={`text-[8px] font-bold px-2 py-1 rounded border uppercase ${article.published ? 'bg-green/5 text-green border-green/10' : 'bg-surface-3 opacity-40'}`}>
                  {article.published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-surface-3 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate(article.id)}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Write Article Modal */}
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish New Article">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Article Title</label>
            <input className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" placeholder="Headline here..." />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Short Excerpt</label>
            <textarea className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red" placeholder="Brief summary..." rows={2} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Main Content (HTML/Text)</label>
            <textarea className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red min-h-[200px]" placeholder="Full story..." />
          </div>
          <button className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all">Publish Story</button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminNewsPage;
