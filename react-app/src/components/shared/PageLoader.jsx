import React from 'react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[150] bg-surface-dark/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 bg-red rounded-2xl flex items-center justify-center animate-bounce shadow-2xl shadow-red/20">
          <span className="text-2xl font-display text-white uppercase tracking-tighter">Rwa</span>
        </div>
        <div className="absolute inset-0 border-2 border-white/10 rounded-2xl animate-ping" />
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-red font-display text-lg uppercase tracking-[0.3em] mb-1">Murakaza Neza</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 animate-pulse">
          Synchronizing Data
        </p>
      </div>

      <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-red animate-progress" />
      </div>
    </div>
  );
};

export default PageLoader;
