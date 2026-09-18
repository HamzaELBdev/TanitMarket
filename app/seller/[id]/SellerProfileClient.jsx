"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Package,
  MessageSquare,
  Loader2,
  UserX
} from 'lucide-react';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserProfileFromDb,
  fetchAdminListingsFromDb,
  normalizeStatus,
  subscribeToSellerReviews,
  submitSellerReview
} from '@/lib/firestoreService';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/swal';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="p-0.5 cursor-pointer"
          >
            <Star className={`w-6 h-6 transition ${filled ? 'fill-[#9fe870] text-[#0e0f0c]' : 'text-[#e8ebe6] hover:text-[#9fe870]'}`} />
          </button>
        );
      })}
    </div>
  );
}

export default function SellerProfileClient() {
  const { t } = useLanguage();
  const params = useParams();
  const { user } = useAuth();

  // Trust the real browser URL first: this is a static export where every
  // /seller/** request the hosting rewrite can't match to a pre-built page
  // falls back to serving seller/_shell's shell (see firebase.json), so for
  // any seller not known at the last build, `useParams()` would incorrectly
  // resolve to "_shell" even though the address bar is correct.
  const getResolvedSellerId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const idx = pathParts.indexOf('seller');
      if (idx !== -1 && pathParts[idx + 1]) {
        return decodeURIComponent(pathParts[idx + 1]);
      }
    }
    let id = params?.id;
    if (Array.isArray(id)) id = id[0];
    return id || null;
  };

  const sellerId = getResolvedSellerId();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!sellerId || sellerId === '_shell') return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [userDoc, dbListings] = await Promise.all([
          getUserProfileFromDb(sellerId),
          fetchAdminListingsFromDb()
        ]);
        if (!mounted) return;

        const allListings = [...MOCK_FEATURED_PRODUCTS, ...(dbListings || [])];
        const matchingListings = allListings.filter(
          (p) => p.sellerId === sellerId || p.seller?.id === sellerId
        );
        const fallbackSellerInfo = matchingListings[0]?.seller || null;

        if (!userDoc && !fallbackSellerInfo) {
          setNotFound(true);
        } else {
          setSellerProfile({
            name: userDoc?.name || fallbackSellerInfo?.name || t('chatDefaultSeller'),
            avatar: userDoc?.avatarUrl || fallbackSellerInfo?.avatar || '',
            location: userDoc?.location || fallbackSellerInfo?.location || '',
            phone: userDoc?.phoneNumber || fallbackSellerInfo?.phone || '',
            bio: userDoc?.bio || '',
            joined: userDoc?.joined || null,
            verified: fallbackSellerInfo?.verified ?? true
          });
        }

        const approved = matchingListings.filter(
          (p) => normalizeStatus(p.status, 'approved') === 'approved'
        );
        const uniqueListings = Array.from(new Map(approved.map((p) => [String(p.id), p])).values());
        setSellerListings(uniqueListings);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [sellerId, t]);

  useEffect(() => {
    if (!sellerId || sellerId === '_shell') return;
    const unsub = subscribeToSellerReviews(sellerId, setReviews);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [sellerId]);

  const myReview = useMemo(
    () => reviews.find((r) => r.authorId === user?.uid) || null,
    [reviews, user?.uid]
  );

  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.rating || 0);
      setReviewComment(myReview.comment || '');
    }
  }, [myReview]);

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
    : 0;
  const roundedAvg = Math.round(avgRating);

  const isOwnProfile = user?.uid === sellerId;
  const canReview = user && !isOwnProfile;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating < 1) {
      showToast(t('sellerReviewSelectStar'), 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitSellerReview(sellerId, {
        authorId: user.uid,
        authorName: user.displayName || (user.email ? user.email.split('@')[0] : 'Utilisateur'),
        authorAvatar: user.photoURL || '',
        rating: reviewRating,
        comment: reviewComment
      });
      showToast(t('sellerReviewSuccess'), 'success');
    } catch (err) {
      showToast(err?.message || t('sellerReviewError'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center text-xs font-bold text-[#868685] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> {t('sellerLoading')}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body">
          <div className="w-16 h-16 rounded-full bg-[#e8ebe6] text-[#868685] flex items-center justify-center mx-auto">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#0e0f0c]">{t('sellerNotFoundTitle')}</h2>
          <p className="text-xs text-[#868685]">{t('sellerNotFoundDesc')}</p>
          <Button href="/" variant="primary" size="md">{t('sellerBackBtn')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8 font-body">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#454745] hover:text-[#0e0f0c] transition">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('sellerBackBtn')}
      </Link>

      {/* Seller Header */}
      <div className="card-tanit-panel flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <img
          src={sellerProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'}
          alt={sellerProfile.name}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#9fe870] shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#0e0f0c] truncate">{sellerProfile.name}</h1>
            {sellerProfile.verified && <CheckCircle2 className="w-4.5 h-4.5 text-[#2ead4b] shrink-0" />}
          </div>

          {sellerProfile.location && (
            <span className="text-xs text-[#868685] flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {sellerProfile.location}
            </span>
          )}

          {sellerProfile.joined && (
            <p className="text-[11px] text-[#868685]">{t('sellerMemberSince', { date: sellerProfile.joined })}</p>
          )}

          {sellerProfile.bio && (
            <p className="text-xs text-[#454745] italic pt-1 max-w-lg">{sellerProfile.bio}</p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-1 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < roundedAvg ? 'fill-[#9fe870] text-[#0e0f0c]' : 'text-[#e8ebe6]'}`} />
            ))}
            <span className="text-xs font-semibold text-[#454745] ml-1">
              {t('sellerReviewsCount', { n: reviews.length })}
            </span>
          </div>
        </div>
      </div>

      {/* Listings */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-heading font-black text-[#0e0f0c] flex items-center gap-1.5">
          <Package className="w-5 h-5" /> {t('sellerListingsTitle')}
        </h2>
        {sellerListings.length === 0 ? (
          <div className="card-tanit-panel text-center p-8 text-xs font-semibold text-[#868685]">
            {t('sellerNoListings')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {sellerListings.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-heading font-black text-[#0e0f0c] flex items-center gap-1.5">
          <Star className="w-5 h-5" /> {t('sellerReviewsTitle')}
        </h2>

        {canReview && (
          <form onSubmit={handleSubmitReview} className="card-tanit-panel space-y-3">
            <h3 className="text-sm font-bold text-[#0e0f0c]">{t('sellerWriteReviewTitle')}</h3>
            <StarPicker value={reviewRating} onChange={setReviewRating} />
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('sellerReviewPlaceholder')}
              rows={3}
              className="w-full p-3 text-xs rounded-xl border border-[#e8ebe6] focus:outline-none focus:ring-2 focus:ring-[#9FE870] bg-white text-[#454745] resize-none"
            />
            <Button type="submit" variant="primary" size="sm" disabled={submittingReview}>
              {submittingReview ? t('sellerSubmittingReview') : (myReview ? t('sellerUpdateReviewBtn') : t('sellerSubmitReviewBtn'))}
            </Button>
          </form>
        )}

        {!user && (
          <div className="card-tanit-panel text-center p-5 text-xs font-semibold text-[#868685] flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" /> {t('sellerReviewLoginPrompt')}
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="card-tanit-panel text-center p-8 text-xs font-semibold text-[#868685]">
            {t('sellerNoReviews')}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="card-tanit-panel space-y-2">
                <div className="flex items-center gap-2.5">
                  {review.authorAvatar ? (
                    <img src={review.authorAvatar} alt={review.authorName} className="w-9 h-9 rounded-full object-cover border border-[#e8ebe6] shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0e0f0c] text-[#9FE870] text-xs font-black flex items-center justify-center shrink-0">
                      {(review.authorName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0e0f0c] truncate">{review.authorName}</h4>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-[#9fe870] text-[#0e0f0c]' : 'text-[#e8ebe6]'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-[#454745] leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
