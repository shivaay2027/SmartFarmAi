function roundMoney(x) {
  return Math.round(x);
}

function computePoolingImpact({
  enabled,
  myQuantityQuintal,
  neighborQuantityQuintal,
  distanceKm,
  vehicleRatePerKm,
  vehicleCapacityQuintal,
}) {
  if (!enabled || !neighborQuantityQuintal || neighborQuantityQuintal <= 0) {
    return { enabled: false };
  }

  const soloTransportCost = distanceKm * vehicleRatePerKm;
  const totalQuantity = myQuantityQuintal + neighborQuantityQuintal;

  if (totalQuantity > vehicleCapacityQuintal) {
    return {
      enabled: true,
      possible: false,
      note: `Pooling exceeds vehicle capacity (${vehicleCapacityQuintal} q).`,
      totalQuantityQuintal: totalQuantity,
      soloTransportCost: roundMoney(soloTransportCost),
    };
  }

  // One vehicle trip, split transport cost by load share.
  const pooledTransportCostTotal = distanceKm * vehicleRatePerKm;
  const myShare = myQuantityQuintal / totalQuantity;
  const myPooledTransportCost = pooledTransportCostTotal * myShare;
  const savings = soloTransportCost - myPooledTransportCost;

  return {
    enabled: true,
    possible: true,
    totalQuantityQuintal: totalQuantity,
    soloTransportCost: roundMoney(soloTransportCost),
    pooledTransportCostTotal: roundMoney(pooledTransportCostTotal),
    myPooledTransportCost: roundMoney(myPooledTransportCost),
    savings: roundMoney(savings),
    savingsPct: soloTransportCost > 0
      ? Number(((savings / soloTransportCost) * 100).toFixed(1))
      : 0,
    myExtraHandlingCost: 0,
    note: "Pooling splits transport cost by quantity share.",
  };
}

module.exports = { computePoolingImpact };
