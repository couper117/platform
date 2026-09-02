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
import useHeroRotation from '../../hooks/useHeroRotation';
import { HERO_SLIDES, heroSrc } from '../../config/heroMedia';
import SportBounce from '../../components/shared/SportBounce';
import Seo from '../../components/shared/Seo';
import { Button, Field, Input, cn } from '../../components/ui';

const loginSchema = z.object({
  username: z.string().min(3, 'authx.identifier_min'),
  password: z.string().min(6, 'auth.validation.password_min'),
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
 * THE PANEL IS A ROTATION, NOT ONE STILL. It used to show a single frame chosen
 * from the visitor's favourite sport — and in the demo dataset a sport's
 * `coverImage` is the generated abstract gradient, so the front door of the
 * platform opened on a coloured rectangle. It now cross-fades the same verified
 * Rwandan photography the homepage hero uses, from config/heroMedia, so there is
 * one curated set and one credits file rather than two.
 *
 * The visitor's chosen sport still decides where the rotation STARTS, so someone
 * who picked basketball is greeted by a court rather than a football pitch — the
 * preference is honoured without costing the panel its variety.
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
      setError(err.response?.data?.message || t('authx.invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  // Cycles the ball through the sports that actually exist on this platform.
  // Same key as the header, so it is usually already cached.
  const { data: sportsRes } = useQuery({ queryKey: ['nav-sports'], queryFn: getSports, staleTime: 300000 });
  const sports = sportsRes?.data ?? [];
  const slugs = sports.map((s) => s.slug).filter(Boolean);

  // The rotation opens on the visitor's own sport when that sport has a photograph
  // in the set, and on the first slide otherwise.
  const { slug: favourite } = useFavouriteSport();
  const slides = React.useMemo(() => {
    const at = HERO_SLIDES.findIndex((slide) => slide.id === favourite);
    return at > 0 ? [...HERO_SLIDES.slice(at), ...HERO_SLIDES.slice(0, at)] : HERO_SLIDES;
  }, [favourite]);
  const { index: shown, still } = useHeroRotation(slides.length);
  const current = slides[shown];

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
            <h1 className="text-2xl font-extrabold text-primary">{t('authx.welcome_back')}</h1>
            <p className="mt-1 text-sm text-secondary">{t('authx.enter_details')}</p>
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
            <Field
              label={t('authx.email_or_username')}
              error={errors.username?.message && t(errors.username.message as string)}
              required
            >
              {(p) => (
                <Input
                  {...p}
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder={t('authx.identifier_placeholder')}
                />
              )}
            </Field>

            <Field
              label={t('auth.password', 'Password')}
              error={errors.password?.message && t(errors.password.message as string)}
              required
            >
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
                {t('authx.remember_me')}
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                {t('authx.forgot_password')}
              </Link>
            </div>

            <Button type="submit" size="lg" block loading={isLoading}>
              {isLoading ? t('authx.signing_in') : t('authx.sign_in')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            {t('auth.no_account')}{' '}
            <Link to="/auth/team/register" className="font-bold text-brand-text underline-offset-4 hover:underline">
              {t('auth.register_now')}
            </Link>
          </p>
        </div>
      </div>

      {/* ─── side panel — a cross-fading photograph, desktop only ─────────
          The four link cards that were here are gone. Every one of them already
          existed in the header and the bottom nav, and on a sign-in screen they
          pulled against the only thing the visitor came to do. A photograph sells
          the product without competing with the form.

          NOT A VIDEO, and the reason is bytes. A background loop is 1–5MB against
          roughly 70KB for a still, and without real Rwandan match footage it would
          only ever be generic stock. The cinematic feel comes from `slowZoom 20s`
          over the photograph plus a 900ms cross-fade between them — most of the
          motion for a fraction of the payload. Worth revisiting the moment
          MINISPORTS supplies actual footage. */}
      <div className="relative hidden overflow-hidden bg-[#0F0F0F] lg:block">
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={heroSrc(s)}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            // lowercase: React 18 does not recognise the camelCase form
            fetchpriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              'transition-opacity duration-[900ms] ease-standard motion-reduce:transition-none',
              i === shown ? 'opacity-100' : 'opacity-0',
              // Ken Burns on the visible frame only. Ambient, so exempt from the
              // 240ms transition budget, and neutralised by the global
              // prefers-reduced-motion rule in index.css.
              i === shown && 'animate-slow-zoom'
            )}
          />
        ))}

        {/* Scrim: heavy only where the caption sits, and clear above it.
            An earlier version put 40% black over the TOP of the frame, which
            crushed a bright sky to a slab and read as a failed image. The caption
            needs contrast at the BOTTOM; the rest should just be the photograph.

            IT IS HEAVIER NOW THAN THE HOMEPAGE HERO'S, because this panel is tall
            and narrow rather than wide. The same 40% midpoint sat two-thirds of the
            way up a 900px column, so on a bright frame — the stadium signage behind
            the football shot — the sub-copy fell to roughly 2:1 against its
            background. The break moves down and the floor goes darker; the top two
            thirds of the picture are untouched. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-45% to-transparent" />
        {/* Green wash, so the photo reads as ours rather than as stock. */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-bright/15 via-transparent to-transparent" />

        {/* One lockup, bottom-left. An empty photo panel looks unfinished; a single
            caption anchors it without turning it back into a menu. The eyebrow names
            whichever photograph is showing, so it stays true as the stack turns. */}
        <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
          <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-pill bg-brand-bright" />
            {current ? t(current.labelKey) : 'Rwanda · MINISPORTS'}
          </p>
          <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white">
            The home of Rwandan sport
          </h2>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Every league, every match, every athlete — from the national leagues to the Amashuri
            Games.
          </p>

          {/* CREDIT IS NOT OPTIONAL. These are the homepage's photographs and most
              are CC BY-SA, which requires attribution wherever they are shown —
              including here. It disappears on its own once heroMedia sets
              `credit: null` for MINISPORTS' own photography. */}
          <div className="mt-6 flex items-center justify-between gap-4">
            {!still && (
              <div className="flex gap-1.5" aria-hidden="true">
                {slides.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      'h-0.5 w-5 rounded-pill transition-colors duration-300 ease-standard',
                      i === shown ? 'bg-white' : 'bg-white/30'
                    )}
                  />
                ))}
              </div>
            )}
            {current?.credit && (
              <span className="ml-auto text-[11px] font-normal text-white/45">
                {t('explore.photo_credit', { author: current.credit })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
