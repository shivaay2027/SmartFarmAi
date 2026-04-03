/**
 * volatility.js
 * Returns a structured { key, params } object for i18n translation,
 * or null if no alert needed. Detects 3-consecutive-day price drop/rise.
 */
function getVolatilityAlert(history) {
  if (!Array.isArray(history) || history.length < 4) return null;

  const last = history.slice(-4);
  const moves = [
    last[1].pricePerQuintal - last[0].pricePerQuintal,
    last[2].pricePerQuintal - last[1].pricePerQuintal,
    last[3].pricePerQuintal - last[2].pricePerQuintal,
  ];

  const allDown = moves.every((m) => m < 0);
  const allUp   = moves.every((m) => m > 0);

  if (allDown) {
    const drop = Math.abs(Math.round(last[0].pricePerQuintal - last[3].pricePerQuintal));
    return { key: "volatility_downtrend", params: { drop } };
  }

  if (allUp) {
    const rise = Math.abs(Math.round(last[3].pricePerQuintal - last[0].pricePerQuintal));
    return { key: "volatility_uptrend", params: { rise } };
  }

  return null;
}

module.exports = { getVolatilityAlert };
