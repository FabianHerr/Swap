// Ranks open offers against what someone has and wants. Pure: no database, so the eval can test it.
//
// A match is an offer on the opposite side of the same pair: you have CAD and want COP, it gives COP
// and wants CAD (the query in assistant.js does that part). Ranking only compares numbers both people
// wrote themselves: how close their "want" is to what you have, and how close their rate is to yours.
// Swap has no market rate, so "a good deal" is never claimed; the reasons just state the differences.

const amountFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmt = (n) => amountFormat.format(n);

// Distance on a ratio scale, so 400 vs 800 counts the same as 800 vs 1,600
const logGap = (a, b) => Math.abs(Math.log(a / b));

// `you` is { giveAmount?, giveCurrency, wantAmount?, wantCurrency }
function rankMatches(offers, you) {
  const hasGive = Number(you.giveAmount) > 0;
  const hasWant = Number(you.wantAmount) > 0;

  const scored = offers.map((offer) => {
    const reasons = [];
    let score = 0;

    if (hasGive) {
      score += logGap(offer.wantAmount, you.giveAmount);
      const diff = offer.wantAmount - you.giveAmount;
      const wants = `Wants ${fmt(offer.wantAmount)} ${offer.wantCurrency}`;
      if (Math.abs(diff) / you.giveAmount < 0.005) reasons.push(`${wants}, the amount you have`);
      else reasons.push(`${wants}, ${fmt(Math.abs(diff))} ${diff < 0 ? "less" : "more"} than you have`);
    }

    if (hasGive && hasWant) {
      // Both rates as "how much of your wanted currency per unit of what you have"
      const yourRate = you.wantAmount / you.giveAmount;
      const theirRate = offer.giveAmount / offer.wantAmount;
      score += logGap(theirRate, yourRate);
      const pct = (theirRate / yourRate - 1) * 100;
      const shown = Math.abs(pct) < 10 ? Math.abs(pct).toFixed(1).replace(/\.0$/, "") : Math.round(Math.abs(pct));
      if (Math.abs(pct) < 0.05) reasons.push("Same rate as yours");
      else reasons.push(`Their rate gives ${shown}% ${pct > 0 ? "more" : "less"} ${offer.giveCurrency} than you asked for`);
    }

    if (!hasGive) {
      reasons.push(`Gives ${fmt(offer.giveAmount)} ${offer.giveCurrency} for ${fmt(offer.wantAmount)} ${offer.wantCurrency}`);
    }

    return { offer, reasons, score };
  });

  // With amounts to compare, closest first; without, newest first (the same order as the Offers page)
  scored.sort((a, b) => (hasGive
    ? a.score - b.score
    : new Date(b.offer.createdAt) - new Date(a.offer.createdAt)));
  return scored;
}

module.exports = { rankMatches };
