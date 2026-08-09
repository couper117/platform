import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';
import { roleHome } from '../../utils/roleHome';
import { getSports } from '../../api/endpoints/sports';
import useFavouriteSport from '../../hooks/useFavouriteSport';
import { sportTheme } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import SportBounce from '../../components/shared/SportBounce';
import Seo from '../../components/shared/Seo';
import { Button, Field, Input, cn } from '../../components/ui';

const loginSchema = z.object({
  username: z.string().min(3, 'Enter your email or username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Split-screen sign-in.
 *
 *   left   the form, on a white panel, in a narrow centred column
 *   right  a full-bleed sport photograph with a single caption
 *
 * THE RIGHT PANEL IS DESKTOP-ONLY. At 360px it would either push the form below
 * the fold or shrink it to nothing, and the form is the reason anyone is here.
 *
 * The photograph follows the visitor's chosen sport, so someone who picked
 * basketball is greeted by a court rather than a football pitch. It is the same
 * preference the landing route uses, so the two never disagree.
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
  const sports = sportsRes?.data ?? [];
  const slugs = sports.map((s) => s.slug).filter(Boolean);

  // The panel shows the visitor's own sport. Prefers the DB cover image, so a real
  // MINISPORTS photograph replaces the stock backdrop the moment one is uploaded.
  const { slug: favourite } = useFavouriteSport();
  const favSport = sports.find((s) => s.slug === favourite);
  const panelImage = favSport?.coverImage || sportTheme(favourite).bg;
  const panelLabel = favSport?.name ? `${favSport.name} · Rwanda` : 'Rwanda · MINISPORTS';

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

      {/* ─── side panel — a photograph, desktop only ───────────────────────
          The four link cards that were here are gone. Every one of them already
          existed in the header and the bottom nav, and on a sign-in screen they
          pulled against the only thing the visitor came to do. A photograph sells
          the product without competing with the form.

          NOT A VIDEO, and the reason is bytes. A background loop is 1–5MB against
          roughly 70KB for this still, and without real Rwandan match footage it
          would only ever be generic stock. The reference gets its cinematic feel
          from `slowZoom 20s` on a photo, which is what happens here — most of the
          motion for a fraction of the payload. Worth revisiting the moment
          MINISPORTS supplies actual footage. */}
      <div className="relative hidden overflow-hidden bg-[#0F0F0F] lg:block">
        <img
          {...responsiveImage(panelImage, { sizes: '50vw' })}
          alt=""
          loading="eager"
          // lowercase: React 18 does not recognise the camelCase form
          fetchpriority="low"
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            // Ken Burns. Ambient, so exempt from the 240ms transition budget, and
            // motion-safe because it is a CSS animation — the global
            // prefers-reduced-motion rule in index.css neutralises it.
            'animate-slow-zoom'
          )}
        />

        {/* Scrim: heavy only where the caption sits, and clear above it.
            This was `from-black/85 via-black/25 to-black/40`, which put 40% black
            over the top of the frame. On a photo whose top half measures luminance
            61 that crushed it to solid black and read as a failed image — the photo
            had loaded fine all along. The caption needs contrast at the BOTTOM; the
            rest of the frame should just be the photograph. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 via-40% to-transparent" />
        {/* Green wash, so the photo reads as ours rather than as stock. */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-bright/15 via-transparent to-transparent" />

        {/* One lockup, bottom-left. An empty photo panel looks unfinished; a single
            caption anchors it without turning it back into a menu. */}
        <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
          <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-pill bg-brand-bright" />
            {panelLabel}
          </p>
          <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white">
            The home of Rwandan sport
          </h2>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Every league, every match, every athlete — from the national leagues to the Amashuri
            Games.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
