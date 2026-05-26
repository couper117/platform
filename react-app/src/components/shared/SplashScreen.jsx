import React from 'react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[200] bg-surface-dark flex flex-col items-center justify-center space-y-8 animate-out fade-out duration-1000 delay-2000 fill-mode-forwards">
      <div className="relative">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red rounded-3xl transform rotate-12 flex items-center justify-center shadow-2xl shadow-red/20 animate-in zoom-in duration-700">
          <span className="text-4xl sm:text-5xl font-display text-white uppercase tracking-tighter -rotate-12">Rwa</span>
        </div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 sm:w-16 sm:h-16 bg-rwanda-blue rounded-2xl flex items-center justify-center shadow-xl animate-in zoom-in duration-700 delay-300">
          <span className="text-xl sm:text-2xl font-display text-white uppercase tracking-tighter">Sport</span>
        </div>
      </div>

      <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <p className="text-red font-display text-xl sm:text-2xl uppercase tracking-[0.4em] mb-2 animate-pulse">Murakaza Neza</p>
        <h1 className="text-3xl sm:text-4xl font-display text-white uppercase tracking-[0.2em]">Rwanda National</h1>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.5em] text-white/30">Sports Platform</p>
      </div>

      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red via-rwanda-yellow to-rwanda-green animate-progress" />
      </div>
    </div>
  );
};

export default SplashScreen;
