// ═══════════════════════════════════════════════════════════════
// SMARTFARM AI — FARM MEMORY MODULE  |  data.js
// Long-term Intelligence Data Layer
// ═══════════════════════════════════════════════════════════════

export const API = 'http://localhost:8001'

// ── Static Farm Profile ────────────────────────────────────────
export const FARM_PROFILE = {
  farmer_name: 'Ramesh Kumar',
  farm_name: 'Ramesh Family Farms',
  location: 'Nashik, Maharashtra',
  state: 'Maharashtra',
  lat: 20.011,
  lng: 73.76,
  size_ha: 12.0,
  soil_type: 'Black Cotton Soil',
  irrigation: 'Drip + Flood',
  preferred_crops: ['Tomato', 'Onion', 'Wheat', 'Soybean'],
  established_year: 2012,
  farm_id: 'FARM-MH-2012-0047',
  phone: '+91-98765-43210',
  aadhaar_masked: 'XXXX-XXXX-4321',
  bank: 'Bank of Maharashtra',
  pmkisan_enrolled: true,
  fasal_bima: true,
}

// ── Crop History (Long-Term Memory) ───────────────────────────
export const CROP_HISTORY = [
  {
    id: 'CROP-2022-KHARIF',
    crop: 'Soybean',
    variety: 'JS-335',
    sown_date: '2022-06-20',
    harvested_date: '2022-10-05',
    area_ha: 8.0,
    yield_tons: 18.4,
    input_cost_inr: 96000,
    revenue_inr: 185000,
    disease_incidents: ['Yellow Mosaic Virus'],
    irrigation_method: 'Flood',
    market_sold: 'Nashik APMC',
    sale_price_per_q: 4800,
    season: 'Kharif',
    weather_note: 'Below normal rainfall — 620mm vs 780mm avg.',
    ai_outcome_rating: 3,
  },
  {
    id: 'CROP-2023-RABI',
    crop: 'Wheat',
    variety: 'Sharbati GW-322',
    sown_date: '2023-11-15',
    harvested_date: '2024-03-20',
    area_ha: 10.0,
    yield_tons: 45.0,
    input_cost_inr: 120000,
    revenue_inr: 250000,
    disease_incidents: ['Aphids (Low)'],
    irrigation_method: 'Flood',
    market_sold: 'Malegaon Mandi',
    sale_price_per_q: 2275,
    season: 'Rabi',
    weather_note: 'Good winter chill — 12°C avg night temp boosted grain fill.',
    ai_outcome_rating: 4,
  },
  {
    id: 'CROP-2024-KHARIF',
    crop: 'Tomato',
    variety: 'Arka Rakshak (Hybrid)',
    sown_date: '2024-06-10',
    harvested_date: '2024-09-15',
    area_ha: 2.0,
    yield_tons: 40.0,
    input_cost_inr: 80000,
    revenue_inr: 320000,
    disease_incidents: ['Early Blight', 'Spider Mites'],
    irrigation_method: 'Drip',
    market_sold: 'Nashik APMC',
    sale_price_per_q: 1800,
    season: 'Kharif',
    weather_note: 'Early market arrival secured premium price before glut.',
    ai_outcome_rating: 5,
  },
  {
    id: 'CROP-2024-RABI',
    crop: 'Onion',
    variety: 'Nashik Red (N-2-4-1)',
    sown_date: '2024-11-05',
    harvested_date: '2025-03-10',
    area_ha: 5.0,
    yield_tons: 120.0,
    input_cost_inr: 150000,
    revenue_inr: 180000,
    disease_incidents: ['Purple Blotch', 'Stemphylium Blight'],
    irrigation_method: 'Drip',
    market_sold: 'Lasalgaon APMC',
    sale_price_per_q: 620,
    season: 'Rabi',
    weather_note: 'Unseasonal rain at harvest raised moisture — price crash at APMC.',
    ai_outcome_rating: 2,
  },
]

// ── Soil Readings (Time-Series Memory) ────────────────────────
export const SOIL_READINGS = [
  { date: '2022-04-10', nitrogen: 62, phosphorus: 34, potassium: 50, ph: 6.7, organic_carbon: 0.68, ec: 0.42 },
  { date: '2023-05-10', nitrogen: 55, phosphorus: 30, potassium: 45, ph: 6.8, organic_carbon: 0.60, ec: 0.45 },
  { date: '2024-05-12', nitrogen: 48, phosphorus: 28, potassium: 40, ph: 6.9, organic_carbon: 0.51, ec: 0.50 },
  { date: '2025-01-20', nitrogen: 42, phosphorus: 25, potassium: 38, ph: 7.1, organic_carbon: 0.45, ec: 0.54 },
]

// ── IoT / Sensor Events (Short-Term Memory stream) ────────────
export const IOT_EVENTS = [
  { ts: '2025-04-03T18:00', type: 'soil_moisture', value: '38%', zone: 'Zone A', status: 'normal' },
  { ts: '2025-04-03T18:00', type: 'temperature',   value: '31°C', zone: 'Ambient', status: 'normal' },
  { ts: '2025-04-03T06:00', type: 'irrigation',    value: '2.4L/plant', zone: 'Zone B', status: 'completed' },
  { ts: '2025-04-02T14:30', type: 'pest_trap',     value: '12 pests/trap', zone: 'Block C', status: 'alert' },
  { ts: '2025-04-02T08:00', type: 'soil_moisture', value: '29%', zone: 'Zone C', status: 'low' },
  { ts: '2025-04-01T18:00', type: 'rainfall',      value: '0mm', zone: 'Farm', status: 'dry' },
]

// ── Voice / Assistant Interaction Log (Short-Term Memory) ─────
export const INTERACTION_LOG = [
  { ts: '2025-04-03T09:15', query: 'What is the onion price in Lasalgaon today?', intent: 'mandi_price', outcome: 'Answered ₹640/q. Farmer noted price improved vs last week.' },
  { ts: '2025-04-02T07:30', query: 'My tomato leaves are turning yellow.', intent: 'disease_detect', outcome: 'Gemini detected Nitrogen deficiency. Urea top-dress recommended.' },
  { ts: '2025-04-01T11:00', query: 'Government scheme for irrigation pump?', intent: 'scheme_info', outcome: 'PMKSY scheme explained. Farmer eligibility confirmed.' },
  { ts: '2025-03-28T16:45', query: 'Best crop to sow in June on my black cotton soil?', intent: 'crop_recommend', outcome: 'Soybean & Cotton recommended. Farmer confirmed Soybean preference.' },
]

// ── Feedback History (Reinforcement Loop) ─────────────────────
export const FEEDBACK_LOG = [
  { id: 'FB-001', date: '2024-10-01', recommendation: 'Tomato — Early market sale', rating: 5, outcome: 'Confirmed — got ₹1,800/q before glut', followed: true },
  { id: 'FB-002', date: '2024-03-25', recommendation: 'Wheat foliar urea at tillering', rating: 4, outcome: 'Yield improved by ~8% vs previous season', followed: true },
  { id: 'FB-003', date: '2023-10-10', recommendation: 'Hold Soybean — price will rise', rating: 2, outcome: 'Price fell further — farmer sold at loss', followed: false },
  { id: 'FB-004', date: '2025-02-05', recommendation: 'Spray Mancozeb for Onion blight', rating: 3, outcome: 'Partially effective — continued disease spread', followed: true },
]

// ── Cross-Farm Regional Benchmarks (Anonymized) ───────────────
export const REGIONAL_BENCHMARKS = [
  { metric: 'Tomato Yield / Ha', your_farm: '20.0 t/ha', region_avg: '16.5 t/ha', rank: 'Top 15%' },
  { metric: 'Onion Yield / Ha', your_farm: '24.0 t/ha', region_avg: '22.0 t/ha', rank: 'Top 30%' },
  { metric: 'Wheat Yield / Ha', your_farm: '4.5 t/ha', region_avg: '4.1 t/ha', rank: 'Top 25%' },
  { metric: 'Water Use Efficiency', your_farm: '3.8 kg/L', region_avg: '2.9 kg/L', rank: 'Top 10%' },
  { metric: 'Input Cost / Ha', your_farm: '₹14,200', region_avg: '₹16,800', rank: 'Efficient' },
]

// ── Memory Layer Definitions (for Architecture view) ──────────
export const MEMORY_LAYERS = [
  {
    layer: 'Short-Term Memory',
    color: 'blue',
    icon: 'zap',
    desc: 'Current session context — today\'s sensor readings, voice queries, and active crop status. Retained for 7 days.',
    items: ['Live IoT sensor stream', 'Voice assistant chat history', 'Active crop growth stage', 'Today\'s weather & alerts'],
  },
  {
    layer: 'Long-Term Memory',
    color: 'green',
    icon: 'database',
    desc: 'Persistent historical records — all crop cycles, soil tests, market transactions, and decisions since farm onboarding.',
    items: ['Full crop history (all seasons)', 'Soil test time-series', 'Market transaction ledger', 'Disease incident log'],
  },
  {
    layer: 'Semantic Memory',
    color: 'purple',
    icon: 'brain',
    desc: 'AI-derived patterns and insights — what works for this specific farm, extracted from all historical data.',
    items: ['Crop success probability models', 'Soil health trajectory', 'Irrigation efficiency scores', 'Market timing intelligence'],
  },
]

// ── Payload for backend API calls ─────────────────────────────
export const MEMORY_API_PAYLOAD = {
  farm_profile: FARM_PROFILE,
  crop_history: CROP_HISTORY.map(c => ({
    id: c.id, crop: c.crop, variety: c.variety,
    sown_date: c.sown_date, harvested_date: c.harvested_date,
    area_ha: c.area_ha, yield_tons: c.yield_tons,
    input_cost_inr: c.input_cost_inr, revenue_inr: c.revenue_inr,
    disease_incidents: c.disease_incidents,
    irrigation_method: c.irrigation_method, notes: c.weather_note,
    season: c.season,
  })),
  soil_readings: SOIL_READINGS.map(s => ({
    date: s.date, nitrogen: s.nitrogen, phosphorus: s.phosphorus,
    potassium: s.potassium, ph: s.ph, organic_carbon: s.organic_carbon,
  })),
  event_count: IOT_EVENTS.length + INTERACTION_LOG.length + FEEDBACK_LOG.length,
  total_seasons: CROP_HISTORY.length,
}
