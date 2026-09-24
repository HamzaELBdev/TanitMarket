"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  Package, 
  TrendingUp, 
  Search, 
  ArrowLeft, 
  Trash2, 
  Check, 
  Ban, 
  RefreshCw,
  Clock,
  PlusCircle,
  X,
  Bell,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  UserCheck,
  Building,
  Star,
  Sparkles,
  Megaphone,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sprout,
  FileText,
  Tag,
  Ellipsis,
  SlidersHorizontal,
  House,
  Smartphone,
  Car,
  Shirt,
  Bike,
  Briefcase,
  Baby,
  PawPrint,
  Palette,
  Plus
} from 'lucide-react';
import { MOCK_ADMIN_STATS, MOCK_ADMIN_LISTINGS, MOCK_ADMIN_USERS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import { validatePhoneNumber } from '@/lib/phoneUtils';
import {
  subscribeAdminListings,
  subscribeAdminUsers,
  subscribeToNotifications,
  updateListingStatusInDb,
  setHeroFeaturedListingInDb,
  setSponsoredStatusInDb,
  deleteListingFromDb,
  updateUserStatusInDb,
  updateUserRoleInDb,
  createListing,
  createModerationNotification,
  markNotificationAsReadInDb,
  getUserProfileFromDb,
  checkIfUserIsAdminInDb,
  updateUserProfileInDb
} from '@/lib/firestoreService';
import { showSuccess, showError, showConfirm, showToast } from '@/lib/swal';

const CATEGORY_META = {
  electronics: { label: 'Électronique', icon: Smartphone },
  vehicles: { label: 'Auto', icon: Car },
  home: { label: 'Maison', icon: House },
  fashion: { label: 'Mode', icon: Shirt },
  realestate: { label: 'Immobilier', icon: Building },
  sports: { label: 'Loisirs', icon: Bike },
  jobs: { label: 'Emploi & Services', icon: Briefcase },
  baby: { label: 'Bébé & Enfants', icon: Baby },
  pets: { label: 'Animaux', icon: PawPrint },
  art: { label: 'Art & Collection', icon: Palette },
};

const categoryMeta = (category) => CATEGORY_META[category] || { label: category || 'Autre', icon: Tag };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80';
const listingImage = (item) => item.image || item.images?.[0] || FALLBACK_IMAGE;
const sellerName = (item) => item.sellerName || item.seller?.name || 'Vendeur';
const listingPlace = (item) => item.city || item.governorate || item.location?.split(',')[0] || 'Tunisie';
const formatTnd = (price) => `${(parseFloat(price) || 0).toLocaleString('fr-FR')} TND`;

const STATUS_STYLES = {
  pending: { label: 'En attente', icon: Clock, className: 'bg-[#fff0df] text-[#b86700]' },
  approved: { label: 'Approuvée', icon: CheckCircle2, className: 'bg-[#e2f6d5] text-[#054d28]' },
  rejected: { label: 'Rejetée', icon: XCircle, className: 'bg-[#ffe3e0] text-[#a72027]' },
  reserved: { label: 'Réservée', icon: Tag, className: 'bg-[#e0f4fd] text-[#0b6a8c]' },
};

function StatusBadge({ status }) {
  const key = status === 'Approuvée' ? 'approved' : status === 'Rejetée' ? 'rejected' : status;
  const s = STATUS_STYLES[key] || STATUS_STYLES.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 ${s.className}`}>
      <Icon className="w-3.5 h-3.5" /> {s.label}
    </span>
  );
}

function UserStatusBadge({ status }) {
  const banned = status === 'Banned' || status === 'Banni';
  return (
    <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 ${
      banned ? 'bg-[#ffe3e0] text-[#a72027]' : 'bg-[#e2f6d5] text-[#054d28]'
    }`}>
      {banned ? 'Banni' : (status === 'Vérifié' ? 'Vérifié' : 'Actif')}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'users' | 'notifications'
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Listings table UI state
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const listingsSectionRef = useRef(null);

  // Admin Post / Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState('');
  
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('electronics');
  const [newPrice, setNewPrice] = useState('');
  const [newGov, setNewGov] = useState('Tunis');
  const [newCity, setNewCity] = useState(TUNISIAN_LOCATIONS['Tunis'][0]);
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newStatus, setNewStatus] = useState('approved'); // Default approved for admin post

  // Optional seller override — lets an admin publish on behalf of another
  // user (their own phone/address/social link), instead of always posting
  // under the admin's own identity.
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerSocialUrl, setNewSellerSocialUrl] = useState('');

  // Strict Auth & Admin Access Guard (Redirect non-admins directly to /profile)
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (isMounted) setCurrentUser(user);
        
        try {
          // Check directly in Firestore if connected user is an admin
          const hasAdminAccess = await checkIfUserIsAdminInDb(user.uid, user.email);

          if (isMounted) {
            if (hasAdminAccess) {
              setIsAdmin(true);
              setAuthChecking(false);
            } else {
              setIsAdmin(false);
              setAuthChecking(false);
              router.push('/profile');
            }
          }
        } catch (err) {
          console.warn("Firestore admin check error:", err);
          if (isMounted) {
            setIsAdmin(false);
            setAuthChecking(false);
            router.push('/profile');
          }
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          setIsAdmin(false);
          setAuthChecking(false);
          router.push('/profile');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  // Real-time Firestore Listeners for Listings, Users, & Notifications
  useEffect(() => {
    setLoading(true);

    const unsubListings = subscribeAdminListings((items) => {
      setListings(items || []);
      setLoading(false);
    });

    const unsubUsers = subscribeAdminUsers((userItems) => {
      setUsers(userItems || []);
    });

    const unsubNotifs = subscribeToNotifications('admin', (notifItems) => {
      setNotifications(notifItems || []);
    });

    return () => {
      unsubListings();
      unsubUsers();
      unsubNotifs();
    };
  }, []);

  // Compute Live Metrics from Firestore Data
  const pendingCount = listings.filter(l => l.status === 'pending').length;
  const approvedCount = listings.filter(l => l.status === 'approved' || l.status === 'Approuvée').length;
  const totalVolume = listings.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  const activeUsersCount = users.filter(u => u.status === 'Active' || u.status === 'Vérifié').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  // Rejection/Deletion reason modal state — shared by "Refuser" et "Supprimer"
  const [reasonModal, setReasonModal] = useState(null); // { id, title, mode: 'reject' | 'delete', sellerId } | null
  const [reasonText, setReasonText] = useState('');
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

  const flashError = (err, fallbackMsg) => {
    console.warn(fallbackMsg, err);
    showError(fallbackMsg, err?.message || 'Erreur inconnue.');
  };

  // Moderation Handlers
  const handleApproveListing = async (item) => {
    try {
      await updateListingStatusInDb(item.id, 'approved');
      setListings(prev => prev.map(l => l.id === item.id ? { ...l, status: 'approved', rejectionReason: null } : l));
      showToast(`"${item.title || "L'annonce"}" a été approuvée et est désormais en ligne !`);

      const sellerId = item.sellerId || item.seller?.id;
      if (sellerId) {
        createModerationNotification({ sellerId, adId: item.id, adTitle: item.title, decision: 'approved' });
      }
    } catch (err) {
      flashError(err, "Échec de l'approbation.");
    }
  };

  const openReasonModal = (item, mode) => {
    setReasonText('');
    setReasonModal({ id: item.id, title: item.title, mode, sellerId: item.sellerId || item.seller?.id });
  };

  const confirmReasonModal = async () => {
    if (!reasonModal) return;
    const { id, title, mode, sellerId } = reasonModal;
    setReasonSubmitting(true);
    try {
      if (mode === 'reject') {
        await updateListingStatusInDb(id, 'rejected', reasonText.trim());
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected', rejectionReason: reasonText.trim() } : l));
        showToast(`"${title || "L'annonce"}" a été rejetée.`, 'warning');
        if (sellerId) {
          createModerationNotification({ sellerId, adId: id, adTitle: title, decision: 'rejected', reason: reasonText.trim() });
        }
      } else {
        await deleteListingFromDb(id);
        setListings(prev => prev.filter(item => item.id !== id));
        showToast(`"${title || "L'annonce"}" a été supprimée définitivement.`, 'warning');
        if (sellerId) {
          createModerationNotification({ sellerId, adId: id, adTitle: title, decision: 'rejected', reason: reasonText.trim() || 'Annonce supprimée par un administrateur.' });
        }
      }
      setReasonModal(null);
      setReasonText('');
    } catch (err) {
      flashError(err, mode === 'reject' ? "Échec du refus de l'annonce." : "Échec de la suppression.");
    } finally {
      setReasonSubmitting(false);
    }
  };

  const handleUserStatus = async (id, statusToSet, name) => {
    if (statusToSet === 'Banned') {
      const confirmed = await showConfirm(
        'Bannir ce membre ?',
        `${name || 'Ce membre'} ne pourra plus se connecter à TanitMarket.`,
        'Bannir',
        { danger: true }
      );
      if (!confirmed) return;
    }
    try {
      await updateUserStatusInDb(id, statusToSet);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: statusToSet } : u));
      showToast(statusToSet === 'Banned' ? 'Membre banni.' : 'Membre réactivé.');
    } catch (err) {
      flashError(err, "Échec de la mise à jour du statut.");
    }
  };

  const handleUserRole = async (id, roleToSet) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: roleToSet } : u));
    await updateUserRoleInDb(id, roleToSet);
  };

  const handleMarkNotifRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    await markNotificationAsReadInDb(notifId);
  };

  // Create / Post New Admin Listing to Firestore
  const handleAdminPostListing = async (e) => {
    e.preventDefault();
    setPostSubmitting(true);
    setPostSuccessMsg('');

    try {
      // Publishing "on behalf of" someone else: as soon as the admin fills
      // in any of the seller override fields, the listing must be fully
      // attributed to that third party — a distinct sellerId decoupled from
      // the admin's own account (so it doesn't show up under the admin's
      // "Mes annonces" and chat isn't misrouted to the admin's inbox) and a
      // neutral avatar instead of the admin's own photo. Firestore rules
      // only allow an admin caller to set a sellerId other than their own.
      const isOnBehalfOf = Boolean(newSellerName.trim() || newSellerPhone.trim() || newSellerSocialUrl.trim());

      let finalSellerPhone = null;
      if (isOnBehalfOf && newSellerPhone.trim()) {
        const { valid, formatted } = validatePhoneNumber(newSellerPhone.trim(), { allowFrench: false });
        if (!valid) {
          showError('Numéro de téléphone invalide', "Le numéro du vendeur doit être un numéro tunisien valide à 8 chiffres (ex: +216 98 123 456).");
          setPostSubmitting(false);
          return;
        }
        finalSellerPhone = formatted;
      }

      const sellerId = isOnBehalfOf ? `guest-${Date.now()}` : (currentUser?.uid || 'admin-root');

      const adData = {
        title: newTitle.trim(),
        category: newCategory,
        price: parseFloat(newPrice) || 0,
        priceType: 'fixed',
        negotiable: false,
        condition: 'Neuf',
        description: newDesc.trim() || 'Annonce officielle administrateur.',
        image: newImageUrl.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
        images: [newImageUrl.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'],
        governorate: newGov,
        city: newCity,
        location: `${newCity}, ${newGov}`,
        status: newStatus, // 'approved' or 'pending'
        sellerId,
        seller: {
          id: sellerId,
          name: isOnBehalfOf ? (newSellerName.trim() || 'Vendeur') : (currentUser?.displayName || 'Administrateur TanitMarket'),
          avatar: isOnBehalfOf ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80' : (currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'),
          rating: 5.0,
          verified: !isOnBehalfOf,
          location: `${newCity}, ${newGov}`,
          ...(finalSellerPhone ? { phone: finalSellerPhone } : {}),
          ...(newSellerSocialUrl.trim() ? { socialUrl: newSellerSocialUrl.trim() } : {})
        }
      };

      await createListing(adData);
      setPostSubmitting(false);
      setPostSuccessMsg('Annonce créée et synchronisée avec Firestore avec succès !');

      // Reset form
      setNewTitle('');
      setNewPrice('');
      setNewDesc('');
      setNewImageUrl('');
      setNewSellerName('');
      setNewSellerPhone('');
      setNewSellerSocialUrl('');

      setTimeout(() => {
        setPostSuccessMsg('');
        setShowCreateModal(false);
      }, 1500);
    } catch (err) {
      console.error("Admin post error:", err);
      setPostSubmitting(false);
      showError("Échec de la publication", err?.message || "Veuillez réessayer.");
    }
  };

  const handleSetHeroFeatured = async (id, title) => {
    try {
      await setHeroFeaturedListingInDb(id);
      setListings(prev => prev.map(item => ({
        ...item,
        isHeroFeatured: String(item.id) === String(id)
      })));
      showToast(`"${title || id}" est désormais en Vedette sur le HERO de la page d'accueil !`);
    } catch (err) {
      flashError(err, "Échec de la mise en Vedette.");
    }
  };

  // Sponsored is a simple per-listing toggle — several listings can be
  // sponsored at once, unlike the single hero feature.
  const handleToggleSponsored = async (item) => {
    const next = !item.isSponsored;
    try {
      await setSponsoredStatusInDb(item.id, next);
      setListings(prev => prev.map(l => l.id === item.id ? { ...l, isSponsored: next } : l));
      showToast(next ? `"${item.title}" est maintenant Sponsorisée.` : `"${item.title}" n'est plus Sponsorisée.`);
    } catch (err) {
      flashError(err, "Échec de la mise à jour du statut Sponsorisé.");
    }
  };

  // Filtered Listings logic
  const filteredListings = listings.filter(l => {
    const matchesSearch = (l.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (l.sellerName?.toLowerCase() || l.seller?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (l.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && l.status === 'pending';
    if (statusFilter === 'approved') return matchesSearch && (l.status === 'approved' || l.status === 'Approuvée');
    if (statusFilter === 'rejected') return matchesSearch && (l.status === 'rejected' || l.status === 'Rejetée');
    return matchesSearch;
  });

  const rejectedCount = listings.filter(l => l.status === 'rejected' || l.status === 'Rejetée').length;
  const listingCategories = [...new Set(listings.map(l => l.category).filter(Boolean))];
  const visibleListings = categoryFilter === 'all'
    ? filteredListings
    : filteredListings.filter(l => l.category === categoryFilter);

  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(visibleListings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedListings = visibleListings.slice(pageStart, pageStart + PAGE_SIZE);

  const userQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = !userQuery ? users : users.filter(u =>
    (u.name || '').toLowerCase().includes(userQuery) ||
    (u.email || '').toLowerCase().includes(userQuery) ||
    (u.location || '').toLowerCase().includes(userQuery)
  );

  const goToTab = (tab) => {
    setActiveTab(tab);
    setOpenMenuId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToListings = (status) => {
    setActiveTab('listings');
    setStatusFilter(status);
    setPage(1);
    setOpenMenuId(null);
    requestAnimationFrame(() => {
      listingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const runMenuAction = (action) => {
    setOpenMenuId(null);
    action();
  };

  const renderBanButton = (u) => {
    const banned = u.status === 'Banned' || u.status === 'Banni';
    return (
      <button
        onClick={() => handleUserStatus(u.id, banned ? 'Active' : 'Banned', u.name)}
        className={`h-10 md:h-9 px-3 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition ${
          banned
            ? 'bg-[#e2f6d5] text-[#163300] hover:bg-[#9FE870]'
            : 'bg-[#ffede8] text-[#a72027] hover:bg-[#a72027] hover:text-white'
        }`}
      >
        <Ban className="w-4 h-4" />
        {banned ? 'Réactiver' : 'Bannir'}
      </button>
    );
  };

  // If verifying auth or if user is NOT an admin, show redirection spinner without displaying any error card
  if (authChecking || !currentUser || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 font-body bg-[#e8ebe6]">
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-[#e8ebe6] shadow-md">
          <div className="w-10 h-10 border-4 border-[#0e0f0c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#0e0f0c]">Redirection vers le profil...</p>
        </div>
      </div>
    );
  }

  const adminInitial = (currentUser.displayName || currentUser.email || 'A').charAt(0).toUpperCase();
  const isModeration = activeTab === 'listings' && statusFilter === 'pending';
  const sectionTitle = activeTab === 'users'
    ? 'Utilisateurs'
    : activeTab === 'notifications'
    ? 'Notifications'
    : isModeration ? 'Modération' : "Vue d'ensemble";

  const pageHeading = activeTab === 'users'
    ? { title: 'Utilisateurs', subtitle: 'Gérez les membres, leurs rôles et leur statut.' }
    : activeTab === 'notifications'
    ? { title: 'Notifications', subtitle: 'Alertes de modération et activité de la plateforme.' }
    : { title: 'Tableau de bord', subtitle: 'Gérez vos annonces et votre communauté.' };

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, active: activeTab === 'listings' && !isModeration, onClick: () => goToListings('all') },
    { key: 'users', label: 'Utilisateurs', icon: Users, count: users.length, active: activeTab === 'users', onClick: () => goToTab('users') },
    { key: 'moderation', label: 'Modération', icon: ShieldCheck, count: pendingCount, highlight: pendingCount > 0, active: isModeration, onClick: () => goToListings('pending') },
    { key: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotifsCount, alert: unreadNotifsCount > 0, active: activeTab === 'notifications', onClick: () => goToTab('notifications') },
  ];

  const statusPills = [
    { key: 'all', label: 'Toutes', count: listings.length },
    { key: 'pending', label: 'En attente', count: pendingCount },
    { key: 'approved', label: 'Approuvées', count: approvedCount },
    { key: 'rejected', label: 'Rejetées', count: rejectedCount },
  ];

  const kpis = [
    { label: 'Volume des annonces', value: `${totalVolume.toLocaleString('fr-FR')} TND`, icon: FileText, iconClass: 'bg-[#e2f6d5] text-[#163300]' },
    { label: 'Annonces', value: listings.length, icon: Tag, iconClass: 'bg-[#e2f6d5] text-[#163300]' },
    { label: 'Membres', value: users.length, icon: Users, iconClass: 'bg-[#e0f4fd] text-[#0b6a8c]' },
    { label: 'À valider', value: pendingCount, icon: Clock, iconClass: 'bg-[#ffe6cc] text-[#b86700]', cardClass: 'bg-[#fff6ea] border-[#ffe6cc]' },
  ];

  const renderRowMenu = (item, align = 'right') => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
        className="w-9 h-9 rounded-lg border border-[#e8ebe6] bg-white text-[#454745] hover:bg-[#e8ebe6] flex items-center justify-center transition"
        aria-label="Plus d'actions"
        aria-expanded={openMenuId === item.id}
      >
        <Ellipsis className="w-4 h-4" />
      </button>
      {openMenuId === item.id && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} aria-hidden="true" />
          <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 w-56 bg-white rounded-xl border border-[#e8ebe6] shadow-xl py-1.5 text-xs font-bold text-[#0e0f0c]`}>
            <Link href={`/product/${item.id}`} target="_blank" onClick={() => setOpenMenuId(null)} className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f7f8f5]">
              <Eye className="w-4 h-4 text-[#454745]" /> Voir l'annonce
            </Link>
            {item.status !== 'approved' && (
              <button onClick={() => runMenuAction(() => handleApproveListing(item))} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f7f8f5]">
                <Check className="w-4 h-4 text-[#054d28]" /> Approuver
              </button>
            )}
            {item.status !== 'rejected' && (
              <button onClick={() => runMenuAction(() => openReasonModal(item, 'reject'))} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f7f8f5]">
                <XCircle className="w-4 h-4 text-[#b86700]" /> Rejeter
              </button>
            )}
            <button onClick={() => runMenuAction(() => handleSetHeroFeatured(item.id, item.title))} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f7f8f5]">
              <Star className={`w-4 h-4 ${item.isHeroFeatured ? 'fill-[#9FE870] text-[#163300]' : 'text-[#454745]'}`} />
              {item.isHeroFeatured ? 'En vedette sur l’accueil' : 'Mettre en vedette'}
            </button>
            <button onClick={() => runMenuAction(() => handleToggleSponsored(item))} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f7f8f5]">
              <Megaphone className={`w-4 h-4 ${item.isSponsored ? 'fill-[#ffc091] text-[#b86700]' : 'text-[#454745]'}`} />
              {item.isSponsored ? 'Retirer le sponsoring' : 'Sponsoriser'}
            </button>
            <div className="my-1 border-t border-[#e8ebe6]" />
            <button onClick={() => runMenuAction(() => openReasonModal(item, 'delete'))} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#fff0ee] text-[#a72027]">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderPrimaryAction = (item, fullWidth = false) => (
    item.status === 'pending' ? (
      <button
        onClick={() => handleApproveListing(item)}
        className={`${fullWidth ? 'flex-1' : 'w-32'} h-9 rounded-lg bg-[#e2f6d5] text-[#163300] hover:bg-[#9FE870] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition`}
      >
        <Check className="w-4 h-4" /> Approuver
      </button>
    ) : (
      <Link
        href={`/product/${item.id}`}
        target="_blank"
        className={`${fullWidth ? 'flex-1' : 'w-32'} h-9 rounded-lg border border-[#e8ebe6] bg-white text-[#0e0f0c] hover:bg-[#f7f8f5] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition`}
      >
        <Eye className="w-4 h-4" /> Voir
      </Link>
    )
  );

  const listingBadges = (item) => (
    (item.isHeroFeatured || item.isSponsored || item.aiModeration) && (
      <span className="inline-flex items-center gap-1 align-middle">
        {item.isHeroFeatured && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0e0f0c]" title="En vedette sur l'accueil">
            <Star className="w-2.5 h-2.5 fill-[#9FE870] text-[#9FE870]" />
          </span>
        )}
        {item.isSponsored && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#fff0df]" title="Sponsorisée">
            <Megaphone className="w-2.5 h-2.5 text-[#b86700]" />
          </span>
        )}
        {item.aiModeration && (
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e2f6d5]"
            title={`IA : ${item.aiModeration.decision === 'approve' ? 'approuvé' : 'rejeté'} — ${item.aiModeration.reason || ''}`}
          >
            <Sparkles className="w-2.5 h-2.5 text-[#163300]" />
          </span>
        )}
      </span>
    )
  );

  return (
    <div className="min-h-dvh bg-[#f7f8f5] font-body text-[#454745] lg:flex">

      {/* ───────── Desktop sidebar ───────── */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-[#e8ebe6] sticky top-0 h-dvh">
        <Link href="/" className="flex items-center gap-2.5 px-6 h-20">
          <img src="/logoBg.png" alt="" className="w-9 h-9 rounded-lg object-contain" />
          <span className="font-heading font-extrabold text-lg text-[#0e0f0c]">TanitMarket</span>
        </Link>

        <nav className="flex-1 px-3 space-y-1" aria-label="Administration">
          {navItems.map(({ key, label, icon: Icon, count, highlight, alert, active, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm font-bold transition ${
                active ? 'bg-[#e2f6d5] text-[#0e0f0c]' : 'text-[#454745] hover:bg-[#f7f8f5] hover:text-[#0e0f0c]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {count > 0 && (
                <span className={`min-w-[26px] h-6 px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                  alert ? 'bg-[#ffe3e0] text-[#a72027]' : highlight ? 'bg-[#fff0df] text-[#b86700]' : 'bg-[#e2f6d5] text-[#163300]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
          <Link
            href="/profile?tab=settings"
            className="w-full flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm font-bold text-[#454745] hover:bg-[#f7f8f5] hover:text-[#0e0f0c] transition"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Paramètres</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-[#e8ebe6]">
          <Link href="/" className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-sm font-bold text-[#454745] hover:bg-[#f7f8f5] hover:text-[#0e0f0c] transition">
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            <span>Retour au marché</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">

        {/* ───────── Desktop top bar ───────── */}
        <header className="hidden lg:flex items-center gap-6 h-16 px-8 bg-white/90 backdrop-blur border-b border-[#e8ebe6] sticky top-0 z-30">
          <nav className="flex items-center gap-2 text-sm text-[#868685] min-w-0" aria-label="Fil d'Ariane">
            <House className="w-4 h-4 shrink-0" />
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#0e0f0c] font-bold truncate">{sectionTitle}</span>
          </nav>
          <div className="relative flex-1 max-w-md ml-auto">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Rechercher une annonce, un utilisateur..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-[#e8ebe6] bg-[#f7f8f5] text-[#0e0f0c] placeholder:text-[#868685] focus:outline-none focus:border-[#0e0f0c] focus:bg-white"
            />
          </div>
          <button
            onClick={() => goToTab('notifications')}
            className="relative w-10 h-10 rounded-full hover:bg-[#f7f8f5] flex items-center justify-center text-[#0e0f0c]"
            aria-label={`Notifications (${unreadNotifsCount} non lues)`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d03238] text-white text-[10px] font-extrabold flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>
          <Link href="/profile" className="flex items-center gap-1.5 text-[#454745] hover:text-[#0e0f0c]" title="Mon profil">
            <span className="w-9 h-9 rounded-full bg-[#6d4fd8] text-white text-sm font-extrabold flex items-center justify-center">{adminInitial}</span>
            <ChevronDown className="w-4 h-4" />
          </Link>
        </header>

        {/* ───────── Mobile top bar ───────── */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e8ebe6] pt-safe">
          <div className="flex items-center gap-3 h-14 px-4">
            <Link href="/" className="flex items-center gap-2 mr-auto">
              <img src="/logoBg.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-heading font-extrabold text-base text-[#0e0f0c]">TanitMarket</span>
            </Link>
            <button
              onClick={() => goToTab('notifications')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#0e0f0c]"
              aria-label={`Notifications (${unreadNotifsCount} non lues)`}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d03238] text-white text-[10px] font-extrabold flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
            <Link href="/profile" className="w-9 h-9 rounded-full bg-[#6d4fd8] text-white text-sm font-extrabold flex items-center justify-center" title="Mon profil">
              {adminInitial}
            </Link>
          </div>
        </header>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7 space-y-5 lg:space-y-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10">

          {/* Page heading */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0e0f0c] leading-tight">{pageHeading.title}</h1>
              <p className="text-sm text-[#868685] mt-0.5">
                <span className="sm:hidden">Administration</span>
                <span className="hidden sm:inline">{pageHeading.subtitle}</span>
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 h-11 px-4 sm:px-5 rounded-xl bg-[#9FE870] hover:bg-[#cdffad] active:bg-[#c5edab] text-[#0e0f0c] text-sm font-extrabold inline-flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:hidden">Annonce</span>
              <span className="hidden sm:inline">Publier une annonce</span>
            </button>
          </div>

          {/* Section switcher (mobile & tablet — desktop uses the sidebar) */}
          <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar">
            {navItems.map(({ key, label, count, active, onClick }) => (
              <button
                key={key}
                onClick={onClick}
                className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition ${
                  active ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-white border border-[#e8ebe6] text-[#454745]'
                }`}
              >
                {label}{count > 0 ? ` (${count})` : ''}
              </button>
            ))}
          </div>

          {activeTab === 'listings' && (
            <>
              {/* Welcome banner (tablet & desktop) */}
              <section className="hidden sm:flex relative overflow-hidden items-center gap-5 rounded-2xl bg-[#163300] px-6 lg:px-8 py-6 text-white">
                <Sprout className="absolute -right-6 -bottom-8 w-48 h-48 text-white/5 rotate-12 pointer-events-none" aria-hidden="true" />
                <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Sprout className="w-7 h-7 text-[#9FE870]" />
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-extrabold text-xl lg:text-2xl text-white">Bienvenue dans votre espace admin</h2>
                  <p className="text-sm lg:text-base text-[#e2f6d5]/90">
                    {pendingCount > 0
                      ? `${pendingCount} annonce${pendingCount > 1 ? 's attendent' : ' attend'} votre validation.`
                      : 'Aucune annonce en attente de validation. 🎉'}
                  </p>
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={() => goToListings('pending')}
                    className="relative shrink-0 h-11 px-5 rounded-full border border-white/40 text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-white hover:text-[#163300] transition"
                  >
                    Voir les annonces <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                )}
              </section>

              {/* KPI cards */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4" aria-label="Indicateurs clés">
                {kpis.map(({ label, value, icon: Icon, iconClass, cardClass }) => (
                  <div key={label} className={`rounded-2xl border p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 ${cardClass || 'bg-white border-[#e8ebe6]'}`}>
                    <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </span>
                    <div className="min-w-0 flex flex-col-reverse sm:flex-col">
                      <div className="text-[11px] sm:text-sm text-[#454745] leading-tight">{label}</div>
                      <div className="font-heading font-extrabold text-base sm:text-2xl text-[#0e0f0c] leading-tight whitespace-nowrap">{value}</div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Pending call-out (mobile) */}
              {pendingCount > 0 && !isModeration && (
                <button
                  onClick={() => goToListings('pending')}
                  className="sm:hidden w-full flex items-center gap-3 rounded-2xl bg-[#fff6ea] border border-[#ffe6cc] p-4 text-left"
                >
                  <span className="w-10 h-10 rounded-full bg-[#ffe6cc] text-[#b86700] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-extrabold text-sm text-[#0e0f0c]">{pendingCount} annonce{pendingCount > 1 ? 's' : ''} à valider</span>
                    <span className="block text-xs text-[#454745]">{pendingCount > 1 ? 'Elles attendent' : 'Elle attend'} votre validation.</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#0e0f0c] rtl:rotate-180" />
                </button>
              )}

              {/* Listings management */}
              <section ref={listingsSectionRef} className="scroll-mt-20 sm:bg-white sm:rounded-2xl sm:border sm:border-[#e8ebe6] sm:p-5 lg:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-[#0e0f0c]">Gestion des annonces</h2>
                      <p className="hidden sm:block text-sm text-[#868685]">Modération et gestion des annonces en Tunisie.</p>
                    </div>
                    {statusFilter !== 'all' && (
                      <button onClick={() => { setStatusFilter('all'); setPage(1); }} className="sm:hidden text-sm font-bold text-[#0e0f0c] shrink-0">
                        Voir tout
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:w-auto">
                    <div className="relative flex-1 md:w-72">
                      <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        placeholder="Rechercher une annonce..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-[#e8ebe6] bg-white text-[#0e0f0c] placeholder:text-[#868685] focus:outline-none focus:border-[#0e0f0c]"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(v => !v)}
                      aria-expanded={showFilters}
                      className={`h-11 px-3 sm:px-4 rounded-xl border text-sm font-bold inline-flex items-center gap-2 transition ${
                        showFilters || categoryFilter !== 'all'
                          ? 'bg-[#0e0f0c] border-[#0e0f0c] text-[#9FE870]'
                          : 'bg-white border-[#e8ebe6] text-[#0e0f0c] hover:bg-[#f7f8f5]'
                      }`}
                      aria-label="Filtres"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">Filtres</span>
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#f7f8f5] border border-[#e8ebe6]">
                    <span className="text-xs font-bold text-[#454745] mr-1">Catégorie :</span>
                    {['all', ...listingCategories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoryFilter(cat); setPage(1); }}
                        className={`h-8 px-3 rounded-full text-xs font-bold transition ${
                          categoryFilter === cat ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-white border border-[#e8ebe6] text-[#454745] hover:text-[#0e0f0c]'
                        }`}
                      >
                        {cat === 'all' ? 'Toutes' : categoryMeta(cat).label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Status pills */}
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filtrer par statut">
                  {statusPills.map(({ key, label, count }) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={statusFilter === key}
                      onClick={() => { setStatusFilter(key); setPage(1); }}
                      className={`shrink-0 h-10 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition ${
                        statusFilter === key ? 'bg-[#163300] text-white' : 'bg-[#f0f2ee] text-[#454745] hover:text-[#0e0f0c]'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>

                {pagedListings.length === 0 ? (
                  <div className="py-12 text-center space-y-2 bg-white rounded-2xl sm:bg-transparent border border-[#e8ebe6] sm:border-0">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-[#2ead4b]" />
                    <p className="font-extrabold text-sm text-[#0e0f0c]">
                      {statusFilter === 'pending' && !searchQuery && categoryFilter === 'all' ? 'Rien à modérer 🎉' : 'Aucune annonce ne correspond.'}
                    </p>
                    {(searchQuery || categoryFilter !== 'all') && (
                      <button
                        onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setPage(1); }}
                        className="text-xs font-bold text-[#0e0f0c] underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <ul className="md:hidden space-y-3">
                      {pagedListings.map((item) => (
                        <li key={item.id} className="bg-white rounded-2xl border border-[#e8ebe6] p-3 flex gap-3">
                          <img
                            src={listingImage(item)}
                            alt={item.title}
                            className="w-20 h-20 rounded-xl object-cover bg-[#e8ebe6] shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <Link href={`/product/${item.id}`} target="_blank" className="block font-extrabold text-sm text-[#0e0f0c] truncate">
                                  {item.title}
                                </Link>
                                <div className="font-heading font-extrabold text-sm text-[#0e0f0c]">{formatTnd(item.price)}</div>
                                <div className="text-[11px] text-[#868685] truncate">
                                  Par {sellerName(item)} • {listingPlace(item)} {listingBadges(item)}
                                </div>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="flex items-center gap-2">
                              {renderPrimaryAction(item, true)}
                              {renderRowMenu(item)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                      <table className="w-full text-left text-sm table-fixed">
                        <thead>
                          <tr className="bg-[#f7f8f5] text-[#454745] text-xs">
                            <th className="py-3 pl-3 font-bold rounded-l-lg">Annonce</th>
                            <th className="py-3 font-bold w-[18%] hidden lg:table-cell">Catégorie</th>
                            <th className="py-3 font-bold w-[14%]">Prix</th>
                            <th className="py-3 font-bold w-[16%]">Statut</th>
                            <th className="py-3 pr-3 font-bold w-[190px] rounded-r-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8ebe6]">
                          {pagedListings.map((item) => {
                            const cat = categoryMeta(item.category);
                            const CatIcon = cat.icon;
                            return (
                              <tr key={item.id} className="hover:bg-[#fafbf9] transition">
                                <td className="py-3 pl-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img
                                      src={listingImage(item)}
                                      alt={item.title}
                                      className="w-14 h-11 rounded-lg object-cover bg-[#e8ebe6] shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Link href={`/product/${item.id}`} target="_blank" className="font-extrabold text-[#0e0f0c] hover:underline truncate">
                                          {item.title}
                                        </Link>
                                        {listingBadges(item)}
                                      </div>
                                      <div className="text-xs text-[#868685] truncate">Par {sellerName(item)} • {listingPlace(item)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 hidden lg:table-cell">
                                  <span className="flex items-center gap-2 text-[#454745] min-w-0">
                                    <CatIcon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{cat.label}</span>
                                  </span>
                                </td>
                                <td className="py-3 font-extrabold text-[#0e0f0c] whitespace-nowrap">{formatTnd(item.price)}</td>
                                <td className="py-3"><StatusBadge status={item.status} /></td>
                                <td className="py-3 pr-3">
                                  <div className="flex items-center gap-2">
                                    {renderPrimaryAction(item)}
                                    {renderRowMenu(item)}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <p className="text-xs sm:text-sm text-[#454745]">
                        {pageStart + 1} – {pageStart + pagedListings.length} sur {visibleListings.length} annonce{visibleListings.length > 1 ? 's' : ''}
                      </p>
                      {totalPages > 1 && (
                        <nav className="flex items-center gap-1.5" aria-label="Pagination">
                          <button
                            onClick={() => setPage(safePage - 1)}
                            disabled={safePage === 1}
                            className="w-9 h-9 rounded-lg border border-[#e8ebe6] bg-white flex items-center justify-center text-[#0e0f0c] disabled:opacity-40"
                            aria-label="Page précédente"
                          >
                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <button
                              key={n}
                              onClick={() => setPage(n)}
                              aria-current={n === safePage ? 'page' : undefined}
                              className={`w-9 h-9 rounded-lg text-sm font-bold ${
                                n === safePage ? 'bg-[#163300] text-white' : 'border border-[#e8ebe6] bg-white text-[#0e0f0c]'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            onClick={() => setPage(safePage + 1)}
                            disabled={safePage === totalPages}
                            className="w-9 h-9 rounded-lg border border-[#e8ebe6] bg-white flex items-center justify-center text-[#0e0f0c] disabled:opacity-40"
                            aria-label="Page suivante"
                          >
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                          </button>
                        </nav>
                      )}
                    </div>
                  </>
                )}
              </section>
            </>
          )}

          {/* ───────── Users ───────── */}
          {activeTab === 'users' && (
            <section className="bg-white rounded-2xl border border-[#e8ebe6] p-4 sm:p-5 lg:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-[#0e0f0c]">Membres ({filteredUsers.length})</h2>
                <div className="relative sm:w-72 lg:hidden">
                  <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Rechercher un membre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-[#e8ebe6] bg-white text-[#0e0f0c] focus:outline-none focus:border-[#0e0f0c]"
                  />
                </div>
              </div>

              {/* Mobile cards */}
              <ul className="md:hidden space-y-3">
                {filteredUsers.map((u) => (
                  <li key={u.id} className="border border-[#e8ebe6] rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-[#e2f6d5] text-[#163300] font-extrabold text-sm flex items-center justify-center shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm text-[#0e0f0c] truncate">{u.name || 'Membre TanitMarket'}</div>
                        <div className="text-xs text-[#868685] truncate">{u.email || 'N/A'}</div>
                      </div>
                      <UserStatusBadge status={u.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={u.role || 'Particulier'}
                        onChange={(e) => handleUserRole(u.id, e.target.value)}
                        className="flex-1 h-10 px-3 text-xs font-bold rounded-lg border border-[#e8ebe6] bg-white text-[#0e0f0c]"
                        aria-label="Rôle"
                      >
                        <option value="Particulier">Particulier</option>
                        <option value="Boutique Pro">Boutique Pro</option>
                        <option value="Admin">Admin</option>
                      </select>
                      {renderBanButton(u)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#f7f8f5] text-[#454745] text-xs">
                      <th className="py-3 pl-3 font-bold rounded-l-lg">Membre</th>
                      <th className="py-3 font-bold">Email</th>
                      <th className="py-3 font-bold hidden lg:table-cell">Localisation</th>
                      <th className="py-3 font-bold">Rôle</th>
                      <th className="py-3 font-bold">Statut</th>
                      <th className="py-3 pr-3 font-bold text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8ebe6]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#fafbf9] transition">
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-[#e2f6d5] text-[#163300] font-extrabold text-sm flex items-center justify-center shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                            <span className="font-extrabold text-[#0e0f0c]">{u.name || 'Membre TanitMarket'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-[#454745]">{u.email || 'N/A'}</td>
                        <td className="py-3 text-[#454745] hidden lg:table-cell">{u.location || '—'}</td>
                        <td className="py-3">
                          <select
                            value={u.role || 'Particulier'}
                            onChange={(e) => handleUserRole(u.id, e.target.value)}
                            className="h-9 px-2.5 text-xs font-bold rounded-lg border border-[#e8ebe6] bg-white text-[#0e0f0c] cursor-pointer"
                            aria-label="Rôle"
                          >
                            <option value="Particulier">Particulier</option>
                            <option value="Boutique Pro">Boutique Pro</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3"><UserStatusBadge status={u.status} /></td>
                        <td className="py-3 pr-3 text-right">{renderBanButton(u)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-[#868685]">Aucun membre ne correspond à la recherche.</p>
              )}
            </section>
          )}

          {/* ───────── Notifications ───────── */}
          {activeTab === 'notifications' && (
            <section className="bg-white rounded-2xl border border-[#e8ebe6] p-4 sm:p-5 lg:p-6 space-y-4">
              <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-[#0e0f0c]">
                Journal des alertes {unreadNotifsCount > 0 && <span className="text-sm font-bold text-[#a72027]">· {unreadNotifsCount} non lue{unreadNotifsCount > 1 ? 's' : ''}</span>}
              </h2>
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#868685]">Aucune notification pour le moment.</p>
              ) : (
                <ul className="space-y-2.5">
                  {notifications.map((notif) => (
                    <li key={notif.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleMarkNotifRead(notif.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleMarkNotifRead(notif.id); }}
                        className={`p-4 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
                          notif.read ? 'bg-white border-[#e8ebe6]' : 'bg-[#f3fbee] border-[#c5edab]'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-[#f0f2ee] text-[#454745]' : 'bg-[#e2f6d5] text-[#163300]'}`}>
                          <Bell className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-[#0e0f0c]">{notif.title || 'Notification'}</span>
                            {!notif.read && (
                              <span className="bg-[#0e0f0c] text-[#9FE870] text-[10px] font-extrabold px-2 py-0.5 rounded-full">Non lu</span>
                            )}
                          </div>
                          <p className="text-sm text-[#454745]">{notif.body}</p>
                          <div className="flex items-center gap-3 text-xs text-[#868685]">
                            <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('fr-FR') : 'Récent'}</span>
                            {notif.link && (
                              <Link href={notif.link} className="font-bold text-[#0e0f0c] hover:underline">
                                Voir l'annonce →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>

      {/* MODAL: POST / CREATE ADMIN LISTING */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#e8ebe6] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e8ebe6] pb-3">
              <h3 className="font-heading font-extrabold text-lg text-[#0e0f0c] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#0e0f0c]" />
                <span>Publier une Annonce Admin (POST Direct Firestore)</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-[#868685] hover:bg-[#e8ebe6] text-xs font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postSuccessMsg && (
              <div className="bg-[#e2f6d5] text-[#0e0f0c] p-3 rounded-xl text-xs font-extrabold border border-[#0e0f0c]/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0e0f0c]" />
                <span>{postSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminPostListing} className="space-y-4 text-xs font-body">
              <div>
                <label className="block font-extrabold text-[#0e0f0c] mb-1">Titre de l'Annonce *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Offre Spéciale Admin / Produit Certifié..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#0e0f0c] mb-1">Catégorie *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-extrabold rounded-xl border border-[#e8ebe6] bg-[#e8ebe6] text-[#0e0f0c]"
                  >
                    <option value="electronics">📱 Multimédia & High-Tech</option>
                    <option value="vehicles">🚗 Véhicules & Pièces Auto</option>
                    <option value="realestate">🏢 Immobilier</option>
                    <option value="fashion">👗 Mode & Accessoires</option>
                    <option value="home">🏠 Maison & Jardin</option>
                    <option value="jobs">💼 Emploi & Services</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-[#0e0f0c] mb-1">Prix (TND) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 350"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#0e0f0c] mb-1">Gouvernorat *</label>
                  <select
                    value={newGov}
                    onChange={(e) => {
                      const gov = e.target.value;
                      setNewGov(gov);
                      if (TUNISIAN_LOCATIONS[gov]) setNewCity(TUNISIAN_LOCATIONS[gov][0]);
                    }}
                    className="w-full px-3 py-2.5 text-xs font-extrabold rounded-xl border border-[#e8ebe6] bg-white text-[#0e0f0c]"
                  >
                    {Object.keys(TUNISIAN_LOCATIONS).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-[#0e0f0c] mb-1">Statut Initial *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-extrabold rounded-xl border border-[#e8ebe6] bg-[#e2f6d5] text-[#0e0f0c]"
                  >
                    <option value="approved">Approuvée immédiatement 🟢</option>
                    <option value="pending">En attente de modération 🟠</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-[#0e0f0c] mb-1">URL de l'image (Optionnel)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>

              <div>
                <label className="block font-extrabold text-[#0e0f0c] mb-1">Description *</label>
                <textarea
                  rows={3}
                  placeholder="Description officielle..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-3 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>

              <div className="p-3 bg-[#e8ebe6] rounded-xl border border-[#e8ebe6] space-y-3">
                <p className="font-extrabold text-[#0e0f0c] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Coordonnées du vendeur (optionnel)
                </p>
                <p className="text-[11px] text-[#868685] -mt-2">
                  Laissez vide pour publier sous votre identité admin. Dès qu'un champ ci-dessous est rempli, l'annonce est publiée entièrement au nom de ce vendeur (pas le vôtre) : son nom, son téléphone et son lien Facebook/Messenger seront affichés sur l'annonce — elle n'apparaîtra pas dans "Mes annonces" de votre compte admin.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom du vendeur"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                  />
                  <input
                    type="text"
                    placeholder="Téléphone (ex: +216 98 123 456)"
                    value={newSellerPhone}
                    onChange={(e) => setNewSellerPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Lien Facebook ou Messenger (optionnel)"
                  value={newSellerSocialUrl}
                  onChange={(e) => setNewSellerSocialUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e8ebe6]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="button-tanit-secondary text-xs font-bold py-2.5 px-4"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting}
                  className="button-tanit-primary text-xs font-extrabold py-2.5 px-6 disabled:opacity-50"
                >
                  {postSubmitting ? 'Publication en cours...' : 'Poster dans Firestore 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT / DELETE REASON */}
      {reasonModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e8ebe6]">
            <div className="flex items-center justify-between border-b border-[#e8ebe6] pb-3">
              <h3 className="font-heading font-extrabold text-lg text-[#0e0f0c] flex items-center gap-2">
                {reasonModal.mode === 'reject' ? (
                  <XCircle className="w-5 h-5 text-[#b86700]" />
                ) : (
                  <Trash2 className="w-5 h-5 text-[#a72027]" />
                )}
                <span>{reasonModal.mode === 'reject' ? 'Refuser cette annonce' : 'Supprimer définitivement'}</span>
              </h3>
              <button
                onClick={() => setReasonModal(null)}
                className="p-1 rounded-full text-[#868685] hover:bg-[#e8ebe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#868685]">
              <span className="font-bold text-[#0e0f0c]">"{reasonModal.title || 'Cette annonce'}"</span> —
              indiquez au vendeur pourquoi{reasonModal.mode === 'reject' ? ' son annonce est refusée' : ' son annonce a été supprimée'}.
              {reasonModal.mode === 'delete' && ' Cette action est irréversible.'}
            </p>

            <textarea
              rows={3}
              autoFocus
              placeholder="Ex : Photos non conformes, prix incohérent, article interdit à la vente..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-white text-[#0e0f0c]"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="button-tanit-secondary text-xs font-bold py-2.5 px-4"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={reasonSubmitting || (reasonModal.mode === 'reject' && !reasonText.trim())}
                onClick={confirmReasonModal}
                className={`text-xs font-extrabold py-2.5 px-6 rounded-xl disabled:opacity-50 ${
                  reasonModal.mode === 'reject'
                    ? 'bg-[#b86700] text-white hover:bg-amber-700'
                    : 'bg-[#a72027] text-white hover:bg-red-700'
                }`}
              >
                {reasonSubmitting
                  ? 'Envoi en cours...'
                  : reasonModal.mode === 'reject' ? 'Confirmer le refus' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
