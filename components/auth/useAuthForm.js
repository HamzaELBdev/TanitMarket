"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/context/LanguageContext';
import { describeAuthError } from '@/lib/authErrors';

const SLOW_AFTER_MS = 8000;

/**
 * Shared form plumbing for the auth views:
 * - react-hook-form + zod (messages in the current language; focus goes to
 *   the first invalid field on submit),
 * - one request at a time (ref guard — Enter spam or double clicks can't
 *   fire a second call), status idle → pending → success,
 * - server errors mapped onto the relevant field (focused) or a banner,
 * - a "taking longer than expected" hint for slow networks.
 * Passwords only ever live in react-hook-form's in-memory state.
 */
export function useAuthForm({ schema, defaultValues, onBusyChange }) {
  const { t, lang } = useLanguage();
  // Rebuilt when the language changes so new messages are translated.
  const resolver = useMemo(() => zodResolver(schema(t)), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const form = useForm({ resolver, defaultValues, mode: 'onSubmit', reValidateMode: 'onChange', shouldFocusError: true });
  const [status, setStatus] = useState('idle');
  const [banner, setBanner] = useState(null); // { tone, message }
  const [slow, setSlow] = useState(false);
  const busy = useRef(false);

  // Re-translate client-side validation errors after a language switch.
  useEffect(() => {
    const fields = Object.entries(form.formState.errors)
      .filter(([, e]) => e?.type !== 'server')
      .map(([name]) => name);
    if (fields.length) form.trigger(fields);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== 'pending') {
      setSlow(false);
      return undefined;
    }
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [status]);

  const run = useCallback(
    (action) =>
      form.handleSubmit(async (values) => {
        if (busy.current) return;
        busy.current = true;
        setBanner(null);
        setStatus('pending');
        onBusyChange?.(true);
        try {
          const outcome = await action(values);
          // Success: stay locked (the screen redirects); `outcome.keepIdle`
          // lets a view (forgot password) return to idle after showing a notice.
          if (outcome?.keepIdle) {
            busy.current = false;
            setStatus('idle');
            onBusyChange?.(false);
          } else {
            setStatus('success');
          }
        } catch (err) {
          const { key, field } = describeAuthError(err);
          const message = t(key);
          if (field && field in values) {
            form.setError(field, { type: 'server', message }, { shouldFocus: true });
          } else {
            setBanner({ tone: 'error', message });
          }
          busy.current = false;
          setStatus('idle');
          onBusyChange?.(false);
        }
      }),
    [form, onBusyChange, t]
  );

  return { form, status, banner, setBanner, slow, run };
}
