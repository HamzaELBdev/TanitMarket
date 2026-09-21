"use client";
import React from 'react';
import { MapPin, Package, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { getPriceInfo } from '@/lib/priceInfo';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

/** Quick preview of an owned listing without leaving the "Mes Annonces" grid. */
export default function ListingQuickViewModal({ item, formatPrice, onDelete, onClose }) {
  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Aperçu de l'annonce"
      footer={item && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button href={`/product/${item.id}`} variant="secondary" size="md" className="flex-1 justify-center">
            Voir la page complète
          </Button>
          <Button href={`/create-listing?editId=${item.id}`} variant="primary" size="md" className="flex-1 justify-center">
            Modifier
          </Button>
          {onDelete && (
            <button
              type="button"
              onClick={() => { onClose(); onDelete(item.id); }}
              aria-label="Supprimer l'annonce"
              title="Supprimer l'annonce"
              className="min-h-11 min-w-11 flex items-center justify-center text-[#a72027] bg-[#FFEDE8] hover:bg-[#a72027] hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    >
      {item && (() => {
        const priceInfo = getPriceInfo(item);
        return (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#e8ebe6]">
            <img
              src={item.image || item.images?.[0] || FALLBACK_IMAGE}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5">
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg text-[#0e0f0c] leading-snug">{item.title}</h3>
            <div className="text-2xl font-black text-[#0e0f0c]">
              {priceInfo.isFree || priceInfo.hasAmount ? formatPrice(priceInfo.isFree ? 0 : item.price) : 'Prix à négocier'}
            </div>
          </div>

          {(item.status === 'rejected' || item.status === 'Rejetée') && item.rejectionReason && (
            <div className="text-xs text-[#a72027] bg-[#FFEDE8] border border-[#a72027]/20 rounded-lg p-3 font-medium">
              <span className="font-extrabold">Motif du refus :</span> {item.rejectionReason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-[#e8ebe6] p-2.5 rounded-lg flex items-center gap-2">
              <Package className="w-4 h-4 text-[#0e0f0c] shrink-0" />
              <span className="font-semibold text-[#0e0f0c] truncate">{item.condition || 'Bon état'}</span>
            </div>
            <div className="bg-[#e8ebe6] p-2.5 rounded-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0e0f0c] shrink-0" />
              <span className="font-semibold text-[#0e0f0c] truncate">{item.location || 'Tunisie'}</span>
            </div>
          </div>

          {item.description && (
            <p className="text-xs leading-relaxed text-[#454745] line-clamp-4 whitespace-pre-line">
              {item.description}
            </p>
          )}
        </div>
        );
      })()}
    </Modal>
  );
}
