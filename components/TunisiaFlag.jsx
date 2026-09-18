"use client";
import React from 'react';

export default function TunisiaFlag({ className = "w-5 h-3.5 rounded-[2px] shadow-2xs inline-block align-middle shrink-0" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 1200 800" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Drapeau Tunisie"
      role="img"
    >
      {/* Red Background */}
      <rect width="1200" height="800" fill="#E70013" />
      {/* White Disk */}
      <circle cx="600" cy="400" r="200" fill="#FFFFFF" />
      {/* Red Crescent Outer Circle */}
      <circle cx="600" cy="400" r="150" fill="#E70013" />
      {/* White Crescent Inner Subtraction Circle */}
      <circle cx="640" cy="400" r="120" fill="#FFFFFF" />
      {/* Red 5-pointed Star */}
      <polygon 
        points="610,310 624,354 670,354 633,381 647,425 610,398 573,425 587,381 550,354 596,354" 
        fill="#E70013" 
      />
    </svg>
  );
}
