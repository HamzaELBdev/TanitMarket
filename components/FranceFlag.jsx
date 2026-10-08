"use client";
import React from 'react';

export default function FranceFlag({ className = "w-5 h-3.5 rounded-[2px] shadow-2xs inline-block align-middle shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
  );
}
