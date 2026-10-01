/**
 * Tolerant text matching for search, in French, Arabic and "arabizi"
 * (Arabic typed in Latin letters with digits: 3 = ع, 7 = ح, 9 = ق…).
 *
 * Both the query and the listing text are reduced to the same rough
 * "skeleton": accents, case, Arabic diacritics and letter variants are
 * flattened, Arabic letters are transliterated, and vowels are dropped. So
 * "téléphone", "telephone" and "تلفون" all end up near "tlfn", and a typo in a
 * vowel no longer hides a listing.
 *
 * It is deliberately loose, and a loose match is only acceptable because the
 * search is AND across words: every word of the query must be found.
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
export function foldText(value) {
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
export function searchWords(value) {
  return words(foldText(value)).map(skeletonOfWord);
}

/**
 * Does `text` contain every word of `query`? Matching is by prefix of a word's
 * skeleton, so "iph" finds "iPhone" while the user is still typing, and a
 * numeric word must match exactly, since "12" must not find "128 Go".
 */
export function matchesQuery(text, query) {
  const wanted = searchWords(query);
  if (wanted.length === 0) return true;
  const have = searchWords(text);
  return wanted.every((w) => have.some((h) => (/^\d+$/.test(w) ? h === w : h.startsWith(w))));
}
