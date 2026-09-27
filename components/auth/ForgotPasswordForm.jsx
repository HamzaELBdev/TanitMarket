"use client";
import { useEffect, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { forgotSchema } from '@/lib/authSchemas';
import FormField from './FormField';
import SubmitButton from './SubmitButton';
import { FormBanner } from './FormMessage';
import { useAuthForm } from './useAuthForm';

export default function ForgotPasswordForm({ email, onEmailChange, onBack, onBusyChange }) {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const [sentTo, setSentTo] = useState(null);
  const { form, status, banner, slow, run } = useAuthForm({
    schema: forgotSchema,
    defaultValues: { email },
    onBusyChange,
  });
  const { register, watch, formState: { errors } } = form;

  useEffect(() => {
    const sub = watch((v, { name }) => name === 'email' && onEmailChange(v.email));
    return () => sub.unsubscribe();
  }, [watch, onEmailChange]);

  const onSubmit = run(async ({ email: mail }) => {
    setSentTo(null);
    await resetPassword(mail);
    setSentTo(mail.trim());
    return { keepIdle: true };
  });

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-[#5b6157] leading-relaxed">{t('authForgotSub')}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          id="forgot-email"
          label={t('authEmailLabel')}
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="username email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('authEmailPlaceholder')}
          ltr
          error={errors.email?.message}
          {...register('email')}
        />
        <FormBanner tone="success" message={sentTo ? t('authForgotSent', { email: sentTo }) : null} />
        <FormBanner tone={banner?.tone} message={banner?.message} />
        <FormBanner tone="info" message={slow ? t('authSlowNetwork') : null} />
        <SubmitButton status={status} pendingLabel={t('authProcessing')} successLabel="">
          {t('authForgotSubmit')}
        </SubmitButton>
      </form>
      <div className="flex justify-center">
        <button type="button" onClick={onBack}
          className="min-h-11 px-2 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-forest cursor-pointer
            rounded-full hover:bg-[#f1f5ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('authBackToLogin')}
        </button>
      </div>
    </div>
  );
}
