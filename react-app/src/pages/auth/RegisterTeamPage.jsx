import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserPlus, Loader2, AlertCircle, ChevronLeft, Building2, User, Trophy, Users } from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import apiClient from '../../api/client';

const registerSchema = z.object({
  // Step 1 — manager
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  // Step 2 — club
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  shortName: z.string().optional(),
  sportId: z.string().min(1, 'Please select a sport'),
  city: z.string().min(2, 'City is required'),
  district: z.string().optional(),
  province: z.string().min(2, 'Province is required'),
  homeVenue: z.string().optional(),
  foundedYear: z.string().optional(),
  registrationNo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  // Step 3 — officials
  presidentName: z.string().min(2, 'Club president is required'),
  presidentPhone: z.string().optional(),
  secretaryName: z.string().optional(),
  secretaryPhone: z.string().optional(),
});

const field = 'w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl focus:border-red outline-none transition-all';
const lbl = 'text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1';
const errCls = 'text-[10px] font-bold text-red uppercase tracking-widest ml-1';

const RegisterTeamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { data: sports } = useQuery({ queryKey: ['sports-list-register'], queryFn: getSports });

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const nextStep = async () => {
    const groups = {
      1: ['fullName', 'username', 'email', 'password', 'phone'],
      2: ['teamName', 'sportId', 'city', 'province'],
    };
    const isValid = await trigger(groups[step] || []);
    if (isValid) setStep(step + 1);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const officials = [
        { role: 'PRESIDENT', fullName: data.presidentName, phone: data.presidentPhone },
        { role: 'SECRETARY', fullName: data.secretaryName, phone: data.secretaryPhone },
      ].filter((o) => o.fullName && o.fullName.trim());

      await apiClient.post('/auth/team/register', { ...data, officials });
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-green rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-green/20">
          <Trophy size={48} className="text-white" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-display text-white uppercase tracking-tighter">Application <span className="text-green">Submitted</span></h1>
          <p className="text-white/60 max-w-md mx-auto leading-relaxed">
            Your club registration has been received. The sport federation will review your application and documents. You will receive an email once approved.
          </p>
        </div>
        <Link to="/auth/login" className="bg-white/10 text-white font-display text-xl uppercase tracking-widest px-10 py-4 rounded-xl hover:bg-white/20 transition-all">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark py-20 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red via-rwanda-yellow to-rwanda-green" />

      <Link to="/auth/login" className="absolute top-8 left-8 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-red transition-colors z-50">
        <ChevronLeft size={14} />
        <span>{t('common.back')}</span>
      </Link>

      <div className="w-full max-w-xl space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-red/10 rounded-3xl border border-red/20 text-red mb-2">
            <UserPlus size={32} />
          </div>
          <h1 className="text-4xl sm:text-6xl font-display text-white uppercase tracking-tighter leading-none">
            Club <span className="text-red">Registration</span>
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Register your club with the federation</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="w-8 h-0.5 bg-white/10" />}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg border-2 transition-all ${step === s ? 'bg-red border-red text-white shadow-lg shadow-red/20' : 'border-white/20 text-white/40'}`}>{s}</div>
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="bg-red/10 border border-red/20 p-4 rounded-xl flex items-center space-x-3 text-red">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-3 text-white/30 mb-2">
                  <User size={18} />
                  <h2 className="text-[10px] uppercase font-bold tracking-[0.3em]">Manager Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={lbl}>Full Name</label>
                    <input {...register('fullName')} className={field} placeholder="Enter full name" />
                    {errors.fullName && <p className={errCls}>{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Username</label>
                    <input {...register('username')} className={field} placeholder="Choose username" />
                    {errors.username && <p className={errCls}>{errors.username.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Email Address</label>
                  <input {...register('email')} className={field} placeholder="email@example.com" />
                  {errors.email && <p className={errCls}>{errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={lbl}>Password</label>
                    <input {...register('password')} type="password" className={field} placeholder="••••••••" />
                    {errors.password && <p className={errCls}>{errors.password.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Phone Number</label>
                    <input {...register('phone')} className={field} placeholder="+250..." />
                  </div>
                </div>
                <button type="button" onClick={nextStep} className="w-full bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all">Next: Club Details</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-3 text-white/30 mb-2">
                  <Building2 size={18} />
                  <h2 className="text-[10px] uppercase font-bold tracking-[0.3em]">Club Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className={lbl}>Official Club Name</label>
                    <input {...register('teamName')} className={field} placeholder="e.g. Kigali Tigers FC" />
                    {errors.teamName && <p className={errCls}>{errors.teamName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Short Name</label>
                    <input {...register('shortName')} className={field} placeholder="KTG" maxLength={10} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Primary Sport</label>
                  <select {...register('sportId')} className={`${field} bg-surface-dark appearance-none cursor-pointer`}>
                    <option value="">Select a sport</option>
                    {sports?.data?.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                  {errors.sportId && <p className={errCls}>{errors.sportId.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={lbl}>City / Town</label>
                    <input {...register('city')} className={field} placeholder="e.g. Kigali" />
                    {errors.city && <p className={errCls}>{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>District</label>
                    <input {...register('district')} className={field} placeholder="e.g. Nyarugenge" />
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Province</label>
                    <input {...register('province')} className={field} placeholder="e.g. Kigali City" />
                    {errors.province && <p className={errCls}>{errors.province.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={lbl}>Home Venue / Stadium</label>
                    <input {...register('homeVenue')} className={field} placeholder="e.g. Amahoro Stadium" />
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Year Founded</label>
                    <input {...register('foundedYear')} type="number" className={field} placeholder="e.g. 1998" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={lbl}>Reg. Number</label>
                    <input {...register('registrationNo')} className={field} placeholder="RGB/…" />
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Primary Colour</label>
                    <input {...register('primaryColor')} className={field} placeholder="e.g. Blue" />
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Secondary Colour</label>
                    <input {...register('secondaryColor')} className={field} placeholder="e.g. White" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-white/20 text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-white/5 transition-all">Back</button>
                  <button type="button" onClick={nextStep} className="flex-[2] bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all">Next: Officials</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-3 text-white/30 mb-2">
                  <Users size={18} />
                  <h2 className="text-[10px] uppercase font-bold tracking-[0.3em]">Club Officials</h2>
                </div>
                <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-red/80">President <span className="text-white/30">(required)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={lbl}>Full Name</label>
                      <input {...register('presidentName')} className={field} placeholder="President name" />
                      {errors.presidentName && <p className={errCls}>{errors.presidentName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className={lbl}>Phone</label>
                      <input {...register('presidentPhone')} className={field} placeholder="+250..." />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">Secretary <span className="text-white/30">(optional)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={lbl}>Full Name</label>
                      <input {...register('secretaryName')} className={field} placeholder="Secretary name" />
                    </div>
                    <div className="space-y-2">
                      <label className={lbl}>Phone</label>
                      <input {...register('secretaryPhone')} className={field} placeholder="+250..." />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 border border-white/20 text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-white/5 transition-all">Back</button>
                  <button type="submit" disabled={isLoading} className="flex-[2] bg-red text-white font-display text-xl uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center space-x-3 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Submit Application</span>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterTeamPage;
