// Simple trend-based forecast: extrapolate last step change for next-day prediction
function predictNextPrice(history) {
  if (!Array.isArray(history) || history.length === 0) return null;
  if (history.length < 2) {
    const last = history[history.length - 1];
    return { predictedPricePerQuintal: last.pricePerQuintal, change: 0, changePct: 0 };
  }

  const n = history.length;
  const last = history[n - 1];
  const prev = history[n - 2];
  const change = last.pricePerQuintal - prev.pricePerQuintal;
  const predicted = Math.max(1, last.pricePerQuintal + change);
  const changePct = last.pricePerQuintal
    ? Number(((predicted - last.pricePerQuintal) / last.pricePerQuintal * 100).toFixed(1))
    : 0;

  return {
    predictedPricePerQuintal: Math.round(predicted),
    change: Math.round(predicted - last.pricePerQuintal),
    changePct,
  };
}

module.exports = { predictNextPrice };
