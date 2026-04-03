const mongoose = require("mongoose");

const PriceHistorySchema = new mongoose.Schema(
  {
    mandiId:         { type: String, required: true, index: true },
    mandiName:       { type: String, required: true },
    cropId:          { type: String, required: true, index: true },
    cropName:        { type: String },
    date:            { type: String, required: true, index: true }, // "YYYY-MM-DD"
    pricePerQuintal: { type: Number, required: true },
    source:          { type: String, default: "agmarknet" }, // "agmarknet" | "mock" | "seed"
  },
  { timestamps: true }
);

// One price snapshot per mandi + crop + day
PriceHistorySchema.index({ mandiId: 1, cropId: 1, date: 1 }, { unique: true });

const PriceHistory = mongoose.model("PriceHistory", PriceHistorySchema);

module.exports = { PriceHistory };
