// Relative-time label from a Firestore Timestamp-like { seconds }. Returns
// null when there's no timestamp to work from (e.g. demo/mock listings),
// so callers can hide the chip entirely rather than show a wrong time.
export function timeAgo(seconds, t) {
  if (!seconds) return null;
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return t('chatJustNow');
  if (diff < 3600) return t('timeMinutesAgo', { n: Math.max(1, Math.round(diff / 60)) });
  if (diff < 86400) return t('timeHoursAgo', { n: Math.round(diff / 3600) });
  if (diff < 2592000) return t('timeDaysAgo', { n: Math.round(diff / 86400) });
  return t('timeMonthsAgo', { n: Math.round(diff / 2592000) });
}
