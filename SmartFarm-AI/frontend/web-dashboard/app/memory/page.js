// ═══════════════════════════════════════════════════════════════
// SMARTFARM AI — FARM MEMORY MODULE  |  page.js
// Long-Term Intelligence Backbone — Main Page
// ═══════════════════════════════════════════════════════════════
'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Brain, History, Sprout, AlertTriangle, Activity,
  MapPin, Shield, Users, MessageCircle, Star, Lock,
  CheckCircle2, XCircle, ThumbsUp, ThumbsDown, RefreshCw,
  Database, Cpu, Globe, ChevronRight,
} from 'lucide-react'

import {
  API, FARM_PROFILE, CROP_HISTORY, SOIL_READINGS,
  IOT_EVENTS, INTERACTION_LOG, FEEDBACK_LOG,
  REGIONAL_BENCHMARKS, MEMORY_LAYERS, MEMORY_API_PAYLOAD,
} from './data'
import {
  StatCard, SectionHeading, MemoryLayerCard, InsightCard,
  CropRecoCard, CropTimelineCard, NutrientBar, AnomalyCard,
  FeedbackRow, IotEventRow, BenchmarkRow, PrivacyBadge, InteractionRow,
} from './components'

// ── Tab config ─────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',          icon: BookOpen },
  { id: 'insights',   label: 'AI Insights',        icon: Brain },
  { id: 'timeline',   label: 'Crop Lifecycle',     icon: History },
  { id: 'soil',       label: 'Soil Memory',        icon: Sprout },
  { id: 'realtime',   label: 'Live Events',        icon: Activity },
  { id: 'anomalies',  label: 'Anomalies',          icon: AlertTriangle },
  { id: 'feedback',   label: 'Feedback Loop',      icon: MessageCircle },
  { id: 'crossfarm',  label: 'Cross-Farm Intel',   icon: Users },
  { id: 'privacy',    label: 'Privacy & Security', icon: Lock },
]

// ── Loading spinner ────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-16 h-16">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-leaf-500" />
        <Brain className="absolute inset-0 m-auto text-leaf-500" size={24} />
      </div>
      <p className="text-slate-500 font-medium text-sm">Loading Farm Memory…</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FarmMemoryPage() {
  const [tab, setTab]               = useState('overview')
  const [loading, setLoading]       = useState(true)
  const [insightData, setInsightData] = useState(null)
  const [anomalyData, setAnomalyData] = useState(null)
  const [soilApiData, setSoilApiData] = useState(null)
  const [fbRatings, setFbRatings]   = useState({})   // live thumbs per feedback id

  // ── Fetch all backend APIs in parallel ────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const lastSoil = SOIL_READINGS[SOIL_READINGS.length - 1]
      const [insRes, anomRes, soilRes] = await Promise.all([
        fetch(`${API}/api/v1/memory/insights`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(MEMORY_API_PAYLOAD),
        }),
        fetch(`${API}/api/v1/memory/anomaly-check`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crop_history: MEMORY_API_PAYLOAD.crop_history, soil_readings: MEMORY_API_PAYLOAD.soil_readings }),
        }),
        fetch(`${API}/api/v1/memory/soil-analysis?nitrogen=${lastSoil.nitrogen}&phosphorus=${lastSoil.phosphorus}&potassium=${lastSoil.potassium}&ph=${lastSoil.ph}&organic_carbon=${lastSoil.organic_carbon}`),
      ])
      const ins  = await insRes.json()
      const anom = await anomRes.json()
      const soil = await soilRes.json()
      setInsightData(ins.data  || null)
      setAnomalyData(anom      || null)
      setSoilApiData(soil      || null)
    } catch (e) {
      console.error('Farm Memory API error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Aggregate stats ────────────────────────────────────────────
  const totalRev    = CROP_HISTORY.reduce((a, c) => a + c.revenue_inr, 0)
  const totalCost   = CROP_HISTORY.reduce((a, c) => a + c.input_cost_inr, 0)
  const netProfit   = totalRev - totalCost
  const totalYield  = CROP_HISTORY.reduce((a, c) => a + c.yield_tons, 0)
  const avgRating   = (CROP_HISTORY.reduce((a, c) => a + c.ai_outcome_rating, 0) / CROP_HISTORY.length).toFixed(1)
  const lastSoil    = SOIL_READINGS[SOIL_READINGS.length - 1]

  // ── Tab content renderer ───────────────────────────────────────
  function renderTab() {
    switch (tab) {

      // ── OVERVIEW ─────────────────────────────────────────────
      case 'overview': return (
        <div className="space-y-8">
          {/* Stat strips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Crop Cycles Logged"  value={CROP_HISTORY.length}  subtext={`Since ${FARM_PROFILE.established_year}`}   icon={History}   colorClass="bg-green-100 text-green-600" />
            <StatCard title="Total Yield"          value={`${totalYield} t`}    subtext="Across all seasons"                          icon={Sprout}    colorClass="bg-blue-100 text-blue-600" />
            <StatCard title="Net Farm Profit"      value={`₹${(netProfit/100000).toFixed(1)}L`} subtext="All recorded cycles"         icon={Star}      colorClass="bg-yellow-100 text-yellow-600" />
            <StatCard title="AI Outcome Avg"       value={`${avgRating}/5`}     subtext="Farmer-rated AI accuracy"                   icon={Brain}     colorClass="bg-purple-100 text-purple-600" />
          </div>

          {/* Memory architecture layers */}
          <div>
            <SectionHeading icon={Database} title="Memory Architecture" subtitle="How SmartFarm AI builds and stores your farm's intelligence" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {MEMORY_LAYERS.map((ml, i) => <MemoryLayerCard key={i} {...ml} />)}
            </div>
          </div>

          {/* Farm profile card */}
          <div>
            <SectionHeading icon={MapPin} title="Farm Identity Profile" subtitle="Static parameters that anchor all AI decisions" />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Farmer', val: FARM_PROFILE.farmer_name },
                  { label: 'Farm ID', val: FARM_PROFILE.farm_id },
                  { label: 'Location', val: FARM_PROFILE.location },
                  { label: 'Farm Size', val: `${FARM_PROFILE.size_ha} Hectares` },
                  { label: 'Soil Type', val: FARM_PROFILE.soil_type },
                  { label: 'Irrigation', val: FARM_PROFILE.irrigation },
                  { label: 'Since', val: FARM_PROFILE.established_year },
                  { label: 'Preferred Crops', val: FARM_PROFILE.preferred_crops.join(', ') },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{r.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                {FARM_PROFILE.pmkisan_enrolled && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">✓ PM-KISAN Enrolled</span>}
                {FARM_PROFILE.fasal_bima && <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">✓ Fasal Bima Active</span>}
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">{FARM_PROFILE.bank}</span>
              </div>
            </div>
          </div>
        </div>
      )

      // ── AI INSIGHTS ───────────────────────────────────────────
      case 'insights': return loading ? <Spinner /> : (
        <div className="space-y-6">
          {insightData ? (
            <>
              {/* Headline & quote */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl flex gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl h-fit flex-shrink-0"><Brain size={28}/></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{insightData.headline}</h3>
                  <p className="text-emerald-800 italic font-medium">"{insightData.memory_quote}"</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Gemini AI Analysis</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{CROP_HISTORY.length} seasons of data</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pattern insights */}
                <div>
                  <SectionHeading icon={Activity} title="Pattern Recognition" subtitle="Learned from your complete farm history" />
                  <div className="space-y-3">
                    {(insightData.top_insights || []).map((ins, i) => <InsightCard key={i} insight={ins} idx={i} />)}
                  </div>
                </div>

                {/* Crop recommendations */}
                <div>
                  <SectionHeading icon={Sprout} title="Personalised Recommendations" subtitle="Based on your soil, history & region" />
                  <div className="space-y-3">
                    {(insightData.crop_recommendations || []).map((c, i) => <CropRecoCard key={i} crop={c} idx={i} />)}
                  </div>
                  {/* Next steps */}
                  {insightData.next_steps?.length > 0 && (
                    <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="font-bold text-slate-700 mb-3 text-sm">Proactive Next Steps</h4>
                      <ul className="space-y-2">
                        {insightData.next_steps.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-600 items-start">
                            <ChevronRight size={14} className="text-leaf-500 mt-0.5 flex-shrink-0"/>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Brain size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Could not load AI insights. Ensure backend is running.</p>
            </div>
          )}
        </div>
      )

      // ── CROP LIFECYCLE ────────────────────────────────────────
      case 'timeline': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Seasons Recorded" value={CROP_HISTORY.length}    subtext="Full lifecycle logs"        icon={History} colorClass="bg-green-100 text-green-600"/>
            <StatCard title="Total Yield"       value={`${totalYield}t`}       subtext="Tomato, Onion, Wheat, Soy" icon={Sprout}  colorClass="bg-blue-100 text-blue-600"/>
            <StatCard title="Net P&L"           value={`₹${netProfit.toLocaleString()}`} subtext="Cumulative"      icon={Star}    colorClass="bg-yellow-100 text-yellow-600"/>
            <StatCard title="Avg AI Rating"     value={`${avgRating}★`}        subtext="Farmer-confirmed accuracy" icon={Brain}   colorClass="bg-purple-100 text-purple-600"/>
          </div>
          <SectionHeading icon={History} title="Full Crop Lifecycle Log" subtitle="Sowing → Harvest → Market — complete traceability of every cycle" />
          <div className="relative border-l-2 border-leaf-200 ml-4 pl-8 space-y-8 pb-4">
            {CROP_HISTORY.map((cycle, i) => <CropTimelineCard key={cycle.id} cycle={cycle} idx={i} />)}
          </div>
        </div>
      )

      // ── SOIL MEMORY ───────────────────────────────────────────
      case 'soil': return loading ? <Spinner /> : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Score ring */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wide mb-3">AI Soil Health Score</p>
              {soilApiData ? (
                <>
                  <div className="relative inline-block my-2">
                    <svg width="120" height="120" className="-rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                      <circle cx="60" cy="60" r="50" fill="none"
                        stroke={soilApiData.soil_health_score > 75 ? '#22c55e' : soilApiData.soil_health_score > 50 ? '#eab308' : '#ef4444'}
                        strokeWidth="10" strokeLinecap="round"
                        strokeDasharray="314.2"
                        strokeDashoffset={314.2 - (314.2 * soilApiData.soil_health_score) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-slate-800">{soilApiData.soil_health_score}</span>
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${soilApiData.soil_health_score > 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {soilApiData.health_status}
                  </p>
                  {/* Suitable crops */}
                  <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                    {(soilApiData.suitable_crops || []).map(c => (
                      <span key={c} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </>
              ) : <p className="text-slate-400 mt-4">No data</p>}
            </div>

            {/* Nutrient status now */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Current Nutrient Status</h4>
              <NutrientBar label="Nitrogen (N)"   value={lastSoil.nitrogen}   optimal_min={60}  optimal_max={160} unit="kg/ha" />
              <NutrientBar label="Phosphorus (P)" value={lastSoil.phosphorus} optimal_min={35}  optimal_max={100} unit="kg/ha" />
              <NutrientBar label="Potassium (K)"  value={lastSoil.potassium}  optimal_min={35}  optimal_max={150} unit="kg/ha" />
              <NutrientBar label="pH"             value={lastSoil.ph}         optimal_min={6.0} optimal_max={7.5} unit="" />
            </div>

            {/* Deficiencies & recs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-2">Deficiencies Found</h4>
              {soilApiData?.issues_found?.length > 0
                ? soilApiData.issues_found.map((iss, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm bg-red-50 text-red-700 border border-red-100 rounded-lg p-3">
                      <XCircle size={14} className="flex-shrink-0 mt-0.5"/><span>{iss}</span>
                    </div>
                  ))
                : <p className="text-green-600 text-sm flex gap-2 items-center"><CheckCircle2 size={14}/>No critical deficiencies.</p>}
            </div>
          </div>

          {/* Nutrient trend table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <SectionHeading icon={Activity} title="Soil Nutrient Trend (Time-Series Memory)" subtitle="AI tracking across all recorded soil tests" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>{['Test Date','N (kg/ha)','P (kg/ha)','K (kg/ha)','pH','Org. Carbon','EC'].map(h => <th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {SOIL_READINGS.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{r.date}</td>
                      <td className="p-3 font-semibold text-slate-800">{r.nitrogen}</td>
                      <td className="p-3 font-semibold text-slate-800">{r.phosphorus}</td>
                      <td className="p-3 font-semibold text-slate-800">{r.potassium}</td>
                      <td className="p-3 text-slate-600">{r.ph}</td>
                      <td className="p-3 text-slate-600">{r.organic_carbon}%</td>
                      <td className="p-3 text-slate-600">{r.ec} dS/m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI prescriptions */}
          {soilApiData?.recommendations?.length > 0 && (
            <div className="bg-gradient-to-br from-leaf-50 to-green-50 border border-leaf-100 rounded-2xl p-6">
              <SectionHeading icon={CheckCircle2} title="Prescriptive AI Actions" color="text-leaf-600" />
              <div className="grid md:grid-cols-2 gap-3">
                {soilApiData.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-leaf-100 shadow-sm flex gap-3 items-start text-sm font-medium text-slate-700 hover:shadow-md transition-shadow">
                    <span className="w-6 h-6 rounded-full bg-leaf-100 text-leaf-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

      // ── LIVE EVENTS ───────────────────────────────────────────
      case 'realtime': return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* IoT sensor stream */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeading icon={Cpu} title="IoT Sensor Stream" subtitle="Short-term memory — last 7 days of field readings" />
              <div>{IOT_EVENTS.map((ev, i) => <IotEventRow key={i} ev={ev} idx={i}/>)}</div>
            </div>
            {/* Interaction log */}
            <div>
              <SectionHeading icon={MessageCircle} title="Voice & App Interaction Log" subtitle="Every query linked to context and outcome" />
              <div className="space-y-3">{INTERACTION_LOG.map((l, i) => <InteractionRow key={i} log={l} idx={i}/>)}</div>
            </div>
          </div>
        </div>
      )

      // ── ANOMALIES ─────────────────────────────────────────────
      case 'anomalies': return loading ? <Spinner /> : (
        <div className="space-y-6">
          {anomalyData?.system_healthy ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="inline-flex p-5 bg-green-100 rounded-full mb-4"><CheckCircle2 size={44} className="text-green-600"/></div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Farm Memory is Stable</h2>
              <p className="text-green-700 max-w-md mx-auto">No critical anomalies detected across yield, revenue, soil, or disease patterns.</p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-center mb-2">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={20}/>
                <p className="text-sm text-red-700 font-medium">
                  <strong>{anomalyData?.anomaly_count || 0} anomalies detected</strong> — cross-referenced with multi-season farm memory and regional benchmarks.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {(anomalyData?.anomalies || []).map((a, i) => <AnomalyCard key={i} anom={a} idx={i}/>)}
              </div>
            </>
          )}
        </div>
      )

      // ── FEEDBACK LOOP ─────────────────────────────────────────
      case 'feedback': return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6">
            <SectionHeading icon={MessageCircle} title="Reinforcement Learning Loop" color="text-purple-600"
              subtitle="Farmer ratings & outcomes are fed back into the AI to improve future recommendations." />
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="bg-white rounded-xl p-4 border border-purple-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-purple-700">{FEEDBACK_LOG.filter(f=>f.followed).length}/{FEEDBACK_LOG.length}</p>
                <p className="text-xs text-slate-500 mt-1">Recommendations followed</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-yellow-600">
                  {(FEEDBACK_LOG.reduce((a,f)=>a+f.rating,0)/FEEDBACK_LOG.length).toFixed(1)}★
                </p>
                <p className="text-xs text-slate-500 mt-1">Average accuracy rating</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-100 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{FEEDBACK_LOG.filter(f=>f.rating>=4).length}</p>
                <p className="text-xs text-slate-500 mt-1">High-quality predictions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Historical Recommendation Feedback</h3>
              <p className="text-sm text-slate-500 mt-0.5">Each entry updates the reinforcement model for your farm.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{['Date','Recommendation','Rating','Followed','Actual Outcome'].map(h=><th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>{FEEDBACK_LOG.map((fb,i)=><FeedbackRow key={fb.id} fb={fb} idx={i}/>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )

      // ── CROSS-FARM INTEL ──────────────────────────────────────
      case 'crossfarm': return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-6">
            <SectionHeading icon={Globe} title="Cross-Farm Regional Intelligence" color="text-teal-600"
              subtitle="Anonymized benchmarking against similar farms in Nashik district — privacy-safe aggregated insights." />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Your Farm vs. Regional Averages</h3>
              <p className="text-sm text-slate-500 mt-0.5">Data aggregated from 847 farms in Maharashtra — all anonymized.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{['Metric','Your Farm','Region Avg','Rank'].map(h=><th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>{REGIONAL_BENCHMARKS.map((bm,i)=><BenchmarkRow key={i} bm={bm} idx={i}/>)}</tbody>
              </table>
            </div>
          </div>

          {/* Digital Twin note */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute right-4 top-4 opacity-10 pointer-events-none"><Globe size={100}/></div>
            <div className="relative z-10">
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">Digital Twin</span>
              <h3 className="text-xl font-bold mt-3 mb-2">Your Farm Has a Living Digital Double</h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                Every IoT reading, satellite image, soil test, and market transaction contributes to a continuously-updated digital model of your farm. This twin is used to simulate interventions before applying them in the field — reducing risk and optimising decisions.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {['IoT Sensors Active','Soil Model Updated','Satellite Data Synced','Market Prices Linked'].map(item=>(
                  <span key={item} className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={11} className="text-green-400"/>{item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

      // ── PRIVACY & SECURITY ────────────────────────────────────
      case 'privacy': return (
        <div className="space-y-6">
          <div className="bg-slate-800 text-white rounded-2xl p-8 relative overflow-hidden shadow-lg">
            <div className="absolute right-6 top-6 opacity-10"><Lock size={120}/></div>
            <div className="relative z-10">
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">Data Governance</span>
              <h2 className="text-2xl font-bold mt-3 mb-2">Your Farm Data. Your Control.</h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                SmartFarm AI follows strict data ownership policies. All farm data is encrypted at rest and in transit. No raw farm data is shared with third parties. Cross-farm insights use only anonymized, aggregated metrics.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeading icon={Shield} title="Data Protection Policies" />
              <div className="space-y-3">
                {[
                  'All data encrypted with AES-256 at rest',
                  'TLS 1.3 for all data in transit',
                  'Farmer retains full ownership of farm data',
                  'Data deletion request honoured within 30 days',
                  'Zero raw data shared with third-party services',
                  'Anonymized aggregate-only cross-farm benchmarks',
                  'Audit log of all AI accesses to your data',
                ].map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5"/>{p}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeading icon={Lock} title="Access & Compliance" />
              <div className="space-y-3">
                {[
                  'Role-based access: Owner, Agronomist, View-only',
                  'Two-factor authentication enforced for all logins',
                  'Session auto-expires after 30 minutes of inactivity',
                  'DPDP Act 2023 (India) compliant data handling',
                  'Monthly privacy audit reports generated automatically',
                  'IoT device access revocable at any time from app',
                  'Aadhaar / Bank details masked in all logs',
                ].map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-blue-500 flex-shrink-0 mt-0.5"/>{p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Security Certifications & Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['AES-256 Encryption','TLS 1.3 Active','DPDP Compliant','Audit Logs On'].map(b=>(
                <div key={b} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                  <Lock size={14} className="text-leaf-500 flex-shrink-0"/>
                  <span className="text-sm text-slate-700 font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

      default: return null
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 80% 20%, #22c55e 0%, transparent 60%)'}}/>
        <div className="absolute right-8 top-8 opacity-10 pointer-events-none"><BookOpen size={160}/></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider">Long-Term Intelligence Backbone</span>
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"/>Auto-learning Active
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Farm Memory Engine</h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mb-6">
            A persistent, evolving intelligence system that stores, learns from, and personalises every crop cycle, soil test, sensor reading, and AI interaction — making SmartFarm AI smarter with every season.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
            {[
              { label: 'Farmer', val: FARM_PROFILE.farmer_name },
              { label: 'Location', val: FARM_PROFILE.location },
              { label: 'Farm Size', val: `${FARM_PROFILE.size_ha} ha` },
              { label: 'Events Logged', val: '342 interactions' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="font-semibold text-white mt-0.5">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200" style={{scrollbarWidth:'none'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all flex-shrink-0 ${
              tab === t.id
                ? 'bg-white text-leaf-700 border border-b-white border-slate-200 -mb-px shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <t.icon size={14}/>{t.label}
          </button>
        ))}
        <button onClick={loadAll} className="ml-auto flex items-center gap-1 px-3 py-2 text-xs text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
