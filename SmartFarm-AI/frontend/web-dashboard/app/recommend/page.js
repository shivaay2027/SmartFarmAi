'use client';
import React, { useState, useEffect } from 'react';

// ── CSS (inline scoped) ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
.cr-root { font-family:'Inter',sans-serif; background:#0b1220; min-height:100vh; color:#e8eefc; padding:0; }
.cr-hero { background:linear-gradient(135deg,#0f1e35 0%,#0b1220 60%); padding:32px 40px 24px; border-bottom:1px solid rgba(255,255,255,0.07); }
.cr-hero h1 { font-size:26px; font-weight:800; background:linear-gradient(90deg,#4ade80,#22d3ee,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin:0 0 4px; }
.cr-hero p { color:#6b7fa3; font-size:13.5px; margin:0; }
.cr-body { max-width:1080px; margin:0 auto; padding:32px 40px; }
/* Steps */
.cr-steps { display:flex; align-items:center; gap:0; margin-bottom:32px; }
.cr-step { display:flex; align-items:center; gap:10px; }
.cr-step-num { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; transition:all .3s; }
.cr-step-num.active { background:linear-gradient(135deg,#4ade80,#22d3ee); color:#0b1220; }
.cr-step-num.done { background:#22c55e; color:#0b1220; }
.cr-step-num.inactive { background:rgba(255,255,255,0.07); color:#6b7fa3; }
.cr-step-label { font-size:13px; font-weight:600; color:#9fb0d0; }
.cr-step-label.active { color:#4ade80; }
.cr-step-divider { flex:1; height:1px; background:rgba(255,255,255,0.08); margin:0 16px; }
/* Cards */
.cr-card { background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.075); border-radius:18px; padding:28px; margin-bottom:20px; backdrop-filter:blur(6px); }
.cr-card h3 { font-size:14px; font-weight:700; color:#9fb0d0; letter-spacing:.7px; text-transform:uppercase; margin:0 0 20px; display:flex; align-items:center; gap:8px; }
/* Form elements */
.cr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
.cr-field { display:flex; flex-direction:column; gap:6px; }
.cr-label { font-size:12px; font-weight:600; color:#6b7fa3; letter-spacing:.5px; text-transform:uppercase; }
.cr-input { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 14px; color:#e8eefc; font-size:14px; font-family:inherit; outline:none; transition:border .2s; }
.cr-input:focus { border-color:#4ade80; box-shadow:0 0 0 3px rgba(74,222,128,0.1); }
.cr-select { appearance:none; background:rgba(255,255,255,0.06) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7fa3' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 12px center; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 36px 10px 14px; color:#e8eefc; font-size:14px; font-family:inherit; outline:none; transition:border .2s; }
.cr-select:focus { border-color:#4ade80; }
.cr-slider-wrap { display:flex; flex-direction:column; gap:8px; }
.cr-slider { width:100%; accent-color:#4ade80; cursor:pointer; }
.cr-slider-row { display:flex; justify-content:space-between; font-size:11px; color:#6b7fa3; }
/* Month picker */
.cr-months { display:flex; flex-wrap:wrap; gap:6px; }
.cr-month-btn { padding:6px 10px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:#9fb0d0; transition:all .2s; }
.cr-month-btn.sel { background:#1e4d2b; border-color:#4ade80; color:#4ade80; }
/* CTA buttons */
.cr-btn { padding:13px 28px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; border:none; transition:all .2s; }
.cr-btn-primary { background:linear-gradient(135deg,#4ade80,#22d3ee); color:#0b1220; }
.cr-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(74,222,128,0.3); }
.cr-btn-secondary { background:rgba(255,255,255,0.07); color:#9fb0d0; border:1px solid rgba(255,255,255,0.12); }
.cr-btn-secondary:hover { background:rgba(255,255,255,0.12); }
.cr-btn:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }
.cr-btn-row { display:flex; justify-content:flex-end; gap:12px; margin-top:28px; }
/* Loading */
.cr-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; padding:80px 0; }
.cr-spinner { width:48px; height:48px; border:3px solid rgba(74,222,128,0.2); border-top-color:#4ade80; border-radius:50%; animation:crspin .8s linear infinite; }
@keyframes crspin { to { transform:rotate(360deg); } }
.cr-loading p { color:#6b7fa3; font-size:14px; }
/* Summary banner */
.cr-banner { background:linear-gradient(135deg,#1a3a22,#12263d); border:1px solid rgba(74,222,128,0.25); border-radius:16px; padding:20px 28px; margin-bottom:28px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
.cr-banner-title { font-size:15px; font-weight:700; color:#4ade80; margin-bottom:4px; }
.cr-banner-sub { font-size:13px; color:#6b7fa3; }
.cr-banner-profit { font-size:28px; font-weight:800; color:#4ade80; }
/* Crop result cards */
.cr-results { display:grid; grid-template-columns:1fr; gap:20px; }
.cr-crop-card { background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.075); border-radius:20px; padding:24px; transition:all .3s; }
.cr-crop-card.winner { border-color:rgba(74,222,128,0.35); background:rgba(74,222,128,0.04); }
.cr-crop-card:hover { border-color:rgba(74,222,128,0.2); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,0.3); }
.cr-crop-header { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
.cr-crop-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0; }
.cr-crop-name { font-size:18px; font-weight:800; color:#e8eefc; }
.cr-rank-badge { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.cr-metrics { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; margin-bottom:20px; }
.cr-metric { background:rgba(255,255,255,0.04); border-radius:12px; padding:12px 14px; }
.cr-metric-label { font-size:10px; font-weight:600; color:#6b7fa3; letter-spacing:.5px; text-transform:uppercase; margin-bottom:4px; }
.cr-metric-value { font-size:16px; font-weight:700; color:#e8eefc; }
.cr-metric-value.green { color:#4ade80; }
.cr-metric-value.amber { color:#fbbf24; }
.cr-metric-value.red { color:#f87171; }
/* Score ring */
.cr-score-ring { display:flex; flex-direction:column; align-items:center; gap:4px; }
/* Risk badge */
.cr-risk { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:4px; }
.cr-risk.low { background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.25); }
.cr-risk.medium { background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.25); }
.cr-risk.high { background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.25); }
/* Demand bar */
.cr-demand-bar-wrap { display:flex; align-items:center; gap:10px; }
.cr-demand-bar-bg { flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; }
.cr-demand-bar-fill { height:100%; border-radius:10px; background:linear-gradient(90deg,#4ade80,#22d3ee); transition:width .8s; }
/* Gemini accordion */
.cr-gemini-btn { width:100%; background:rgba(129,140,248,0.08); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; color:#c7d2fe; font-size:13px; font-weight:600; transition:all .2s; }
.cr-gemini-btn:hover { background:rgba(129,140,248,0.14); }
.cr-gemini-panel { background:rgba(15,10,40,0.5); border:1px solid rgba(129,140,248,0.15); border-radius:12px; padding:18px; margin-top:10px; animation:crfadein .25s; }
@keyframes crfadein { from {opacity:0;transform:translateY(-6px)} to {opacity:1;transform:none} }
.cr-explanation { font-size:13.5px; color:#c7d2fe; line-height:1.7; margin-bottom:14px; }
.cr-reasons { list-style:none; padding:0; margin:0 0 14px; display:flex; flex-direction:column; gap:8px; }
.cr-reasons li { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:#9fb0d0; }
.cr-reasons li::before { content:'✓'; color:#4ade80; font-weight:700; flex-shrink:0; padding-top:1px; }
.cr-sell-row { display:flex; gap:20px; flex-wrap:wrap; }
.cr-sell-item { flex:1; min-width:160px; background:rgba(255,255,255,0.04); border-radius:10px; padding:12px; }
.cr-sell-item .lbl { font-size:10px; font-weight:600; color:#6b7fa3; letter-spacing:.5px; text-transform:uppercase; margin-bottom:4px; }
.cr-sell-item .val { font-size:13px; color:#e8eefc; line-height:1.5; }
.cr-sell-item .val.warn { color:#fbbf24; }
/* Dividers */
.cr-divider { height:1px; background:rgba(255,255,255,0.06); margin:18px 0; }
/* Reset button */
.cr-reset { display:inline-flex; align-items:center; gap:6px; color:#6b7fa3; font-size:13px; cursor:pointer; background:none; border:none; padding:0; font-family:inherit; transition:color .2s; }
.cr-reset:hover { color:#e8eefc; }
`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CROP_ICONS = {
  'Tomato':'🍅','Onion':'🧅','Potato':'🥔','Cabbage':'🥬','Cauliflower':'🥦','Brinjal':'🍆',
  'Okra':'🌿','Green Chilli':'🌶️','Carrot':'🥕','Spinach':'🌱','Bitter Gourd':'🥒',
  'Bottle Gourd':'🥬','Capsicum':'🫑','Garlic':'🧄','Peas':'🫛','Wheat':'🌾',
  'Rice':'🍚','Maize':'🌽','Jowar':'🌾','Bajra':'🌾','Ragi':'🌾','Tur (Arhar)':'🫘',
  'Chana':'🫘','Moong':'🫘','Urad':'🫘','Groundnut':'🥜','Soybean':'🫘',
  'Mustard':'🌻','Sunflower':'🌻','Sugarcane':'🎋','Cotton':'🪴','Turmeric':'🟡',
  'Ginger':'🫚','Banana':'🍌','Papaya':'🧡','Watermelon':'🍉','Lemon':'🍋',
  'Grapes':'🍇','Pomegranate':'❤️','Mango':'🥭',
};

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#1a3a22,#0f2a1b)','linear-gradient(135deg,#1d2a50,#12203d)',
  'linear-gradient(135deg,#3b1a3a,#2a0f2a)','linear-gradient(135deg,#3a2a1a,#2d1f0f)',
  'linear-gradient(135deg,#1a3535,#0f2a2a)',
];

function ScoreRing({ score, size = 64 }) {
  const pct = Math.round(score * 100);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#f87171';
  return (
    <div className="cr-score-ring">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}/>
      </svg>
      <div style={{ position:'absolute', fontSize:12, fontWeight:700, color }}>{pct}%</div>
    </div>
  );
}

function RiskBadge({ score }) {
  const pct = Math.round(score * 100);
  const cls = pct < 30 ? 'low' : pct < 55 ? 'medium' : 'high';
  const lbl = pct < 30 ? '🟢 Low' : pct < 55 ? '🟡 Medium' : '🔴 High';
  return <span className={`cr-risk ${cls}`}>{lbl} Risk</span>;
}

function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }

function CropCard({ crop, idx, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const isWinner = idx === 0;
  const pct = Math.round(crop.composite_score * 100);

  return (
    <div className={`cr-crop-card ${isWinner ? 'winner' : ''}`}>
      {/* Header */}
      <div className="cr-crop-header">
        <div className="cr-crop-icon" style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
          {CROP_ICONS[crop.crop_name] || '🌿'}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div className="cr-crop-name">{crop.crop_name}</div>
            {isWinner && <span className="cr-rank-badge" style={{ background:'rgba(74,222,128,0.15)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)' }}>⭐ Top Pick</span>}
            {!isWinner && <span className="cr-rank-badge" style={{ background:'rgba(255,255,255,0.07)', color:'#6b7fa3', border:'1px solid rgba(255,255,255,0.1)' }}>#{crop.rank}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <RiskBadge score={crop.risk_score} />
            <span style={{ fontSize:12, color:'#6b7fa3' }}>Suitability: {Math.round(crop.suitability_score*100)}%</span>
          </div>
        </div>
        {/* Score ring */}
        <div style={{ position:'relative', display:'inline-flex' }}>
          <ScoreRing score={crop.composite_score} size={68} />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="cr-metrics">
        <div className="cr-metric">
          <div className="cr-metric-label">Expected Profit</div>
          <div className={`cr-metric-value ${crop.estimated_profit_inr > 0 ? 'green' : 'red'}`}>
            ₹{fmt(crop.estimated_profit_inr)}
          </div>
        </div>
        <div className="cr-metric">
          <div className="cr-metric-label">Estimated Yield</div>
          <div className="cr-metric-value">{crop.estimated_yield_q}q</div>
        </div>
        <div className="cr-metric">
          <div className="cr-metric-label">Market Price</div>
          <div className="cr-metric-value amber">₹{fmt(crop.market_price_per_q)}/q</div>
        </div>
        <div className="cr-metric">
          <div className="cr-metric-label">Total Cost</div>
          <div className="cr-metric-value">₹{fmt(crop.estimated_cost_inr)}</div>
        </div>
        <div className="cr-metric">
          <div className="cr-metric-label">Profit Margin</div>
          <div className={`cr-metric-value ${crop.profit_margin_pct >= 0 ? 'green' : 'red'}`}>
            {crop.profit_margin_pct}%
          </div>
        </div>
        <div className="cr-metric">
          <div className="cr-metric-label">Water Need</div>
          <div className="cr-metric-value" style={{ textTransform:'capitalize' }}>{crop.water_need}</div>
        </div>
      </div>

      {/* Demand bar */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:11, color:'#6b7fa3', fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase' }}>Market Demand</span>
          <span style={{ fontSize:11, color:'#9fb0d0' }}>{Math.round(crop.demand_score*100)}%</span>
        </div>
        <div className="cr-demand-bar-bg">
          <div className="cr-demand-bar-fill" style={{ width: `${Math.round(crop.demand_score*100)}%` }}/>
        </div>
      </div>

      <div className="cr-divider" />

      {/* Gemini reasoning */}
      <button className="cr-gemini-btn" onClick={() => setOpen(p => !p)}>
        <span>✨ Why {crop.crop_name}? — AI Reasoning</span>
        <span style={{ fontSize:11 }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="cr-gemini-panel">
          {crop.explanation && (
            <p className="cr-explanation">{crop.explanation}</p>
          )}
          {crop.key_reasons?.length > 0 && (
            <ul className="cr-reasons">
              {crop.key_reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          <div className="cr-sell-row">
            {crop.best_sell_time && (
              <div className="cr-sell-item">
                <div className="lbl">📅 Best Time to Sell</div>
                <div className="val">{crop.best_sell_time}</div>
              </div>
            )}
            {crop.watch_out && (
              <div className="cr-sell-item">
                <div className="lbl">⚠️ Watch Out</div>
                <div className="val warn">{crop.watch_out}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  ph: 6.5, nitrogen: 80, phosphorus: 60, potassium: 50, moisture_pct: 55,
  temperature_c: 28, rainfall_mm: 800, humidity_pct: 65,
  state: 'Maharashtra', agro_zone: 'Semi-arid', lat: 19.99, lng: 73.79,
  farm_size_ha: 2, budget_inr: 50000, irrigation: 'drip',
  risk_appetite: 'medium', harvest_months: [6, 7, 8], soil_type: 'loamy',
};

const STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh',
  'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
];

const AGRO_ZONES = ['Arid','Semi-arid','Sub-humid','Humid','Coastal','Hilly'];
const SOIL_TYPES  = ['Sandy','Loamy','Clayey','Black (Regur)','Red Laterite','Alluvial'];

export default function CropRecommender() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function toggleMonth(m) {
    setForm(f => ({
      ...f,
      harvest_months: f.harvest_months.includes(m)
        ? f.harvest_months.filter(x => x !== m)
        : [...f.harvest_months, m],
    }));
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        ph: +form.ph, nitrogen: +form.nitrogen, phosphorus: +form.phosphorus,
        potassium: +form.potassium, moisture_pct: +form.moisture_pct,
        temperature_c: +form.temperature_c, rainfall_mm: +form.rainfall_mm,
        humidity_pct: +form.humidity_pct, farm_size_ha: +form.farm_size_ha,
        budget_inr: +form.budget_inr, lat: +form.lat, lng: +form.lng,
      };
      const res = await fetch('http://localhost:8001/api/v1/recommend-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.message || 'Failed to get recommendations. Is the AI service running?');
    } finally {
      setLoading(false);
    }
  }

  function reset() { setResult(null); setStep(1); setForm(DEFAULT_FORM); setError(''); }

  const topCrop = result?.crops?.[0];
  const totalProfit = result?.crops?.reduce((s, c) => s + (c.estimated_profit_inr > 0 ? c.estimated_profit_inr : 0), 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cr-root">
        {/* Hero */}
        <div className="cr-hero">
          <h1>🌱 Intelligent Crop Recommender</h1>
          <p>AI-powered multi-factor analysis — soil, weather, market & profit optimization with Gemini reasoning</p>
        </div>

        <div className="cr-body">
          {/* Step indicator */}
          <div className="cr-steps">
            {[{n:1,l:'Soil & Weather'},{n:2,l:'Farm Profile'},{n:3,l:'Recommendations'}].map((s,i,a) => (
              <React.Fragment key={s.n}>
                <div className="cr-step">
                  <div className={`cr-step-num ${step > s.n ? 'done' : step === s.n ? 'active' : 'inactive'}`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`cr-step-label ${step === s.n ? 'active' : ''}`}>{s.l}</span>
                </div>
                {i < a.length - 1 && <div className="cr-step-divider"/>}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 1: SOIL & WEATHER ─────────────────── */}
          {step === 1 && (
            <>
              <div className="cr-card">
                <h3>🧪 Soil Parameters</h3>
                <div className="cr-grid">
                  <div className="cr-field">
                    <label className="cr-label">Soil pH — <b style={{color:'#4ade80'}}>{form.ph}</b></label>
                    <div className="cr-slider-wrap">
                      <input type="range" className="cr-slider" min={4} max={9} step={0.1} value={form.ph} onChange={e=>set('ph',+e.target.value)}/>
                      <div className="cr-slider-row"><span>4 (Acidic)</span><span>9 (Alkaline)</span></div>
                    </div>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Nitrogen (kg/ha)</label>
                    <input type="number" className="cr-input" min={0} max={300} value={form.nitrogen} onChange={e=>set('nitrogen',e.target.value)} placeholder="80"/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Phosphorus (kg/ha)</label>
                    <input type="number" className="cr-input" min={0} max={200} value={form.phosphorus} onChange={e=>set('phosphorus',e.target.value)} placeholder="60"/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Potassium (kg/ha)</label>
                    <input type="number" className="cr-input" min={0} max={200} value={form.potassium} onChange={e=>set('potassium',e.target.value)} placeholder="50"/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Soil Moisture — <b style={{color:'#4ade80'}}>{form.moisture_pct}%</b></label>
                    <div className="cr-slider-wrap">
                      <input type="range" className="cr-slider" min={0} max={100} value={form.moisture_pct} onChange={e=>set('moisture_pct',+e.target.value)}/>
                      <div className="cr-slider-row"><span>Dry</span><span>Waterlogged</span></div>
                    </div>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Soil Type</label>
                    <select className="cr-select" value={form.soil_type} onChange={e=>set('soil_type',e.target.value)}>
                      {SOIL_TYPES.map(t=><option key={t} value={t.toLowerCase().split(' ')[0]}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="cr-card">
                <h3>🌤️ Weather Conditions (Annual)</h3>
                <div className="cr-grid">
                  <div className="cr-field">
                    <label className="cr-label">Avg Temperature — <b style={{color:'#fbbf24'}}>{form.temperature_c}°C</b></label>
                    <div className="cr-slider-wrap">
                      <input type="range" className="cr-slider" min={5} max={50} value={form.temperature_c} onChange={e=>set('temperature_c',+e.target.value)}/>
                      <div className="cr-slider-row"><span>5°C</span><span>50°C</span></div>
                    </div>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Annual Rainfall (mm)</label>
                    <input type="number" className="cr-input" min={0} max={5000} value={form.rainfall_mm} onChange={e=>set('rainfall_mm',e.target.value)} placeholder="800"/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Humidity — <b style={{color:'#22d3ee'}}>{form.humidity_pct}%</b></label>
                    <div className="cr-slider-wrap">
                      <input type="range" className="cr-slider" min={0} max={100} value={form.humidity_pct} onChange={e=>set('humidity_pct',+e.target.value)}/>
                      <div className="cr-slider-row"><span>Dry</span><span>Very Humid</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cr-btn-row">
                <button className="cr-btn cr-btn-primary" onClick={()=>setStep(2)}>
                  Next: Farm Profile →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: FARM PROFILE ─────────────────────── */}
          {step === 2 && (
            <>
              <div className="cr-card">
                <h3>📍 Location</h3>
                <div className="cr-grid">
                  <div className="cr-field">
                    <label className="cr-label">State</label>
                    <select className="cr-select" value={form.state} onChange={e=>set('state',e.target.value)}>
                      {STATES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Agro-climatic Zone</label>
                    <select className="cr-select" value={form.agro_zone} onChange={e=>set('agro_zone',e.target.value)}>
                      {AGRO_ZONES.map(z=><option key={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Latitude</label>
                    <input type="number" className="cr-input" step={0.01} value={form.lat} onChange={e=>set('lat',e.target.value)}/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Longitude</label>
                    <input type="number" className="cr-input" step={0.01} value={form.lng} onChange={e=>set('lng',e.target.value)}/>
                  </div>
                </div>
              </div>

              <div className="cr-card">
                <h3>🧑‍🌾 Farmer Profile</h3>
                <div className="cr-grid">
                  <div className="cr-field">
                    <label className="cr-label">Farm Size (Hectares)</label>
                    <input type="number" className="cr-input" min={0.1} max={500} step={0.1} value={form.farm_size_ha} onChange={e=>set('farm_size_ha',e.target.value)}/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Available Budget (₹)</label>
                    <input type="number" className="cr-input" min={1000} step={1000} value={form.budget_inr} onChange={e=>set('budget_inr',e.target.value)}/>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Irrigation Type</label>
                    <select className="cr-select" value={form.irrigation} onChange={e=>set('irrigation',e.target.value)}>
                      <option value="drip">Drip Irrigation</option>
                      <option value="flood">Flood / Canal Irrigation</option>
                      <option value="rainfed">Rainfed (No Irrigation)</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label className="cr-label">Risk Appetite</label>
                    <select className="cr-select" value={form.risk_appetite} onChange={e=>set('risk_appetite',e.target.value)}>
                      <option value="low">Low — Prefer safe, stable crops</option>
                      <option value="medium">Medium — Balanced risk/reward</option>
                      <option value="high">High — Maximize profit potential</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="cr-card">
                <h3>📅 Target Harvest Months (select all that apply)</h3>
                <div className="cr-months">
                  {MONTHS.map((m,i) => (
                    <button key={m} className={`cr-month-btn ${form.harvest_months.includes(i+1)?'sel':''}`}
                      onClick={()=>toggleMonth(i+1)}>
                      {m}
                    </button>
                  ))}
                </div>
                {form.harvest_months.length === 0 && (
                  <p style={{ color:'#f87171', fontSize:12, marginTop:8 }}>Please select at least one harvest month.</p>
                )}
              </div>

              {error && <p style={{ color:'#f87171', fontSize:13, textAlign:'center', margin:'0 0 12px' }}>{error}</p>}

              <div className="cr-btn-row">
                <button className="cr-btn cr-btn-secondary" onClick={()=>setStep(1)}>← Back</button>
                <button className="cr-btn cr-btn-primary" disabled={loading || form.harvest_months.length===0} onClick={submit}>
                  {loading ? '⏳ Analyzing…' : '🌱 Get AI Recommendations'}
                </button>
              </div>
            </>
          )}

          {/* ── LOADING ───────────────────────────────────── */}
          {step === 3 && loading && (
            <div className="cr-loading">
              <div className="cr-spinner"/>
              <p>Running 5-stage AI scoring pipeline…</p>
              <p style={{ fontSize:12, color:'#4a5a7a' }}>Evaluating 40 crops · Fetching mandi prices · Generating Gemini reasoning…</p>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────── */}
          {step === 3 && !loading && result && (
            <>
              {/* Summary banner */}
              {topCrop && (
                <div className="cr-banner">
                  <div>
                    <div className="cr-banner-title">⭐ Best Crop for Your Farm: {topCrop.crop_name}</div>
                    <div className="cr-banner-sub">
                      {result.farm_size_ha} ha · {result.state} · {result.irrigation} · {result.risk_appetite} risk · {result.total_candidates_evaluated} crops evaluated
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'#6b7fa3', marginBottom:2 }}>EXPECTED PROFIT</div>
                    <div className="cr-banner-profit">₹{fmt(topCrop.estimated_profit_inr)}</div>
                  </div>
                </div>
              )}

              <button className="cr-reset" onClick={reset}>← Start Over</button>

              <div className="cr-results" style={{ marginTop:20 }}>
                {result.crops?.map((crop, i) => (
                  <CropCard key={crop.crop_name} crop={crop} idx={i} defaultOpen={i===0}/>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
