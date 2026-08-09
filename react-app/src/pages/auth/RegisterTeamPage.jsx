import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, ChevronLeft, ChevronRight, Check, Trophy, ShieldCheck, ListChecks, BarChart3,
} from 'lucide-react';
import { getSports } from '../../api/endpoints/sports';
import apiClient from '../../api/client';
import useFavouriteSport from '../../hooks/useFavouriteSport';
import { sportTheme } from '../../config/sportThemes';
import responsiveImage from '../../utils/responsiveImage';
import Seo from '../../components/shared/Seo';
import { Button, Field, Input, Select, cn } from '../../components/ui';

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

const STEPS = [
  { n: 1, label: 'Your account' },
  { n: 2, label: 'Club details' },
  { n: 3, label: 'Officials' },
];

/** What registering actually gets a club — reassurance beside a long form. */
const BENEFITS = [
  { icon: ShieldCheck, text: 'Verified status in official federation leagues' },
  { icon: ListChecks, text: 'Manage your roster and player documents' },
  { icon: BarChart3, text: 'Appear in national standings and match centres' },
];

/**
 * Club registration — the same split screen as sign-in.
 *
 *   left   a three-step form in a narrow column
 *   right  the sport photograph, desktop only
 *
 * WHY THE WIZARD SURVIVES. Twenty-one fields on one page is a wall; three steps of
 * seven is a task. The steps also gate validation — `trigger` checks only the
 * current group, so someone is never told about a club field while filling in their
 * own name.
 *
 * The left column scrolls and the panel is sticky at full height, so a long step
 * never drags the photograph out of view.
 */
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

  // Same panel photograph as sign-in, following the visitor's chosen sport.
  const { slug: favourite } = useFavouriteSport();
  const favSport = (sports?.data ?? []).find((s) => s.slug === favourite);
  const panelImage = favSport?.coverImage || sportTheme(favourite).bg;

  /* ─── success ─── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-pill bg-brand text-white shadow-brand">
            <Check size={30} strokeWidth={3} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-primary">Application submitted</h1>
          <p className="mt-3 text-base leading-relaxed text-secondary">
            Your club registration has been received. The federation will review your application
            and documents, and you’ll get an email once it’s approved.
          </p>
          <div className="mt-7">
            <Button to="/auth/login" size="lg" block>
              Go to sign in
            </Button>
          </div>
          <p className="mt-3 text-sm text-tertiary">Taking you there automatically…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <Seo title="Register your club" description="Register your club with its federation on RwaSport." />

      {/* ─── form ─── */}
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:min-h-0">
        <Link
          to="/auth/login"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-secondary transition-colors hover:text-brand-text"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('common.back', 'Back to sign in')}
        </Link>

        <div className="mx-auto w-full max-w-lg flex-1 py-8">
          <p className="font-display text-xl font-extrabold tracking-tight text-primary">
            Rwa<span className="text-brand-text">Sport</span>
          </p>

          <h1 className="mt-6 text-2xl font-extrabold text-primary">Register your club</h1>
          <p className="mt-1.5 text-sm text-secondary">
            Three short steps. The federation reviews every application before a club joins a
            league.
          </p>

          {/* Step indicator. Labelled, not just numbered — three bare circles do not
              tell you what is still ahead. Completed steps carry a tick so progress
              is legible at a glance. */}
          <ol className="mt-7 flex items-center gap-2" aria-label="Progress">
            {STEPS.map(({ n, label }, i) => {
              const done = step > n;
              const current = step === n;
              return (
                <React.Fragment key={n}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn('h-0.5 flex-1 rounded-pill', step > i ? 'bg-brand' : 'bg-hairline')}
                    />
                  )}
                  <li
                    aria-current={current ? 'step' : undefined}
                    className="flex shrink-0 items-center gap-2"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-pill text-xs font-bold',
                        done && 'bg-brand text-white',
                        current && 'bg-brand text-white shadow-brand',
                        !done && !current && 'border border-hairline text-tertiary'
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : n}
                    </span>
                    <span
                      className={cn(
                        'hidden text-sm font-semibold sm:block',
                        current ? 'text-primary' : 'text-tertiary'
                      )}
                    >
                      {label}
                    </span>
                  </li>
                </React.Fragment>
              );
            })}
          </ol>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger/5 p-3"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger-text" aria-hidden="true" />
              <p className="text-sm font-semibold text-danger-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
            {/* Step 1 — the manager's own account */}
            {step === 1 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" error={errors.fullName?.message} required>
                    {(p) => <Input {...p} {...register('fullName')} autoComplete="name" placeholder="Jean Bosco Habimana" />}
                  </Field>
                  <Field label="Username" error={errors.username?.message} required>
                    {(p) => <Input {...p} {...register('username')} autoComplete="username" placeholder="jbosco" />}
                  </Field>
                </div>

                <Field label="Email address" error={errors.email?.message} required>
                  {(p) => <Input {...p} {...register('email')} type="email" autoComplete="email" placeholder="you@example.rw" />}
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Password" error={errors.password?.message} hint="At least 6 characters" required>
                    {(p) => <Input {...p} {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" />}
                  </Field>
                  <Field label="Phone number" error={errors.phone?.message}>
                    {(p) => <Input {...p} {...register('phone')} type="tel" autoComplete="tel" placeholder="+250 7…" />}
                  </Field>
                </div>

                <Button type="button" onClick={nextStep} size="lg" block icon={ChevronRight} iconRight>
                  Next: club details
                </Button>
              </>
            )}

            {/* Step 2 — the club */}
            {step === 2 && (
              <>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Official club name" error={errors.teamName?.message} required className="sm:col-span-2">
                    {(p) => <Input {...p} {...register('teamName')} placeholder="e.g. Kigali Tigers FC" />}
                  </Field>
                  <Field label="Short name" error={errors.shortName?.message} hint="Max 10">
                    {(p) => <Input {...p} {...register('shortName')} maxLength={10} placeholder="KTG" />}
                  </Field>
                </div>

                <Field label="Primary sport" error={errors.sportId?.message} required>
                  {(p) => (
                    <Select
                      {...p}
                      {...register('sportId')}
                      size="md"
                      placeholder="Select a sport"
                      options={(sports?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
                    />
                  )}
                </Field>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="City / town" error={errors.city?.message} required>
                    {(p) => <Input {...p} {...register('city')} placeholder="Kigali" />}
                  </Field>
                  <Field label="District" error={errors.district?.message}>
                    {(p) => <Input {...p} {...register('district')} placeholder="Nyarugenge" />}
                  </Field>
                  <Field label="Province" error={errors.province?.message} required>
                    {(p) => <Input {...p} {...register('province')} placeholder="Kigali City" />}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Home venue" error={errors.homeVenue?.message}>
                    {(p) => <Input {...p} {...register('homeVenue')} placeholder="Amahoro Stadium" />}
                  </Field>
                  <Field label="Year founded" error={errors.foundedYear?.message}>
                    {(p) => <Input {...p} {...register('foundedYear')} type="number" placeholder="1998" />}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Reg. number" error={errors.registrationNo?.message} hint="RGB / federation">
                    {(p) => <Input {...p} {...register('registrationNo')} placeholder="RGB/…" />}
                  </Field>
                  {/* These two feed the club colour shown on crests and match rows. */}
                  <Field label="Primary colour" error={errors.primaryColor?.message} hint="Kit colour">
                    {(p) => <Input {...p} {...register('primaryColor')} placeholder="Blue" />}
                  </Field>
                  <Field label="Secondary colour" error={errors.secondaryColor?.message}>
                    {(p) => <Input {...p} {...register('secondaryColor')} placeholder="White" />}
                  </Field>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="flex-[2]" icon={ChevronRight} iconRight>
                    Next: officials
                  </Button>
                </div>
              </>
            )}

            {/* Step 3 — officials */}
            {step === 3 && (
              <>
                <fieldset className="rounded-card border border-hairline bg-surface-2 p-4">
                  <legend className="px-1 text-sm font-bold text-primary">
                    President <span className="font-medium text-danger-text">· required</span>
                  </legend>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" error={errors.presidentName?.message} required>
                      {(p) => <Input {...p} {...register('presidentName')} placeholder="President's name" />}
                    </Field>
                    <Field label="Phone" error={errors.presidentPhone?.message}>
                      {(p) => <Input {...p} {...register('presidentPhone')} type="tel" placeholder="+250 7…" />}
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="rounded-card border border-hairline bg-surface-2 p-4">
                  <legend className="px-1 text-sm font-bold text-primary">
                    Secretary <span className="font-medium text-tertiary">· optional</span>
                  </legend>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" error={errors.secretaryName?.message}>
                      {(p) => <Input {...p} {...register('secretaryName')} placeholder="Secretary's name" />}
                    </Field>
                    <Field label="Phone" error={errors.secretaryPhone?.message}>
                      {(p) => <Input {...p} {...register('secretaryPhone')} type="tel" placeholder="+250 7…" />}
                    </Field>
                  </div>
                </fieldset>

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" size="lg" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" size="lg" loading={isLoading} className="flex-[2]">
                    {isLoading ? 'Submitting…' : 'Submit application'}
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Already registered?{' '}
            <Link to="/auth/login" className="font-bold text-brand-text underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ─── side panel — desktop only ─── */}
      <div className="relative hidden overflow-hidden bg-[#0F0F0F] lg:sticky lg:top-0 lg:block lg:h-screen">
        <img
          {...responsiveImage(panelImage, { sizes: '45vw' })}
          alt=""
          loading="eager"
          // lowercase: React 18 does not recognise the camelCase form
          fetchpriority="low"
          className="absolute inset-0 h-full w-full animate-slow-zoom object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-bright/15 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
          <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Trophy size={12} aria-hidden="true" className="text-brand-bright" />
            Official club registration
          </p>
          <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white">
            Join an official league
          </h2>

          {/* Three lines of reassurance. A twenty-one-field form is a big ask, and
              this is the one place to answer "what do I actually get". */}
          <ul className="mt-5 space-y-2.5">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-white/75">
                <Icon size={16} className="mt-0.5 shrink-0 text-brand-bright" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterTeamPage;
