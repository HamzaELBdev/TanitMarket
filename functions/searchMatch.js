/**
 * Saved-search matching, server side. The text-folding half is a copy of
 * lib/searchText.js (Cloud Functions cannot import from the app's ES modules);
 * test/savedSearch.test.js runs both over the same corpus so they cannot
 * drift apart silently. Free of firebase-admin so it can be tested without it.
 */

const ARABIC_TO_LATIN = {
  ا: 'a', أ: 'a', إ: 'a', آ: 'a', ى: 'a', ء: 'a', ئ: 'a', ؤ: 'u', ة: 'a',
  ب: 'b', ت: 't', ث: 't', ج: 'j', ح: 'h', خ: 'kh', د: 'd', ذ: 'd', ر: 'r', ز: 'z',
  س: 's', ش: 'ch', ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q',
  ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', و: 'u', ي: 'i', پ: 'b', چ: 'ch', ڨ: 'g',
};

// Digits typed in place of Arabic letters in arabizi.
const ARABIZI_DIGITS = { 2: 'a', 3: 'a', 5: 'kh', 6: 't', 7: 'h', 8: 'gh', 9: 'q' };

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

/** Lowercase, no accents, no Arabic diacritics/tatweel, Arabic-Indic digits to 0-9. */
function foldText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Latin accents
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Arabic harakat, dagger alef, tatweel
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
}

/** Words of a folded text; anything that is not a letter or digit separates them. */
function words(folded) {
  return folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function skeletonOfWord(word) {
  const hasLetters = /\p{L}/u.test(word);
  let out = '';
  for (const ch of word) {
    if (ARABIC_TO_LATIN[ch]) out += ARABIC_TO_LATIN[ch];
    // Digits inside a word that also has letters are arabizi; a bare number
    // ("128", "2020") stays a number.
    else if (hasLetters && ARABIZI_DIGITS[ch]) out += ARABIZI_DIGITS[ch];
    else out += ch;
  }
  out = out
    .replace(/ph/g, 'f')
    .replace(/ou/g, 'u')
    .replace(/ch|sh/g, 'c')
    .replace(/kh/g, 'x')
    .replace(/gh/g, 'g')
    .replace(/[kq]/g, 'k')
    .replace(/c(?![h])/g, 'k')
    .replace(/(.)\1+/g, '$1'); // doubled letters
  // Drop vowels except at the start of a word, but keep short words readable.
  const stripped = out[0] + out.slice(1).replace(/[aeiouy]/g, '');
  return stripped.length >= 2 ? stripped : out;
}

/** The comparable form of a text: one skeleton per word. */
function searchWords(value) {
  return words(foldText(value)).map(skeletonOfWord);
}

/**
 * Does `text` contain every word of `query`? Matching is by prefix of a word's
 * skeleton, so "iph" finds "iPhone" while the user is still typing, and a
 * numeric word must match exactly, since "12" must not find "128 Go".
 */
function matchesQuery(text, query) {
  const wanted = searchWords(query);
  if (wanted.length === 0) return true;
  const have = searchWords(text);
  return wanted.every((w) => have.some((h) => (/^\d+$/.test(w) ? h === w : h.startsWith(w))));
}

const FREE_GOVERNORATE = 'Toute la Tunisie';

// Same rule as the home page filter: whole location parts, so "Tunis" does not
// match "Ariana, Tunisie".
function matchesGovernorate(listing, governorate) {
  if (!governorate || governorate === FREE_GOVERNORATE) return true;
  const target = String(governorate).trim().toLowerCase();
  const parts = [listing.governorate, listing.city, listing.seller?.location, listing.location]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim().toLowerCase());
  return parts.includes(target);
}

/**
 * Does a freshly approved listing satisfy a saved search?
 * `search` = { query, governorate?, maxPrice? }. A search with no words never
 * matches: "tell me about every new listing" is not what saving a search means.
 */
function matchesSavedSearch(listing, search) {
  if (!listing || !search) return false;
  if (searchWords(search.query).length === 0) return false;
  if (!matchesGovernorate(listing, search.governorate)) return false;

  const max = Number(search.maxPrice);
  if (search.maxPrice != null && search.maxPrice !== '' && Number.isFinite(max) && max > 0) {
    const price = listing.price == null || listing.price === '' ? NaN : Number(listing.price);
    // No usable price (negotiable, unpriced) cannot be shown to be within budget.
    if (!Number.isFinite(price) || price > max) return false;
  }
  return matchesQuery(`${listing.title || ''} ${listing.description || ''} ${listing.category || ''}`, search.query);
}

module.exports = { foldText, searchWords, matchesQuery, matchesGovernorate, matchesSavedSearch };
