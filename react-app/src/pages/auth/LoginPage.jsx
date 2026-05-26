import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      
      if (user.role === 'SUPERADMIN' || user.role === 'LEAGUE_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/team/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red via-rwanda-yellow to-rwanda-green" />
      <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-red/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-rwanda-green/10 rounded-full blur-[120px]" />

      <Link to="/" className="absolute top-8 left-8 hidden sm:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red transition-colors">
        <ChevronLeft size={14} />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-red/10 rounded-3xl border border-red/20 text-red mb-2 shadow-2xl shadow-red/20">
            <LogIn size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display text-white uppercase tracking-tighter">
            Access <span className="text-red">Portal</span>
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Rwanda National Sports Platform</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red/10 border border-red/20 p-4 rounded-xl flex items-center space-x-3 text-red animate-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Username</label>
                <input
                  {...register('username')}
                  className={`w-full bg-white/5 border ${errors.username ? 'border-red/50' : 'border-white/10'} text-white p-4 rounded-xl focus:border-red focus:bg-white/10 outline-none transition-all placeholder:text-white/10`}
                  placeholder="Enter your username"
                />
                {errors.username && <p className="text-[10px] font-bold text-red uppercase tracking-widest ml-1">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full bg-white/5 border ${errors.password ? 'border-red/50' : 'border-white/10'} text-white p-4 rounded-xl focus:border-red focus:bg-white/10 outline-none transition-all placeholder:text-white/10`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-[10px] font-bold text-red uppercase tracking-widest ml-1">{errors.password.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-red/20 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Enter Portal</span>}
            </button>
          </form>
        </div>

        <div className="text-center space-y-4">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            Don't have an account?
          </p>
          <Link to="/auth/team/register" className="inline-block text-white font-display text-lg uppercase tracking-widest border border-white/20 px-8 py-2 rounded-lg hover:bg-white/5 transition-all">
            Register Your Team
          </Link>
        </div>
      </div>

      <div className="mt-20 text-white/20 text-[8px] uppercase font-bold tracking-[0.4em]">
        Secured by RNSP Identity Service
      </div>
    </div>
  );
};

export default LoginPage;
