"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Send,
  ShieldCheck,
  TrendingDown,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function NegotiationModal({ product, isOpen, onClose }) {
  const { t } = useLanguage();
  const router = useRouter();

  const originalPrice = product ? parseFloat(product.price) || 100 : 100;
  const [offerPrice, setOfferPrice] = useState(Math.round(originalPrice * 0.85));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setOfferPrice(Math.round((parseFloat(product.price) || 100) * 0.85));
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const savings = Math.max(0, originalPrice - offerPrice);
  const discountPercent = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);

  const presetPercentages = [5, 10, 15, 20];

  const getOfferStrengthBadge = () => {
    if (discountPercent <= 10) {
      return {
        label: t('negOfferExcellent'),
        color: "bg-[#e2f6d5] text-[#054d28]"
      };
    }
    if (discountPercent <= 20) {
      return {
        label: t('negOfferReasonable'),
        color: "bg-[#e8ebe6] text-[#0e0f0c]"
      };
    }
    return {
      label: t('negOfferAggressive'),
      color: "bg-[#ffd11a] text-[#4a3b1c]"
    };
  };

  const strengthBadge = getOfferStrengthBadge();

  const handleSubmitOffer = (e) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      onClose();
      router.push(`/chat?productId=${product.id}&offer=${offerPrice}&note=${encodeURIComponent(note)}`);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#0e0f0c]/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200 font-body">
      <div className="bg-white rounded-t-xl sm:rounded-xl max-w-lg w-full p-4 sm:p-6 relative space-y-4 max-h-[85vh] sm:max-h-[85vh] overflow-y-auto no-scrollbar pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6 text-[#0e0f0c]">

        {/* Mobile Pull Indicator Bar */}
        <div className="w-10 h-1 bg-[#0e0f0c]/15 rounded-full mx-auto sm:hidden mb-1" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#868685] hover:text-[#0e0f0c] hover:bg-[#e8ebe6] transition"
          aria-label={t('closeModalAria')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#0e0f0c]/10 pb-3">
          <div className="w-10 h-10 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center font-bold flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-[#0e0f0c]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#0e0f0c] flex items-center gap-2">
              <span>{t('negModalTitle')}</span>
              <span className="bg-[#e8ebe6] text-[#0e0f0c] font-semibold text-[10px] sm:text-xs px-2 py-0.5 rounded-full">
                TND
              </span>
            </h3>
            <p className="text-xs text-[#868685]">{t('negModalSub')}</p>
          </div>
        </div>

        {/* Product Snapshot */}
        <div className="flex items-center gap-3 bg-[#e8ebe6] p-3 rounded-lg">
          <img
            src={product.image || product.images?.[0]}
            alt={product.title}
            className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-white p-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-[#0e0f0c] truncate">{product.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#868685]">{t('negAskedPrice')}</span>
              <span className="text-xs sm:text-sm font-bold text-[#0e0f0c]">{product.price} TND</span>
            </div>
          </div>
        </div>

        {/* Interactive Offer Section */}
        <form onSubmit={handleSubmitOffer} className="space-y-3.5">

          {/* Main Price Output & Savings Badge */}
          <div className="bg-[#e8ebe6] p-4 sm:p-5 rounded-lg text-center space-y-2.5">
            <label className="block text-xs font-semibold text-[#868685] uppercase tracking-wider">
              {t('negYourOffer')}
            </label>

            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                step="1"
                min="1"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-36 text-center text-2xl sm:text-4xl font-black text-[#0e0f0c] bg-white border border-[#0e0f0c] rounded-md p-2 focus:outline-none"
              />
              <span className="text-xl sm:text-2xl font-black text-[#0e0f0c]">TND</span>
            </div>

            {/* Live Savings calculation */}
            {savings > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[#e2f6d5] text-[#054d28] font-semibold text-xs px-3 py-1 rounded-full">
                <TrendingDown className="w-3.5 h-3.5 text-[#054d28]" />
                <span>{t('negSavings', { n: savings, p: discountPercent })}</span>
              </div>
            )}

            {/* Slider Control */}
            <div className="pt-1 px-1">
              <input
                type="range"
                min={Math.round(originalPrice * 0.5)}
                max={originalPrice}
                step="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-[#e8ebe6] rounded-lg appearance-none cursor-pointer accent-[#9fe870]"
              />
              <div className="flex justify-between text-[10px] text-[#868685] font-semibold mt-1">
                <span>{t('negSliderMin', { n: Math.round(originalPrice * 0.5) })}</span>
                <span>{t('negSliderMax', { n: originalPrice })}</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Percentage Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#0e0f0c] mb-1.5">
              {t('negQuickDiscounts')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetPercentages.map((percent) => {
                const calculatedPrice = Math.round(originalPrice * (1 - percent / 100));
                const isSelected = offerPrice === calculatedPrice;
                return (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setOfferPrice(calculatedPrice)}
                    className={`py-2 px-2 rounded-full text-xs font-semibold border transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#9fe870] text-[#0e0f0c] border-[#0e0f0c]'
                        : 'bg-white text-[#454745] border-[#0e0f0c]/15 hover:bg-[#e8ebe6]'
                    }`}
                  >
                    -{percent}%
                    <span className="block text-[10px] font-normal text-[#868685]">{calculatedPrice} TND</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strength Indicator Badge */}
          <div className={`p-2.5 rounded-lg text-xs font-semibold text-center transition ${strengthBadge.color}`}>
            {strengthBadge.label}
          </div>

          {/* Message to Seller */}
          <div>
            <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
              {t('messageToSeller')}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('negMessagePlaceholder')}
              className="w-full p-3 text-xs rounded-md border border-[#0e0f0c] focus:outline-none focus:ring-2 focus:ring-[#9fe870] bg-white text-[#0e0f0c]"
            />
          </div>

          {/* Guarantee Note */}
          <div className="flex items-center gap-2 text-xs text-[#868685] bg-[#e8ebe6] p-3 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-[#0e0f0c] flex-shrink-0" />
            <span>{t('negGuaranteeNote')}</span>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="button-tanit-secondary flex-1 text-xs py-2.5"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="button-tanit-lime flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              {submitting ? t('negSubmitting') : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#0e0f0c]" />
                  <span>{t('sendBtn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
