"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
  Store,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import TunisiaFlag from '@/components/TunisiaFlag';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { showInfo, showError, showToast } from '@/lib/swal';

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isAdmin, loginWithEmail, signupWithEmail, loginWithGoogle, logout } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Particulier'); // 'Particulier' | 'Boutique Pro'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        showToast(t('authWelcomeAdmin', { name: user.displayName || user.email }));
        const timer = setTimeout(() => router.push('/dash'), 600);
        return () => clearTimeout(timer);
      } else {
        showToast(t('authConnectedAs', { name: user.displayName || user.email }));
        const timer = setTimeout(() => router.push('/profile'), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isAdmin, router]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.success) {
        showToast(t('authGoogleSuccess'));
        setTimeout(() => router.push(res.isAdmin ? '/dash' : '/profile'), 600);
      }
    } catch (err) {
      showError(t('authGoogleFailTitle'), err.message || t('authGoogleFailDefault'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showError(t('authMissingFieldsTitle'), t('authMissingFieldsMsg'));
      return;
    }

    if (!isLogin && (!name.trim() || name.trim().length < 2)) {
      showError(t('authInvalidNameTitle'), t('authInvalidNameMsg'));
      return;
    }

    if (!isLogin && password.length < 6) {
      showError(t('authShortPasswordTitle'), t('authShortPasswordMsg'));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          showToast(t('authLoginSuccessToast'));
          setTimeout(() => router.push(res.isAdmin ? '/dash' : '/profile'), 600);
        }
      } else {
        const res = await signupWithEmail(email, password, name);
        if (res.success) {
          showToast(t('authSignupSuccessToast'));
          setTimeout(() => router.push(res.isAdmin ? '/dash' : '/profile'), 600);
        }
      }
    } catch (err) {
      showError(t('authErrorTitle'), err.message || t('authErrorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10 font-body text-[#0e0f0c] bg-[#e8ebe6]">
      <div className="bg-[#ffffff] rounded-2xl max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xl animate-rise-in">

        {/* Left Column: Brand Showcase & Trust Pillars (Desktop / Tablet only) — polarity-flipped dark panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0e0f0c] via-[#13150f] to-[#1b1f16] text-white p-7 sm:p-10 flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 bg-[#9fe870]/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 bg-[#9fe870]/10 rounded-full blur-3xl" />
          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-[#9fe870] flex items-center justify-center text-[#0e0f0c] group-hover:scale-105 transition-transform">
                <img src="/logoBg.png" alt="TanitMarket" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-heading font-black tracking-tight text-white">TanitMarket</span>
                  <TunisiaFlag className="w-5 h-3.5 rounded-[2px] inline-block align-middle" />
                </div>
                <span className="text-[10px] text-[#9fe870] font-semibold uppercase tracking-wider block">
                  {t('authBrandTagline')}
                </span>
              </div>
            </Link>

            {/* Value Proposition */}
            <div className="space-y-2">
              <Badge variant="lime" size="sm" icon={Sparkles}>
                {t('authBrandBadge')}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#9fe870] leading-tight">
                {t('authBrandHeadline1')} <br />
                <span className="text-white">{t('authBrandHeadline2')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#e8ebe6]/80 leading-relaxed">
                {t('authBrandDesc')}
              </p>
            </div>

            {/* Trust Pillars */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('authPillar1Title')}</h4>
                  <p className="text-[11px] text-[#e8ebe6]/70">{t('authPillar1Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('authPillar2Title')}</h4>
                  <p className="text-[11px] text-[#e8ebe6]/70">{t('authPillar2Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('authPillar3Title')}</h4>
                  <p className="text-[11px] text-[#e8ebe6]/70">{t('authPillar3Desc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Community Stat */}
          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-[#e8ebe6]/80 relative z-10">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#9fe870] animate-pulse" />
              {t('authLiveStatus')}
            </span>
            <Link href="/" className="hover:text-white font-semibold underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t('authBackHome')}
            </Link>
          </div>
        </div>

        {/* Right Column: Clean Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 flex flex-col justify-center bg-[#ffffff]">

          {/* Compact Brand Strip (Mobile only) */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0e0f0c] flex items-center justify-center shrink-0">
              <img src="/logoBg.png" alt="TanitMarket" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-lg font-heading font-black tracking-tight text-[#0e0f0c] flex items-center gap-1.5">
              TanitMarket
              <TunisiaFlag className="w-4 h-2.5 rounded-[2px] inline-block align-middle" />
            </span>
          </Link>

          {/* Header & Mode Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#0e0f0c] tracking-tight">
                  {isLogin ? t('authWelcomeBack') : t('authCreateAccountTitle')}
                </h1>
                <p className="text-xs text-[#868685] mt-1">
                  {isLogin ? t('authLoginSub') : t('authSignupSub')}
                </p>
              </div>
            </div>

            {/* Tab Pill Switcher */}
            <div className="flex bg-[#e8ebe6] p-1.5 rounded-full">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  isLogin
                    ? 'bg-[#0e0f0c] text-white'
                    : 'text-[#868685] hover:text-[#0e0f0c]'
                }`}
              >
                {t('authTabLogin')}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  !isLogin
                    ? 'bg-[#0e0f0c] text-white'
                    : 'text-[#868685] hover:text-[#0e0f0c]'
                }`}
              >
                {t('authTabSignup')}
              </button>
            </div>
          </div>

          {/* Active Session Warning / Shortcut */}
          {user && (
            <div className="bg-[#e2f6d5] rounded-xl p-4 text-center space-y-3 animate-in fade-in">
              <div className="text-xs text-[#0e0f0c]">
                {t('authLoggedInAs')} <strong className="font-bold">{user.displayName || user.email}</strong>.
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button href="/profile" variant="primary" size="sm">
                  {t('authGoToProfile')}
                </Button>
                <Button onClick={logout} variant="danger" size="sm" icon={LogOut}>
                  {t('authLogout')}
                </Button>
              </div>
            </div>
          )}

          {/* Google One-Click Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-[#e8ebe6] active:scale-[0.99] text-[#0e0f0c] border border-[#0e0f0c] rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{t('continueWithGoogle')}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#0e0f0c]/10 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-[#868685] uppercase tracking-wider absolute">
              {t('authOrEmail')}
            </span>
          </div>

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Signup Fields (Name & Account Type) */}
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0e0f0c]">
                    {t('authFullName')} <span className="text-[#d03238]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder={t('authNamePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-md border border-[#0e0f0c] focus:outline-none focus:ring-2 focus:ring-[#9fe870] bg-white text-[#0e0f0c] transition"
                    />
                  </div>
                </div>

                {/* Account Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0e0f0c]">
                    {t('authAccountType')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('Particulier')}
                      className={`p-2.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        role === 'Particulier'
                          ? 'bg-[#e2f6d5] text-[#0e0f0c] border-[#0e0f0c]'
                          : 'bg-white text-[#868685] border-[#0e0f0c]/20 hover:bg-[#e8ebe6]'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t('authRoleIndividual')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('Boutique Pro')}
                      className={`p-2.5 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                        role === 'Boutique Pro'
                          ? 'bg-[#e2f6d5] text-[#0e0f0c] border-[#0e0f0c]'
                          : 'bg-white text-[#868685] border-[#0e0f0c]/20 hover:bg-[#e8ebe6]'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>{t('authRoleShop')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0e0f0c]">
                {t('emailAddress')} <span className="text-[#d03238]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.tn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-md border border-[#0e0f0c] focus:outline-none focus:ring-2 focus:ring-[#9fe870] bg-white text-[#0e0f0c] transition"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0e0f0c]">
                  {t('password')} <span className="text-[#d03238]">*</span>
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => showInfo(t('authForgotTitle'), t('authForgotBody'))}
                    className="text-[11px] font-semibold text-[#0e0f0c] hover:underline cursor-pointer"
                  >
                    {t('authForgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-md border border-[#0e0f0c] focus:outline-none focus:ring-2 focus:ring-[#9fe870] bg-white text-[#0e0f0c] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#868685] hover:text-[#0e0f0c] transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-[11px] text-[#868685]">{t('authMinChars')}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full mt-2"
              iconRight={ArrowRight}
            >
              {loading
                ? t('authProcessing')
                : (isLogin ? t('authLoginSubmit') : t('authSignupSubmit'))}
            </Button>
          </form>

          {/* Terms notice */}
          <p className="text-[10px] text-center text-[#868685] leading-normal pt-1">
            {t('authTermsPrefix')} <Link href="/" className="underline hover:text-[#0e0f0c]">{t('authTermsLink')}</Link> {t('authTermsAnd')} <Link href="/" className="underline hover:text-[#0e0f0c]">{t('authPrivacyLink')}</Link> {t('authTermsSuffix')}
          </p>

        </div>

      </div>
    </div>
  );
}
