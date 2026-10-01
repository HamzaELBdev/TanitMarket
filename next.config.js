/** @type {import('next').NextConfig} */
// Firebase App Hosting runs the app as a Node server and requires a
// standalone build — its adapter sets NEXT_PRIVATE_STANDALONE=true before
// `next build` and then reads .next/standalone. A static export there
// produces out/ instead and the deploy fails, so only export for the
// classic Firebase Hosting flow (firebase.json → "public": "out").
const isAppHosting = process.env.NEXT_PRIVATE_STANDALONE === 'true';
const isExport = !isAppHosting && (process.env.NODE_ENV === 'production' || process.env.NEXT_EXPORT === 'true');

// Build stamp shown in the admin dashboard, so an admin can tell at a glance
// which version is live. Computed here because there is nowhere else to get
// it: the export is static, so there is no server to ask at runtime.
//
// `env` values are inlined into the bundle at build time (and, per the Next
// docs for this version, the NEXT_PUBLIC_ prefix has no meaning for values
// set this way — it only matters for the environment and .env files). Reading
// them must be a direct `process.env.BUILD_TIME` reference: destructuring
// process.env does not survive the build-time substitution.
//
// Both can be overridden from the environment so a CI pipeline can stamp the
// exact values it deployed rather than whatever the build host computed.
function gitShortSha() {
  try {
    // stdio ignores stderr so a non-git checkout stays silent instead of
    // printing "not a git repository" on every build.
    return require('child_process')
      .execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const buildTime = process.env.BUILD_TIME || new Date().toISOString();
const buildCommit = process.env.BUILD_COMMIT || gitShortSha();

const nextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  env: {
    BUILD_TIME: buildTime,
    BUILD_COMMIT: buildCommit,
  },
};

module.exports = nextConfig;
