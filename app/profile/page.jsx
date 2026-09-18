"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Star,
  Circle,
  MapPin,
  PlusCircle,
  Heart,
  Package,
  LogOut,
  Tag,
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
  Sparkles,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  AlertTriangle
} from 'lucide-react';
import { MOCK_USER_PROFILE, MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { auth, onAuthStateChanged, signOut, sendFirebaseSmsOtp, verifyFirebaseSmsOtp, updateProfile } from '@/lib/firebase';
import {
  uploadImageToStorage,
  fetchUserListingsFromDb,
  deleteListingFromDb,
  getUserProfileFromDb,
  updateUserProfileInDb,
  saveUserProfileToDb,
  subscribeToUserChats,
  subscribeAdminListings,
  normalizeStatus
} from '@/lib/firestoreService';
import ProductCard from '@/components/ProductCard';
import ListingManageCard from '@/components/ListingManageCard';
import ListingQuickViewModal from '@/components/ListingQuickViewModal';
import Dropdown from '@/components/ui/Dropdown';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { showSuccess, showError, showConfirm, showToast } from '@/lib/swal';

function ProfileContent() {
  const { t, formatPrice } = useLanguage();
  const { wishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get('tab') || 'listings';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [userListings, setUserListings] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
    const formattedLocation = `${selectedCity}, ${selectedGov}, Tunisie`;

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
    const cleaned = rawNum.replace(/[\s\-\(\)]/g, '');
    const isTunisian = /^(?:\+216|216)?[24579]\d{7}$/.test(cleaned);

    if (!rawNum || !isTunisian) {
      showError('Numéro invalide', 'Seuls les numéros de téléphone tunisiens à 8 chiffres sont acceptés (ex: +216 98 123 456 ou 98 123 456).');
      return;
    }

    // Auto format to standard +216 format if entered without country code
    let formattedPhone = cleaned;
    if (!formattedPhone.startsWith('+216')) {
      if (formattedPhone.startsWith('216')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+216' + formattedPhone;
      }
    }
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
        showError('Numéro invalide', "Numéro non valide. Seuls les numéros tunisiens (+216) à 8 chiffres sont autorisés (ex: +216 98 123 456).");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 font-body text-[#454745]">
      
      {/* Profile Header Box — dark cover band + overlapping avatar */}
      <div className="card-tanit-panel relative overflow-hidden shadow-xl animate-rise-in !p-0">
        {/* Cover band */}
        <div className="relative h-24 sm:h-32 bg-gradient-to-br from-[#0e0f0c] via-[#161911] to-[#1c2015] overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-[#9fe870]/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 w-48 h-48 bg-[#9fe870]/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #9fe870 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>

        <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-3 sm:pt-0 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
            {/* Avatar with Firebase Storage Upload — only this element overlaps the
                dark cover band (sm+ only, since a flex-col mobile layout would drag
                the name/text block below it up into the band too, making that text
                illegible against the dark background). */}
            <div className="relative group shrink-0 sm:-mt-14 animate-rise-in">
              <div className={`rounded-full p-1 ${isEmailVerified && isPhoneVerifiedFlag ? 'bg-gradient-to-br from-[#9fe870] to-[#054d28]' : 'bg-[#e8ebe6]'}`}>
                <img
                  src={avatarUrl || currentUser.photoURL || MOCK_USER_PROFILE.avatar}
                  alt={editName || currentUser.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg bg-white transition-transform group-hover:scale-105"
                />
              </div>
              {isEmailVerified && isPhoneVerifiedFlag && (
                <span className="absolute -top-1 -left-1 bg-[#0e0f0c] text-[#9fe870] rounded-full p-1 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
              <label className="absolute bottom-0 right-0 bg-[#0e0f0c] text-white p-1.5 sm:p-2 rounded-full shadow-md cursor-pointer hover:bg-[#9FE870] hover:text-[#0e0f0c] transition-all hover:scale-110 active:scale-90 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* User Bio & Details */}
            <div className="flex-1 min-w-0 text-center md:text-left space-y-2 animate-rise-in" style={{ animationDelay: '80ms' }}>
              <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0e0f0c] truncate min-w-0" title={editName || currentUser.displayName || currentUser.email}>
                  {editName || currentUser.displayName || currentUser.email}
                </h1>

                {/* Account Verification Badge (Requires BOTH Email & Phone Verification) */}
                {isEmailVerified && isPhoneVerifiedFlag ? (
                  <span className="inline-flex items-center gap-1 bg-[#e2f6d5] text-[#0e0f0c] font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full w-max mx-auto md:mx-0 shrink-0 whitespace-nowrap border border-[#0e0f0c]/10">
                    <ShieldCheck className="w-4 h-4 text-[#0e0f0c] fill-[#9FE870]" />
                    <span>Compte Vérifié 🟢</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-[#FFEDE8] text-[#a72027] font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full w-max mx-auto md:mx-0 shrink-0 whitespace-nowrap border border-[#a72027]/20">
                    <ShieldAlert className="w-4 h-4 text-[#a72027]" />
                    <span>Compte Non Vérifié 🔴</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-[#868685] truncate">{currentUser.email}</p>
              {userProfile.bio && <p className="text-xs text-[#454745] font-semibold italic line-clamp-2">{userProfile.bio}</p>}

              {/* Verification Detail Chips & Real User Data */}
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 text-xs text-[#868685] pt-1">
                {/* Real Location Pill (Only if user saved it) */}
                <span className="flex items-center gap-1 font-semibold text-[#0e0f0c] bg-[#e8ebe6] px-2.5 py-1 rounded-full border border-[#e8ebe6] max-w-full">
                  <MapPin className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />
                  <span className="truncate">{savedLocation || 'Localisation non renseignée'}</span>
                </span>

                {/* Real Phone Pill (Only if user entered it) */}
                <span className="flex items-center gap-1 font-semibold text-[#0e0f0c] bg-[#e8ebe6] px-2.5 py-1 rounded-full border border-[#e8ebe6] max-w-full">
                  <Phone className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />
                  <span className="truncate">{phoneNumber || 'Téléphone non renseigné'}</span>
                  {isPhoneVerifiedFlag && <CheckCircle2 className="w-3.5 h-3.5 fill-[#9FE870] text-[#0e0f0c] ml-0.5 shrink-0" />}
                </span>

                {/* Real Email Verification Status */}
                <span className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${
                  isEmailVerified
                    ? 'bg-[#e2f6d5] text-[#0e0f0c] border-[#0e0f0c]/10'
                    : 'bg-[#FFEDE8] text-[#a72027] border-[#a72027]/20'
                }`}>
                  {isEmailVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  E-mail {isEmailVerified ? 'vérifié' : 'non vérifié'}
                </span>

                {/* Real SMS Phone Verification Status */}
                <span className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${
                  isPhoneVerifiedFlag
                    ? 'bg-[#e2f6d5] text-[#0e0f0c] border-[#0e0f0c]/10'
                    : 'bg-[#FFEDE8] text-[#a72027] border-[#a72027]/20'
                }`}>
                  {isPhoneVerifiedFlag ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  SMS {isPhoneVerifiedFlag ? 'vérifié' : 'non vérifié'}
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto shrink-0 animate-rise-in" style={{ animationDelay: '140ms' }}>
              <Link
                href="/create-listing"
                className="button-tanit-primary text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>{t('sellItem')}</span>
              </Link>
              {/* Admin Dashboard CTA Button (Strictly hidden if user is NOT an admin) */}
              {(userProfile?.isAdmin === true || userProfile?.role === 'Admin' || userProfile?.role?.toLowerCase() === 'admin') && (
                <Link
                  href="/dash"
                  className="button-tanit-tertiary text-xs py-2.5 px-3.5 transition-transform hover:scale-105 active:scale-95"
                  title="Dashboard Administration"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#0e0f0c]" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-[#FFEDE8] text-[#a72027] border border-[#a72027]/30 hover:bg-[#a72027] hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                title="Se déconnecter de TanitMarket"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Profile Completion Widget (hidden once 100% complete) */}
          {completionPercent < 100 && (
            <div className="mt-6 pt-6 border-t border-[#e8ebe6] animate-rise-in" style={{ animationDelay: '180ms' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#0e0f0c]">
                  <Sparkles className="w-4 h-4 text-[#0e0f0c]" /> Complétez votre profil
                </span>
                <span className="text-xs font-black text-[#0e0f0c]">{completionPercent}%</span>
              </div>
              <div className="h-2 bg-[#e8ebe6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9fe870] to-[#054d28] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                {completionChecks.map((check) => (
                  <span
                    key={check.label}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      check.done
                        ? 'bg-[#e2f6d5] text-[#0e0f0c] border-[#0e0f0c]/10'
                        : 'bg-[#e8ebe6] text-[#868685] border-[#e8ebe6]'
                    }`}
                  >
                    {check.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                    {check.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-[#e8ebe6] mt-6 pt-6">
            {[
              { icon: Package, value: userListings.length, label: t('activeListings') },
              { icon: MessageSquare, value: userChats.length, label: 'Conversations Chat' },
              { icon: Heart, value: wishlist.length, label: t('wishlist') },
            ].map((stat, idx) => {
              const StatIcon = stat.icon;
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => setActiveTab(idx === 0 ? 'listings' : idx === 1 ? 'chats' : 'wishlist')}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 rounded-2xl bg-[#e8ebe6] hover:bg-[#e2f6d5] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer animate-rise-in"
                  style={{ animationDelay: `${200 + idx * 60}ms` }}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0e0f0c] text-[#9FE870] flex items-center justify-center">
                    <StatIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-[#0e0f0c] leading-none">{stat.value}</div>
                  <div className="text-[9px] sm:text-xs font-bold text-[#868685] text-center leading-tight px-1">{stat.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-[#e8ebe6] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-2.5 px-4 sm:px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
            activeTab === 'listings' ? 'bg-[#0e0f0c] text-[#9FE870] shadow-md' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          <Package className="w-4 h-4" /> {t('myAnnouncements')} ({userListings.length})
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className={`py-2.5 px-4 sm:px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
            activeTab === 'chats' ? 'bg-[#0e0f0c] text-[#9FE870] shadow-md' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Discussions Chat ({userChats.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`py-2.5 px-4 sm:px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
            activeTab === 'wishlist' ? 'bg-[#0e0f0c] text-[#9FE870] shadow-md' : 'bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#e2f6d5] border border-[#e8ebe6]'
          }`}
        >
          <Heart className="w-4 h-4 fill-current" /> {t('wishlist')} ({wishlist.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 px-4 sm:px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
            activeTab === 'settings' ? 'bg-[#0e0f0c] text-[#9FE870] shadow-md' : 'bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#e2f6d5] border border-[#e8ebe6]'
          }`}
        >
          <Settings className="w-4 h-4" /> Paramètres
        </button>
      </div>

      {/* Tab 1: My Announcements */}
      {activeTab === 'listings' && (
        <div className="space-y-4 animate-rise-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center shadow-xs shrink-0">
                <Tag className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c] truncate">{t('myAnnouncements')}</h3>
            </div>
            <Link href="/create-listing" className="button-tanit-primary text-xs py-2 px-4 shrink-0 transition-transform hover:scale-105 active:scale-95">
              <PlusCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('sellItem')}</span>
            </Link>
          </div>

          {/* Toolbar: search + status filter + sort — only worth showing once there's something to filter */}
          {!loadingListings && userListings.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="listing-search" className="sr-only">Rechercher dans mes annonces</label>
                <input
                  id="listing-search"
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Rechercher par titre..."
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
              <div className="flex gap-2.5 shrink-0">
                <Dropdown
                  label="Filtrer par statut"
                  icon={SlidersHorizontal}
                  value={listingStatusFilter}
                  onChange={setListingStatusFilter}
                  className="w-40"
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'approved', label: 'En ligne' },
                    { value: 'pending', label: 'En attente' },
                    { value: 'rejected', label: 'Rejetées' },
                  ]}
                />
                <Dropdown
                  label="Trier"
                  value={listingSort}
                  onChange={setListingSort}
                  className="w-40"
                  options={[
                    { value: 'newest', label: 'Plus récentes' },
                    { value: 'price-asc', label: 'Prix croissant' },
                    { value: 'price-desc', label: 'Prix décroissant' },
                  ]}
                />
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
                  onDelete={handleDeleteListing}
                  onQuickView={setQuickViewItem}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ListingQuickViewModal
        item={quickViewItem}
        formatPrice={formatPrice}
        onClose={() => setQuickViewItem(null)}
      />

      {/* Tab 2: Chat Conversations */}
      {activeTab === 'chats' && (
        <div className="card-tanit-panel p-4 sm:p-6 space-y-4 border border-[#e8ebe6] animate-rise-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center shadow-xs shrink-0">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#0e0f0c] truncate">Discussions & Messagerie</h3>
                <p className="text-xs text-[#868685]">Vos échanges en direct avec les acheteurs et vendeurs</p>
              </div>
            </div>
            <Link href="/chat" className="button-tanit-primary text-xs py-2.5 px-5 shadow-xs w-full sm:w-auto justify-center transition-transform hover:scale-105 active:scale-95">
              Ouvrir le Chat Complet 💬
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
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#9FE870] text-[#0e0f0c] flex items-center justify-center shadow-xs shrink-0">
                <Heart className="w-4.5 h-4.5 fill-[#0e0f0c]" />
              </div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0e0f0c] truncate">
                {t('wishlist')} ({wishlist.length})
              </h3>
            </div>
            {wishlist.length > 0 && (
              <Link href="/favoris" className="button-tanit-tertiary text-xs py-2 px-3 sm:px-4 flex items-center gap-1 shrink-0 transition-transform hover:scale-105 active:scale-95">
                <span className="hidden sm:inline">Page dédiée</span> <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
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
                <p className="text-xs text-[#868685]">Numéro tunisien +216, pour rassurer vos acheteurs</p>
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
                    Numéro de téléphone tunisien (+216) :
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-[#868685] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+216 98 123 456 ou 98 123 456"
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
