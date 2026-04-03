function lastNDates(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function makeHistory(base, deltas) {
  const dates = lastNDates(deltas.length);
  return dates.map((date, idx) => ({ date, pricePerQuintal: Math.max(1, base + deltas[idx]) }));
}

// Base prices (₹/quintal) by mandi, by crop (mock) for key mandis.
const BASE = {
  onion: {
    lasalgaon: 2300, nashik: 2200, pune: 2500, nagpur: 2100,
    azadpur: 2600, jaipur: 2400, indore: 2350, ahmedabad: 2280,
    hyderabad: 2150, bengaluru: 2450, kolkata: 2550,
  },
  wheat: {
    lasalgaon: 2650, nashik: 2700, pune: 2680, nagpur: 2720,
    azadpur: 2760, jaipur: 2740, indore: 2710, ahmedabad: 2690,
    hyderabad: 2660, bengaluru: 2670, kolkata: 2750,
  },
  tomato: {
    lasalgaon: 1200, nashik: 1100, pune: 1400, nagpur: 1150,
    azadpur: 1500, jaipur: 1350, indore: 1250, ahmedabad: 1300,
    hyderabad: 1280, bengaluru: 1450, kolkata: 1480,
  },
  potato: {
    lasalgaon: 1600, nashik: 1550, pune: 1700, nagpur: 1580,
    azadpur: 1750, jaipur: 1680, indore: 1620, ahmedabad: 1650,
    hyderabad: 1590, bengaluru: 1720, kolkata: 1730,
  },
};

// Generic base prices (₹/quintal) per crop for any mandi
const CROP_BASE_DEFAULT = {
  onion: 2300, potato: 1600, tomato: 1300, brinjal: 1500, okra: 2000,
  cabbage: 900, cauliflower: 1100, chilli_green: 4500, peas: 3500,
  carrot: 1800, cucumber: 1400, bottle_gourd: 1200, pumpkin: 1000,
  wheat: 2700, rice: 2800, maize: 2200, jowar: 2300, bajra: 2200,
  chana: 5200, tur: 6500, moong: 7000, urad: 6800, masur: 6000,
  groundnut: 5500, soybean: 4800, mustard: 5500, sunflower_seed: 5200, sesame: 7500,
  sugarcane: 340, cotton: 7000, jute: 4300,
  banana: 1200, mango: 5000, grapes: 3500, pomegranate: 7000, apple: 4500,
};

// 7-day price deltas per crop — realistic volatility patterns
// Vegetables: highly volatile; Cereals: stable; Pulses: medium; Fruits: very volatile
const HISTORY_DELTAS = {
  // Vegetables (perishable = highly volatile)
  onion:       [0, 30, -20, 10, -15, 5, -25],
  tomato:      [0, -50, -40, -30, 10, 20, -10],
  potato:      [0, 10, 0, -10, 5, 0, 10],
  brinjal:     [0, -30, 20, -10, 15, -5, 25],
  okra:        [0, 40, -25, 10, -20, 30, -15],
  cabbage:     [0, -15, 10, 5, -20, 15, -5],
  cauliflower: [0, 20, -10, 25, -15, 10, -20],
  chilli_green:[0, 100, -80, 120, -60, 90, -50],
  peas:        [0, 60, -30, 50, -40, 70, -20],
  carrot:      [0, 20, -10, 30, -15, 25, -5],
  cucumber:    [0, -20, 15, -10, 20, -15, 30],
  bottle_gourd:[0, 10, -5, 15, -10, 8, -12],
  pumpkin:     [0, -10, 5, -8, 12, -6, 8],
  // Cereals (very stable — govt. MSP floors)
  wheat:       [0, 5, 10, 0, 5, 0, 5],
  rice:        [0, 8, -5, 10, -8, 6, 4],
  maize:       [0, -10, 5, -8, 12, -5, 10],
  jowar:       [0, 5, -8, 12, -6, 9, -4],
  bajra:       [0, -5, 8, -4, 6, -8, 5],
  // Pulses (medium volatile)
  chana:       [0, 30, -20, 40, -15, 25, -10],
  tur:         [0, -40, 30, -20, 50, -30, 35],
  moong:       [0, 50, -30, 40, -25, 60, -20],
  urad:        [0, -30, 40, -20, 35, -25, 45],
  masur:       [0, 20, -15, 30, -10, 25, -20],
  // Oilseeds (medium volatile)
  groundnut:   [0, -30, 20, -40, 30, -20, 40],
  soybean:     [0, 50, -30, 60, -40, 50, -30],
  mustard:     [0, -40, 30, -50, 40, -30, 50],
  sunflower_seed:[0, 30, -20, 40, -30, 25, -15],
  sesame:      [0, 60, -40, 80, -50, 70, -30],
  // Commercial (very stable)
  sugarcane:   [0, 2, -1, 3, 0, 2, -1],
  cotton:      [0, 50, -30, 60, -20, 40, -50],
  jute:        [0, 20, -10, 15, -5, 20, -10],
  // Fruits (highly volatile — season/spot market)
  banana:      [0, -30, 20, -40, 30, -20, 50],
  mango:       [0, 150, -100, 200, -80, 120, -60],
  grapes:      [0, -80, 60, -100, 80, -60, 100],
  pomegranate: [0, 120, -80, 100, -60, 140, -80],
  apple:       [0, 80, -50, 100, -30, 70, -60],
};



function baseFor(mandiId, cropId) {
  const byCrop = BASE[cropId];
  if (byCrop && typeof byCrop[mandiId] === "number") {
    return byCrop[mandiId];
  }
  const defaultBase = CROP_BASE_DEFAULT[cropId];
  if (!defaultBase) return null;

  // Small deterministic mandi-specific offset so mandis differ slightly.
  const hash = (mandiId || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const offset = (hash % 201) - 100; // [-100..100]
  return Math.max(1, defaultBase + offset);
}

function getMockLivePrice(mandiId, cropId) {
  const base = baseFor(mandiId, cropId);
  if (!base) return null;
  const bump = ((mandiId.length * 7 + cropId.length * 11) % 41) - 20;
  return Math.max(1, base + bump);
}

function getMockHistory(mandiId, cropId) {
  const base = baseFor(mandiId, cropId);
  if (!base) return [];
  const deltas = HISTORY_DELTAS[cropId] ?? [0, 0, 0, 0, 0, 0, 0];
  return makeHistory(base, deltas);
}

module.exports = { getMockLivePrice, getMockHistory };
