"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User, Phone, MapPin, Settings, LifeBuoy, ShieldCheck, LogOut, Bell, Globe, Moon, ChevronRight, ArrowLeft, Save
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { requestFcmToken, deleteFcmToken, isPushOptedOut, setPushOptOut, isPushSupported, lastFcmError } from '@/lib/firebase';
import { saveFcmTokenToDb, removeFcmTokenFromDb } from '@/lib/firestoreService';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import { showToast, showError } from '@/lib/swal';
import Dropdown from '@/components/ui/Dropdown';
import SettingsSection, { useIsDesktop } from '@/components/account/SettingsSection';
import ContactSection from '@/components/account/ContactSection';
import { AvatarUploader } from '@/components/account/Avatar';
import { SaveButton, Switch, FieldError, inputCls } from '@/components/account/ui';
import { TAB_HREF } from '@/components/account/AccountLayout';
import { sectionIn, staggerContainer, EASE_OUT } from '@/lib/design';

const BIO_MAX = 500;

// idle → saving → saved (2s) → idle; errors keep the typed values.
function useSaveState() {
  const [state, setState] = useState('idle');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = async (fn) => {
    setState('saving');
    try {
      await fn();
      setState('saved');
      timer.current = setTimeout(() => setState('idle'), 2000);
      return true;
    } catch (e) {
      console.warn('Save error:', e);
      setState('idle');
      return false;
    }
  };
  return [state, run];
}

function ProfileForm({ acc, desktop }) {
  const { t } = useLanguage();
  const [name, setName] = useState(acc.displayName || '');
  const [bio, setBio] = useState(acc.profile?.bio || '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [state, run] = useSaveState();

  const validate = (n = name, b = bio) => {
    const e = {};
    if (n.trim().length < 2) e.name = t('stNameRequired');
    if (b.length > BIO_MAX) e.bio = t('stBioTooLong');
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(e.name ? 'st-name' : 'st-bio')?.focus();
      return;
    }
    const ok = await run(() => acc.saveProfile({ name: name.trim(), bio: bio.trim() }));
    if (ok) showToast(t('stSaved'));
    else setFormError(t('stSaveError'));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className={desktop ? 'grid grid-cols-[168px_minmax(0,1fr)] gap-5' : 'space-y-4'}>
        <div className="flex justify-center pt-1">
          <AvatarUploader src={acc.avatarUrl} name={acc.displayName} size="md" onUpload={acc.uploadAvatar} showLabel />
        </div>
        <div className="space-y-4 min-w-0">
          <div>
            <label htmlFor="st-name" className="block text-sm font-bold text-[#0e0f0c] mb-1.5">
              {t('stDisplayName')} <span className="text-[#a72027]" aria-hidden="true">*</span>
            </label>
            <input
              id="st-name"
              value={name}
              required
              autoComplete="name"
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(validate(e.target.value, bio)); }}
              aria-invalid={!!errors.name}
              aria-describedby="st-name-err"
              className={inputCls}
            />
            <FieldError id="st-name-err">{errors.name}</FieldError>
          </div>
          <div>
            <label htmlFor="st-bio" className="block text-sm font-bold text-[#0e0f0c] mb-1.5">{t('stBio')}</label>
            <textarea
              id="st-bio"
              rows={desktop ? 3 : 3}
              value={bio}
              maxLength={BIO_MAX + 50}
              onChange={(e) => { setBio(e.target.value); if (errors.bio) setErrors(validate(name, e.target.value)); }}
              placeholder={t('stBioPh')}
              aria-invalid={!!errors.bio}
              aria-describedby="st-bio-err st-bio-count"
              className={`${inputCls} py-3 resize-none`}
            />
            <div className="flex justify-between gap-2">
              <FieldError id="st-bio-err">{errors.bio}</FieldError>
              <span id="st-bio-count" className={`ms-auto text-xs mt-1 tabular-nums ${bio.length > BIO_MAX ? 'text-[#a72027] font-bold' : 'text-[#6b7566]'}`}>{bio.length}/{BIO_MAX}</span>
            </div>
          </div>
        </div>
      </div>
      <FieldError id="st-profile-err">{formError}</FieldError>
      <SaveButton state={state} />
    </form>
  );
}

function LocationForm({ acc }) {
  const { t } = useLanguage();
  const [gov, setGov] = useState(acc.profile?.selectedGov && TUNISIAN_LOCATIONS[acc.profile.selectedGov] ? acc.profile.selectedGov : '');
  const [city, setCity] = useState(acc.profile?.selectedCity || '');
  const [error, setError] = useState('');
  const [state, run] = useSaveState();
  const cities = TUNISIAN_LOCATIONS[gov] || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!gov || !city || !cities.includes(city)) { setError(t('stLocationRequired')); return; }
    const ok = await run(() => acc.saveLocation(gov, city));
    if (ok) showToast(`${t('stLocation')} : ${city}, ${gov}`);
    else setError(t('stSaveError'));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span id="st-gov-label" className="block text-sm font-bold text-[#0e0f0c] mb-1.5">{t('stGov')}</span>
          <Dropdown
            label={t('stGov')}
            icon={MapPin}
            size="lg"
            value={gov}
            placeholder={t('stSelect')}
            invalid={!!error && !gov}
            describedBy="st-loc-err"
            onChange={(g) => { setGov(g); setCity(''); setError(''); }}
            options={Object.keys(TUNISIAN_LOCATIONS).map((g) => ({ value: g, label: g }))}
          />
        </div>
        <div>
          <span className="block text-sm font-bold text-[#0e0f0c] mb-1.5">{t('stCity')}</span>
          <Dropdown
            key={gov}
            label={t('stCity')}
            icon={MapPin}
            size="lg"
            value={city}
            placeholder={t('stSelect')}
            invalid={!!error && !city}
            describedBy="st-loc-err"
            onChange={(c) => { setCity(c); setError(''); }}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>
      <FieldError id="st-loc-err">{error}</FieldError>
      <SaveButton state={state} label={t('stSaveLocation')} icon={Save} />
    </form>
  );
}

function Preferences({ acc }) {
  const { t, lang, setLang } = useLanguage();
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const supported = isPushSupported();

  useEffect(() => {
    if (supported) setPushOn(Notification.permission === 'granted' && !isPushOptedOut());
  }, [supported]);

  // on = permission + save this device's FCM token; off = delete the token
  // and remember the opt-out (browsers can't revoke permission themselves).
  const toggle = async () => {
    if (!supported) {
      showError('Notifications indisponibles', "Sur iPhone/iPad, ajoutez d'abord TanitMarket à l'écran d'accueil (Partager > Sur l'écran d'accueil), puis ouvrez l'application pour activer les notifications.");
      return;
    }
    setBusy(true);
    try {
      if (!pushOn) {
        const token = await requestFcmToken();
        if (token) {
          setPushOptOut(false);
          if (acc.user?.uid) await saveFcmTokenToDb(acc.user.uid, token);
          setPushOn(true);
          showToast('Notifications activées.');
        } else if (Notification.permission === 'denied') {
          showError('Notifications bloquées', 'Autorisez les notifications pour TanitMarket dans les paramètres de votre navigateur.');
        } else {
          showError('Activation impossible sur cet appareil', lastFcmError || 'Erreur inconnue');
        }
      } else {
        setPushOptOut(true);
        const token = await deleteFcmToken();
        if (token && acc.user?.uid) await removeFcmTokenFromDb(acc.user.uid, token);
        setPushOn(false);
        showToast('Notifications désactivées sur cet appareil.');
      }
    } catch (err) {
      console.warn('Toggle notifications error:', err);
      showToast(t('stSaveError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const row = 'flex items-center gap-3 min-h-[64px] px-4 py-2';
  return (
    <div className="rounded-2xl border border-[#163300]/[0.08] divide-y divide-[#163300]/[0.07]">
      <div className={row}>
        <Bell className="w-5 h-5 shrink-0 text-[#163300]" />
        <span id="pref-notif" className="flex-1 font-bold text-[15px] text-[#0e0f0c]">{t('stNotifications')}</span>
        <Switch checked={pushOn} onChange={toggle} disabled={busy} label={t('stNotifications')} />
      </div>
      <div className={row}>
        <Globe className="w-5 h-5 shrink-0 text-[#163300]" />
        <span className="flex-1 font-bold text-[15px] text-[#0e0f0c]">{t('stLanguage')}</span>
        <div role="group" aria-label={t('stLanguage')} className="flex p-1 rounded-xl border border-[#163300]/10 bg-white">
          {['fr', 'ar'].map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`relative min-w-12 min-h-10 px-3 rounded-lg text-sm font-bold cursor-pointer transition-colors ${lang === l ? 'text-[#163300]' : 'text-[#6b7566] hover:text-[#163300]'}`}
            >
              {lang === l && <motion.span layoutId="pref-lang" transition={{ duration: 0.22, ease: EASE_OUT }} className="absolute inset-0 rounded-lg bg-brand-mint" />}
              <span className="relative">{l.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={row}>
        <Moon className="w-5 h-5 shrink-0 text-[#163300]" />
        <span className="flex-1 font-bold text-[15px] text-[#0e0f0c]">{t('stAppearance')}</span>
        <span className="text-xs font-bold text-[#6b7566] bg-[#eef1ec] px-3 py-1.5 rounded-full" aria-disabled="true">{t('stAppearanceSoon')}</span>
      </div>
    </div>
  );
}

function Help() {
  const { t } = useLanguage();
  const item = (icon, label) => {
    const Icon = icon;
    return (
      <button
        type="button"
        onClick={() => showToast(t('stSoon'), 'info')}
        className="w-full flex items-center gap-3 min-h-[60px] px-4 text-start hover:bg-[#f7faf4] transition-colors cursor-pointer first:rounded-t-2xl last:rounded-b-2xl"
      >
        <Icon className="w-5 h-5 shrink-0 text-[#163300]" />
        <span className="flex-1 font-bold text-[15px] text-[#0e0f0c]">{label}</span>
        <ChevronRight className="w-4 h-4 text-[#5c6657] rtl:rotate-180" />
      </button>
    );
  };
  return (
    <div className="rounded-2xl border border-[#163300]/[0.08] divide-y divide-[#163300]/[0.07]">
      {item(LifeBuoy, t('stHelpCenter'))}
      {item(ShieldCheck, t('stPrivacy'))}
    </div>
  );
}

const SECTIONS = ['profile', 'contact', 'location', 'prefs', 'help'];

export default function AccountSettings({ acc, initialSection }) {
  const { t } = useLanguage();
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(() => new Set([SECTIONS.includes(initialSection) ? initialSection : 'profile']));

  // Deep link (?section=…): open that section and bring it into view.
  useEffect(() => {
    if (!initialSection || !SECTIONS.includes(initialSection)) return;
    const id = setTimeout(() => {
      const el = document.getElementById(`section-${initialSection}`);
      el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el?.querySelector('button[aria-expanded], input, [data-dropdown-trigger]')?.focus({ preventScroll: true });
    }, 350);
    return () => clearTimeout(id);
  }, [initialSection]);

  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const jump = (id) => {
    setOpen((prev) => new Set(prev).add(id));
    setTimeout(() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const sec = (id) => ({ id, desktop, open: open.has(id), onToggle: () => toggle(id) });

  const logoutBtn = (
    <button
      type="button"
      onClick={acc.logout}
      className="w-full min-h-[52px] rounded-2xl border border-[#a72027]/25 bg-[#fdf1ef] hover:bg-[#fbe2de] text-[#a72027] font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.99]"
    >
      <LogOut className="w-5 h-5 rtl:rotate-180" /> {t('accSignOut')}
    </button>
  );

  const profile = (
    <SettingsSection {...sec('profile')} icon={User} title={t('stPublic')} sub={t('stPublicSub')}>
      <ProfileForm acc={acc} desktop={desktop} />
    </SettingsSection>
  );
  const contact = (
    <SettingsSection {...sec('contact')} icon={Phone} title={t('stContact')} sub={t('stContactSub')} subShort={t('stContactSubShort')}>
      <ContactSection acc={acc} />
    </SettingsSection>
  );
  const location = (
    <SettingsSection {...sec('location')} icon={MapPin} title={t('stLocation')} sub={t('stLocationSub')} subShort={t('stLocationSubShort')}>
      <LocationForm acc={acc} />
    </SettingsSection>
  );
  const prefs = (
    <SettingsSection {...sec('prefs')} icon={Settings} title={t('stPrefs')} sub={t('stPrefsSub')} subShort={t('stPrefsSubShort')}>
      <Preferences acc={acc} />
    </SettingsSection>
  );
  const help = (
    <SettingsSection {...sec('help')} icon={LifeBuoy} title={t('stHelp')} sub={t('stHelpSub')}>
      <Help />
    </SettingsSection>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.05)} className="space-y-4 lg:space-y-6">
      <Link href={TAB_HREF.overview} aria-label={t('accBack')} className="lg:hidden w-11 h-11 rounded-full bg-[#eef1ec] hover:bg-brand-mint flex items-center justify-center text-[#163300] transition-colors">
        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
      </Link>
      <motion.header variants={sectionIn}>
        <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-[40px] text-[#0e0f0c] leading-tight">{t('stTitle')}</h1>
        <p className="text-sm lg:text-lg text-[#5c6657] mt-0.5">{t('stSub')}</p>
      </motion.header>

      {!desktop && (
        <motion.nav variants={sectionIn} aria-label={t('stTitle')} className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
          {[['profile', User, t('stJumpProfile')], ['contact', Phone, t('stContact')], ['prefs', Settings, t('stPrefs')]].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => jump(id)}
              className={`shrink-0 min-h-11 px-4 rounded-full border text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${open.has(id) ? 'bg-brand-lime border-brand-lime text-[#163300]' : 'bg-white border-[#163300]/15 text-[#2f3a28] hover:bg-brand-mint'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </motion.nav>
      )}

      {desktop ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 items-start">
          <motion.div variants={sectionIn} className="space-y-6">{profile}{contact}{location}</motion.div>
          <motion.div variants={sectionIn} className="space-y-6">{prefs}{help}{logoutBtn}</motion.div>
        </div>
      ) : (
        <motion.div variants={sectionIn} className="space-y-3">
          {profile}{contact}{location}{prefs}{help}
          <div className="pt-1">{logoutBtn}</div>
        </motion.div>
      )}
    </motion.div>
  );
}
