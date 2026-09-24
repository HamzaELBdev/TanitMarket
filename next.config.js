/** @type {import('next').NextConfig} */
// Firebase App Hosting runs the app as a Node server and requires a
// standalone build — its adapter sets NEXT_PRIVATE_STANDALONE=true before
// `next build` and then reads .next/standalone. A static export there
// produces out/ instead and the deploy fails, so only export for the
// classic Firebase Hosting flow (firebase.json → "public": "out").
const isAppHosting = process.env.NEXT_PRIVATE_STANDALONE === 'true';
const isExport = !isAppHosting && (process.env.NODE_ENV === 'production' || process.env.NEXT_EXPORT === 'true');

const nextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
