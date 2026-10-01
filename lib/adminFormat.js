export { tsSeconds } from './adminStats.js';

export const formatDateTime = (seconds) => seconds
  ? new Date(seconds * 1000).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null;
