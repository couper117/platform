import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle, ChevronLeft, ArrowRight, CalendarDays, UserPlus, GraduationCap, Compass,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import { roleHome } from '../../utils/roleHome';
import { getSports } from '../../api/endpoints/sports';
import { HERO_BG } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import SportBounce from '../../components/shared/SportBounce';
import Seo from '../../components/shared/Seo';
import { Button, Field, Input } from '../../components/ui';

const loginSchema = z.object({
  username: z.string().min(3, 'Enter your email or username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/** Right-panel links. Everything a visitor might actually want instead of signing in. */
const SIDE_LINKS = [
  { to: '/fixtures', icon: CalendarDays, title: 'Live scores & fixtures', desc: 'Follow every match as it happens.' },
  { to: '/auth/team/register', icon: UserPlus, title: 'Register your team', desc: 'Join an official league this season.' },
  { to: '/amashuri', icon: GraduationCap, title: 'Amashuri Games', desc: 'Rwanda’s inter-school competitions.' },
  { to: '/', icon: Compass, title: 'Explore all sports', desc: 'Browse every federation and league.' },
];

/**
 * Split-screen sign-in.
 *
 *   left   the form, on a white panel, in a narrow centred column
 *   right  a dark panel over a blurred stadium photo, carrying the links someone
 *          might want instead of signing in
 *
 * THE RIGHT PANEL IS DESKTOP-ONLY. At 360px it would either push the form below
 * the fold or shrink it to nothing, and the form is the reason anyone is here. The
 * links it holds all live in the header and bottom nav anyway, so nothing is lost.
 *
 * The bouncing ball sits directly above the inputs. An auth screen is the one place
 * in this product where decoration is the point — there is no data to show, and a
 * bare pair of text boxes on a white field is a cold front door.
 */
const LoginPage = () => {
  const { t } = useTranslation();
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

      navigate(roleHome(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Cycles the ball through the sports that actually exist on this platform.
  // Same key as the header, so it is usually already cached.
  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const slugs = (sportsRes?.data ?? []).map((s) => s.slug).filter(Boolean);

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-2">
      <Seo title="Sign in" description="Sign in to RwaSport." />

      {/* ─── form ─── */}
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:min-h-0">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-secondary transition-colors hover:text-brand-text"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('common.back', 'Back')}
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <div className="text-center">
            <p className="font-display text-xl font-extrabold tracking-tight text-primary">
              Rwa<span className="text-brand-text">Sport</span>
            </p>
          </div>

          {/* The animation, directly above the fields. */}
          <SportBounce slugs={slugs} className="my-1" />

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-secondary">Please enter your details.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger/5 p-3"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-text" aria-hidden="true" />
              <p className="text-sm font-semibold text-danger-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Email or username" error={errors.username?.message} required>
              {(p) => (
                <Input
                  {...p}
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder="you@email.rw or username"
                />
              )}
            </Field>

            <Field label={t('auth.password', 'Password')} error={errors.password?.message} required>
              {(p) => (
                <Input
                  {...p}
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              )}
            </Field>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-badge border-hairline text-brand accent-brand focus:ring-brand"
                />
                Remember me
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                Forgot password
              </Link>
            </div>

            <Button type="submit" size="lg" block loading={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Don’t have an account?{' '}
            <Link to="/auth/team/register" className="font-bold text-brand-text underline-offset-4 hover:underline">
              Register your team
            </Link>
          </p>
        </div>
      </div>

      {/* ─── side panel — desktop only ─── */}
      <div className="relative hidden overflow-hidden bg-[#0F0F0F] lg:block">
        <img
          {...responsiveImage(HERO_BG, { sizes: '50vw' })}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md"
        />
        {/* The reference drops its hero photo to brightness(0.4). Without this much
            darkening the link cards sit on mid-tone grass and stop being readable. */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Green wash so the photo reads as ours rather than as stock. */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-bright/20 via-transparent to-black/70" />

        <div className="relative flex h-full flex-col justify-center gap-3 p-10 xl:p-14">
          <div className="mb-4 max-w-sm">
            <h2 className="text-2xl font-extrabold text-white">The home of Rwandan sport</h2>
            <p className="mt-2 text-sm text-white/60">
              Every league, every match, every athlete — from the national leagues to the Amashuri
              Games.
            </p>
          </div>

          {SIDE_LINKS.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-card border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 ease-standard hover:border-brand-bright/50 hover:bg-white/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-bright/15 text-brand-bright">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="block text-sm text-white/55">{desc}</span>
              </span>
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="shrink-0 text-white/30 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-bright"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
