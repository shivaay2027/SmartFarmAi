const mongoose = require("mongoose");

async function initMongo() {
  const url = process.env.MONGO_URL;
  if (!url) return { enabled: false };

  mongoose.set("strictQuery", true);
  await mongoose.connect(url, {
    dbName: process.env.MONGO_DB || "krishi_route",
  });

  return { enabled: true };
}

module.exports = { initMongo };
