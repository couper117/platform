import React from 'react';
import { twMerge } from 'tailwind-merge';

const AdminTable = ({ headers, children, className = "" }) => {
  return (
    <div className={twMerge("w-full overflow-hidden rounded-3xl border border-surface-3 dark:border-white/5 bg-white dark:bg-surface-dark2", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-2 dark:bg-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-surface-dark/40 dark:text-white/40">
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-3 dark:divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
