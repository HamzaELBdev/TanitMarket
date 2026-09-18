import React from 'react';
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react';

/** Moderation-status pill — shared visual language for approved/rejected/pending/reserved listings. */
export default function StatusBadge({ status }) {
  if (status === 'Approuvée' || status === 'approved') {
    return (
      <span className="badge-tanit-active">
        <CheckCircle className="w-3 h-3 text-[#0e0f0c]" />
        En Ligne 🟢
      </span>
    );
  }
  if (status === 'rejected' || status === 'Rejetée') {
    return (
      <span className="badge-tanit-error">
        <XCircle className="w-3 h-3 text-[#a72027]" />
        Rejetée 🔴
      </span>
    );
  }
  if (status === 'reserved' || status === 'Réservée') {
    return (
      <span className="badge-tanit-neutral">
        <Ban className="w-3 h-3 text-[#454745]" />
        Réservée / Vendue 🔵
      </span>
    );
  }
  return (
    <span className="badge-tanit-pending">
      <Clock className="w-3 h-3 text-[#b86700] animate-pulse" />
      En attente de modération 🟠
    </span>
  );
}
