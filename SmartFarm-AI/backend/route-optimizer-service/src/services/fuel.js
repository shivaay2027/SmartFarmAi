const axios = require("axios");

const DEFAULT_FUEL_PRICE = 90; // ₹/litre fallback
const BASE_FUEL_PRICE = 90;    // baseline that vehicle rates were calibrated at

let cachedFuelPrice = null;
let lastCacheTime = 0;

async function getFuelPrice() {
  const env = process.env.FUEL_PRICE;
  if (env) return Number(env);

  const now = Date.now();
  if (cachedFuelPrice && now - lastCacheTime < 1000 * 60 * 60) {
    return cachedFuelPrice;
  }

  try {
    // Use live USD/INR exchange rate as a proxy for crude oil / transport cost fluctuations.
    const res = await axios.get("https://api.frankfurter.app/latest?from=USD&to=INR");
    const inrRate = res.data.rates.INR;
    const dynamicPrice = inrRate * 1.08;
    if (dynamicPrice > 50 && dynamicPrice < 150) {
      cachedFuelPrice = dynamicPrice;
      lastCacheTime = now;
      return dynamicPrice;
    }
  } catch (err) {
    console.error("Real-time fuel API failed, falling back:", err.message);
  }

  return DEFAULT_FUEL_PRICE;
}

function adjustRateForFuel(baseRatePerKm, fuelPrice) {
  if (!baseRatePerKm || !fuelPrice) return baseRatePerKm;
  return (baseRatePerKm * fuelPrice) / BASE_FUEL_PRICE;
}

module.exports = { getFuelPrice, adjustRateForFuel, DEFAULT_FUEL_PRICE, BASE_FUEL_PRICE };
