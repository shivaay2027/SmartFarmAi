// Demand index (0–1): higher-than-average price = higher demand
function computeDemandIndex({ pricePerQuintal, history }) {
  if (!pricePerQuintal || pricePerQuintal <= 0) return 0.3;
  if (!Array.isArray(history) || history.length === 0) return 0.5;

  const avg = history.reduce((sum, p) => sum + (p.pricePerQuintal || 0), 0) / history.length;
  if (!avg) return 0.5;

  const ratio = pricePerQuintal / avg;
  const raw = Math.max(0.2, Math.min(1.0, ratio));
  return Number(raw.toFixed(2));
}

module.exports = { computeDemandIndex };
