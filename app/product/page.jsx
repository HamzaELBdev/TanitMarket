"use client";
import React, { Suspense } from 'react';
import ProductDetailClient from './[id]/ProductDetailClient';

export default function ProductQueryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-bold text-[#788078]">
        Chargement des détails de l'annonce...
      </div>
    }>
      <ProductDetailClient />
    </Suspense>
  );
}
