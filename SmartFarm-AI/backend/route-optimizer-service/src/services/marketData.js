const axios = require("axios");
const mongoose = require("mongoose");
const { getMockLivePrice, getMockHistory } = require("../data/mockPrices");

const API_KEY = "579b464db66ec23bdd00000167d51bb1f0724463592732c0ff9c3b52";
const API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

let priceCache = null;
let lastCacheTime = 0;

// Fetch Live Mandi Prices from Agmarknet via Data.gov.in API (cached 1 hour)
async function getRealMandiPrices() {
  const now = Date.now();
  if (priceCache && now - lastCacheTime < 1000 * 60 * 60) return priceCache;
  try {
    const response = await axios.get(`${API_URL}?api-key=${API_KEY}&format=json&limit=1000`);
    if (response.data && response.data.records) {
      priceCache = response.data.records;
      lastCacheTime = now;
      return priceCache;
    }
  } catch (error) {
    console.error("Error fetching live mandi prices from Data.gov.in:", error.message);
  }
  return [];
}

// Get today's live price for a specific mandi+crop (with mock fallback)
async function getLivePriceForMandiCrop(mandiId, mandiName, cropId) {
  const liveRecords = await getRealMandiPrices();

  if (liveRecords && liveRecords.length > 0) {
    const mandiKeyword = mandiName.toLowerCase()
      .replace(" apmc", "").replace(" mandi", "").replace(" market", "");
    const match = liveRecords.find(r =>
      r.market && r.market.toLowerCase().includes(mandiKeyword) &&
      r.commodity && r.commodity.toLowerCase().includes(cropId.toLowerCase())
    );
    if (match && match.modal_price) {
      const price = Number(match.modal_price);
      if (price > 0) return price;
    }
  }

  const p = getMockLivePrice(mandiId, cropId);
  return typeof p === "number" ? p : 0;
}

/**
 * Get last 7-day price history for a specific mandi+crop.
 * Queries MongoDB PriceHistory collection if connected.
 * Falls back to mock history data if MongoDB is unavailable.
 */
async function getPriceHistoryForMandiCrop(mandiId, cropId) {
  if (mongoose.connection.readyState === 1) {
    try {
      const { PriceHistory } = require("../db/models/PriceHistory");
      const records = await PriceHistory
        .find({ mandiId, cropId })
        .sort({ date: -1 })
        .limit(7)
        .lean();

      if (records && records.length >= 2) {
        return records
          .map(r => ({ date: r.date, pricePerQuintal: r.pricePerQuintal }))
          .reverse();
      }
    } catch (err) {
      console.warn("MongoDB history query failed, using mock:", err.message);
    }
  }

  return getMockHistory(mandiId, cropId);
}

module.exports = { getLivePriceForMandiCrop, getPriceHistoryForMandiCrop, getRealMandiPrices };
