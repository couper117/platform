import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import ResponsiveWrapper from '../../components/shared/ResponsiveWrapper';
import Seo from '../../components/shared/Seo';

const buildSchema = (t) => z.object({
  name: z.string().min(2, t('contact.validation.name')),
  email: z.string().email(t('contact.validation.email')).optional().or(z.literal('')),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, t('contact.validation.message')),
});

const ContactPage = () => {
  const { t, i18n } = useTranslation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const info = [
    { icon: Mail, label: t('footer.email'), value: 'info@rwasport.rw' },
    { icon: Phone, label: t('footer.phone'), value: '+250 123 456 789' },
    { icon: MapPin, label: t('footer.address'), value: 'Kigali, Rwanda' },
  ];

  const schema = React.useMemo(() => buildSchema(t), [t, i18n.language]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await apiClient.post('/contacts', values);
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err.response?.data?.message || t('contact.send_failed'));
    }
  };

  return (
    <div className="bg-surface-2 dark:bg-surface-dark min-h-screen pb-24">
      <Seo title={t('contact.seo_title')} description={t('contact.seo_desc')} />

      <section className="bg-surface-dark py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-rwanda-blue/10 blur-[120px]" />
        <ResponsiveWrapper className="relative z-10 text-center space-y-3">
          <h1 className="text-5xl sm:text-7xl font-display text-white uppercase tracking-tighter">{t('contact.title')} <span className="text-red">{t('contact.title_accent')}</span></h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">{t('contact.subtitle')}</p>
        </ResponsiveWrapper>
      </section>

      <ResponsiveWrapper className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="space-y-4">
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/5 rounded-2xl p-5">
              <span className="w-11 h-11 rounded-full bg-red/10 text-red flex items-center justify-center shrink-0"><Icon size={18} /></span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark2 border border-surface-3 dark:border-white/5 rounded-3xl p-6 sm:p-8">
          {sent ? (
            <div className="py-16 flex flex-col items-center text-center gap-4">
              <CheckCircle size={48} className="text-rwanda-green" />
              <h3 className="font-display text-2xl uppercase tracking-widest">{t('contact.sent_title')}</h3>
              <p className="opacity-60 max-w-sm">{t('contact.sent_body')}</p>
              <button onClick={() => setSent(false)} className="mt-2 text-red font-display uppercase tracking-widest text-sm">{t('contact.send_another')}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="bg-red/10 border border-red/20 p-4 rounded-xl flex items-center gap-3 text-red text-xs font-bold uppercase tracking-wider">
                  <AlertCircle size={16} /> {serverError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t('contact.name')} error={errors.name} {...register('name')} placeholder={t('contact.name_placeholder')} />
                <Field label={t('footer.email')} error={errors.email} {...register('email')} placeholder="you@email.com" />
                <Field label={t('footer.phone')} error={errors.phone} {...register('phone')} placeholder="+250 ..." />
                <Field label={t('contact.subject')} error={errors.subject} {...register('subject')} placeholder={t('contact.subject_placeholder')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">{t('contact.message')}</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder={t('contact.message_placeholder')}
                  className={`w-full bg-surface-2 dark:bg-white/5 border ${errors.message ? 'border-red/50' : 'border-surface-3 dark:border-white/10'} p-4 rounded-xl focus:border-red outline-none transition-all`}
                />
                {errors.message && <p className="text-[10px] font-bold text-red uppercase tracking-widest ml-1">{errors.message.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red text-white font-display text-lg uppercase tracking-widest py-4 rounded-xl hover:bg-red-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> {t('contact.send')}</>}
              </button>
            </form>
          )}
        </div>
      </ResponsiveWrapper>
    </div>
  );
};

const Field = React.forwardRef(({ label, error, ...props }, ref) => (
  <div className="space-y-2">
    <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">{label}</label>
    <input
      ref={ref}
      {...props}
      className={`w-full bg-surface-2 dark:bg-white/5 border ${error ? 'border-red/50' : 'border-surface-3 dark:border-white/10'} p-4 rounded-xl focus:border-red outline-none transition-all`}
    />
    {error && <p className="text-[10px] font-bold text-red uppercase tracking-widest ml-1">{error.message}</p>}
  </div>
));
Field.displayName = 'Field';

export default ContactPage;
