import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Plus, Edit2, Trash2, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminModal from '../../components/admin/AdminModal';
import Skeleton from '../../components/shared/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useUiStore from '../../store/uiStore';

const CATEGORIES = ['NEWS', 'ANNOUNCEMENT', 'RESULT', 'TRANSFER', 'INJURY', 'OTHER'];

const emptyForm = { title: '', category: 'NEWS', excerpt: '', body: '', published: true, coverImage: null };

const AdminNewsPage = () => {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: news, isLoading, isError } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data } = await apiClient.get('/news');
      return data.data;
    },
  });

  const toFormData = (data) => {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('category', data.category);
    fd.append('excerpt', data.excerpt);
    fd.append('body', data.body);
    fd.append('published', data.published);
    if (data.coverImage) fd.append('coverImage', data.coverImage);
    return fd;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/news', toFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      closeModal();
      pushToast('Article published!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to publish article'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      await apiClient.put(`/news/${id}`, toFormData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      closeModal();
      pushToast('Article updated!', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to update article'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      await apiClient.delete(`/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      pushToast('Article deleted', 'success');
    },
    onError: (err: any) => pushToast(err.response?.data?.message || 'Failed to delete article'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setFormData(emptyForm);
  };

  const openCreate = () => {
    setEditingArticle(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      category: article.category || 'NEWS',
      excerpt: article.excerpt || '',
      body: article.body || '',
      published: !!article.published,
      coverImage: null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">News <span className="text-red">Publisher</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Manage platform-wide announcements and news</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red text-white px-8 py-3 rounded-xl font-display text-lg uppercase tracking-widest hover:bg-red-dark transition-all shadow-xl shadow-red/20 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Write Article</span>
        </button>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : isError ? (
        <EmptyState icon={Newspaper} title="Couldn't load articles" hint="Something went wrong fetching news. Try refreshing the page." />
      ) : news?.length ? (
        <AdminTable headers={['Article Title', 'Category', 'Views', 'Date', 'Status', 'Actions']}>
          {news.map(article => (
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
                  <button onClick={() => openEdit(article)} className="p-2 hover:bg-surface-3 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${article.title}"?`)) deleteMutation.mutate(article.id); }}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-red/10 text-red rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <EmptyState icon={Newspaper} title="No articles yet" hint="Write your first story to keep fans updated." />
      )}

      {/* Write/Edit Article Modal */}
      <AdminModal isOpen={isModalOpen} onClose={closeModal} title={editingArticle ? 'Edit Article' : 'Publish New Article'}>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Article Title</label>
            <input
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
              placeholder="Headline here..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Category</label>
              <select
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-3.5 rounded-xl outline-none text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red file:text-white file:text-[10px] file:uppercase file:font-bold"
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Short Excerpt</label>
            <textarea
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red"
              placeholder="Brief summary..."
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Main Content (HTML/Text)</label>
            <textarea
              className="w-full bg-surface-2 dark:bg-white/5 border border-surface-3 dark:border-white/10 p-4 rounded-xl outline-none focus:border-red min-h-[200px]"
              placeholder="Full story..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest opacity-60 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-4 h-4"
            />
            Publish immediately
          </label>
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isSaving}
            className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <span>{editingArticle ? 'Save Changes' : 'Publish Story'}</span>}
          </button>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminNewsPage;
