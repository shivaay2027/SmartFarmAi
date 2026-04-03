/**
 * perishability.js
 * Returns structured { key, params } objects for i18n translation.
 * Crop-specific distance thresholds (250–500 km).
 */
const PERISHABLE = {
  // Vegetables
  tomato:       { maxKm: 250, crop: "tomato" },
  brinjal:      { maxKm: 250, crop: "brinjal" },
  okra:         { maxKm: 250, crop: "okra" },
  cabbage:      { maxKm: 300, crop: "cabbage" },
  cauliflower:  { maxKm: 300, crop: "cauliflower" },
  chilli_green: { maxKm: 350, crop: "chilli_green" },
  peas:         { maxKm: 350, crop: "peas" },
  cucumber:     { maxKm: 300, crop: "cucumber" },
  bottle_gourd: { maxKm: 300, crop: "bottle_gourd" },
  // Fruits
  banana:       { maxKm: 300, crop: "banana" },
  mango:        { maxKm: 400, crop: "mango" },
  grapes:       { maxKm: 350, crop: "grapes" },
  pomegranate:  { maxKm: 450, crop: "pomegranate" },
  apple:        { maxKm: 500, crop: "apple" },
};

function getPerishabilityWarning({ cropId, distanceKm }) {
  const meta = PERISHABLE[cropId];
  if (!meta) return null;
  const d = Math.round(distanceKm);

  if (distanceKm > meta.maxKm * 1.7) {
    return { key: "perishability_high", params: { crop: meta.crop, km: d } };
  }
  if (distanceKm > meta.maxKm) {
    return { key: "perishability_medium", params: { crop: meta.crop, maxKm: meta.maxKm } };
  }
  return null;
}

module.exports = { getPerishabilityWarning };
