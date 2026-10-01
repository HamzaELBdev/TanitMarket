#!/usr/bin/env node
/**
 * Build and deploy in one step, stamping the build so the admin dashboard can
 * show what is live (see components/dash/LastDeployment.jsx).
 *
 *   npm run deploy                     # hosting + functions, whatever firebase.json has
 *   npm run deploy -- --only hosting   # arguments are passed on to firebase deploy
 *   DEPLOY_DRY_RUN=1 npm run deploy    # build and stamp, print the deploy, run nothing
 *
 * Why a script and not `BUILD_TIME=$(date) npm run build && firebase deploy`:
 * that one-liner is POSIX-only, and it leaves the stamp to whoever remembers
 * to type it. Here the build cannot be deployed without a stamp.
 *
 * What the stamp can and cannot be: it is set when this script starts, so it
 * records the deploy run, not the instant Hosting finished serving. The value
 * has to be inside the bundle, and the bundle has to exist before it can be
 * uploaded, so no build-time stamp can ever be the completion time. It is
 * accurate to the few minutes a deploy takes, and — unlike a bare build date —
 * it can no longer be a stamp from some unrelated earlier build.
 */
const { spawnSync, execSync } = require('child_process');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const isWindows = process.platform === 'win32';

// Arguments reach a shell, so anything outside this set is refused rather than
// forwarded. Covers what firebase deploy actually takes: --only, --project,
// target names, comma-separated lists.
const SAFE_ARG = /^[A-Za-z0-9:_,./@=-]+$/;

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(command, args, label) {
  console.log(`\n▸ ${label}\n  ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    // npm and firebase are .cmd shims on Windows, which execvp cannot run.
    shell: isWindows,
    env: process.env,
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') fail(`\`${command}\` introuvable. Est-il installé et dans le PATH ?`);
    fail(`Échec de « ${label} » : ${result.error.message}`);
  }
  if (result.status !== 0) fail(`« ${label} » s'est arrêté avec le code ${result.status}. Rien n'a été déployé au-delà de cette étape.`);
}

function gitStamp() {
  const git = (args) => {
    try {
      return execSync(`git ${args}`, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  };
  const sha = git('rev-parse --short HEAD');
  if (!sha) return '';
  // A deploy from a modified working tree does not match any commit, and an
  // admin reading the dashboard should be able to see that.
  const dirty = git('status --porcelain');
  return dirty ? `${sha}-dirty` : sha;
}

const passthrough = process.argv.slice(2);
const unsafe = passthrough.filter((arg) => !SAFE_ARG.test(arg));
if (unsafe.length) fail(`Argument refusé : ${unsafe.join(' ')}`);

const buildTime = process.env.BUILD_TIME || new Date().toISOString();
const buildCommit = process.env.BUILD_COMMIT || gitStamp();

process.env.BUILD_TIME = buildTime;
process.env.BUILD_COMMIT = buildCommit;

console.log('Déploiement TanitMarket');
console.log(`  BUILD_TIME   ${buildTime}`);
console.log(`  BUILD_COMMIT ${buildCommit || '(inconnu — pas un dépôt git)'}`);
if (buildCommit.endsWith('-dirty')) {
  console.log('  ⚠ L’arbre de travail contient des modifications non committées.');
}

// `npm run build` also runs the postbuild hook (scripts/postbuild-shell.js),
// which copies the product shell the Cloud Function serves.
run(isWindows ? 'npm.cmd' : 'npm', ['run', 'build'], 'Build Next.js (+ postbuild)');

if (process.env.DEPLOY_DRY_RUN) {
  console.log(`\n▸ DEPLOY_DRY_RUN : arrêt avant « firebase deploy ${passthrough.join(' ')} ».`);
  console.log('  Le build dans out/ porte le stamp ci-dessus.\n');
  process.exit(0);
}

run('firebase', ['deploy', ...passthrough], 'firebase deploy');

console.log(`\n✔ Déployé. Le dashboard affichera « ${buildTime} ».\n`);
