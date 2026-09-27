import { z } from 'zod';

// Mirrors what Firebase Auth enforces server-side: a valid e-mail and the
// default password policy (at least 6 characters). The 2-character name
// minimum is the existing client rule. Don't tighten these to match mockup
// copy — the server is the source of truth.
export const PASSWORD_MIN = 6;
export const NAME_MIN = 2;

export const ACCOUNT_TYPES = ['Particulier', 'Boutique Pro'];

const email = (t) =>
  z
    .string()
    .trim()
    .min(1, t('authErrEmailRequired'))
    .pipe(z.email(t('authErrEmailInvalid')));

export const loginSchema = (t) =>
  z.object({
    email: email(t),
    password: z.string().min(1, t('authErrPasswordRequired')),
  });

export const signupSchema = (t) =>
  z.object({
    name: z.string().trim().min(NAME_MIN, t('authInvalidNameMsg')),
    role: z.enum(ACCOUNT_TYPES),
    email: email(t),
    password: z.string().min(1, t('authErrPasswordRequired')).min(PASSWORD_MIN, t('authShortPasswordMsg')),
  });

export const forgotSchema = (t) => z.object({ email: email(t) });
