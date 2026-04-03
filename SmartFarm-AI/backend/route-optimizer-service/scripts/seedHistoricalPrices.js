#!/usr/bin/env node
/**
 * seedHistoricalPrices.js
 *
 * One-time seed script: generates 30 days of realistic price history for every
 * Mandi × Crop combination and writes it into MongoDB PriceHistory collection.
 *
 * Run once after setting up MongoDB:
 *   node scripts/seedHistoricalPrices.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { PriceHistory } = require("../src/db/models/PriceHistory");
const { MANDIS } = require("../src/data/mandis");
const { CROPS } = require("../src/data/crops");
const { getMockLivePrice } = require("../src/data/mockPrices");

const DAYS_TO_SEED = 30;

function getDateIST(daysAgo) {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setDate(ist.getDate() - daysAgo);
  return ist.toISOString().slice(0, 10);
}

function simulatePrice(basePrice, dayIndex) {
  const noise = 1 + (Math.sin(dayIndex * 0.8) * 0.04) + ((Math.random() - 0.5) * 0.06);
  return Math.max(100, Math.round(basePrice * noise));
}

async function seed() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("❌  MONGO_URL not set in .env — cannot seed.");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl, { dbName: process.env.MONGO_DB || "krishi_route" });
  console.log("✅  MongoDB connected.");

  const ops = [];
  let count = 0;

  for (const mandi of MANDIS) {
    for (const crop of CROPS) {
      const basePrice = getMockLivePrice(mandi.id, crop.id);
      if (!basePrice || basePrice <= 0) continue;

      for (let d = DAYS_TO_SEED; d >= 0; d--) {
        const date = getDateIST(d);
        const price = simulatePrice(basePrice, DAYS_TO_SEED - d);
        ops.push({
          updateOne: {
            filter: { mandiId: mandi.id, cropId: crop.id, date },
            update: {
              $setOnInsert: {
                mandiId: mandi.id, mandiName: mandi.name,
                cropId: crop.id, cropName: crop.name,
                date, pricePerQuintal: price, source: "seed",
              },
            },
            upsert: true,
          },
        });
        count++;
      }
    }
  }

  if (ops.length === 0) { console.log("⚠️  No seed ops generated."); process.exit(0); }

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < ops.length; i += BATCH) {
    const result = await PriceHistory.bulkWrite(ops.slice(i, i + BATCH), { ordered: false });
    inserted += result.upsertedCount || 0;
  }

  console.log(`✅  Seed complete: ${inserted} new records inserted out of ${count} total.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
