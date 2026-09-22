// Approximate centroid [lat, lng] for each of Tunisia's 24 governorates.
// Used to map a browser geolocation fix to the nearest governorate for the
// "Me localiser" button — no listing/user data carries real GPS coordinates,
// so this offline nearest-centroid lookup is the practical substitute for a
// full reverse-geocoding service.
export const GOVERNORATE_COORDS = {
  'Tunis': [36.8065, 10.1815],
  'Ariana': [36.8625, 10.1956],
  'Ben Arous': [36.7533, 10.2189],
  'Manouba': [36.8081, 9.8631],
  'Nabeul': [36.4561, 10.7376],
  'Zaghouan': [36.4028, 10.1425],
  'Bizerte': [37.2744, 9.8739],
  'Béja': [36.7256, 9.1817],
  'Jendouba': [36.5011, 8.7803],
  'Le Kef': [36.1826, 8.7148],
  'Siliana': [36.0836, 9.3708],
  'Kairouan': [35.6781, 10.0963],
  'Kasserine': [35.1676, 8.8365],
  'Sidi Bouzid': [35.0381, 9.4858],
  'Sousse': [35.8256, 10.6084],
  'Monastir': [35.7780, 10.8262],
  'Mahdia': [35.5047, 11.0622],
  'Sfax': [34.7406, 10.7603],
  'Gafsa': [34.4250, 8.7842],
  'Tozeur': [33.9197, 8.1335],
  'Kébili': [33.7044, 8.9690],
  'Gabès': [33.8815, 10.0982],
  'Médenine': [33.3549, 10.5055],
  'Tataouine': [32.9297, 10.4518],
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Returns the governorate name whose centroid is closest to the given
// coordinates.
export function findNearestGovernorate(lat, lng) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const [gov, coords] of Object.entries(GOVERNORATE_COORDS)) {
    const dist = haversineDistanceKm([lat, lng], coords);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = gov;
    }
  }
  return nearest;
}
