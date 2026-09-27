"use client";
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Mail, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { signupSchema } from '@/lib/authSchemas';
import FormField from './FormField';
import PasswordField from './PasswordField';
import AccountTypeSelector from './AccountTypeSelector';
import SubmitButton from './SubmitButton';
import GoogleAuthButton from './GoogleAuthButton';
import { FormBanner } from './FormMessage';
import { useAuthForm } from './useAuthForm';
import { OrDivider, SwitchPrompt } from './FormBits';
import LegalNotice from './LegalNotice';

export default function SignupForm({ email, onEmailChange, onSuccess, onSwitch, google, busy, onBusyChange, notice }) {
  const { t } = useLanguage();
  const { signupWithEmail } = useAuth();
  const { form, status, banner, slow, run } = useAuthForm({
    schema: signupSchema,
    defaultValues: { name: '', role: 'Particulier', email, password: '' },
    onBusyChange,
  });
  const { register, control, watch, getValues, formState: { errors } } = form;

  useEffect(() => {
    const sub = watch((v, { name }) => name === 'email' && onEmailChange(v.email));
    return () => sub.unsubscribe();
  }, [watch, onEmailChange]);

  const onSubmit = run(async ({ name, role, email: mail, password }) => {
    const res = await signupWithEmail(mail, password, name, role);
    onSuccess(res, 'signup');
  });

  return (
    <div className="space-y-5">
      <GoogleAuthButton onClick={() => google.start({ role: getValues('role') })} pending={google.pending}
        disabled={busy && !google.pending} />
      <FormBanner tone={notice?.tone} message={notice?.message} />
      <OrDivider t={t} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          id="signup-name"
          label={t('authFullName')}
          required
          icon={User}
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder={t('authNamePlaceholder')}
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          control={control}
          name="role"
          render={({ field }) => <AccountTypeSelector value={field.value} onChange={field.onChange} name={field.name} />}
        />

        <FormField
          id="signup-email"
          label={t('authEmailLabel')}
          required
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder={t('authEmailPlaceholder')}
          ltr
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          id="signup-password"
          label={t('authPasswordLabel')}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          hint={t('authMinChars')}
          error={errors.password?.message}
          {...register('password')}
        />

        <FormBanner tone={banner?.tone} message={banner?.message} />
        <FormBanner tone="info" message={slow ? t('authSlowNetwork') : null} />

        <div className="pt-1">
          <SubmitButton status={status} pendingLabel={t('authProcessing')} successLabel={t('authSignupRedirecting')}>
            {t('authSignupSubmit')}
          </SubmitButton>
        </div>
      </form>

      <SwitchPrompt question={t('authAlreadyMember')} action={t('authSignInLink')} onClick={onSwitch} />
      <LegalNotice t={t} signup />
    </div>
  );
}
