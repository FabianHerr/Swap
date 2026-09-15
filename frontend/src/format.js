const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatAmount = (amount) => amountFormat.format(amount);

export const isPositiveAmount = (amount) => amount !== "" && amount != null && Number(amount) > 0;

// How wide "1,150,000" sets, counted in digits: a comma or decimal point is about a third of a digit wide.
// The board sizes every amount from its widest one, so all offers match.
export function amountWidth(amount) {
  const text = isPositiveAmount(amount) ? formatAmount(amount) : '0';
  const digits = text.replace(/\D/g, '').length;
  return digits + (text.length - digits) / 3;
}

const rateNumber = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);

// The poster's own rate from their two amounts ("1 EUR = 1.48 CAD"), stated per unit of the stronger currency
// so it never reads "1 JPY = 0.01 CAD". This is arithmetic on the offer, not a market rate.
export function offerRate({ giveAmount, giveCurrency, wantAmount, wantCurrency }) {
  if (!isPositiveAmount(giveAmount) || !isPositiveAmount(wantAmount) || !giveCurrency || !wantCurrency) return null;
  const perGive = Number(wantAmount) / Number(giveAmount);
  return perGive >= 1
    ? `1 ${giveCurrency} = ${rateNumber(perGive)} ${wantCurrency}`
    : `1 ${wantCurrency} = ${rateNumber(1 / perGive)} ${giveCurrency}`;
}

// "250 EUR for 370 CAD", used wherever an offer is summarized in one line
export const offerTerms = (offer) =>
  `${formatAmount(offer.giveAmount)} ${offer.giveCurrency} for ${formatAmount(offer.wantAmount)} ${offer.wantCurrency}`;

// A short monogram for an avatar: the first letter of up to two words in a name.
export function avatarInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// A deterministic tint index (0-5) for an avatar, so the same name always gets the same color
// and different people are still easy to tell apart at a glance.
const AVATAR_TINTS = 6;
export function avatarTint(name) {
  const text = String(name || "");
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash % AVATAR_TINTS;
}

const memberSinceFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const NEW_MEMBER_DAYS = 30;

// A short, honest fact about an offer's owner from their real profile: when they joined and how many
// swap requests they've had accepted. Swap has no ratings or verification, so this never says more than that.
// `profile` is `offer.ownerProfile` from the API; null when there's no profile to show (your own offer, a
// preview, the example offer, or a user who no longer exists).
export function memberFact(profile) {
  if (!profile) return null;
  const joined = new Date(profile.memberSince);
  const daysSinceJoin = (Date.now() - joined.getTime()) / 86400000;
  if (daysSinceJoin <= NEW_MEMBER_DAYS && !profile.acceptedSwaps) return "New to Swap";
  const swaps = profile.acceptedSwaps === 1 ? "1 swap accepted" : `${profile.acceptedSwaps} swaps accepted`;
  return `Joined ${memberSinceFormat.format(joined)} · ${swaps}`;
}

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

// "just now", "5 minutes ago", "yesterday"
export function timeAgo(date) {
  const seconds = (Date.now() - new Date(date).getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return relativeFormat.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
}
