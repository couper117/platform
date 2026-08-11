import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';
import { useMotionSafe, listStack, listItem, pressable, DUR, EASE } from '../../lib/motion';

/**
 * Contact.
 *
 * THE MOTION HERE IS MOSTLY FUNCTIONAL, per lib/motion: entrances give the page a
 * reading direction, and the send → sent swap answers "what just happened" — the
 * one question this screen actually raises. Everything in that group stays inside
 * the 240ms budget and runs off the shared listStack/listItem vocabulary rather
 * than bespoke timings, so it cannot drift from the rest of the product.
 *
 * ONE THING IS AMBIENT AND DECORATIVE: the wash behind the header drifts. That is
 * the same exemption SportBounce, the live pulse and the skeleton shimmer take —
 * it is a loop rather than a transition, nobody is waiting on it, and a header
 * with two lines of type in it is the kind of otherwise-empty space where
 * decoration is the point. It is slow enough (18s) to read as light moving rather
 * than as something demanding attention.
 *
 * The reveals are `whileInView` with `once: true`, not on-mount: on a phone the
 * form sits well below the fold, and animating it while unseen wastes the one
 * chance to draw the eye when it actually arrives.
 *
 * Every block gates on useMotionSafe — index.css stops CSS animation but Framer
 * drives transforms in JS and sails straight past it.
 */

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const info = [
  { icon: Mail, label: 'Email', value: 'info@rwasport.rw' },
  { icon: Phone, label: 'Phone', value: '+250 123 456 789' },
  { icon: MapPin, label: 'Address', value: 'Kigali, Rwanda' },
];

const ContactPage = () => {
  const safe = useMotionSafe();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await apiClient.post('/contacts', values);
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title="Contact" description="Get in touch with the RwaSport team." />

      <section className="bg-surface-dark py-16 sm:py-24 relative overflow-hidden">
        {/* The ambient one. A slow drift, so the header has some life in it without
            asking to be looked at. Loops rather than transitions — see the note above. */}
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-rwanda-blue/10 blur-[120px]"
          animate={safe ? { x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.12, 1] } : undefined}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <ResponsiveWrapper className="relative z-10 text-center space-y-3">
          <motion.h1
            initial={safe ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.slow, ease: EASE }}
            className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter"
          >
            Get In <span className="text-red">Touch</span>
          </motion.h1>
          <motion.p
            initial={safe ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE, delay: 0.08 }}
            className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]"
          >
            We'd love to hear from you
          </motion.p>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info. Staggered so the three cards read top-down rather than landing as
            one slab — the same 15ms cascade the fixture lists use. */}
        <motion.div
          variants={listStack(safe)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-4"
        >
          {info.map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              variants={listItem(safe)}
              {...(safe ? { whileHover: { y: -3 } } : {})}
              transition={{ duration: DUR.base, ease: EASE }}
              className="flex items-center gap-4 bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/5 rounded-2xl p-5"
            >
              <span className="w-11 h-11 rounded-full bg-red/10 text-red flex items-center justify-center shrink-0"><Icon size={18} /></span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={safe ? { opacity: 0, y: 12 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: DUR.slow, ease: EASE }}
          className="lg:col-span-2 bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/5 rounded-3xl p-6 sm:p-8"
        >
          {/* `mode="wait"` so the form is gone before the receipt arrives — the two
              states say contradictory things and must never be on screen together. */}
          <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div
              key="sent"
              initial={safe ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="py-16 flex flex-col items-center text-center gap-4"
            >
              {/* The confirmation gets the beat, because this is the moment the
                  whole page exists for. Same shape as scorePop. */}
              <motion.div
                initial={safe ? { scale: 0.5, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DUR.slow, ease: EASE, delay: 0.05 }}
              >
                <CheckCircle size={48} className="text-rwanda-green" />
              </motion.div>
              <h3 className="font-display text-2xl uppercase tracking-widest">Message sent</h3>
              <p className="opacity-60 max-w-sm">Thank you for reaching out — our team will get back to you shortly.</p>
              <button onClick={() => setSent(false)} className="mt-2 text-red font-display uppercase tracking-widest text-sm">Send another</button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={safe ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* The error has to announce itself — it appears far from where the
                  eye is (the button that was just pressed), so it slides rather
                  than blinking into place. */}
              <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={safe ? { opacity: 0, height: 0, marginBottom: 0 } : false}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: DUR.base, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="bg-red/10 border border-red/20 p-4 rounded-xl flex items-center gap-3 text-red text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={16} /> {serverError}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
              <motion.div
                variants={listStack(safe)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {/* The wrapper carries the cascade, not Field itself — Field forwards
                    its ref to the input for react-hook-form, and making it a motion
                    component would put the ref on the wrong element. */}
                <motion.div variants={listItem(safe)}>
                  <Field label="Name" error={errors.name} {...register('name')} placeholder="Your name" />
                </motion.div>
                <motion.div variants={listItem(safe)}>
                  <Field label="Email" error={errors.email} {...register('email')} placeholder="you@email.com" />
                </motion.div>
                <motion.div variants={listItem(safe)}>
                  <Field label="Phone" error={errors.phone} {...register('phone')} placeholder="+250 ..." />
                </motion.div>
                <motion.div variants={listItem(safe)}>
                  <Field label="Subject" error={errors.subject} {...register('subject')} placeholder="How can we help?" />
                </motion.div>
              </motion.div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Message</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder="Write your message..."
                  className={`w-full bg-surface-2 dark:bg-white/5 border ${errors.message ? 'border-red/50' : 'border-surface-3 dark:border-white/10'} p-4 rounded-xl focus:border-red outline-none transition-all`}
                />
                {errors.message && <p className="text-[10px] font-bold text-red uppercase tracking-widest ml-1">{String(errors.message.message ?? '')}</p>}
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                {...pressable(safe)}
                className="w-full bg-red text-white font-display text-lg uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Send Message</>}
              </motion.button>
            </motion.form>
          )}
          </AnimatePresence>
        </motion.div>
      </ResponsiveWrapper>
    </div>
  );
};

/**
 * The error message animates its own height so the field below does not jump when
 * one appears — with four fields in a two-column grid, an un-animated message
 * shifts everything under it in a single frame and the eye loses its place.
 *
 * forwardRef is given both generics: untyped, TypeScript reads the props as `{}`
 * and every call site fails on `label` and `error`, and the ref lands as
 * ForwardedRef<unknown> which the input rejects.
 */
type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** react-hook-form's FieldError, whose `message` is wider than string. */
  error?: { message?: unknown };
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(({ label, error, ...props }, ref) => {
  const safe = useMotionSafe();

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">{label}</label>
      <input
        ref={ref}
        {...props}
        aria-invalid={!!error}
        className={`w-full bg-surface-2 dark:bg-white/5 border ${error ? 'border-red/50' : 'border-surface-3 dark:border-white/10'} p-4 rounded-xl focus:border-red outline-none transition-all`}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={safe ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DUR.fast, ease: EASE }}
            className="overflow-hidden text-[10px] font-bold text-red uppercase tracking-widest ml-1"
          >
            {String(error.message ?? '')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
Field.displayName = 'Field';

export default ContactPage;
