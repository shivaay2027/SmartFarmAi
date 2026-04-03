const HANDLING_PER_QUINTAL = 25; // ₹/quintal (loading + unloading)
const HANDLING_BASE = 150;        // ₹ flat base
const TRANSPORT_MULTIPLIER = 1.0; // set 2.0 for round-trip pricing if desired

function roundMoney(x) {
  return Math.round(x);
}

function computeProfit({ quantityQuintal, pricePerQuintal, distanceKm, vehicleRatePerKm }) {
  const revenue = quantityQuintal * pricePerQuintal;
  const transportCost = distanceKm * vehicleRatePerKm * TRANSPORT_MULTIPLIER;
  const handlingCost = HANDLING_BASE + HANDLING_PER_QUINTAL * quantityQuintal;
  const totalCost = transportCost + handlingCost;
  const netProfit = revenue - totalCost;

  return {
    revenue: roundMoney(revenue),
    transportCost: roundMoney(transportCost),
    handlingCost: roundMoney(handlingCost),
    totalCost: roundMoney(totalCost),
    netProfit: roundMoney(netProfit),
  };
}

module.exports = { computeProfit };
