/**
 * fetchDailyPrices.js
 *
 * Cron-job that runs daily at 2:00 AM IST (20:30 UTC).
 * Fetches live Agmarknet prices for all configured Mandis + Crops
 * and persists daily snapshots into MongoDB PriceHistory collection.
 */
const cron = require("node-cron");
const mongoose = require("mongoose");
const { PriceHistory } = require("../db/models/PriceHistory");
const { getRealMandiPrices } = require("../services/marketData");
const { MANDIS } = require("../data/mandis");
const { CROPS } = require("../data/crops");
const { getMockLivePrice } = require("../data/mockPrices");

function getTodayIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().slice(0, 10);
}

async function runDailyPriceSnapshot() {
  if (mongoose.connection.readyState !== 1) {
    console.log("[CronJob] MongoDB not connected — skipping daily snapshot.");
    return;
  }

  const today = getTodayIST();
  console.log(`[CronJob] Running daily price snapshot for ${today}…`);

  let liveRecords = [];
  try {
    liveRecords = await getRealMandiPrices();
    console.log(`[CronJob] Fetched ${liveRecords.length} live records from Agmarknet API.`);
  } catch (err) {
    console.warn("[CronJob] Agmarknet API failed — will use mock prices as fallback.", err.message);
  }

  const ops = [];

  for (const mandi of MANDIS) {
    for (const crop of CROPS) {
      let pricePerQuintal = null;
      let source = "mock";

      if (liveRecords.length > 0) {
        const mandiKeyword = mandi.name.toLowerCase()
          .replace(" apmc", "").replace(" mandi", "").replace(" market", "");
        const match = liveRecords.find(r =>
          r.market && r.market.toLowerCase().includes(mandiKeyword) &&
          r.commodity && r.commodity.toLowerCase().includes(crop.id.toLowerCase())
        );
        if (match && match.modal_price) {
          const p = Number(match.modal_price);
          if (p > 0) { pricePerQuintal = p; source = "agmarknet"; }
        }
      }

      if (!pricePerQuintal) {
        const mockPrice = getMockLivePrice(mandi.id, crop.id);
        pricePerQuintal = typeof mockPrice === "number" ? mockPrice : 0;
        source = "mock";
      }

      if (pricePerQuintal <= 0) continue;

      ops.push({
        updateOne: {
          filter: { mandiId: mandi.id, cropId: crop.id, date: today },
          update: {
            $set: { mandiId: mandi.id, mandiName: mandi.name, cropId: crop.id, cropName: crop.name, date: today, pricePerQuintal, source },
          },
          upsert: true,
        },
      });
    }
  }

  if (ops.length === 0) { console.log("[CronJob] No price records to save today."); return; }

  try {
    const result = await PriceHistory.bulkWrite(ops, { ordered: false });
    console.log(`[CronJob] ✅ Daily snapshot done: ${result.upsertedCount || 0} new, ${result.modifiedCount || 0} updated.`);
  } catch (err) {
    console.error("[CronJob] ❌ Failed to save daily prices to MongoDB:", err.message);
  }
}

function scheduleDailyPriceJob() {
  // "30 20 * * *" = 20:30 UTC = 02:00 AM IST
  cron.schedule("30 20 * * *", async () => { await runDailyPriceSnapshot(); }, {
    scheduled: true,
    timezone: "UTC",
  });
  console.log("[CronJob] Daily price snapshot scheduled at 2:00 AM IST (20:30 UTC) every day.");
}

module.exports = { scheduleDailyPriceJob, runDailyPriceSnapshot };
