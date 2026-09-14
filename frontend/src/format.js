const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatAmount = (amount) => amountFormat.format(amount);

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
