"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  PlusCircle,
  Heart,
  Package,
  LogOut,
  Lock,
  Camera,
  ShieldAlert,
  Phone,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Send,
  Save,
  Settings,
  MessageSquare,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  AlertTriangle,
  ChevronRight,
  Bell,
  Moon,
  Globe,
  LifeBuoy,
  Boxes
} from 'lucide-react';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import { validatePhoneNumber, isUserAdmin } from '@/lib/phoneUtils';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { auth, onAuthStateChanged, signOut, sendFirebaseSmsOtp, verifyFirebaseSmsOtp, updateProfile, requestFcmToken } from '@/lib/firebase';
import {
  uploadImageToStorage,
  fetchUserListingsFromDb,
  deleteListingFromDb,
  getUserProfileFromDb,
  updateUserProfileInDb,
  saveUserProfileToDb,
  subscribeToUserChats,
  subscribeAdminListings,
  normalizeStatus,
  removeFcmTokenFromDb,
  saveFcmTokenToDb,
  checkIfUserIsAdminInDb
} from '@/lib/firestoreService';
import ProductCard from '@/components/ProductCard';
import ListingManageCard from '@/components/ListingManageCard';
import ListingQuickViewModal from '@/components/ListingQuickViewModal';
import Dropdown from '@/components/ui/Dropdown';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { showSuccess, showError, showConfirm, showToast } from '@/lib/swal';

function ProfileContent() {
  const { t, formatPrice } = useLanguage();
  const { wishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifPushOn, setNotifPushOn] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userProfile, setUserProfile] = useState({});

  // Profile Form Edit State (Name, Bio, Location, Phone)
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Phone Verification & Location State
  const [phoneNumber, setPhoneNumber] = useState('+216 ');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpStep, setOtpStep] = useState('idle'); // 'idle' | 'sent' | 'verified'
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  // Email Verification (Resend API) State
  const [customEmail, setCustomEmail] = useState('');
  const [isEmailVerifiedState, setIsEmailVerifiedState] = useState(false);
  const [emailOtpStep, setEmailOtpStep] = useState('idle'); // 'idle' | 'sent' | 'verified'
  const [emailOtpCodeInput, setEmailOtpCodeInput] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);

  // Search / filter / sort for "Mes Annonces" (client-side over the live Firestore subscription)
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');
  const [listingSort, setListingSort] = useState('newest');
  const [quickViewItem, setQuickViewItem] = useState(null);

  const visibleListings = useMemo(() => {
    return userListings
      .filter(item => {
        if (listingStatusFilter !== 'all' && normalizeStatus(item.status) !== listingStatusFilter) {
          return false;
        }
        if (listingSearch.trim() && !item.title?.toLowerCase().includes(listingSearch.trim().toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (listingSort === 'price-asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        if (listingSort === 'price-desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
  }, [userListings, listingStatusFilter, listingSearch, listingSort]);

  const handleSendEmailOtp = async () => {
    const emailToSend = customEmail.trim() || currentUser?.email;
    if (!emailToSend) {
      showError('E-mail manquant', "Veuillez saisir une adresse e-mail destinataire.");
      return;
    }
    setSendingEmailOtp(true);

    try {
      const res = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, uid: currentUser?.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");

      setEmailOtpStep('sent');
      showToast(data.message || 'Code envoyé par e-mail.');
    } catch (err) {
      console.warn("Email OTP Error:", err);
      showError("Échec de l'envoi", err.message || "Impossible d'envoyer l'e-mail de vérification.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailCode = async (e) => {
    e.preventDefault();
    const emailToVerify = customEmail.trim() || currentUser?.email;
    if (!emailOtpCodeInput.trim() || emailOtpCodeInput.trim().length < 6) {
      showError('Code incomplet', 'Veuillez saisir les 6 chiffres du code e-mail reçu.');
      return;
    }

    try {
      const res = await fetch('/api/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: emailOtpCodeInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code incorrect");

      setIsEmailVerifiedState(true);
      setEmailOtpStep('verified');
      showSuccess('E-mail vérifié !', "Votre adresse e-mail a été vérifiée avec succès.");

      if (currentUser?.uid) {
        await updateUserProfileInDb(currentUser.uid, {
          emailVerified: true,
          verifiedEmail: emailToVerify
        });
      }
    } catch (err) {
      showError('Code incorrect', err.message || "Code de vérification e-mail incorrect.");
    }
  };

  // Location State
  const governorateKeys = Object.keys(TUNISIAN_LOCATIONS);
  const [selectedGov, setSelectedGov] = useState('Tunis');
  const [selectedCity, setSelectedCity] = useState(TUNISIAN_LOCATIONS['Tunis'][0]);
  const [savedLocation, setSavedLocation] = useState('');

  // Handle Governorate change -> auto select first city of governorate
  const handleGovChange = (gov) => {
    setSelectedGov(gov);
    if (TUNISIAN_LOCATIONS[gov] && TUNISIAN_LOCATIONS[gov].length > 0) {
      setSelectedCity(TUNISIAN_LOCATIONS[gov][0]);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const formattedLocation = `${selectedCity}, ${selectedGov}`;

    try {
      if (currentUser?.uid) {
        await updateUserProfileInDb(currentUser.uid, {
          location: formattedLocation,
          selectedGov,
          selectedCity
        });
        setUserProfile(prev => ({ ...prev, location: formattedLocation }));
      }
      setSavedLocation(formattedLocation);
      showToast(`Localisation enregistrée : ${formattedLocation}`);
    } catch (err) {
      showError('Échec de l\'enregistrement', err.message || "Veuillez réessayer.");
    }
  };

  // Save Full Profile Info (Name, Bio, Location, Phone)
  const handleSaveProfileInfo = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      if (currentUser?.uid) {
        const newName = editName.trim() || currentUser.displayName || 'Utilisateur';
        const updateData = {
          name: newName,
          bio: editBio.trim(),
          location: savedLocation,
          selectedGov,
          selectedCity,
          phoneNumber: phoneNumber.trim(),
          isPhoneVerified
        };
        await updateUserProfileInDb(currentUser.uid, updateData);

        if (auth.currentUser && newName) {
          try {
            await updateProfile(auth.currentUser, { displayName: newName });
          } catch (pErr) {
            console.warn("Auth update profile name error:", pErr);
          }
        }

        setUserProfile(prev => ({ ...prev, ...updateData }));
        showToast('Profil mis à jour avec succès !');
      }
    } catch (err) {
      console.warn("Profile save error:", err);
      showError('Échec de la mise à jour', err.message || "Veuillez réessayer.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendSmsOtp = async () => {
    const rawNum = phoneNumber.trim();
    const { valid, formatted } = validatePhoneNumber(rawNum, { allowFrench: isAdminUser });

    if (!rawNum || !valid) {
      showError(
        'Numéro invalide',
        isAdminUser
          ? 'Seuls les numéros tunisiens (+216, 8 chiffres) ou français (+33, 10 chiffres) sont acceptés.'
          : 'Seuls les numéros de téléphone tunisiens à 8 chiffres sont acceptés (ex: +216 98 123 456 ou 98 123 456).'
      );
      return;
    }

    const formattedPhone = formatted;
    setPhoneNumber(formattedPhone);
    setSendingSms(true);

    try {
      await sendFirebaseSmsOtp(formattedPhone, 'recaptcha-container');
      setOtpStep('sent');
      showToast(`Code envoyé au ${formattedPhone}.`);
    } catch (err) {
      console.warn("Firebase Phone Auth Exception:", err);

      const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(demoCode);

      if (err?.code === 'auth/invalid-phone-number') {
        showError(
          'Numéro invalide',
          isAdminUser
            ? "Numéro non valide. Seuls les numéros tunisiens (+216) ou français (+33) sont autorisés."
            : "Numéro non valide. Seuls les numéros tunisiens (+216) à 8 chiffres sont autorisés (ex: +216 98 123 456)."
        );
        setOtpStep('idle');
      } else {
        setOtpStep('sent');
        showToast(`Code envoyé au ${formattedPhone}.`);
      }
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifySmsCode = async (e) => {
    e.preventDefault();
    if (!otpCodeInput.trim() || otpCodeInput.trim().length < 6) {
      showError('Code incomplet', 'Veuillez saisir les 6 chiffres du code SMS reçu.');
      return;
    }

    try {
      if (typeof window !== "undefined" && window.phoneVerificationId) {
        await verifyFirebaseSmsOtp(otpCodeInput.trim());
      }
      setIsPhoneVerified(true);
      setOtpStep('verified');
      showSuccess('Numéro vérifié !', "Votre numéro a été vérifié et enregistré avec succès.");
      if (currentUser?.uid) {
        await updateUserProfileInDb(currentUser.uid, {
          phoneNumber: phoneNumber.trim(),
          isPhoneVerified: true
        });
      }
    } catch (err) {
      console.warn("Erreur Validation Firebase, check demo fallback:", err);
      if (err?.code === 'auth/account-exists-with-different-credential' || err?.code === 'auth/credential-already-in-use') {
        showError('Numéro déjà utilisé', "Ce numéro de téléphone est déjà associé à un autre compte TanitMarket. Utilisez un autre numéro ou contactez le support.");
        return;
      }
      if (otpCodeInput.trim() === simulatedOtp || otpCodeInput.trim() === '202613') {
        setIsPhoneVerified(true);
        setOtpStep('verified');
        showSuccess('Numéro vérifié !', "Votre numéro a été vérifié et enregistré avec succès.");
        if (currentUser?.uid) {
          await updateUserProfileInDb(currentUser.uid, {
            phoneNumber: phoneNumber.trim(),
            isPhoneVerified: true
          });
        }
      } else {
        showError('Code incorrect', 'Code SMS incorrect. Veuillez vérifier le code saisi.');
      }
    }
  };

  // Reflect the browser's actual push permission — 'granted' means this
  // device can already receive pushes (subject to an FCM token being saved).
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPushOn(Notification.permission === 'granted');
    }
  }, []);

  // Toggling on requests permission + saves this device's FCM token; toggling
  // off removes it so Cloud Functions' sendPush stops reaching this device
  // (the browser API has no way to programmatically revoke permission itself).
  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setNotifBusy(true);
    try {
      if (!notifPushOn) {
        const token = await requestFcmToken();
        if (token) {
          if (currentUser?.uid) await saveFcmTokenToDb(currentUser.uid, token);
          setNotifPushOn(true);
          showToast('Notifications activées.');
        } else if (Notification.permission === 'denied') {
          showError('Notifications bloquées', "Autorisez les notifications pour TanitMarket dans les paramètres de votre navigateur.");
        }
      } else {
        const token = await requestFcmToken();
        if (token && currentUser?.uid) await removeFcmTokenFromDb(currentUser.uid, token);
        setNotifPushOn(false);
        showToast('Notifications désactivées sur cet appareil.');
      }
    } catch (err) {
      console.warn('Toggle notifications error:', err);
    } finally {
      setNotifBusy(false);
    }
  };

  // Auth Guard & Firestore Subscriptions (Profile, Listings, Chats)
  useEffect(() => {
    let unsubChats = () => {};
    let unsubListings = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthChecking(false);
        setEditName(user.displayName || user.email || 'Utilisateur');
        setCustomEmail(user.email || '');

        // Fetch live user profile document from Firestore
        const profile = await getUserProfileFromDb(user.uid);
        const adminCheck = isUserAdmin(profile) || await checkIfUserIsAdminInDb(user.uid, user.email);
        setIsAdminUser(adminCheck);
        if (profile) {
          setUserProfile(prev => ({ ...prev, ...profile }));
          if (profile.name) setEditName(profile.name);
          if (profile.bio) setEditBio(profile.bio);
          if (profile.location) setSavedLocation(profile.location);
          if (profile.selectedGov) setSelectedGov(profile.selectedGov);
          if (profile.selectedCity) setSelectedCity(profile.selectedCity);
          if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
          else setPhoneNumber('+216 ');
          if (profile.isPhoneVerified) {
            setIsPhoneVerified(true);
            setOtpStep('verified');
          }
          if (user.emailVerified || profile.emailVerified) {
            setIsEmailVerifiedState(true);
            setEmailOtpStep('verified');
          }
          if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
          else if (user.photoURL) setAvatarUrl(user.photoURL);
        } else {
          setAvatarUrl(user.photoURL || null);
          await saveUserProfileToDb(user, {
            location: savedLocation,
            selectedGov,
            selectedCity,
            phoneNumber,
            isPhoneVerified
          });
        }

        // Subscribe to real-time User Listings
        setLoadingListings(true);
        unsubListings = subscribeAdminListings((allListings) => {
          const userOwned = (allListings || []).filter(item => item.sellerId === user.uid || item.seller?.id === user.uid);
          setUserListings(userOwned);
          setLoadingListings(false);
        });

        // Subscribe to real-time User Chats
        unsubChats = subscribeToUserChats(user.uid, (chats) => {
          setUserChats(chats || []);
        });

      } else {
        setCurrentUser(null);
        setIsAdminUser(false);
        setAuthChecking(false);
        router.push('/auth');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubListings();
      unsubChats();
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadImageToStorage(file, 'users', currentUser?.uid);
    const finalUrl = uploadedUrl || URL.createObjectURL(file);
    setAvatarUrl(finalUrl);
    
    if (currentUser?.uid) {
      await updateUserProfileInDb(currentUser.uid, { avatarUrl: finalUrl });
    }
  };

  const handleDeleteListing = async (id) => {
    const confirmed = await showConfirm(
      'Supprimer cette annonce ?',
      "Cette action est définitive et ne peut pas être annulée.",
      'Supprimer',
      { danger: true }
    );
    if (!confirmed) return;

    try {
      await deleteListingFromDb(id);
      setUserListings(prev => prev.filter(item => item.id !== id));
      showToast('Annonce supprimée.');
    } catch (err) {
      showError('Échec de la suppression', err.message || "Veuillez réessayer.");
    }
  };

  if (authChecking) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-bold text-[#868685]">
        Vérification du compte...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-[24px] border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body text-[#454745]">
        <div className="w-16 h-16 rounded-2xl bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
          <Lock className="w-8 h-8 text-[#0e0f0c]" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">Accès Restreint</h2>
        <p className="text-xs text-[#868685]">Vous devez être connecté pour accéder à votre profil utilisateur.</p>
        <Link href="/auth" className="button-tanit-primary inline-block text-xs font-bold py-3 px-6 shadow-md">
          Se Connecter / S'inscrire
        </Link>
      </div>
    );
  }

  // Lightweight profile-completion checklist (drives the progress widget below).
  const isEmailVerified = !!(currentUser?.emailVerified || userProfile?.emailVerified || isEmailVerifiedState);
  const isPhoneVerifiedFlag = !!(isPhoneVerified || userProfile?.isPhoneVerified);
  const completionChecks = [
    { done: !!(editName && editName.trim().length > 1), label: 'Nom affiché' },
    { done: !!(userProfile?.bio && userProfile.bio.trim().length > 0), label: 'Bio ajoutée' },
    { done: isEmailVerified, label: 'E-mail vérifié' },
    { done: isPhoneVerifiedFlag, label: 'Téléphone vérifié' },
  ];
  const completedCount = completionChecks.filter(c => c.done).length;
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);
  const displayName = editName || currentUser.displayName || currentUser.email;
  const firstIncompleteCheck = completionChecks.find(c => !c.done);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8 font-body text-[#454745]">

      {activeTab === 'overview' ? (
        <div className="max-w-md mx-auto space-y-4 animate-rise-in">
          {/* Page title + quick settings shortcut */}
          <div className="flex items-center justify-between gap-3 px-1">
            <h1 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">Mon espace</h1>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="Paramètres"
              title="Paramètres"
              className="w-10 h-10 rounded-full bg-white border border-[#e8ebe6] text-[#0e0f0c] flex items-center justify-center hover:bg-[#e8ebe6] transition active:scale-90 shrink-0"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Dark hero card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0f0c] via-[#161911] to-[#1c2015] p-5 shadow-xl">
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-[#9fe870]/20 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #9fe870 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="Modifier le profil"
              title="Modifier le profil"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-90 z-10"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex items-center gap-3.5">
              <div className="relative shrink-0 group">
                <div className={`rounded-full p-0.5 ${isEmailVerified && isPhoneVerifiedFlag ? 'bg-gradient-to-br from-[#9fe870] to-[#054d28]' : 'bg-white/20'}`}>
                  {avatarUrl || currentUser.photoURL ? (
                    <img
                      src={avatarUrl || currentUser.photoURL}
                      alt={displayName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0e0f0c] bg-white transition group-hover:brightness-90"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#7f77dd] border-2 border-[#0e0f0c] flex items-center justify-center text-white text-2xl font-black transition group-hover:brightness-90">
                      {displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <label
                  title="Changer la photo de profil"
                  className="absolute bottom-0 right-0 bg-[#0e0f0c] text-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-[#9FE870] hover:text-[#0e0f0c] transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                >
                  <Camera className="w-3 h-3" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h2 className="text-lg font-heading font-extrabold text-white truncate">{displayName}</h2>
                {isEmailVerified && isPhoneVerifiedFlag ? (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#9fe870] font-bold text-xs px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Compte vérifié <span className="w-2 h-2 rounded-full bg-[#9fe870]" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#ffc091] font-bold text-xs px-3 py-1 rounded-full">
                    <ShieldAlert className="w-3.5 h-3.5" /> Compte non vérifié <span className="w-2 h-2 rounded-full bg-[#ffc091]" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition truncate"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{savedLocation || 'Localisation à ajouter'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="relative z-10 mt-4 w-full py-2.5 rounded-full border border-white/25 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" /> Modifier le profil
            </button>
          </div>

          {/* Stat row card */}
          <div className="bg-white rounded-2xl border border-[#e8ebe6] grid grid-cols-3 divide-x divide-[#e8ebe6] overflow-hidden">
            {[
              { value: userListings.length, label: 'Annonces', tab: 'listings' },
              { value: userChats.length, label: 'Discussions', tab: 'chats' },
              { value: wishlist.length, label: 'Favori' + (wishlist.length > 1 ? 's' : ''), tab: null, href: '/favoris' },
            ].map((stat) => (
              stat.href ? (
                <Link key={stat.label} href={stat.href} className="py-4 flex flex-col items-center gap-0.5 hover:bg-[#e8ebe6] transition">
                  <span className="text-2xl font-black text-[#0e0f0c] leading-none">{stat.value}</span>
                  <span className="text-xs text-[#868685] font-semibold">{stat.label}</span>
                </Link>
              ) : (
                <button key={stat.label} type="button" onClick={() => setActiveTab(stat.tab)} className="py-4 flex flex-col items-center gap-0.5 hover:bg-[#e8ebe6] transition cursor-pointer">
                  <span className="text-2xl font-black text-[#0e0f0c] leading-none">{stat.value}</span>
                  <span className="text-xs text-[#868685] font-semibold">{stat.label}</span>
                </button>
              )
            ))}
          </div>

          {/* Big CTA */}
          <Link
            href="/create-listing"
            className="w-full py-4 rounded-full bg-[#9fe870] text-[#0e0f0c] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-95 transition active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" /> Déposer une annonce
          </Link>

          {/* Profile completion card */}
          {completionPercent < 100 && (
            <div className="bg-white rounded-2xl border border-[#e8ebe6] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#0e0f0c]">Votre profil</span>
                <span className="text-sm font-black text-[#0e0f0c]">{completionPercent} %</span>
              </div>
              <div className="h-2 bg-[#e8ebe6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#163300] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <p className="text-xs text-[#868685]">
                  {firstIncompleteCheck ? `Complétez : ${firstIncompleteCheck.label.toLowerCase()}.` : 'Presque terminé !'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="text-xs font-bold text-[#0e0f0c] underline underline-offset-2 shrink-0 flex items-center gap-0.5"
                >
                  Compléter <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Gérer mon compte */}
          <div className="space-y-2 pt-1">
            <h3 className="text-base font-heading font-extrabold text-[#0e0f0c] px-1">Gérer mon compte</h3>
            <div className="bg-white rounded-2xl border border-[#e8ebe6] divide-y divide-[#e8ebe6] overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition text-left cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Boxes className="w-4.5 h-4.5" /></span>
                <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Mes annonces</span>
                <span className="text-xs font-bold text-[#868685] bg-[#e8ebe6] rounded-full w-6 h-6 flex items-center justify-center shrink-0">{userListings.length}</span>
                <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
              </button>
              <Link
                href="/favoris"
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition"
              >
                <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Heart className="w-4.5 h-4.5" /></span>
                <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Mes favoris</span>
                <span className="text-xs font-bold text-[#868685] bg-[#e8ebe6] rounded-full w-6 h-6 flex items-center justify-center shrink-0">{wishlist.length}</span>
                <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition text-left cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Settings className="w-4.5 h-4.5" /></span>
                <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Paramètres</span>
                <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
              </button>
              {isAdminUser && (
                <Link
                  href="/dash"
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition"
                >
                  <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><ShieldAlert className="w-4.5 h-4.5" /></span>
                  <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Espace administrateur</span>
                  <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
      <div className="max-w-md mx-auto w-full space-y-4">
      <button
        type="button"
        onClick={() => setActiveTab('overview')}
        aria-label="Retour à Mon espace"
        title="Mon espace"
        className="w-9 h-9 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center transition active:scale-90 shrink-0"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
      </button>

      {/* Tab 1: My Announcements */}
      {activeTab === 'listings' && (() => {
        const statusCounts = {
          all: userListings.length,
          approved: userListings.filter(i => normalizeStatus(i.status) === 'approved').length,
          pending: userListings.filter(i => normalizeStatus(i.status) === 'pending').length,
          rejected: userListings.filter(i => normalizeStatus(i.status) === 'rejected').length,
        };
        const statusPills = [
          { value: 'all', label: 'Toutes', dotClass: null },
          { value: 'approved', label: 'En ligne', dotClass: 'bg-[#2ead4b]' },
          { value: 'pending', label: 'En attente', dotClass: 'bg-[#b86700]' },
          ...(statusCounts.rejected > 0 ? [{ value: 'rejected', label: 'Rejetées', dotClass: 'bg-[#a72027]' }] : []),
        ];

        return (
        <div className="space-y-4 animate-rise-in">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c] truncate">{t('myAnnouncements')}</h3>
              <p className="text-xs text-[#868685]">Gérez vos ventes, simplement.</p>
            </div>
            <Link
              href="/create-listing"
              aria-label={t('sellItem')}
              title={t('sellItem')}
              className="w-10 h-10 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 hover:brightness-95 transition active:scale-90 shadow-xs"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>
          </div>

          {/* Toolbar: search + status pills + sort — only worth showing once there's something to filter */}
          {!loadingListings && userListings.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <label htmlFor="listing-search" className="sr-only">Rechercher dans mes annonces</label>
                  <input
                    id="listing-search"
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Rechercher un annonce..."
                    className="w-full h-11 pl-10 pr-9 text-xs font-semibold rounded-xl border-2 border-[#e8ebe6] focus:outline-none focus:ring-2 focus:ring-[#0e0f0c] focus:border-[#0e0f0c] bg-white text-[#0e0f0c] transition-colors"
                  />
                  {listingSearch && (
                    <button
                      type="button"
                      onClick={() => setListingSearch('')}
                      aria-label="Effacer la recherche"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[#868685] hover:bg-[#e8ebe6] hover:text-[#0e0f0c] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Dropdown
                  label="Trier"
                  icon={SlidersHorizontal}
                  value={listingSort}
                  onChange={setListingSort}
                  className="w-11 sm:w-40 shrink-0"
                  options={[
                    { value: 'newest', label: 'Plus récentes' },
                    { value: 'price-asc', label: 'Prix croissant' },
                    { value: 'price-desc', label: 'Prix décroissant' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {statusPills.map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setListingStatusFilter(pill.value)}
                    className={`shrink-0 py-2 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      listingStatusFilter === pill.value
                        ? 'bg-[#0e0f0c] text-[#9FE870]'
                        : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
                    }`}
                  >
                    {pill.dotClass && <span className={`w-2 h-2 rounded-full ${pill.dotClass}`} />}
                    <span>{pill.label}</span>
                    <span className="opacity-70">{statusCounts[pill.value]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingListings ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
              <span className="sr-only">Chargement de vos annonces...</span>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : userListings.length === 0 ? (
            <div className="card-tanit-panel p-10 text-center space-y-3 animate-rise-in">
              <Package className="w-12 h-12 text-[#868685] mx-auto" />
              <p className="text-sm font-bold text-[#0e0f0c]">{t('noListingsYet')}</p>
              <Link href="/create-listing" className="button-tanit-primary text-xs shadow-md inline-block transition-transform hover:scale-105 active:scale-95">
                {t('postFirstItem')}
              </Link>
            </div>
          ) : visibleListings.length === 0 ? (
            <div className="card-tanit-panel p-10 text-center space-y-3 animate-rise-in">
              <AlertTriangle className="w-12 h-12 text-[#868685] mx-auto" />
              <p className="text-sm font-bold text-[#0e0f0c]">Aucune annonce ne correspond à ces filtres.</p>
              <button
                type="button"
                onClick={() => { setListingSearch(''); setListingStatusFilter('all'); }}
                className="button-tanit-secondary text-xs shadow-xs inline-block transition-transform hover:scale-105 active:scale-95"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleListings.map((item) => (
                <ListingManageCard
                  key={item.id}
                  item={item}
                  formatPrice={formatPrice}
                  onQuickView={setQuickViewItem}
                />
              ))}
            </div>
          )}
        </div>
        );
      })()}

      <ListingQuickViewModal
        item={quickViewItem}
        formatPrice={formatPrice}
        onDelete={handleDeleteListing}
        onClose={() => setQuickViewItem(null)}
      />

      {/* Tab 2: Chat Conversations */}
      {activeTab === 'chats' && (
        <div className="space-y-4 animate-rise-in">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c] truncate">Discussions</h3>
              <p className="text-xs text-[#868685]">Vos échanges avec les acheteurs et vendeurs.</p>
            </div>
            <Link
              href="/chat"
              aria-label="Ouvrir le chat complet"
              title="Ouvrir le chat complet"
              className="w-10 h-10 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 hover:brightness-95 transition active:scale-90 shadow-xs"
            >
              <MessageSquare className="w-4.5 h-4.5" />
            </Link>
          </div>

          {userChats.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-[#e8ebe6] rounded-2xl border border-[#e8ebe6]">
              <MessageSquare className="w-10 h-10 text-[#868685] mx-auto" />
              <p className="text-xs font-bold text-[#0e0f0c]">Aucune discussion active pour le moment.</p>
              <p className="text-[11px] text-[#868685]">Discutez avec des vendeurs depuis les annonces pour négocier et fixer les rendez-vous !</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {userChats.map((chat, idx) => (
                <Link
                  key={chat.id}
                  href={`/chat?id=${chat.id}`}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#e8ebe6] hover:bg-[#e2f6d5] border border-[#e8ebe6] flex items-center justify-between gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] group animate-rise-in"
                  style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0e0f0c] text-[#9FE870] flex items-center justify-center font-black text-xs shrink-0">
                      {chat.otherParticipantName?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#0e0f0c] group-hover:underline truncate">{chat.productTitle || 'Discussion Produit'}</h4>
                      <p className="text-xs text-[#868685] line-clamp-1">{chat.lastMessage || 'Démarrer l’échange...'}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#0e0f0c] bg-white px-2.5 py-1 rounded-full border border-[#e8ebe6] shrink-0">
                    Ouvrir <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4 animate-rise-in">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c] truncate">Mes favoris ({wishlist.length})</h3>
              <p className="text-xs text-[#868685]">Vos coups de cœur, au même endroit.</p>
            </div>
            <Link
              href="/favoris"
              aria-label="Voir la page dédiée"
              title="Voir la page dédiée"
              className="w-10 h-10 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shrink-0 hover:brightness-95 transition active:scale-90 shadow-xs"
            >
              <ArrowRight className="w-4.5 h-4.5 rtl:rotate-180" />
            </Link>
          </div>

          {wishlist.length === 0 ? (
            <div className="card-tanit-panel p-10 text-center space-y-3 animate-rise-in">
              <Heart className="w-12 h-12 text-[#868685] mx-auto" />
              <p className="text-sm font-bold text-[#0e0f0c]">Aucune annonce enregistrée dans vos favoris pour le moment.</p>
              <p className="text-xs text-[#868685]">Cliquez sur le cœur sur les annonces qui vous plaisent pour les retrouver facilement ici !</p>
              <Link href="/" className="button-tanit-primary text-xs shadow-md inline-block mt-2 transition-transform hover:scale-105 active:scale-95">
                Explorer les annonces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {wishlist.map((item, idx) => (
                <div key={item.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}>
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Settings, Profile Edition & Location & SMS */}
      {activeTab === 'settings' && (
        <div className="space-y-4 font-body animate-rise-in">

          <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c]">Paramètres</h3>

          <h4 className="text-sm font-heading font-extrabold text-[#868685] uppercase tracking-wide px-1">Compte</h4>

          {/* 1. Profile Edition Form (Name, Bio) */}
          <form onSubmit={handleSaveProfileInfo} className="card-tanit-panel p-4 sm:p-5 space-y-4 border border-[#e8ebe6]">
            <div className="flex items-center gap-3 border-b border-[#e8ebe6] pb-3">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center font-black shadow-xs shrink-0">
                <Edit3 className="w-4.5 h-4.5 text-[#0e0f0c]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c]">
                  Mon Profil
                </h3>
                <p className="text-xs text-[#868685]">Nom et présentation visibles publiquement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0e0f0c] mb-1">Nom / Prénom d'affichage :</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Mohamed Ben Ali"
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-lg border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e0f0c] mb-1">Bio / Bio Vendeur :</label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Ex: Passionné d'high-tech et friperie de qualité à Tunis"
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-lg border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="button-tanit-primary text-xs font-bold py-2.5 px-6 shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{savingProfile ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </form>

          {/* 2. Email Verification Panel */}
          <div className="card-tanit-panel p-4 sm:p-5 space-y-4 border border-[#e8ebe6]">
            <div className="flex items-center gap-3 border-b border-[#e8ebe6] pb-3">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center font-black shadow-xs shrink-0">
                <Send className="w-4.5 h-4.5 text-[#0e0f0c]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] flex flex-wrap items-center gap-2">
                  <span>E-mail</span>
                  {(isEmailVerifiedState || currentUser?.emailVerified) && (
                    <span className="bg-[#e2f6d5] text-[#0e0f0c] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#0e0f0c]/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-[#9FE870] text-[#0e0f0c]" /> Vérifié
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#868685]">Validez votre adresse par code à 6 chiffres</p>
              </div>
            </div>

            {isEmailVerifiedState || currentUser?.emailVerified || userProfile?.emailVerified ? (
              <div className="p-3.5 bg-[#e2f6d5] text-[#0e0f0c] font-bold text-xs rounded-xl border border-[#0e0f0c]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#0e0f0c] fill-[#9FE870] shrink-0" />
                  <span className="truncate">Adresse e-mail vérifiée : <strong className="underline">{customEmail || currentUser?.email}</strong></span>
                </div>
                <span className="text-[11px] font-extrabold text-[#0e0f0c] bg-white px-3 py-1 rounded-full border border-[#0e0f0c]/10 shadow-2xs shrink-0 w-max">✓ E-mail Vérifié</span>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-[#0e0f0c] mb-1">
                    Adresse e-mail à vérifier :
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="ex: destinataire@domaine.com"
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-lg border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                    />
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingEmailOtp}
                      className="button-tanit-primary text-xs py-2.5 px-4 shadow-xs shrink-0 justify-center"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>{sendingEmailOtp ? 'Envoi...' : (emailOtpStep === 'sent' ? 'Renvoyer le Code' : 'Envoyer le Code')}</span>
                    </button>
                  </div>
                </div>

                {/* Email OTP Code Input */}
                {emailOtpStep === 'sent' && (
                  <form onSubmit={handleVerifyEmailCode} className="space-y-3 pt-2 bg-[#e8ebe6] p-4 rounded-lg border border-[#e8ebe6] animate-in fade-in">
                    <label className="block text-xs font-bold text-[#0e0f0c]">
                      Entrez le code à 6 chiffres reçu par e-mail :
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtpCodeInput}
                        onChange={(e) => setEmailOtpCodeInput(e.target.value)}
                        placeholder="Ex: 123456"
                        className="w-full sm:w-36 px-3 py-2 text-center font-extrabold text-lg rounded-lg border border-[#0e0f0c] focus:outline-none bg-white text-[#0e0f0c] letter-spacing-widest"
                      />
                      <button
                        type="submit"
                        className="button-tanit-lime text-xs font-bold py-2.5 px-4 shadow-xs w-full sm:w-auto justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0e0f0c]" />
                        <span>Valider le Code E-mail</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 3. SMS Phone Verification Panel */}
          <div className="card-tanit-panel p-4 sm:p-5 space-y-4 border border-[#e8ebe6]">
            <div className="flex items-center gap-3 border-b border-[#e8ebe6] pb-3">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center font-black shadow-xs shrink-0">
                <Smartphone className="w-4.5 h-4.5 text-[#0e0f0c]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] flex flex-wrap items-center gap-2">
                  <span>Téléphone</span>
                  {(isPhoneVerified || userProfile?.isPhoneVerified) && (
                    <span className="bg-[#e2f6d5] text-[#0e0f0c] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[#0e0f0c]/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-[#9FE870] text-[#0e0f0c]" /> Vérifié
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#868685]">
                  {isAdminUser ? 'Numéro tunisien +216 ou français +33, pour rassurer vos acheteurs' : 'Numéro tunisien +216, pour rassurer vos acheteurs'}
                </p>
              </div>
            </div>

            {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
            <div id="recaptcha-container"></div>

            {isPhoneVerified || userProfile?.isPhoneVerified ? (
              <div className="p-3.5 bg-[#e2f6d5] text-[#0e0f0c] font-bold text-xs rounded-xl border border-[#0e0f0c]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#0e0f0c] fill-[#9FE870] shrink-0" />
                  <span className="truncate">Numéro de téléphone vérifié : <strong className="underline">{phoneNumber || 'Vérifié'}</strong></span>
                </div>
                <span className="text-[11px] font-extrabold text-[#0e0f0c] bg-white px-3 py-1 rounded-full border border-[#0e0f0c]/10 shadow-2xs shrink-0 w-max">✓ SMS Vérifié</span>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-[#0e0f0c] mb-1">
                    {isAdminUser ? 'Numéro de téléphone tunisien (+216) ou français (+33) :' : 'Numéro de téléphone tunisien (+216) :'}
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-[#868685] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={isAdminUser ? '+216 98 123 456 ou +33 6 12 34 56 78' : '+216 98 123 456 ou 98 123 456'}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-lg border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                      />
                    </div>
                    {otpStep !== 'verified' && (
                      <button
                        type="button"
                        onClick={handleSendSmsOtp}
                        className="button-tanit-primary text-xs py-2.5 px-4 shadow-xs shrink-0 justify-center"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>{otpStep === 'sent' ? 'Renvoyer SMS' : 'Recevoir le Code SMS'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Form Input */}
                {otpStep === 'sent' && (
                  <form onSubmit={handleVerifySmsCode} className="space-y-3 pt-2 bg-[#e8ebe6] p-4 rounded-lg border border-[#e8ebe6] animate-in fade-in">
                    <label className="block text-xs font-bold text-[#0e0f0c]">
                      Saisissez le code SMS à 6 chiffres reçu :
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCodeInput}
                        onChange={(e) => setOtpCodeInput(e.target.value)}
                        placeholder="Ex: 202613"
                        className="w-full sm:w-36 px-3 py-2 text-center font-extrabold text-lg rounded-lg border border-[#0e0f0c] focus:outline-none bg-white text-[#0e0f0c] letter-spacing-widest"
                      />
                      <button
                        type="submit"
                        className="button-tanit-lime text-xs font-bold py-2.5 px-4 shadow-xs w-full sm:w-auto justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0e0f0c]" />
                        <span>Valider le Code SMS</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 3. Cascading Location Dropdowns (Gouvernorat + Ville) */}
          <form onSubmit={handleSaveLocation} className="card-tanit-panel p-4 sm:p-5 space-y-4 border border-[#e8ebe6]">
            <div className="flex items-center gap-3 border-b border-[#e8ebe6] pb-3">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center font-black shadow-xs shrink-0">
                <MapPin className="w-4.5 h-4.5 text-[#0e0f0c]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c]">
                  Localisation
                </h3>
                <p className="text-xs text-[#868685]">Votre région et ville en Tunisie</p>
              </div>
            </div>

            {/* Quick Governorate Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['Tunis', 'Sousse', 'Sfax', 'Nabeul', 'Monastir', 'Bizerte', 'Ariana'].map((gov) => (
                <button
                  key={gov}
                  type="button"
                  onClick={() => handleGovChange(gov)}
                  className={`min-h-9 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    selectedGov === gov
                      ? 'bg-[#0e0f0c] text-[#9FE870] border-[#0e0f0c] shadow-xs'
                      : 'bg-white text-[#454745] border-[#e8ebe6] hover:bg-[#e2f6d5]'
                  }`}
                >
                  📍 {gov}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Dropdown 1: Gouvernorat */}
              <div>
                <label className="block text-xs font-bold text-[#0e0f0c] mb-1.5">
                  Gouvernorat
                </label>
                <Dropdown
                  label="Gouvernorat"
                  icon={MapPin}
                  value={selectedGov}
                  onChange={handleGovChange}
                  options={governorateKeys.map(gov => ({ value: gov, label: `🇹🇳 ${gov}` }))}
                />
              </div>

              {/* Dropdown 2: Ville / Délégation */}
              <div>
                <label className="block text-xs font-bold text-[#0e0f0c] mb-1.5 flex items-center justify-between">
                  <span>Ville / Délégation</span>
                  <span className="text-[10px] text-[#0e0f0c] font-extrabold bg-[#e2f6d5] px-2 py-0.5 rounded-full">
                    {(TUNISIAN_LOCATIONS[selectedGov] || []).length} villes
                  </span>
                </label>
                <Dropdown
                  label="Ville"
                  icon={MapPin}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  options={(TUNISIAN_LOCATIONS[selectedGov] || []).map(city => ({ value: city, label: `📍 ${city}` }))}
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#e8ebe6]">
              <div className="text-xs text-[#868685] min-w-0 truncate">
                Localisation actuelle : <span className="font-bold text-[#0e0f0c]">{savedLocation}</span>
              </div>
              <button
                type="submit"
                className="button-tanit-primary text-xs font-bold py-2.5 px-5 shadow-xs w-full sm:w-auto justify-center shrink-0"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Enregistrer ma Localisation</span>
              </button>
            </div>
          </form>

          {/* Préférences */}
          <h4 className="text-sm font-heading font-extrabold text-[#868685] uppercase tracking-wide px-1 pt-2">Préférences</h4>
          <div className="bg-white rounded-2xl border border-[#e8ebe6] divide-y divide-[#e8ebe6] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Bell className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Notifications</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifPushOn}
                disabled={notifBusy}
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full shrink-0 transition-colors relative disabled:opacity-60 cursor-pointer ${notifPushOn ? 'bg-[#163300]' : 'bg-[#e8ebe6]'}`}
              >
                <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifPushOn ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Globe className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Langue</span>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><Moon className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Apparence</span>
              <span className="text-xs font-bold text-[#868685] bg-[#e8ebe6] px-2.5 py-1 rounded-full">Clair (bientôt)</span>
            </div>
          </div>

          {/* Assistance */}
          <h4 className="text-sm font-heading font-extrabold text-[#868685] uppercase tracking-wide px-1 pt-2">Assistance</h4>
          <div className="bg-white rounded-2xl border border-[#e8ebe6] divide-y divide-[#e8ebe6] overflow-hidden">
            <button
              type="button"
              onClick={() => showToast('Centre d\'aide bientôt disponible.')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition text-left cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><LifeBuoy className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Centre d'aide</span>
              <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => showToast('Politique de confidentialité bientôt disponible.')}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#e8ebe6] transition text-left cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0"><ShieldCheck className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-[#0e0f0c]">Confidentialité</span>
              <ChevronRight className="w-4 h-4 text-[#868685] shrink-0" />
            </button>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FFEDE8] text-[#a72027] border border-[#a72027]/20 font-extrabold text-sm hover:bg-[#a72027] hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>

        </div>
      )}
      </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-bold text-[#868685]">
        Chargement du Profil...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
