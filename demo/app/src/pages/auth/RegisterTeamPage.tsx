import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, ChevronLeft, ChevronRight, Check, Trophy, ShieldCheck, ListChecks, BarChart3,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getSports } from '../../api/endpoints/sports';
import apiClient from '../../api/client';
import SportBounce from '../../components/shared/SportBounce';
import SportSlideshow from '../../components/shared/SportSlideshow';
import Seo from '../../components/shared/Seo';
import { useMotionSafe, DUR, EASE } from '../../lib/motion';
import { Button, Field, Input, Select, cn } from '../../components/ui';

const registerSchema = z.object({
  // Step 1 — manager
  fullName: z.string().min(3, 'auth.validation.full_name_min'),
  username: z.string().min(3, 'auth.validation.username_min'),
  email: z.string().email('auth.validation.email_invalid'),
  password: z.string().min(6, 'auth.validation.password_min'),
  phone: z.string().optional(),
  // Step 2 — club
  teamName: z.string().min(2, 'auth.validation.team_name_min'),
  shortName: z.string().optional(),
  sportId: z.string().min(1, 'auth.validation.sport_required'),
  city: z.string().min(2, 'auth.validation.city_required'),
  district: z.string().optional(),
  province: z.string().min(2, 'auth.validation.province_required'),
  homeVenue: z.string().optional(),
  foundedYear: z.string().optional(),
  registrationNo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  // Step 3 — officials
  presidentName: z.string().min(2, 'auth.validation.president_required'),
  presidentPhone: z.string().optional(),
  secretaryName: z.string().optional(),
  secretaryPhone: z.string().optional(),
});

// Labels are keys, resolved at render — see the indicator below.
const STEPS = [
  { n: 1, label: 'register.step_account' },
  { n: 2, label: 'register.step_club' },
  { n: 3, label: 'register.step_officials' },
];

/**
 * Step transition.
 *
 * Direction-aware: forward enters from the right and leaves to the left, Back
 * mirrors it. That says "you advanced" or "you went back" without anyone re-reading
 * the indicator.
 *
 * The outgoing step leaves fast (100ms) and the incoming one arrives with its rows
 * CASCADING rather than as a single block. That is what makes it read as a new page
 * being dealt out instead of a div being repositioned — the cascade is doing most of
 * the work here, not the slide. A slight scale on entry adds depth without the
 * queasiness of a real 3D flip.
 *
 * The whole sequence is ~430ms, deliberately over the 240ms transition budget: that
 * budget is for motion a user is WAITING on, and this fires from an explicit click
 * where a beat is the point. Every individual tween is still under 240ms, and the
 * lot collapses to nothing under prefers-reduced-motion.
 */
const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 56 : -56, opacity: 0, scale: 0.985 }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: EASE, staggerChildren: 0.028, delayChildren: 0.03 },
  },
  exit: (dir) => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.985,
    transition: { duration: 0.1, ease: EASE },
  }),
};

/** One row of a step. Inherits the stagger from stepVariants above. */
const rowVariants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.16, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

/**
 * A row wrapper, so each block of the form can cascade independently. Variant
 * propagation needs a real DOM node between the step container and the field — a
 * fragment would break the chain.
 */
const Row = ({ className, children }) => (
  <motion.div variants={rowVariants} className={className}>
    {children}
  </motion.div>
);

/** What registering actually gets a club — reassurance beside a long form. */
const BENEFITS = [
  { icon: ShieldCheck, text: 'register.benefit_verified' },
  { icon: ListChecks, text: 'register.benefit_roster' },
  { icon: BarChart3, text: 'register.benefit_standings' },
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
  // +1 forward, -1 back. Drives which way the step slides.
  const [dir, setDir] = useState(1);
  const safe = useMotionSafe();
  const formTop = useRef(null);
  const formRef = useRef(null);

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
    if (isValid) {
      setDir(1);
      setStep(step + 1);
    }
  };

  const goBack = (to) => {
    setDir(-1);
    setStep(to);
  };

  /**
   * A step change is a page change, so it has to behave like one.
   *
   * SCROLL: step 2 is tall enough to scroll. Advancing from the bottom of it would
   * otherwise drop you into the middle of step 3 with its heading off-screen.
   *
   * FOCUS: moving focus to the first control means keyboard users are not left at
   * the button they just pressed, and a screen reader announces the new field
   * instead of silently swapping the form underneath it.
   *
   * Both wait out the transition rather than fighting it — scrolling mid-slide looks
   * broken. `behavior: 'auto'` under reduced motion, since a smooth scroll is itself
   * motion.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      formTop.current?.scrollIntoView({ behavior: safe ? 'smooth' : 'auto', block: 'start' });
      formRef.current?.querySelector('input:not([type=hidden]), select')?.focus({ preventScroll: true });
      // ONE delay for both cases, not a shorter one under reduced motion.
      // AnimatePresence swaps asynchronously whether or not it animates, and a short
      // timer raced that commit — reduced-motion users silently lost focus
      // management, which is exactly who depends on it most. 340ms costs them
      // nothing perceptible and makes the behaviour identical either way.
    }, 340);
    return () => clearTimeout(timer);
    // Deliberately only on `step` — refiring on `safe` would yank focus mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
      setError(err.response?.data?.message || t('auth.register_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── success ─── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-pill bg-brand text-white shadow-brand">
            <Check size={30} strokeWidth={3} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-primary">{t('register.success_title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-secondary">
            {t('register.submitted_hint')}
          </p>
          <div className="mt-7">
            <Button to="/auth/login" size="lg" block>
              {t('register.go_to_sign_in')}
            </Button>
          </div>
          <p className="mt-3 text-sm text-tertiary">{t('register.auto_redirect')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <Seo title={t('register.title')} description={t('register.seo_description')} />

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
          <div className="flex items-center gap-2">
            <p className="font-display text-xl font-extrabold tracking-tight text-primary">
              Rwa<span className="text-brand-text">Sport</span>
            </p>
            {/* The same bouncing mark as sign-in, so the two front doors feel like one
                product. Sized down and set beside the wordmark rather than above the
                fields: this form is long, and 80px of decoration between the heading
                and the first input would push the work further down the page. */}
            <SportBounce
              slugs={(sports?.data ?? []).map((s) => s.slug).filter(Boolean)}
              size={20}
              className="h-8"
            />
          </div>

          <h1 ref={formTop} className="mt-5 scroll-mt-6 text-2xl font-extrabold text-primary">
            {t('register.title')}
          </h1>
          <p className="mt-1.5 text-sm text-secondary">{t('register.intro')}</p>

          {/* Step indicator. Labelled, not just numbered — three bare circles do not
              tell you what is still ahead. Completed steps carry a tick so progress
              is legible at a glance. */}
          <ol className="mt-7 flex items-center gap-2" aria-label={t('register.progress')}>
            {STEPS.map(({ n, label }, i) => {
              const done = step > n;
              const current = step === n;
              return (
                <React.Fragment key={n}>
                  {/* The connector FILLS rather than flipping colour, so the
                      indicator visibly tracks the same movement as the step. */}
                  {i > 0 && (
                    <span aria-hidden="true" className="relative h-0.5 flex-1 overflow-hidden rounded-pill bg-hairline">
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-pill bg-brand"
                        initial={false}
                        animate={{ width: step > i ? '100%' : '0%' }}
                        transition={{ duration: safe ? 0.28 : 0, ease: EASE }}
                      />
                    </span>
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
                      {t(label)}
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

          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="mt-6" noValidate>
            {/* `mode="wait"` because wizard steps must not overlap — two sets of form
                fields on top of each other would be unusable mid-transition. That
                makes the swap a sequence rather than a single tween, so each half is
                held short. */}
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={safe ? stepVariants : undefined}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: DUR.base, ease: EASE }}
                className="space-y-5"
              >
            {/* Step 1 — the manager's own account */}
            {step === 1 && (
              <>
                <Row className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('auth.full_name')} error={errors.fullName?.message && t(errors.fullName.message)} required>
                    {(p) => <Input {...p} {...register('fullName')} autoComplete="name" placeholder={t('register.ph_full_name')} />}
                  </Field>
                  <Field label={t('auth.username')} error={errors.username?.message && t(errors.username.message)} required>
                    {(p) => <Input {...p} {...register('username')} autoComplete="username" placeholder={t('register.ph_username')} />}
                  </Field>
                </Row>

                <Row>
                  <Field label={t('auth.email_address')} error={errors.email?.message && t(errors.email.message)} required>
                    {(p) => <Input {...p} {...register('email')} type="email" autoComplete="email" placeholder={t('register.ph_email')} />}
                  </Field>
                </Row>

                <Row className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('auth.password')} error={errors.password?.message && t(errors.password.message)} hint={t('register.hint_password')} required>
                    {(p) => <Input {...p} {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" />}
                  </Field>
                  <Field label={t('auth.phone_number')} error={errors.phone?.message && t(errors.phone.message)}>
                    {(p) => <Input {...p} {...register('phone')} type="tel" autoComplete="tel" placeholder={t('register.ph_phone')} />}
                  </Field>
                </Row>

                <Row>
                  <Button type="button" onClick={nextStep} size="lg" block icon={ChevronRight} iconRight>
                    {t('register.next_club')}
                  </Button>
                </Row>
              </>
            )}

            {/* Step 2 — the club */}
            {step === 2 && (
              <>
                <Row className="grid gap-5 sm:grid-cols-3">
                  <Field label={t('register.official_club_name')} error={errors.teamName?.message && t(errors.teamName.message)} required className="sm:col-span-2">
                    {(p) => <Input {...p} {...register('teamName')} placeholder={t('register.ph_club_name')} />}
                  </Field>
                  <Field label={t('register.short_name')} error={errors.shortName?.message && t(errors.shortName.message)} hint={t('register.hint_short_name')}>
                    {(p) => <Input {...p} {...register('shortName')} maxLength={10} placeholder={t('register.ph_short_name')} />}
                  </Field>
                </Row>

                <Row>
                  <Field label={t('auth.primary_sport')} error={errors.sportId?.message && t(errors.sportId.message)} required>
                  {(p) => (
                    <Select
                      {...p}
                      {...register('sportId')}
                      size="md"
                      placeholder={t('auth.select_sport')}
                      options={(sports?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
                    />
                    )}
                  </Field>
                </Row>

                <Row className="grid gap-5 sm:grid-cols-3">
                  <Field label={t('register.city_town')} error={errors.city?.message && t(errors.city.message)} required>
                    {(p) => <Input {...p} {...register('city')} placeholder={t('register.ph_city')} />}
                  </Field>
                  <Field label={t('register.district')} error={errors.district?.message && t(errors.district.message)}>
                    {(p) => <Input {...p} {...register('district')} placeholder={t('register.ph_district')} />}
                  </Field>
                  <Field label={t('auth.province')} error={errors.province?.message && t(errors.province.message)} required>
                    {(p) => <Input {...p} {...register('province')} placeholder={t('register.ph_province')} />}
                  </Field>
                </Row>

                <Row className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('register.home_venue')} error={errors.homeVenue?.message && t(errors.homeVenue.message)}>
                    {(p) => <Input {...p} {...register('homeVenue')} placeholder={t('register.ph_venue')} />}
                  </Field>
                  <Field label={t('register.founded_year')} error={errors.foundedYear?.message && t(errors.foundedYear.message)}>
                    {(p) => <Input {...p} {...register('foundedYear')} type="number" placeholder={t('register.ph_founded')} />}
                  </Field>
                </Row>

                <Row className="grid gap-5 sm:grid-cols-3">
                  <Field label={t('register.reg_number')} error={errors.registrationNo?.message && t(errors.registrationNo.message)} hint={t('register.hint_reg_no')}>
                    {(p) => <Input {...p} {...register('registrationNo')} placeholder={t('register.ph_reg_no')} />}
                  </Field>
                  {/* These two feed the club colour shown on crests and match rows. */}
                  <Field label={t('register.primary_colour')} error={errors.primaryColor?.message && t(errors.primaryColor.message)} hint={t('register.hint_kit_colour')}>
                    {(p) => <Input {...p} {...register('primaryColor')} placeholder={t('register.ph_primary_colour')} />}
                  </Field>
                  <Field label={t('register.secondary_colour')} error={errors.secondaryColor?.message && t(errors.secondaryColor.message)}>
                    {(p) => <Input {...p} {...register('secondaryColor')} placeholder={t('register.ph_secondary_colour')} />}
                  </Field>
                </Row>

                <Row className="flex gap-3">
                  <Button type="button" variant="secondary" size="lg" onClick={() => goBack(1)} className="flex-1">
                    {t('common.back')}
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="flex-[2]" icon={ChevronRight} iconRight>
                    {t('register.next_officials')}
                  </Button>
                </Row>
              </>
            )}

            {/* Step 3 — officials */}
            {step === 3 && (
              <>
                <Row>
                  <fieldset className="rounded-card border border-hairline bg-surface-2 p-4">
                  <legend className="px-1 text-sm font-bold text-primary">
                    {t('register.president')} <span className="font-medium text-danger-text">{t('register.required_suffix')}</span>
                  </legend>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <Field label={t('auth.full_name')} error={errors.presidentName?.message && t(errors.presidentName.message)} required>
                      {(p) => <Input {...p} {...register('presidentName')} placeholder={t('register.ph_president_name')} />}
                    </Field>
                    <Field label={t('register.phone')} error={errors.presidentPhone?.message && t(errors.presidentPhone.message)}>
                      {(p) => <Input {...p} {...register('presidentPhone')} type="tel" placeholder="+250 7…" />}
                    </Field>
                  </div>
                  </fieldset>
                </Row>

                <Row>
                  <fieldset className="rounded-card border border-hairline bg-surface-2 p-4">
                  <legend className="px-1 text-sm font-bold text-primary">
                    {t('register.secretary')} <span className="font-medium text-tertiary">{t('register.optional_suffix')}</span>
                  </legend>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <Field label={t('auth.full_name')} error={errors.secretaryName?.message && t(errors.secretaryName.message)}>
                      {(p) => <Input {...p} {...register('secretaryName')} placeholder={t('register.ph_secretary_name')} />}
                    </Field>
                    <Field label={t('register.phone')} error={errors.secretaryPhone?.message && t(errors.secretaryPhone.message)}>
                      {(p) => <Input {...p} {...register('secretaryPhone')} type="tel" placeholder="+250 7…" />}
                    </Field>
                  </div>
                  </fieldset>
                </Row>

                <Row className="flex gap-3">
                  <Button type="button" variant="secondary" size="lg" onClick={() => goBack(2)} className="flex-1">
                    {t('common.back')}
                  </Button>
                  <Button type="submit" size="lg" loading={isLoading} className="flex-[2]">
                    {isLoading ? t('register.submitting') : t('auth.submit_application')}
                  </Button>
                </Row>
              </>
            )}
              </motion.div>
            </AnimatePresence>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Already registered?{' '}
            <Link to="/auth/login" className="font-bold text-brand-text underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ─── side panel — desktop only ───────────────────────────────────
          A SLIDESHOW here rather than the single photograph sign-in uses. Someone
          registering a new club has no chosen sport yet — there is no "their" sport
          to show — so the panel cycles every sport on the platform instead, and the
          caption names each one as it passes. It doubles as a quiet inventory of what
          they are joining. */}
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
        <SportSlideshow sports={sports?.data ?? []} className="h-full bg-[#0F0F0F]">
          {(slide) => (
            <div className="flex h-full flex-col justify-end p-10 xl:p-14">
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Trophy size={12} aria-hidden="true" className="text-brand-bright" />
                {/* Follows the slide, so the label and the picture can never disagree. */}
                {slide.name} · Rwanda
              </p>
              <h2 className="max-w-md text-3xl font-extrabold leading-tight text-white">
                {t('register.panel_title')}
              </h2>

              {/* Three lines of reassurance. A twenty-one-field form is a big ask, and
                  this is the one place to answer "what do I actually get". */}
              <ul className="mt-5 space-y-2.5">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Icon size={16} className="mt-0.5 shrink-0 text-brand-bright" aria-hidden="true" />
                    {t(text)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SportSlideshow>
      </div>
    </div>
  );
};

export default RegisterTeamPage;
