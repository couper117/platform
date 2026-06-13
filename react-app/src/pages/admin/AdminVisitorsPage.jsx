import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Eye, Globe, Clock, Filter, Search, User } from 'lucide-react';
import apiClient from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import Skeleton from '../../components/shared/Skeleton';
import { format } from 'date-fns';

const AdminVisitorsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-logs', page],
    queryFn: async () => {
      const { data } = await apiClient.get('/activity', { params: { page, limit: 20 } });
      return data;
    },
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display uppercase tracking-tighter">Visitor <span className="text-red">Analytics</span></h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Live tracking of platform traffic and user actions</p>
        </div>
        <div className="flex items-center space-x-4 bg-white dark:bg-surface-dark2 p-4 rounded-2xl border border-surface-3 dark:border-white/5 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold tracking-widest opacity-40">Total Events</span>
            <span className="text-2xl font-display leading-none">{data?.total || 0}</span>
          </div>
          <div className="w-px h-8 bg-surface-3 dark:bg-white/10" />
          <Eye className="text-red" />
        </div>
      </div>

      {isLoading ? (
        <Skeleton type="card" count={3} />
      ) : (
        <AdminTable headers={['Time', 'User', 'Action', 'IP / Device', 'Path']}>
          {data?.data?.map(log => (
            <tr key={log.id} className="hover:bg-surface-2 dark:hover:bg-white/5 transition-colors text-[11px]">
              <td className="px-6 py-4 font-mono opacity-60">
                {format(new Date(log.createdAt), 'HH:mm:ss')}
                <br />
                {format(new Date(log.createdAt), 'dd MMM')}
              </td>
              <td className="px-6 py-4">
                {log.user ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-red/10 flex items-center justify-center text-red font-bold">
                      {log.user.fullName[0]}
                    </div>
                    <span className="font-bold">{log.user.fullName}</span>
                  </div>
                ) : (
                  <span className="opacity-30 italic">Guest</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded border ${
                  log.action === 'PAGE_VIEW' ? 'bg-blue-500/5 text-blue-500 border-blue-500/10' : 'bg-red/5 text-red border-red/10'
                } font-bold uppercase`}>
                  {log.action}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold opacity-60">{log.ip}</span>
                  <span className="text-[9px] opacity-30 truncate max-w-[150px]">{log.userAgent}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-red opacity-60">{log.pagePath}</td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Pagination */}
      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          className="px-6 py-2 bg-surface-2 dark:bg-white/5 rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-20"
        >
          Previous
        </button>
        <span className="flex items-center font-display text-xl">{page}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={data?.pages <= page}
          className="px-6 py-2 bg-surface-2 dark:bg-white/5 rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-20"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminVisitorsPage;
