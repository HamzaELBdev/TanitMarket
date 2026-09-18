"use client";
import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { MOCK_ADMIN_STATS, MOCK_ADMIN_LISTINGS, MOCK_ADMIN_USERS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { TUNISIAN_LOCATIONS } from '@/lib/tunisianLocations';
import {
  subscribeAdminListings,
  subscribeAdminUsers,
  subscribeToNotifications,
  updateListingStatusInDb,
  setHeroFeaturedListingInDb,
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

export default function AdminDashboardPage() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'listings' | 'users' | 'notifications'
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

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
        location: `${newCity}, ${newGov}, Tunisie`,
        status: newStatus, // 'approved' or 'pending'
        seller: {
          id: currentUser?.uid || 'admin-root',
          name: currentUser?.displayName || 'Administrateur TanitMarket',
          avatar: currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
          rating: 5.0,
          verified: true,
          location: `${newCity}, ${newGov}`
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

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-6 space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-12 font-body text-[#454745]">
      
      {/* Admin Top Header (Forest Green #0e0f0c Panel) */}
      <div className="bg-[#0e0f0c] rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#9FE870] text-[#0e0f0c] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Administration TanitMarket
            </span>
            <span className="text-xs text-[#e2f6d5] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#9FE870] animate-pulse"></span> Firestore En Direct
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#9FE870]">Tableau de Bord Administration</h1>
          <p className="text-xs text-[#e2f6d5]/80">Gestion complète GET / POST / UPDATE / DELETE de la base de données Firestore 🇹🇳</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="button-tanit-lime text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle className="w-4 h-4 text-[#0e0f0c]" />
            <span>➕ Publier une Annonce Admin</span>
          </button>
          <Link
            href="/"
            className="p-2.5 rounded-lg bg-white/10 hover:bg-[#9FE870] hover:text-[#0e0f0c] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Marché</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (Computed from Real Firestore Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue / Volume */}
        <div className="card-tanit-panel p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#868685]">Volume Annonces (TND)</span>
            <div className="w-9 h-9 rounded-lg bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#0e0f0c]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0e0f0c]">{totalVolume.toLocaleString()} TND</div>
          <div className="text-[11px] font-bold text-[#0e0f0c]">
            <span>{approvedCount} annonces validées</span>
          </div>
        </div>

        {/* Total Listings */}
        <div className="card-tanit-panel p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#868685]">Total Annonces</span>
            <div className="w-9 h-9 rounded-lg bg-[#e8ebe6] text-[#0e0f0c] border border-[#e8ebe6] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#0e0f0c]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0e0f0c]">{listings.length}</div>
          <div className="text-[11px] font-bold text-[#868685]">
            <span>{pendingCount} en attente de validation</span>
          </div>
        </div>

        {/* Registered Users */}
        <div className="card-tanit-panel p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#868685]">Membres Firestore</span>
            <div className="w-9 h-9 rounded-lg bg-[#e8ebe6] text-[#0e0f0c] border border-[#e8ebe6] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0e0f0c]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0e0f0c]">{users.length}</div>
          <div className="text-[11px] font-bold text-[#0e0f0c]">
            <span>{activeUsersCount} membres actifs</span>
          </div>
        </div>

        {/* Pending Approvals / Notifications */}
        <div className="card-tanit-panel p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#868685]">Alertes Modération</span>
            <div className="w-9 h-9 rounded-lg bg-[#FFF0DF] text-[#b86700] flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-[#b86700]" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#0e0f0c]">{pendingCount}</div>
          <div className="text-[11px] font-bold text-[#b86700]">
            <span>{pendingCount > 0 ? 'Modération requise' : 'Aucune annonce en attente'}</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8ebe6] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-2 px-4 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'listings' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          <span>Gestion des Annonces ({listings.length})</span>
          {pendingCount > 0 && (
            <span className="bg-[#9FE870] text-[#0e0f0c] text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            activeTab === 'users' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          Gestion des Utilisateurs ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-2 px-4 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
          }`}
        >
          <span>Notifications & Logs ({notifications.length})</span>
          {unreadNotifsCount > 0 && (
            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Table: Recent Pending & Approved Ads */}
          <div className="lg:col-span-8 card-tanit-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-lg text-[#0e0f0c]">Dernières Annonces Soumises (Temps Réel)</h3>
              <button 
                onClick={() => setActiveTab('listings')} 
                className="text-xs font-bold text-[#0e0f0c] hover:underline"
              >
                Tout afficher ➔
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e8ebe6] text-[#868685]">
                    <th className="py-3 font-bold">Annonce</th>
                    <th className="py-3 font-bold">Prix</th>
                    <th className="py-3 font-bold">Vendeur</th>
                    <th className="py-3 font-bold">Statut</th>
                    <th className="py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ebe6]">
                  {listings.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-[#e8ebe6] transition">
                      <td className="py-3 font-bold text-[#0e0f0c] max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <img 
                            src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80'} 
                            alt={item.title} 
                            className="w-8 h-8 rounded-lg object-cover border border-[#e8ebe6] shrink-0" 
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 font-extrabold text-[#0e0f0c]">{item.price} TND</td>
                      <td className="py-3 text-[#868685] max-w-[120px] truncate">
                        {item.sellerName || item.seller?.name || 'Vendeur Connecté'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          item.status === 'Approuvée' || item.status === 'approved'
                            ? 'badge-tanit-active'
                            : item.status === 'rejected' || item.status === 'Rejetée'
                            ? 'badge-tanit-error'
                            : 'badge-tanit-pending'
                        }`}>
                          {item.status === 'approved' ? 'Approuvée' : (item.status === 'pending' ? 'En attente' : item.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1">
                        <button
                          onClick={() => handleSetHeroFeatured(item.id, item.title)}
                          className={`p-1.5 rounded-full transition ${
                            item.isHeroFeatured
                              ? 'bg-[#0e0f0c] text-[#9FE870] ring-2 ring-[#9FE870]'
                              : 'bg-[#e2f6d5] text-[#0e0f0c] hover:bg-[#9FE870]'
                          }`}
                          title="Afficher cette annonce en Vedette sur le Hero d'accueil"
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isHeroFeatured ? 'fill-[#9FE870]' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleApproveListing(item)}
                          className="p-1.5 rounded-full bg-[#e2f6d5] text-[#0e0f0c] hover:bg-[#9FE870] transition"
                          title="Approuver l'annonce"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openReasonModal(item, 'reject')}
                          className="p-1.5 rounded-full bg-[#FFF0DF] text-[#b86700] hover:bg-amber-600 hover:text-white transition"
                          title="Rejeter l'annonce"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openReasonModal(item, 'delete')}
                          className="p-1.5 rounded-full bg-[#FFEDE8] text-[#a72027] hover:bg-red-700 hover:text-white transition"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Journal & Notifications */}
          <div className="lg:col-span-4 card-tanit-panel p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-[#0e0f0c]">Activités En Direct</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#e2f6d5] text-xs space-y-1 border border-[#0e0f0c]/10">
                <div className="font-extrabold text-[#0e0f0c] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0e0f0c] animate-pulse"></span> Base Firestore synchronisée
                </div>
                <div className="text-[11px] text-[#868685]">Écouteurs `onSnapshot` actifs sur `ads`, `users` et `notifications`.</div>
              </div>

              {notifications.slice(0, 4).map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => handleMarkNotifRead(notif.id)}
                  className={`p-3 rounded-xl text-xs space-y-1 border cursor-pointer transition ${
                    notif.read ? 'bg-[#e8ebe6] border-[#e8ebe6]' : 'bg-[#FFF0DF] border-[#b86700]/30 font-bold'
                  }`}
                >
                  <div className="flex items-center justify-between text-[#0e0f0c]">
                    <span className="font-extrabold flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-[#0e0f0c]" /> {notif.title || 'Notification Modération'}
                    </span>
                    <span className="text-[9px] text-[#868685]">{notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Maintenant'}</span>
                  </div>
                  <p className="text-[11px] text-[#454745]">{notif.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL LISTINGS MANAGEMENT */}
      {activeTab === 'listings' && (
        <div className="card-tanit-panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-xl text-[#0e0f0c]">Gestion Globale des Annonces</h3>
              <p className="text-xs text-[#868685]">Modération en temps réel des dépôts d'annonces en Tunisie</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1 bg-[#e8ebe6] p-1 rounded-xl border border-[#e8ebe6] text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'all' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'text-[#868685]'}`}
                >
                  Toutes ({listings.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'pending' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'text-[#868685]'}`}
                >
                  En attente ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'approved' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'text-[#868685]'}`}
                >
                  Approuvées ({approvedCount})
                </button>
              </div>

              {/* Search Field */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-4 h-4 text-[#868685] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher titre, vendeur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-[#e8ebe6] text-[#454745]"
                />
              </div>
            </div>
          </div>

          {/* Mobile card list (below sm:) */}
          <div className="sm:hidden space-y-3 pt-2">
            {filteredListings.map((item) => (
              <div key={item.id} className="border border-[#e8ebe6] rounded-xl p-3 space-y-2.5 bg-white">
                <div className="flex items-start gap-2.5">
                  <img
                    src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80'}
                    alt={item.title}
                    className="w-14 h-14 rounded-lg object-cover border border-[#e8ebe6] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.id}`} target="_blank" className="font-extrabold text-xs text-[#0e0f0c] hover:underline line-clamp-2">
                      {item.title}
                    </Link>
                    <div className="text-[10px] text-[#868685]">ID: {item.id}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="font-black text-xs text-[#0e0f0c]">{item.price} TND</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        item.status === 'Approuvée' || item.status === 'approved'
                          ? 'badge-tanit-active'
                          : item.status === 'rejected' || item.status === 'Rejetée'
                          ? 'badge-tanit-error'
                          : 'badge-tanit-pending'
                      }`}>
                        {item.status === 'approved' ? 'Approuvée' : (item.status === 'pending' ? 'En attente' : item.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#868685]">
                  <span className="capitalize">{item.category}</span>
                  <span>{item.governorate || item.location || 'Tunisie'}</span>
                </div>
                <div className="text-[10px] text-[#868685]">Vendeur : {item.sellerName || item.seller?.name || 'Vendeur'}</div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#e8ebe6]">
                  <button
                    onClick={() => handleSetHeroFeatured(item.id, item.title)}
                    className={`flex-1 p-2 rounded-lg flex items-center justify-center transition ${
                      item.isHeroFeatured
                        ? 'bg-[#0e0f0c] text-[#9FE870] ring-2 ring-[#9FE870]'
                        : 'bg-[#e2f6d5] text-[#0e0f0c]'
                    }`}
                    title="Mettre en Vedette"
                  >
                    <Star className={`w-4 h-4 ${item.isHeroFeatured ? 'fill-[#9FE870]' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleApproveListing(item)}
                    className="flex-1 p-2 rounded-lg bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center"
                    title="Approuver"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openReasonModal(item, 'reject')}
                    className="flex-1 p-2 rounded-lg bg-[#FFF0DF] text-[#b86700] flex items-center justify-center"
                    title="Rejeter"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openReasonModal(item, 'delete')}
                    className="flex-1 p-2 rounded-lg bg-[#FFEDE8] text-[#a72027] flex items-center justify-center"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table (sm: and up) */}
          <div className="hidden sm:block overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e8ebe6] text-[#868685]">
                  <th className="py-3 font-bold">Annonce</th>
                  <th className="py-3 font-bold">Prix</th>
                  <th className="py-3 font-bold">Catégorie</th>
                  <th className="py-3 font-bold">Localisation</th>
                  <th className="py-3 font-bold">Vendeur</th>
                  <th className="py-3 font-bold">Statut</th>
                  <th className="py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe6]">
                {filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-[#e8ebe6] transition">
                    <td className="py-3 font-bold text-[#0e0f0c] max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80'}
                          alt={item.title}
                          className="w-10 h-10 rounded-xl object-cover border border-[#e8ebe6] shrink-0"
                        />
                        <div>
                          <Link href={`/product/${item.id}`} target="_blank" className="font-extrabold hover:underline line-clamp-1">
                            {item.title}
                          </Link>
                          <span className="text-[10px] text-[#868685] block">ID: {item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-black text-[#0e0f0c]">{item.price} TND</td>
                    <td className="py-3 text-[#868685] capitalize">{item.category}</td>
                    <td className="py-3 text-[#868685]">{item.governorate || item.location || 'Tunisie'}</td>
                    <td className="py-3 text-[#868685]">{item.sellerName || item.seller?.name || 'Vendeur'}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        item.status === 'Approuvée' || item.status === 'approved'
                          ? 'badge-tanit-active'
                          : item.status === 'rejected' || item.status === 'Rejetée'
                          ? 'badge-tanit-error'
                          : 'badge-tanit-pending'
                      }`}>
                        {item.status === 'approved' ? 'Approuvée' : (item.status === 'pending' ? 'En attente' : item.status)}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleSetHeroFeatured(item.id, item.title)}
                        className={`p-1.5 rounded-full transition ${
                          item.isHeroFeatured
                            ? 'bg-[#0e0f0c] text-[#9FE870] ring-2 ring-[#9FE870]'
                            : 'bg-[#e2f6d5] text-[#0e0f0c] hover:bg-[#9FE870]'
                        }`}
                        title="Afficher cette annonce en Vedette sur le Hero d'accueil"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isHeroFeatured ? 'fill-[#9FE870]' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleApproveListing(item)}
                        className="p-1.5 rounded-full bg-[#e2f6d5] text-[#0e0f0c] hover:bg-[#9FE870] transition"
                        title="Valider l'annonce"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openReasonModal(item, 'reject')}
                        className="p-1.5 rounded-full bg-[#FFF0DF] text-[#b86700] hover:bg-amber-600 hover:text-white transition"
                        title="Rejeter l'annonce"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openReasonModal(item, 'delete')}
                        className="p-1.5 rounded-full bg-[#FFEDE8] text-[#a72027] hover:bg-red-700 hover:text-white transition"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="card-tanit-panel p-6 space-y-4">
          <h3 className="font-heading font-extrabold text-xl text-[#0e0f0c]">Gestion des Utilisateurs Firestore</h3>

          {/* Mobile card list (below sm:) */}
          <div className="sm:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="border border-[#e8ebe6] rounded-xl p-3 space-y-2.5 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-black text-xs flex items-center justify-center border border-[#0e0f0c]/10 shrink-0">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-[#0e0f0c] truncate">{u.name || 'Membre TanitMarket'}</div>
                    <div className="text-[10px] text-[#868685] truncate">{u.email || 'N/A'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] shrink-0 ${
                    u.status === 'Banned' || u.status === 'Banni' ? 'badge-tanit-error' : 'badge-tanit-active'
                  }`}>
                    {u.status || 'Active'}
                  </span>
                </div>
                <div className="text-[10px] text-[#868685]">{u.location || 'Tunis, Tunisie'}</div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#e8ebe6]">
                  <select
                    value={u.role || 'Particulier'}
                    onChange={(e) => handleUserRole(u.id, e.target.value)}
                    className="flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg border border-[#e8ebe6] bg-white text-[#0e0f0c]"
                  >
                    <option value="Particulier">Particulier</option>
                    <option value="Boutique Pro">Boutique Pro 🏢</option>
                    <option value="Admin">Admin 🛡️</option>
                  </select>
                  <button
                    onClick={() => handleUserStatus(u.id, u.status === 'Banned' ? 'Active' : 'Banned', u.name)}
                    className={`p-2 rounded-lg transition ${
                      u.status === 'Banned'
                        ? 'bg-[#e2f6d5] text-[#0e0f0c]'
                        : 'bg-[#FFEDE8] text-[#a72027]'
                    }`}
                    title={u.status === 'Banned' ? "Réactiver le membre" : "Bannir de TanitMarket"}
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e8ebe6] text-[#868685]">
                  <th className="py-3 font-bold">Membre</th>
                  <th className="py-3 font-bold">Email</th>
                  <th className="py-3 font-bold">Gouvernorat</th>
                  <th className="py-3 font-bold">Rôle</th>
                  <th className="py-3 font-bold">Statut</th>
                  <th className="py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe6]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#e8ebe6] transition">
                    <td className="py-3 font-bold text-[#0e0f0c] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-black text-xs flex items-center justify-center border border-[#0e0f0c]/10">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <span>{u.name || 'Membre TanitMarket'}</span>
                    </td>
                    <td className="py-3 text-[#868685]">{u.email || 'N/A'}</td>
                    <td className="py-3 text-[#868685]">{u.location || 'Tunis, Tunisie'}</td>
                    <td className="py-3">
                      <select
                        value={u.role || 'Particulier'}
                        onChange={(e) => handleUserRole(u.id, e.target.value)}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg border border-[#e8ebe6] bg-white text-[#0e0f0c] cursor-pointer"
                      >
                        <option value="Particulier">Particulier</option>
                        <option value="Boutique Pro">Boutique Pro 🏢</option>
                        <option value="Admin">Admin 🛡️</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        u.status === 'Banned' || u.status === 'Banni'
                          ? 'badge-tanit-error' 
                          : 'badge-tanit-active'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      <button 
                        onClick={() => handleUserStatus(u.id, u.status === 'Banned' ? 'Active' : 'Banned', u.name)}
                        className={`p-1.5 rounded-full transition ${
                          u.status === 'Banned' 
                            ? 'bg-[#e2f6d5] text-[#0e0f0c] hover:bg-[#9FE870]' 
                            : 'bg-[#FFEDE8] text-[#a72027] hover:bg-red-700 hover:text-white'
                        }`}
                        title={u.status === 'Banned' ? "Réactiver le membre" : "Bannir de TanitMarket"}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS LOGS */}
      {activeTab === 'notifications' && (
        <div className="card-tanit-panel p-6 space-y-4">
          <h3 className="font-heading font-extrabold text-xl text-[#0e0f0c]">Journal des Notifications & Alertes</h3>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleMarkNotifRead(notif.id)}
                className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  notif.read ? 'bg-white border-[#e8ebe6]' : 'bg-[#e2f6d5] border-[#0e0f0c]/30 shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#0e0f0c]">{notif.title}</span>
                    {!notif.read && (
                      <span className="bg-[#0e0f0c] text-[#9FE870] text-[9px] font-black px-2 py-0.5 rounded-full">Non lu</span>
                    )}
                  </div>
                  <p className="text-xs text-[#868685]">{notif.body}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#868685] block">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('fr-FR') : 'Récent'}
                  </span>
                  {notif.link && (
                    <Link href={notif.link} className="text-xs font-bold text-[#0e0f0c] hover:underline">
                      Voir l'annonce ➔
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
