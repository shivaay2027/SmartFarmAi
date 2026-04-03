const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { z } = require("zod");

const { CROPS } = require("./data/crops");
const { VEHICLES, getVehicleRatePerKm, getVehicleCapacityQuintal } = require("./data/vehicles");
const { MANDIS } = require("./data/mandis");

const { haversineKm, getRoadDistanceKm } = require("./services/distance");
const { getLivePriceForMandiCrop, getPriceHistoryForMandiCrop } = require("./services/marketData");
const { computeProfit } = require("./services/profit");
const { computePoolingImpact } = require("./services/pooling");
const { getVolatilityAlert } = require("./services/volatility");
const { getFuelPrice, adjustRateForFuel } = require("./services/fuel");
const { getPerishabilityWarning } = require("./services/perishability");
const { predictNextPrice } = require("./services/prediction");
const { computeDemandIndex } = require("./services/demand");
const { getSeasonalityInsight } = require("./services/seasonality");
const { initMongo } = require("./db/mongo");
const { scheduleDailyPriceJob, runDailyPriceSnapshot } = require("./jobs/fetchDailyPrices");

const app = express();

// Allow requests from SmartFarm-AI Next.js frontend (port 3000)
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("🌾 Krishi-Route Backend (SmartFarm-AI) Running — port 4001");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "krishi-route-backend", service: "route-optimizer-service" });
});

// Admin endpoint: manually trigger the daily price snapshot (for testing)
app.post("/api/admin/run-snapshot", async (req, res) => {
  try {
    await runDailyPriceSnapshot();
    res.json({ ok: true, message: "Daily price snapshot triggered successfully." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/meta", (req, res) => {
  res.json({
    crops: CROPS,
    vehicles: VEHICLES,
    units: ["quintal", "ton"],
  });
});

const OptimizeSchema = z.object({
  crop: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.enum(["quintal", "ton"]),
  vehicle: z.enum(["TATA_ACE", "TRACTOR", "TRUCK"]),
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radiusKm: z.number().positive().max(2000).optional().default(100),
  pooling: z
    .object({
      enabled: z.boolean().optional().default(false),
      neighborQuantity: z.number().positive().optional(),
      neighborUnit: z.enum(["quintal", "ton"]).optional(),
    })
    .optional()
    .default({ enabled: false }),
});

app.post("/api/optimize", async (req, res) => {
  const parsed = OptimizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: parsed.error.flatten(),
    });
  }

  const input = parsed.data;
  const baseVehicleRatePerKm = getVehicleRatePerKm(input.vehicle);
  const fuelPrice = await getFuelPrice();
  const vehicleRatePerKm = adjustRateForFuel(baseVehicleRatePerKm, fuelPrice);
  const vehicleCapacityQuintal = getVehicleCapacityQuintal(input.vehicle);
  const quantityQuintal = input.unit === "ton" ? input.quantity * 10 : input.quantity;

  const neighborQuintal =
    input.pooling?.enabled && input.pooling.neighborQuantity && input.pooling.neighborUnit
      ? input.pooling.neighborUnit === "ton"
        ? input.pooling.neighborQuantity * 10
        : input.pooling.neighborQuantity
      : 0;

  const mandisWithDistance = MANDIS.map((m) => {
    const distanceKm = haversineKm(input.origin, { lat: m.lat, lng: m.lng });
    return { ...m, distanceKm };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const mandisInRadius = mandisWithDistance.filter((m) => m.distanceKm <= input.radiusKm);
  const fallbackUsed = mandisInRadius.length === 0;

  const mandisWithinRadius = (fallbackUsed ? mandisWithDistance : mandisInRadius).slice(0, 4);

  const mandisWithRoadData = await Promise.all(
    mandisWithinRadius.map(async (m) => {
      const roadData = await getRoadDistanceKm(input.origin, { lat: m.lat, lng: m.lng });
      return { ...m, distanceKm: roadData.distanceKm, routeCoordinates: roadData.routeCoordinates };
    })
  );

  const markets = await Promise.all(mandisWithRoadData.map(async (m) => {
    const pricePerQuintal = await getLivePriceForMandiCrop(m.id, m.name, input.crop);
    const history = await getPriceHistoryForMandiCrop(m.id, input.crop);
    const volatilityAlert = getVolatilityAlert(history);
    const perishabilityWarning = getPerishabilityWarning({ cropId: input.crop, distanceKm: m.distanceKm });

    const profit = computeProfit({
      quantityQuintal,
      pricePerQuintal,
      distanceKm: m.distanceKm,
      vehicleRatePerKm,
    });

    const poolingImpact = computePoolingImpact({
      enabled: Boolean(input.pooling?.enabled),
      myQuantityQuintal: quantityQuintal,
      neighborQuantityQuintal: neighborQuintal,
      distanceKm: m.distanceKm,
      vehicleRatePerKm,
      vehicleCapacityQuintal,
    });

    const usingPooling = poolingImpact.enabled && poolingImpact.possible;
    const transportCost = usingPooling ? poolingImpact.myPooledTransportCost : profit.transportCost;
    const totalCost = transportCost + profit.handlingCost + (usingPooling ? poolingImpact.myExtraHandlingCost : 0);
    const netProfit = profit.revenue - totalCost;
    const soloNetProfit = profit.netProfit;

    const prediction = predictNextPrice(history);
    const demandIndex = computeDemandIndex({ pricePerQuintal, history });
    const seasonalityInsight = getSeasonalityInsight(history);

    let predictedNetProfit = null;
    if (prediction && prediction.predictedPricePerQuintal) {
      const predictedProfit = computeProfit({
        quantityQuintal,
        pricePerQuintal: prediction.predictedPricePerQuintal,
        distanceKm: m.distanceKm,
        vehicleRatePerKm,
      });
      const predictedTotalCost =
        (usingPooling ? poolingImpact.myPooledTransportCost : predictedProfit.transportCost) +
        predictedProfit.handlingCost +
        (usingPooling ? poolingImpact.myExtraHandlingCost : 0);
      predictedNetProfit = Math.round(predictedProfit.revenue - predictedTotalCost);
    }

    return {
      mandiId: m.id,
      mandiName: m.name,
      state: m.state,
      district: m.district,
      location: { lat: m.lat, lng: m.lng },
      distanceKm: Number(m.distanceKm.toFixed(1)),
      pricePerQuintal,
      revenue: profit.revenue,
      transportCost,
      handlingCost: profit.handlingCost,
      totalCost,
      netProfit,
      profitMargin: profit.revenue > 0 ? Number(((netProfit / profit.revenue) * 100).toFixed(1)) : 0,
      volatilityAlert,
      perishabilityWarning,
      priceHistory: history,
      seasonalityInsight,
      soloNetProfit,
      prediction,
      predictedNetProfit,
      demandIndex,
      pooling: poolingImpact,
      route: {
        type: "LineString",
        coordinates: m.routeCoordinates || [
          [input.origin.lng, input.origin.lat],
          [m.lng, m.lat],
        ],
      },
    };
  }));

  const winner = markets.reduce(
    (best, cur) => (cur.netProfit > best.netProfit ? cur : best),
    markets[0] || { netProfit: -Infinity }
  );

  res.json({
    input: {
      ...input,
      quantityQuintal,
      fuelPrice,
      baseVehicleRatePerKm,
      vehicleRatePerKm,
      vehicleCapacityQuintal,
    },
    warnings: fallbackUsed ? ["No mandis found within radius; showing nearest options instead."] : [],
    markets,
    winnerMandiId: winner?.mandiId ?? null,
  });
});

const port = Number(process.env.PORT || 4001);

(async () => {
  try {
    const mongo = await initMongo();
    if (mongo.enabled) {
      console.log("✅ MongoDB connected.");
      scheduleDailyPriceJob();
      runDailyPriceSnapshot().catch(err =>
        console.warn("[CronJob] Initial snapshot failed:", err.message)
      );
    } else {
      console.log("ℹ️  MongoDB not configured (MONGO_URL missing). Using mock price data.");
    }
  } catch (e) {
    console.warn("⚠️  MongoDB connection failed; continuing with mock data.", e.message);
  }

  app.listen(port, () => {
    console.log(`🌾 Krishi-Route backend (SmartFarm-AI) running on http://localhost:${port}`);
  });
})();
