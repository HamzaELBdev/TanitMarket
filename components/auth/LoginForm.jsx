"use client";
import { useEffect } from 'react';
import { Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/lib/authSchemas';
import FormField from './FormField';
import PasswordField from './PasswordField';
import SubmitButton from './SubmitButton';
import GoogleAuthButton from './GoogleAuthButton';
import { FormBanner } from './FormMessage';
import { useAuthForm } from './useAuthForm';
import { OrDivider, SwitchPrompt } from './FormBits';
import LegalNotice from './LegalNotice';

export default function LoginForm({ email, onEmailChange, onSuccess, onForgot, onSwitch, google, busy, onBusyChange, notice }) {
  const { t } = useLanguage();
  const { loginWithEmail } = useAuth();
  const { form, status, banner, slow, run } = useAuthForm({
    schema: loginSchema,
    defaultValues: { email, password: '' },
    onBusyChange,
  });
  const { register, watch, formState: { errors } } = form;

  useEffect(() => {
    const sub = watch((v, { name }) => name === 'email' && onEmailChange(v.email));
    return () => sub.unsubscribe();
  }, [watch, onEmailChange]);

  const onSubmit = run(async ({ email: mail, password }) => {
    const res = await loginWithEmail(mail, password);
    onSuccess(res, 'login');
  });

  return (
    <div className="space-y-5">
      <GoogleAuthButton onClick={() => google.start()} pending={google.pending} disabled={busy && !google.pending} />
      <FormBanner tone={notice?.tone} message={notice?.message} />
      <OrDivider t={t} />

      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={banner ? 'login-banner' : undefined}>
        <FormField
          id="login-email"
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
        <div>
          <PasswordField
            id="login-password"
            label={t('authPasswordLabel')}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <button type="button" onClick={onForgot}
              className="min-h-11 -mb-2 px-1 text-sm font-semibold text-brand-forest underline underline-offset-4 decoration-[#a9b6a0]
                hover:decoration-brand-forest cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss">
              {t('authForgotPassword')}
            </button>
          </div>
        </div>

        <FormBanner id="login-banner" tone={banner?.tone} message={banner?.message} />
        <FormBanner tone="info" message={slow ? t('authSlowNetwork') : null} />

        <div className="pt-1">
          <SubmitButton status={status} pendingLabel={t('authProcessing')} successLabel={t('authRedirecting')}>
            {t('authLoginSubmit')}
          </SubmitButton>
        </div>
      </form>

      <SwitchPrompt question={t('authNoAccount')} action={t('authCreateAccountLink')} onClick={onSwitch} />
      <LegalNotice t={t} />
    </div>
  );
}
