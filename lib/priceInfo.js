// Single source of truth for how a listing's price should be presented,
// across the card, the detail page, and SEO/OG metadata. The three seller
// choices at publish time (Prix Négociable / Prix Fixe / Gratuit) are
// mutually exclusive and must never be inferred from `price === 0` alone —
// a negotiable listing published with no amount set also has price 0, and
// showing "Gratuit" or "0 TND" for it is wrong.
export function getPriceInfo(product) {
  const priceType = product?.priceType || (product?.isFree ? 'free' : product?.negotiable ? 'negotiable' : 'fixed');
  const isFree = product?.isFree === true || priceType === 'free';
  const isNegotiable = !isFree && priceType === 'negotiable';
  const isFixed = !isFree && !isNegotiable;
  const rawPrice = parseFloat(product?.price) || 0;
  const hasAmount = !isFree && rawPrice > 0;

  return { priceType, isFree, isNegotiable, isFixed, amount: rawPrice, hasAmount };
}
