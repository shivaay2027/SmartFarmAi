// Seasonality: find uptrend, downtrend, peak day, or stable from price history
function getSeasonalityInsight(priceHistory) {
  if (!priceHistory || priceHistory.length < 3) return null;

  let allUp = true;
  let allDown = true;

  for (let i = 1; i < priceHistory.length; i++) {
    if (priceHistory[i].pricePerQuintal < priceHistory[i - 1].pricePerQuintal) allUp = false;
    if (priceHistory[i].pricePerQuintal > priceHistory[i - 1].pricePerQuintal) allDown = false;
  }

  if (allUp) return { key: "insight_uptrend" };
  if (allDown) return { key: "insight_downtrend" };

  // Find peak day
  let maxPrice = -Infinity;
  let peakDateStr = null;

  for (const entry of priceHistory) {
    if (entry.pricePerQuintal > maxPrice) {
      maxPrice = entry.pricePerQuintal;
      peakDateStr = entry.date;
    }
  }

  if (peakDateStr) {
    const d = new Date(peakDateStr);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[d.getDay()];
    return { key: "insight_peak_day", params: { day: dayName } };
  }

  return { key: "insight_stable" };
}

module.exports = { getSeasonalityInsight };
