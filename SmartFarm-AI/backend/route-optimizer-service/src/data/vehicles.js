const VEHICLES = [
  { id: "TATA_ACE", name: "Tata Ace (Small)" },
  { id: "TRACTOR", name: "Tractor + Trolley" },
  { id: "TRUCK", name: "Truck (Large)" },
];

const VEHICLE_RATE_PER_KM = {
  // ₹/km — swap with real rental rates later.
  TATA_ACE: 18,
  TRACTOR: 12,
  TRUCK: 35,
};

const VEHICLE_CAPACITY_QUINTAL = {
  // Rough, for pooling math only (quintals).
  TATA_ACE: 15,
  TRACTOR: 40,
  TRUCK: 120,
};

function getVehicleRatePerKm(vehicleId) {
  return VEHICLE_RATE_PER_KM[vehicleId] ?? 20;
}

function getVehicleCapacityQuintal(vehicleId) {
  return VEHICLE_CAPACITY_QUINTAL[vehicleId] ?? 40;
}

module.exports = {
  VEHICLES,
  getVehicleRatePerKm,
  getVehicleCapacityQuintal,
};
