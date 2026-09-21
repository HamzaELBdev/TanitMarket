// Runs automatically after `npm run build` (npm's implicit `postbuild` hook).
//
// The static export only pre-renders /product/[id] pages for listings that
// existed in Firestore at build time (see generateStaticParams in
// app/product/[id]/page.jsx). Any listing created afterwards has no matching
// file in `out/`, so Firebase Hosting's catch-all rewrite for /product/**
// kicks in. That rewrite now points at the `productSocialPreview` Cloud
// Function (see functions/index.js) instead of a hardcoded product page, so
// social crawlers get accurate per-listing Open Graph tags fetched live from
// Firestore. For everyone else (real visitors), that same function serves
// this snapshot of the SPA shell — copied here from an already-built product
// page — so the client-side app boots exactly as before and resolves the
// real product from the browser's URL.
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const src = path.join(outDir, 'product', 'prod-1.html');

// Bundled directly into the Cloud Function's own deployment (read from disk
// at module load, no network call) — a same-origin self-fetch from inside
// the function was found to hang indefinitely (Cloud Run egress back through
// Firebase Hosting's own edge), so this avoids that path entirely.
const functionsDest = path.join(__dirname, '..', 'functions', 'product-shell.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, functionsDest);
  console.log(`[postbuild-shell] Copied ${src} -> ${functionsDest}`);
} else {
  console.warn(`[postbuild-shell] Source file not found, skipping: ${src}`);
}
