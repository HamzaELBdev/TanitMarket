import React from 'react';

/** Loading placeholder matching ListingManageCard's row shape (thumbnail + text + actions). */
export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e8ebe6] p-3 sm:p-4 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#e8ebe6] shrink-0" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="h-4 bg-[#e8ebe6] rounded-full w-3/5" />
          <div className="h-5 bg-[#e8ebe6] rounded-full w-2/5" />
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="h-11 w-20 bg-[#e8ebe6] rounded-lg" />
          <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg" />
          <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg" />
          <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg" />
        </div>
      </div>
      <div className="flex sm:hidden items-center gap-2 mt-3 pt-3 border-t border-[#e8ebe6]">
        <div className="h-11 flex-1 bg-[#e8ebe6] rounded-lg" />
        <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg shrink-0" />
        <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg shrink-0" />
        <div className="h-11 w-11 bg-[#e8ebe6] rounded-lg shrink-0" />
      </div>
    </div>
  );
}
