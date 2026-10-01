/**
 * Formatting for the build stamp shown in the admin dashboard.
 *
 * What the stamp actually is: the moment `next build` ran, not the moment
 * Firebase Hosting finished serving it. The two are minutes apart in the
 * normal `npm run build && firebase deploy` flow, and nothing in a static
 * export can know the real deploy time — there is no server to ask. A CI
 * pipeline that knows better can pass BUILD_TIME itself (see next.config.js).
 */

const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

/** Parse the stamp, rejecting a missing or unparseable value rather than rendering "Invalid Date". */
export function parseBuildTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Absolute date, in the viewer's own timezone.
 *
 * Built from the date parts rather than toLocaleString so the wording does not
 * depend on which locales the build host happens to have installed. It still
 * reads the viewer's timezone, so the string the static export prerenders
 * (UTC on the build host) differs from the one the browser renders — the
 * component that shows it marks the element suppressHydrationWarning for
 * exactly that reason.
 */
export function formatBuildDate(value) {
  const d = parseBuildTime(value);
  if (!d) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * "il y a 3 h" — relative to `now`, which the caller passes so this stays a
 * pure function (and so a test can pin it). Returns null for a missing stamp
 * and for a stamp in the future, which would otherwise read "il y a -2 h":
 * clock skew between the build host and the viewer makes that reachable.
 */
export function formatBuildAge(value, now = Date.now()) {
  const d = parseBuildTime(value);
  if (!d) return null;
  const seconds = (now - d.getTime()) / 1000;
  if (seconds < 0) return null;
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(seconds / 86400);
  if (days < 31) return `il y a ${days} j`;
  const months = Math.round(seconds / 2592000);
  return `il y a ${months} mois`;
}
