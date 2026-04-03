// ═══════════════════════════════════════════════════════════════
// SMARTFARM AI — FARM MEMORY MODULE  |  components.js
// Reusable UI sub-components
// ═══════════════════════════════════════════════════════════════
'use client'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, AlertTriangle, Droplet, Leaf,
  BarChart2, Shield, Zap, Star, Clock, CheckCircle2, XCircle,
  Bug, Calendar, MapPin, Coins, Brain, Database, Activity,
  ThumbsUp, ThumbsDown, Wifi, Cpu, Lock, Users, Globe,
} from 'lucide-react'

// ── Icon map used by AI insight cards ─────────────────────────
export const ICON_MAP = {
  'trending-up': TrendingUp, 'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle, 'droplet': Droplet,
  'leaf': Leaf, 'bar-chart': BarChart2, 'shield': Shield,
  'zap': Zap, 'star': Star, 'clock': Clock,
  'check': CheckCircle2, 'brain': Brain, 'database': Database,
}

// ── Colour helpers ─────────────────────────────────────────────
const SEV_STYLES = {
  High:   'bg-red-50 border-red-200 text-red-700',
  Medium: 'bg-orange-50 border-orange-200 text-orange-700',
  Low:    'bg-yellow-50 border-yellow-200 text-yellow-700',
}
const SEV_BADGE = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-orange-100 text-orange-700',
  Low:    'bg-yellow-100 text-yellow-700',
}
const LAYER_COLOR = { blue: 'bg-blue-50 border-blue-200 text-blue-700', green: 'bg-green-50 border-green-200 text-green-700', purple: 'bg-purple-50 border-purple-200 text-purple-700' }
const LAYER_ICON_BG = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600' }

// ── Generic stat card ──────────────────────────────────────────
export function StatCard({ title, value, subtext, icon: Icon, colorClass }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl flex-shrink-0 ${colorClass}`}><Icon size={20} /></div>
    </motion.div>
  )
}

// ── Section heading ────────────────────────────────────────────
export function SectionHeading({ icon: Icon, title, subtitle, color = 'text-leaf-500' }) {
  return (
    <div className="mb-5">
      <h2 className={`text-xl font-bold text-slate-800 flex items-center gap-2`}>
        <Icon className={color} size={22} /> {title}
      </h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1 ml-8">{subtitle}</p>}
    </div>
  )
}

// ── Memory layer card (Short / Long / Semantic) ────────────────
export function MemoryLayerCard({ layer, color, icon, desc, items }) {
  const IconComp = icon === 'zap' ? Zap : icon === 'database' ? Database : Brain
  return (
    <div className={`rounded-2xl border p-5 ${LAYER_COLOR[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${LAYER_ICON_BG[color]}`}><IconComp size={20} /></div>
        <h3 className="font-bold text-slate-800">{layer}</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{desc}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── AI Insight card (from Gemini response) ─────────────────────
export function InsightCard({ insight, idx }) {
  const IconComp = ICON_MAP[insight.icon] || CheckCircle2
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-3 hover:border-leaf-300 hover:shadow-md transition-all group"
    >
      <div className="mt-0.5 flex-shrink-0 p-2 bg-slate-50 rounded-lg group-hover:bg-leaf-50 transition-colors">
        <IconComp size={16} className="text-slate-500 group-hover:text-leaf-600 transition-colors" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{insight.title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.detail}</p>
      </div>
    </motion.div>
  )
}

// ── Crop recommendation card ───────────────────────────────────
export function CropRecoCard({ crop, idx }) {
  const pct = crop.confidence_pct || 75
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-green-700 text-lg">{crop.crop}</h4>
        <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">{pct}% Match</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{crop.reason}</p>
      <div className="mt-3 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 + 0.3 }}
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
        />
      </div>
    </motion.div>
  )
}

// ── Crop timeline card (lifecycle) ─────────────────────────────
export function CropTimelineCard({ cycle, idx }) {
  const profit = cycle.revenue_inr - cycle.input_cost_inr
  const yieldPerHa = (cycle.yield_tons / cycle.area_ha).toFixed(1)
  const isProfit = profit > 0
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
      <div className="absolute -left-[41px] top-1 h-7 w-7 rounded-full bg-leaf-500 border-4 border-white shadow-md flex items-center justify-center">
        <Leaf size={12} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{cycle.crop}
              <span className="ml-2 text-sm font-normal text-slate-400">({cycle.variety})</span>
            </h3>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <Calendar size={13} /> {cycle.sown_date} → {cycle.harvested_date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{cycle.season}</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= cycle.ai_outcome_rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
              ))}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Area', val: `${cycle.area_ha} ha` },
            { label: 'Total Yield', val: `${cycle.yield_tons} t` },
            { label: 'Yield/Ha', val: `${yieldPerHa} t/ha` },
            { label: 'Market', val: cycle.market_sold.split(' ')[0] },
            { label: 'Net P&L', val: `₹${profit.toLocaleString()}`, highlight: isProfit ? 'text-green-600' : 'text-red-500' },
          ].map(m => (
            <div key={m.label} className="bg-slate-50 p-3 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">{m.label}</p>
              <p className={`font-bold text-slate-800 text-sm mt-0.5 ${m.highlight || ''}`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* Diseases + weather + sale */}
        <div className="grid md:grid-cols-3 gap-4 mt-3 text-sm">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1.5 tracking-wide flex items-center gap-1"><Bug size={11}/>Diseases</p>
            <div className="flex flex-wrap gap-1.5">
              {cycle.disease_incidents.map((d, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-600 rounded text-xs">{d}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1.5 tracking-wide flex items-center gap-1"><Coins size={11}/>Sale</p>
            <p className="text-slate-700 font-medium">₹{cycle.sale_price_per_q}/q @ {cycle.market_sold}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1.5 tracking-wide flex items-center gap-1"><MapPin size={11}/>AI Memory Note</p>
            <p className="text-slate-600 italic leading-snug">"{cycle.weather_note}"</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Soil nutrient bar ──────────────────────────────────────────
export function NutrientBar({ label, value, optimal_min, optimal_max, unit }) {
  const max_display = optimal_max * 1.6
  const pct = Math.min((value / max_display) * 100, 100)
  const inRange = value >= optimal_min && value <= optimal_max
  const color = inRange ? 'from-green-400 to-emerald-500' : value < optimal_min ? 'from-red-400 to-orange-500' : 'from-yellow-400 to-amber-500'
  const status = inRange ? 'Optimal' : value < optimal_min ? 'Low' : 'High'
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inRange ? 'bg-green-100 text-green-700' : value < optimal_min ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
          <span className="text-sm font-bold text-slate-800">{value} {unit}</span>
        </div>
      </div>
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r rounded-full ${color}`}
        />
      </div>
      <p className="text-xs text-slate-400 mt-0.5">Optimal: {optimal_min}–{optimal_max} {unit}</p>
    </div>
  )
}

// ── Anomaly card ───────────────────────────────────────────────
export function AnomalyCard({ anom, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
      className={`p-5 rounded-2xl border shadow-sm ${SEV_STYLES[anom.severity] || SEV_STYLES.Low}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} />
          <h3 className="font-bold">{anom.title}</h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${SEV_BADGE[anom.severity]}`}>{anom.severity}</span>
      </div>
      <p className="text-sm leading-relaxed mb-4 opacity-90">{anom.detail}</p>
      <div className="bg-white/60 p-3 rounded-xl border border-black/5">
        <p className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1">AI Action</p>
        <p className="text-sm text-slate-800 font-medium">{anom.recommendation}</p>
      </div>
      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
        <Globe size={11}/> Regional context: Similar trends across Nashik farms last season.
      </p>
    </motion.div>
  )
}

// ── Feedback row ───────────────────────────────────────────────
export function FeedbackRow({ fb, idx }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.07 }}
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
    >
      <td className="p-3 text-xs text-slate-400 font-medium">{fb.date}</td>
      <td className="p-3 text-sm text-slate-700 font-medium">{fb.recommendation}</td>
      <td className="p-3">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={11} className={s <= fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
          ))}
        </div>
      </td>
      <td className="p-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fb.followed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {fb.followed ? 'Followed' : 'Skipped'}
        </span>
      </td>
      <td className="p-3 text-xs text-slate-500 italic">{fb.outcome}</td>
    </motion.tr>
  )
}

// ── IoT event row ──────────────────────────────────────────────
export function IotEventRow({ ev, idx }) {
  const COLOR = { normal: 'bg-green-100 text-green-700', alert: 'bg-red-100 text-red-600', low: 'bg-yellow-100 text-yellow-700', completed: 'bg-blue-100 text-blue-600', dry: 'bg-orange-100 text-orange-600' }
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
      className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          {ev.type === 'soil_moisture' ? <Droplet size={14} className="text-blue-500"/>
           : ev.type === 'temperature' ? <Activity size={14} className="text-orange-500"/>
           : ev.type === 'irrigation' ? <Droplet size={14} className="text-cyan-500"/>
           : ev.type === 'pest_trap' ? <Bug size={14} className="text-red-500"/>
           : ev.type === 'rainfall' ? <Droplet size={14} className="text-sky-400"/>
           : <Cpu size={14} className="text-slate-400"/>}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 capitalize">{ev.type.replace('_', ' ')}</p>
          <p className="text-xs text-slate-400">{ev.zone} • {ev.ts.replace('T', ' ')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-700 text-sm">{ev.value}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${COLOR[ev.status] || 'bg-slate-100 text-slate-500'}`}>{ev.status}</span>
      </div>
    </motion.div>
  )
}

// ── Regional benchmark row ─────────────────────────────────────
export function BenchmarkRow({ bm, idx }) {
  const isTop = bm.rank.toLowerCase().includes('top') || bm.rank === 'Efficient'
  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.07 }}
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
    >
      <td className="p-3 text-sm font-semibold text-slate-700">{bm.metric}</td>
      <td className="p-3 text-sm font-bold text-green-700">{bm.your_farm}</td>
      <td className="p-3 text-sm text-slate-500">{bm.region_avg}</td>
      <td className="p-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isTop ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {bm.rank}
        </span>
      </td>
    </motion.tr>
  )
}

// ── Privacy pill badge ─────────────────────────────────────────
export function PrivacyBadge({ label }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
      <Lock size={14} className="text-leaf-500 flex-shrink-0" />
      <span className="text-sm text-slate-700 font-medium">{label}</span>
    </div>
  )
}

// ── Interaction log row ────────────────────────────────────────
export function InteractionRow({ log, idx }) {
  const INTENT_COLOR = { mandi_price: 'bg-purple-100 text-purple-700', disease_detect: 'bg-red-100 text-red-700', scheme_info: 'bg-blue-100 text-blue-700', crop_recommend: 'bg-green-100 text-green-700' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
      className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-slate-800 flex-1 pr-4">"{log.query}"</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${INTENT_COLOR[log.intent] || 'bg-slate-100 text-slate-500'}`}>
          {log.intent.replace('_', ' ')}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-1">{log.ts.replace('T', ' ')}</p>
      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed"><span className="font-bold text-slate-700">Outcome: </span>{log.outcome}</p>
    </motion.div>
  )
}
