"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { showToast } from '@/lib/swal';
import { describeAuthError, isPopupCancellation } from '@/lib/authErrors';
import { redirectTarget, SUCCESS_REDIRECT_DELAY_MS } from '@/lib/authConfig';
import { viewVariants } from '@/lib/authMotion';
import AuthLayout from './AuthLayout';
import AuthLogo from './AuthLogo';
import AuthLanguageSwitch from './AuthLanguageSwitch';
import AuthNavigation from './AuthNavigation';
import AnimatedHeight from './AnimatedHeight';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const MODES = ['login', 'signup', 'forgot'];
const ORDER = { forgot: -1, login: 0, signup: 1 };

const HEADINGS = {
  login: { title: 'authWelcomeBack', sub: 'authLoginSub' },
  signup: { title: 'authCreateAccountTitle', sub: 'authSignupSub' },
  forgot: { title: 'authForgotHeading', sub: null },
};

function readModeFromUrl() {
  if (typeof window === 'undefined') return 'login';
  const m = new URLSearchParams(window.location.search).get('mode');
  return MODES.includes(m) ? m : 'login';
}

/**
 * /auth orchestrator. Mode lives in ?mode=login|signup|forgot (shareable,
 * back button friendly via replaceState). The server-rendered default is the
 * login view; a deep link switches after mount without animation.
 */
export default function AuthScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isAdmin, loading: authLoading, loginWithGoogle, logout } = useAuth();

  const [mode, setMode] = useState('login');
  const [dir, setDir] = useState(1);
  const [email, setEmail] = useState(''); // carried across views; never the password
  const [busy, setBusy] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(null);
  const [animate, setAnimate] = useState(false);
  const signedInHere = useRef(false); // set when auth succeeded on this page
  const redirectTimer = useRef(null);

  useEffect(() => {
    setMode(readModeFromUrl());
    // Enable view transitions only after the first paint so a deep link
    // (?mode=signup) doesn't animate in.
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const changeMode = useCallback(
    (next) => {
      if (busy || next === mode) return;
      setDir(ORDER[next] > ORDER[mode] ? 1 : -1);
      setMode(next);
      setGoogleNotice(null);
      const url = new URL(window.location.href);
      if (next === 'login') url.searchParams.delete('mode');
      else url.searchParams.set('mode', next);
      window.history.replaceState(window.history.state, '', url);
    },
    [busy, mode]
  );

  // Navigate only once Firebase confirmed the session (the auth call resolved).
  const onSuccess = useCallback(
    (res, kind) => {
      signedInHere.current = true;
      showToast(t(kind === 'signup' ? 'authSignupSuccessToast' : kind === 'google' ? 'authGoogleSuccess' : 'authLoginSuccessToast'));
      redirectTimer.current = setTimeout(() => router.replace(redirectTarget(res?.isAdmin)), SUCCESS_REDIRECT_DELAY_MS);
    },
    [router, t]
  );

  // Already signed in when arriving on /auth: same behaviour as before —
  // short notice, then off to the profile (or dashboard for admins).
  useEffect(() => {
    // `busy`: a sign-in on this page is in flight — onAuthStateChanged can
    // fire before it resolves; that flow handles its own redirect.
    if (authLoading || !user || signedInHere.current || busy) return undefined;
    showToast(isAdmin ? t('authWelcomeAdmin', { name: user.displayName || user.email }) : t('authConnectedAs', { name: user.displayName || user.email }));
    const id = setTimeout(() => router.push(redirectTarget(isAdmin)), isAdmin ? 600 : 800);
    return () => clearTimeout(id);
  }, [user, isAdmin, authLoading, busy, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const google = {
    pending: googlePending,
    start: async ({ role } = {}) => {
      if (busy) return;
      setBusy(true);
      setGooglePending(true);
      setGoogleNotice(null);
      try {
        const res = await loginWithGoogle({ role });
        onSuccess(res, 'google');
      } catch (err) {
        setGoogleNotice(
          isPopupCancellation(err)
            ? { tone: 'info', message: t('authGoogleCancelled') }
            : { tone: 'error', message: t(describeAuthError(err).key) }
        );
        setBusy(false);
      } finally {
        setGooglePending(false);
      }
    },
  };

  const heading = HEADINGS[mode];
  const shared = { email, onEmailChange: setEmail, onBusyChange: setBusy, busy };

  let view;
  if (mode === 'signup') {
    view = <SignupForm {...shared} onSuccess={onSuccess} onSwitch={() => changeMode('login')} google={google} notice={googleNotice} />;
  } else if (mode === 'forgot') {
    view = <ForgotPasswordForm {...shared} onBack={() => changeMode('login')} />;
  } else {
    view = (
      <LoginForm {...shared} onSuccess={onSuccess} onForgot={() => changeMode('forgot')} onSwitch={() => changeMode('signup')}
        google={google} notice={googleNotice} />
    );
  }

  const showSessionCard = user && !authLoading && !busy && !signedInHere.current;

  return (
    <AuthLayout>
      <section className="relative isolate flex flex-col px-5 pt-6 pb-10 sm:px-10 sm:py-10 lg:px-12 xl:px-16 lg:py-12">
        {/* Soft decorative wave at the bottom of the mobile card */}
        <svg className="lg:hidden pointer-events-none -z-10 absolute inset-x-0 bottom-0 w-full h-16 text-brand-mint" viewBox="0 0 400 64"
          preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40c60-26 120-30 190-12s140 20 210-8v44H0z" fill="currentColor" opacity="0.7" />
        </svg>
        {/* Compact header (mobile / tablet) */}
        <div className="lg:hidden auth-rise space-y-3 mb-6" style={{ '--auth-i': 0 }}>
          <div className="flex items-center justify-between gap-3 -mt-2">
            <Link href="/" className="inline-flex items-center gap-2 min-h-11 text-sm font-medium text-[#3c4238] hover:text-brand-forest
              rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss">
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
              {t('authBackHome')}
            </Link>
            <AuthLanguageSwitch />
          </div>
          <AuthLogo size="sm" tone="light" tagline={t('authBrandTagline')} />
        </div>

        <div className="hidden lg:flex justify-end -mt-4 -me-3 mb-4 auth-rise" style={{ '--auth-i': 1 }}>
          <AuthLanguageSwitch />
        </div>

        <div className="w-full max-w-[520px] mx-auto lg:my-auto">
          {/* CSS entrance on the wrapper: its fill-mode would override framer's transform on the header. */}
          <AnimatedHeight className="auth-rise" style={{ '--auth-i': 2 }}>
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.header key={mode} custom={dir} variants={viewVariants} initial={animate ? 'enter' : false}
                animate="center" exit="exit" className="pb-6">
                <h1 className="font-heading font-extrabold text-[#0e0f0c] tracking-[-0.03em] leading-[1.08] text-[28px] sm:text-[34px] xl:text-[38px]">
                  {t(heading.title)}
                </h1>
                {heading.sub ? (
                  <p className="mt-2 text-base sm:text-[17px] text-[#5b6157] leading-snug">{t(heading.sub)}</p>
                ) : null}
              </motion.header>
            </AnimatePresence>
          </AnimatedHeight>

          {showSessionCard ? (
            <div className="mb-5 rounded-2xl bg-brand-mint border border-[#d3eac4] p-4 text-center space-y-3" role="status">
              <p className="text-sm text-brand-forest">
                {t('authLoggedInAs')} <strong className="font-bold">{user.displayName || user.email}</strong>.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/profile" className="min-h-11 inline-flex items-center px-5 rounded-full bg-brand-forest text-white text-sm font-semibold">
                  {t('authGoToProfile')}
                </Link>
                <button type="button" onClick={logout}
                  className="min-h-11 inline-flex items-center gap-2 px-5 rounded-full border border-[#a72027]/30 text-[#a72027] text-sm font-semibold cursor-pointer">
                  <LogOut className="w-4 h-4" aria-hidden="true" /> {t('authLogout')}
                </button>
              </div>
            </div>
          ) : null}

          {mode !== 'forgot' ? (
            <div className="auth-rise mb-5" style={{ '--auth-i': 3 }}>
              <AuthNavigation mode={mode} onChange={changeMode} />
            </div>
          ) : null}

          <div id="auth-panel" role={mode === 'forgot' ? undefined : 'tabpanel'}
            aria-labelledby={mode === 'forgot' ? undefined : `auth-tab-${mode}`} className="auth-rise" style={{ '--auth-i': 4 }}>
            <AnimatedHeight>
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div key={mode} custom={dir} variants={viewVariants} initial={animate ? 'enter' : false}
                  animate="center" exit="exit">
                  {view}
                </motion.div>
              </AnimatePresence>
            </AnimatedHeight>
          </div>
        </div>

      </section>
    </AuthLayout>
  );
}
