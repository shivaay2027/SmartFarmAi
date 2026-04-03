'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2,
  MapPin, Cpu, Star, AlertTriangle, ChevronDown,
  Search, Navigation, Info, ArrowUpDown, CheckCircle2, Clock, Zap, Target,
  Wifi, WifiOff, Database, Activity
} from 'lucide-react'
import {
  getStates, getDistricts, getSubDistricts, getMandis, getCrops,
  getPrice, CROP_INFO, MANDI_DB
} from './mandiDb'

const API = 'http://localhost:8001/api/v1/mandi'
const CROP_CATS = ['All','Cereal','Pulse','Oilseed','Vegetable','Spice','Fruit','Cash Crop']

// MSP 2024-25 official values
const MSP = {
  WHEAT: 2275, RICE: 2300, BASMATI_RICE: null, MAIZE: 2090, BAJRA: 2625,
  JOWAR: 3371, RAGI: 3846, SOYBEAN: 4892, MUSTARD: 5650, GROUNDNUT: 6783,
  SUNFLOWER: 7280, SESAME: 9267, COTTON: 7020, SUGARCANE: 340, JUTE: 5335,
  ARHAR: 7550, MOONG: 8682, URAD: 7400, CHANA: 5440, MASOOR: 6425,
}

// Agmarknet commodity name map (how Agmarknet calls each crop)
const AGMARK_NAME = {
  WHEAT:'Wheat', RICE:'Paddy(Dhan)(Common)', BASMATI_RICE:'Paddy(Basmati)',
  MAIZE:'Maize', BAJRA:'Bajra(Pearl Millet/Cumbu)', JOWAR:'Jowar(Sorghum)',
  RAGI:'Ragi (Finger Millet)(Nagli/Kodon)', SOYBEAN:'Soya seeds',
  MUSTARD:'Mustard', GROUNDNUT:'Groundnut', SUNFLOWER:'Sunflower Seed',
  SESAME:'Sesamum(Sesame,Gingelly,Til)', COTTON:'Cotton', SUGARCANE:'Sugarcane',
  JUTE:'Jute', ARHAR:'Arhar (Tur/Red Gram)(Whole)', MOONG:'Moong (Whole)',
  URAD:'Urad (Black Gram)(Whole)', CHANA:'Bengal Gram(Gram)(Whole)',
  MASOOR:'Masoor Dal', ONION:'Onion', TOMATO:'Tomato', POTATO:'Potato',
  GARLIC:'Garlic', CHILLI:'Dry Chillies', CABBAGE:'Cabbage', CAULIFLOWER:'Cauliflower',
  BRINJAL:'Brinjal', BHINDI:'Bhindi(Ladies Finger)', TURMERIC:'Turmeric',
  GINGER:'Ginger(Dry)', CORIANDER:'Coriander(Leaves)', BANANA:'Banana',
  APPLE:'Apple', MANGO:'Mango (Raw-Ripe)', GRAPES:'Grapes Coloured', POMEGRANATE:'Pomegranate',
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
const TrendIcon = ({ t }) =>
  t === 'up'   ? <TrendingUp  size={14} className="text-emerald-500" /> :
  t === 'down' ? <TrendingDown size={14} className="text-red-500"   /> :
                 <Minus size={14} className="text-slate-400" />

const ConfBadge = ({ s }) => {
  const p = Math.round((s||0.7) * 100)
  const c = p >= 80 ? 'bg-emerald-100 text-emerald-700' : p >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c}`}><CheckCircle2 size={10}/>{p}%</span>
}

const RecBadge = ({ r }) => {
  const c = { BUY:'bg-emerald-500', HOLD:'bg-amber-500', SELL:'bg-red-500' }[r] || 'bg-slate-400'
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold text-white ${c}`}><Zap size={12}/>{r}</span>
}

const Sparkline = ({ vals, color }) => {
  if (!vals || vals.length < 2) return <span className="text-slate-300 text-xs">—</span>
  const min = Math.min(...vals), max = Math.max(...vals), W = 80, H = 28
  const pts = vals.map((v, i) => `${(i/(vals.length-1))*W},${H-((v-min)/(max-min||1))*H}`).join(' ')
  return <svg width={W} height={H}><polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts}/></svg>
}

const DropSelect = ({ label, value, onChange, options, disabled, placeholder }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-leaf-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
    </div>
  </div>
)

const LoadingRow = () => (
  <tr><td colSpan={8}><div className="h-4 bg-slate-100 animate-pulse rounded mx-4 my-3"/></td></tr>
)

export default function MandiPrices() {
  // Selection state
  const [selState, setSelState]   = useState('')
  const [selDist,  setSelDist]    = useState('')
  const [selSub,   setSelSub]     = useState('')
  const [selMandi, setSelMandi]   = useState('')
  const [selCrop,  setSelCrop]    = useState('')
  const [selCat,   setSelCat]     = useState('All')
  const [search,   setSearch]     = useState('')
  const [sortCol,  setSortCol]    = useState('modal')
  const [sortDir,  setSortDir]    = useState('desc')
  const [tab,      setTab]        = useState('prices')
  const [userLat,  setUserLat]    = useState(22.7196)
  const [userLng,  setUserLng]    = useState(75.8577)

  // Live prices state
  const [liveData,    setLiveData]    = useState([])
  const [liveSource,  setLiveSource]  = useState('')
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveDate,    setLiveDate]    = useState('')

  // Sparklines: { [cropId]: number[] }
  const [sparklines, setSparklines] = useState({})

  // Price Trend
  const [histData,    setHistData]    = useState([])
  const [histLoading, setHistLoading] = useState(false)

  // AI Forecast
  const [forecast,    setForecast]    = useState(null)
  const [fcLoading,   setFcLoading]   = useState(false)
  const [fcSource,    setFcSource]    = useState('')

  // Best Market
  const [bestMkts,    setBestMkts]    = useState([])
  const [bmLoading,   setBmLoading]   = useState(false)

  // Derived hierarchy
  const states    = getStates()
  const districts = selState ? getDistricts(selState) : []
  const subList   = selState && selDist ? getSubDistricts(selState, selDist) : []
  const mandiList = selState ? getMandis(selState, selDist, selSub) : []
  const allCrops  = selState ? getCrops(selState) : getCrops(null)
  const cropList  = selCat === 'All' ? allCrops : allCrops.filter(c => c.cat === selCat)
  const curMandi  = mandiList.find(m => m.id === selMandi) || null

  // Cascade resets
  const handleState = (v) => { setSelState(v); setSelDist(''); setSelSub(''); setSelMandi(''); setSelCrop(''); setLiveData([]); setHistData([]); setForecast(null); setBestMkts([]); setSparklines({}) }
  const handleDist  = (v) => { setSelDist(v);  setSelSub(''); setSelMandi('') }
  const handleSub   = (v) => { setSelSub(v);   setSelMandi('') }

  // Geo
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => { setUserLat(p.coords.latitude); setUserLng(p.coords.longitude) })
  }, [])

  // ── Fetch live prices when mandi selected ──
  const fetchLive = useCallback(async (mandiObj) => {
    if (!mandiObj) return
    setLiveLoading(true)
    setLiveData([])
    setLiveSource('')
    try {
      // Pass market name so backend can route:
      //   Tier-1 (Agmarknet API) if market appears in official APMC dataset
      //   Tier-2 (regional scrapers) if market is a local/sub-district mandi
      const marketName = mandiObj.name.replace(/ APMC$/i, '').trim()
      const params = new URLSearchParams({
        state: mandiObj.state,
        market: marketName,
        district: mandiObj.district,
        limit: '2000',
      })
      const r = await fetch(`${API}/live-prices?${params}`)
      if (r.ok) {
        const d = await r.json()
        const all = d.data || []
        setLiveData(all)
        // Show tier in source label
        const tierLabel = d.tier === 2 ? '🏷 Regional' : '✅ Agmarknet'
        setLiveSource(d.source ? `${tierLabel}: ${d.source}` : tierLabel)
        setLiveDate((all[0])?.date || d.date || '')
      }
    } catch { /* offline */ }
    finally { setLiveLoading(false) }
  }, [])


  useEffect(() => {
    if (selMandi) {
      const m = MANDI_DB.find(m => m.id === selMandi)
      if (m) fetchLive(m)
    } else { setLiveData([]); setLiveSource('') }
  }, [selMandi, fetchLive])

  // ── Fetch sparklines for all crops in view when state changes ──
  const sparklineCache = useRef({})
  useEffect(() => {
    if (!selState) return
    const crops = allCrops.slice(0, 12) // limit to avoid too many requests
    const fetchSparklines = async () => {
      const results = {}
      await Promise.all(crops.map(async (c) => {
        const agName = AGMARK_NAME[c.id]
        if (!agName) return
        const key = `${selState}|${agName}`
        if (sparklineCache.current[key]) { results[c.id] = sparklineCache.current[key]; return }
        try {
          const r = await fetch(`${API}/sparkline?commodity=${encodeURIComponent(agName)}&state=${encodeURIComponent(selState)}`)
          if (r.ok) {
            const d = await r.json()
            if (d.data?.length >= 2) { sparklineCache.current[key] = d.data; results[c.id] = d.data }
          }
        } catch { /* skip */ }
      }))
      setSparklines(prev => ({ ...prev, ...results }))
    }
    fetchSparklines()
  }, [selState]) // eslint-disable-line

  // ── Fetch historical prices when crop + mandi selected ──
  useEffect(() => {
    if (!selCrop || !selMandi) { setHistData([]); return }
    const agName = AGMARK_NAME[selCrop]
    if (!agName) return
    setHistLoading(true)
    setHistData([])
    ;(async () => {
      try {
        const r = await fetch(`${API}/historical-prices?commodity=${encodeURIComponent(agName)}&state=${encodeURIComponent(selState)}&days=30`)
        if (r.ok) {
          const d = await r.json()
          setHistData(d.data || [])
        }
      } catch { /* offline */ }
      finally { setHistLoading(false) }
    })()
  }, [selCrop, selMandi, selState])

  // ── Fetch AI forecast when crop selected ──
  useEffect(() => {
    if (!selCrop) { setForecast(null); return }
    const agName = AGMARK_NAME[selCrop]
    if (!agName) return
    setFcLoading(true)
    setForecast(null)
    const curPrice = allPricesRef.current.find(p => p.cropId === selCrop)?.modal || 0
    ;(async () => {
      try {
        const r = await fetch(`${API}/forecast?commodity=${encodeURIComponent(agName)}&state=${encodeURIComponent(selState)}&current_price=${curPrice}`)
        if (r.ok) {
          const d = await r.json()
          setForecast(d.data || null)
          setFcSource(d.source || '')
        }
      } catch { /* offline */ }
      finally { setFcLoading(false) }
    })()
  }, [selCrop, selState]) // eslint-disable-line

  // ── Fetch best markets when crop selected + tab='best' ──
  useEffect(() => {
    if (!selCrop || tab !== 'best') { setBestMkts([]); return }
    const agName = AGMARK_NAME[selCrop]
    if (!agName) return
    setBmLoading(true)
    setBestMkts([])
    ;(async () => {
      try {
        const r = await fetch(`${API}/best-market?commodity=${encodeURIComponent(agName)}&state=${encodeURIComponent(selState)}&lat=${userLat}&lng=${userLng}`)
        if (r.ok) {
          const d = await r.json()
          setBestMkts(d.data || [])
        }
      } catch { /* offline */ }
      finally { setBmLoading(false) }
    })()
  }, [selCrop, tab, selState, userLat, userLng])

  // ── Merge live data ONLY (Strict no dummy data policy) ──
  const allPrices = (() => {
    if (!selMandi || liveData.length === 0) return []

    // Build reverse maps for features like MSP and Sparklines
    const nameToId = {}
    Object.keys(AGMARK_NAME).forEach(key => {
      nameToId[AGMARK_NAME[key].toLowerCase().split('(')[0].trim()] = key
    })

    const finalPrices = []

    liveData.forEach(r => {
      if (!r.commodity || !r.modal_price || r.modal_price <= 0) return
      
      const commLower = r.commodity.toLowerCase().split('(')[0].trim()
      let mappedId = nameToId[commLower]
      if (!mappedId) {
        const found = Object.keys(nameToId).find(k => commLower.includes(k.slice(0,5)) || k.includes(commLower.slice(0,5)))
        if (found) mappedId = nameToId[found]
      }

      // Dropdown crop filter
      if (selCrop && mappedId !== selCrop) return
      // Dropdown category filter
      if (selCat !== 'All' && mappedId) {
        const cat = cropList.find(c => c.id === mappedId)?.cat
        if (cat && cat !== selCat) return
      }

      const cId = mappedId || r.commodity.replace(/\s+/g,'_').toLowerCase()
      const cName = mappedId ? (cropList.find(c=>c.id===mappedId)?.name || r.commodity) : r.commodity
      const mspVal = mappedId ? (MSP[mappedId] || null) : null
      
      let trend = 'neutral'
      let changePct = 0
      if (mappedId && sparklines[mappedId]?.length >= 2) {
         trend = sparklines[mappedId].slice(-1)[0] > sparklines[mappedId].slice(-2,-1)[0] ? 'up' : 'down'
         changePct = parseFloat(((sparklines[mappedId].slice(-1)[0] - sparklines[mappedId][0]) / sparklines[mappedId][0] * 100).toFixed(1))
      }

      const existing = finalPrices.find(p => p.cropName === cName)
      if (existing) {
         if (r.modal_price > existing.modal) {
             existing.modal = r.modal_price
             existing.min = r.min_price || r.modal_price
             existing.max = r.max_price || r.modal_price
         }
      } else {
         finalPrices.push({
            cropId: cId, cropName: cName, msp: mspVal,
            modal: r.modal_price, min: r.min_price || r.modal_price, max: r.max_price || r.modal_price,
            changePct, trend, confidence: 0.92, isLive: true,
            marketName: r.market || '', date: r.date || liveDate
         })
      }
    })
    return finalPrices
  })()

  // Keep ref for forecast fetch
  const allPricesRef = useRef(allPrices)
  allPricesRef.current = allPrices

  const displayed = allPrices
    .filter(p => !search || p.cropName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0
      return sortDir === 'asc' ? va - vb : vb - va
    })

  const topGainer = allPrices.reduce((best, p) => (!best || p.changePct > best.changePct ? p : best), null)
  const topLoser  = allPrices.reduce((best, p) => (!best || p.changePct < best.changePct ? p : best), null)
  const belowMSP  = allPrices.filter(p => p.msp && p.modal < p.msp)
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('desc') } }
  const loading = liveLoading

  const now = new Date()
  const lastUpdated = `${now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}${liveDate ? ` · Prices dated ${liveDate}` : ''}`

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={24} className="text-leaf-500"/> Mandi Price Forecaster
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">All-India real-time mandi prices · AI prediction · Profit optimizer</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
            <Navigation size={11} className="text-emerald-500"/> GPS Active
          </span>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10}/> LAST UPDATED</p>
            <p className="text-sm font-bold text-slate-800">{lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* ── Location & Crop Selector ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-leaf-500"/> Select Location & Crop</h2>
          <p className="text-xs text-slate-400">State → District → Sub-district → Mandi</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <DropSelect label="State" value={selState} onChange={handleState}
            options={states.map(s => ({ value: s, label: s }))} placeholder="Select State"/>
          <DropSelect label="District" value={selDist} onChange={handleDist}
            options={districts.map(d => ({ value: d, label: d }))} placeholder={selState ? 'Select District' : '← State first'} disabled={!selState}/>
          <DropSelect label="Sub-District" value={selSub} onChange={handleSub}
            options={subList.map(s => ({ value: s, label: s }))} placeholder={selDist ? 'Select Tehsil' : '← District first'} disabled={!selDist}/>
          <DropSelect label="Mandi" value={selMandi} onChange={setSelMandi}
            options={mandiList.map(m => ({ value: m.id, label: m.name }))} placeholder={selState ? 'Select Mandi' : '← State first'} disabled={!selState}/>
          <DropSelect label="Crop" value={selCrop} onChange={setSelCrop}
            options={cropList.map(c => ({ value: c.id, label: c.name }))} placeholder="All Crops" disabled={!selState}/>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Crop</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-leaf-400 shadow-sm"/>
            </div>
          </div>
        </div>
        {/* Status bar */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {selState && !selMandi && (
            <p className="text-xs text-leaf-600 font-medium">
              ✓ {mandiList.length} mandis in {selState}{selDist && ` › ${selDist}`}{selSub && ` › ${selSub}`} — select one to load prices
              {liveLoading && <span className="ml-2 text-amber-500">(fetching live prices…)</span>}
            </p>
          )}
          {selMandi && (
            <div className="flex flex-wrap items-center gap-2">
              {liveSource
                ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Wifi size={10}/>Live: Agmarknet</span>
                : <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"><WifiOff size={10}/>Estimated (local)</span>}
              {liveDate && <span className="text-xs text-slate-400 flex items-center gap-1"><Database size={9}/>Data: {liveDate}</span>}
              <span className="text-xs text-slate-400">{cropList.length} crops · {selCat !== 'All' && `Showing: ${selCat}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Crop Category Filter Tabs ── */}
      {selMandi && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CROP_CATS.map(cat => (
            <button key={cat} onClick={() => setSelCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border
                ${selCat===cat ? 'bg-leaf-500 text-white border-leaf-500' : 'bg-white text-slate-500 border-slate-200 hover:border-leaf-400 hover:text-leaf-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Summary Cards ── */}
      {selMandi && allPrices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label:'HIGHEST GAINER', icon:'🚀', p:topGainer, color:'text-emerald-600', sub:`+${topGainer?.changePct}%`, cond:topGainer?.changePct > 0 },
            { label:'BIGGEST DROP',   icon:'📉', p:topLoser,  color:'text-red-500',     sub:`${topLoser?.changePct}%`,   cond:topLoser?.changePct < 0 },
          ].map(({ label, icon, p, color, sub, cond }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">{icon} {label}</p>
              {selMandi ? (
                <>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{p?.cropName?.split('(')[0] || '—'} <span className="text-base">{cond ? sub : ''}</span></p>
                  <p className="text-sm text-slate-400 mt-0.5">₹{p?.modal?.toLocaleString('en-IN')}/Quintal</p>
                </>
              ) : <p className="text-slate-400 font-semibold mt-2">Select a mandi</p>}
            </div>
          ))}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-2"><AlertTriangle size={12} className="text-amber-500"/> BELOW MSP ALERT</p>
            {belowMSP.length > 0
              ? <><p className="text-xl font-bold text-amber-600 mt-1">{belowMSP.length} crops ⚠️</p><p className="text-xs text-slate-400 mt-0.5 truncate">{belowMSP.slice(0,3).map(p=>p.cropName.split('(')[0]).join(', ')}</p></>
              : <><p className="text-xl font-bold text-emerald-600 mt-1">All above MSP ✓</p><p className="text-xs text-slate-400 mt-0.5">No alert today</p></>}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            { id:'prices',  icon:<BarChart2 size={14}/>, label:"Today's Prices" },
            { id:'trend',   icon:<Activity  size={14}/>, label:'Price Trend' },
            { id:'predict', icon:<Cpu       size={14}/>, label:'AI Forecast' },
            { id:'best',    icon:<Star      size={14}/>, label:'Best Market' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors
                ${tab===t.id ? 'border-leaf-500 text-leaf-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-4">
            <button onClick={() => { fetchLive(curMandi); setSparklines({}) }}
              className="flex items-center gap-1 text-xs text-leaf-600 hover:text-leaf-700 font-medium">
              <RefreshCw size={12}/> Refresh
            </button>
          </div>
        </div>

        {/* ── TODAY'S PRICES ── */}
        {tab === 'prices' && (
          <div>
            {!selMandi ? (
              <div className="p-10 text-center text-slate-400">
                <MapPin size={36} className="mx-auto mb-3 text-slate-200"/>
                <p className="font-semibold text-slate-500">Select a State & Mandi above to load live prices</p>
                <p className="text-xs mt-1">Use the cascading dropdowns: State → District → Mandi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {[
                        { col:'cropName', label:'Crop' },
                        { col:'min',      label:'Min (₹)' },
                        { col:'modal',    label:'Modal (₹)' },
                        { col:'max',      label:'Max (₹)' },
                        { col:'changePct',label:'Change' },
                        { col:'msp',      label:'MSP (₹)' },
                        { col:null,       label:'7-Day Trend' },
                        { col:'confidence',label:'Confidence' },
                      ].map(({ col, label }) => (
                        <th key={label} onClick={() => col && toggleSort(col)}
                          className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide ${col ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}>
                          <span className="flex items-center gap-1">{label}{col && <ArrowUpDown size={10}/>}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? Array(6).fill(0).map((_, i) => <LoadingRow key={i}/>) :
                     displayed.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400">No crops match the filter</td></tr>
                     ) : displayed.map((p, i) => {
                      const spkVals = sparklines[p.cropId] || []
                      const spkColor = p.trend==='up' ? '#22c55e' : p.trend==='down' ? '#ef4444' : '#94a3b8'
                      const belowMsp = p.msp && p.modal < p.msp
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800">{p.cropName}</div>
                            {p.isLive
                              ? <span className="text-xs text-emerald-600 font-medium">● Live{p.marketName ? ` · ${p.marketName}` : ''}</span>
                              : <span className="text-xs text-slate-400">● Estimated</span>}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">₹{(p.min||0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 text-base">₹{(p.modal||0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-slate-500">₹{(p.max||0).toLocaleString('en-IN')}</td>
                          <td className={`px-4 py-3.5 font-bold ${p.changePct>0?'text-emerald-600':p.changePct<0?'text-red-500':'text-slate-400'}`}>
                            <span className="flex items-center gap-1"><TrendIcon t={p.trend}/>{p.changePct>0?'+':''}{p.changePct}%</span>
                          </td>
                          <td className="px-4 py-3.5">
                            {p.msp
                              ? <span className={`text-xs font-medium ${belowMsp ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                  ₹{p.msp.toLocaleString('en-IN')}{belowMsp && <span className="ml-1 text-red-500">⚠ Below</span>}
                                </span>
                              : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <Sparkline vals={spkVals.length >= 2 ? spkVals : null} color={spkColor}/>
                          </td>
                          <td className="px-4 py-3.5"><ConfBadge s={p.confidence}/></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>Prices per Quintal (100 kg) · Source: Agmarknet{liveDate ? ` · Data date: ${liveDate}` : ''}{curMandi ? ` · ${curMandi.name}` : ''}</span>
              <span className="flex gap-3">
                <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-emerald-500"/>≥80% High</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-amber-500"/>60-79% Med</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-red-400"/>Low</span>
              </span>
            </div>
          </div>
        )}

        {/* ── PRICE TREND ── */}
        {tab === 'trend' && (
          <div className="p-6">
            {!selMandi || !selCrop ? (
              <div className="text-center text-slate-400 py-12">
                <Activity size={32} className="mx-auto mb-2 text-slate-200"/>
                <p className="font-medium">Select a Mandi and a Crop to view the 30-day price trend</p>
                <p className="text-xs mt-1">Uses real Agmarknet historical data</p>
              </div>
            ) : histLoading ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-leaf-500"/>
                <p>Fetching historical prices from Agmarknet…</p>
              </div>
            ) : histData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database size={32} className="mx-auto mb-2 text-slate-200"/>
                <p className="font-medium">No historical data available for {CROP_INFO[selCrop]?.name} in {selState}</p>
                <p className="text-xs mt-1">Agmarknet may not have records for this commodity in this state</p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-700 mb-4">
                  30-Day Price Trend — {CROP_INFO[selCrop]?.name}
                  <span className="ml-2 text-xs text-slate-400 font-normal">{curMandi?.name} · Source: Agmarknet</span>
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  {(() => {
                    // Sort ascending by date for chronological drawing
                    const sortedHist = [...histData].sort((a,b) => {
                      const da = a.date.split('/').reverse().join('');
                      const db = b.date.split('/').reverse().join('');
                      return da.localeCompare(db);
                    });
                    const vals = sortedHist.map(d => d.modal_price)
                    const min = Math.min(...vals), max = Math.max(...vals), W = 760, H = 160
                    const pts = vals.length > 1 
                      ? vals.map((v, i) => `${(i/(vals.length-1))*W},${H-((v-min)/(max-min||1))*H}`).join(' ')
                      : `0,${H/2} ${W},${H/2}`;
                    const fill = vals.length > 1 ? `0,${H} ` + pts + ` ${W},${H}` : pts;
                    return (
                      <svg viewBox={`0 -5 ${W} ${H+15}`} className="w-full h-40 overflow-visible">
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <polygon fill="url(#g1)" points={fill}/>
                        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" points={pts}/>
                        {/* Date labels */}
                        {sortedHist.filter((_,i) => i % Math.max(1, Math.floor(sortedHist.length/5)) === 0).map((d,i) => {
                          const idx = sortedHist.indexOf(d)
                          const x = sortedHist.length > 1 ? (idx/(sortedHist.length-1))*W : W/2
                          return <text key={i} x={x} y={H+12} fill="#94a3b8" fontSize="9" textAnchor="middle">{d.date?.slice(0,5)}</text>
                        })}
                        <text x="4" y={H-2} fill="#94a3b8" fontSize="11">₹{min.toLocaleString('en-IN')}</text>
                        <text x="4" y="14" fill="#94a3b8" fontSize="11">₹{max.toLocaleString('en-IN')}</text>
                      </svg>
                    )
                  })()}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>{['Date','Min (₹)','Modal (₹)','Max (₹)','Records'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {histData.slice(0, 15).map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-500 font-medium">{d.date}</td>
                          <td className="px-4 py-2.5 text-slate-500">₹{d.min_price?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">₹{d.modal_price?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-slate-500">₹{d.max_price?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-slate-400">{d.count} mandi{d.count>1?'s':''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI FORECAST ── */}
        {tab === 'predict' && (
          <div className="p-6">
            {!selCrop ? (
              <div className="text-center text-slate-400 py-12">
                <Cpu size={32} className="mx-auto mb-2 text-slate-200"/>
                <p className="font-medium">Select a Crop above for AI price forecast</p>
                <p className="text-xs mt-1">Powered by Gemini AI + Agmarknet historical data</p>
              </div>
            ) : fcLoading ? (
              <div className="text-center py-12 text-slate-400">
                <Cpu size={24} className="mx-auto mb-2 animate-pulse text-leaf-500"/>
                <p>Gemini AI is analysing price patterns…</p>
              </div>
            ) : !forecast ? (
              <div className="text-center py-12 text-slate-400">
                <Database size={32} className="mx-auto mb-2 text-slate-200"/>
                <p>Could not load forecast — select a mandi and refresh</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Recommendation banner */}
                <div className={`rounded-2xl p-5 flex flex-wrap items-start gap-4 ${
                  forecast.recommendation==='BUY' ? 'bg-emerald-50 border border-emerald-200' :
                  forecast.recommendation==='SELL' ? 'bg-red-50 border border-red-200' :
                  'bg-amber-50 border border-amber-200'}`}>
                  <RecBadge r={forecast.recommendation}/>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{forecast.reason}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      7-day expected change:
                      <span className={`ml-1 font-bold ${forecast.expected_change_pct>0?'text-emerald-600':'text-red-500'}`}>
                        {forecast.expected_change_pct>0?'+':''}{forecast.expected_change_pct}%
                      </span>
                      {fcSource && <span className="ml-2 text-slate-400 font-normal">· Source: {fcSource}</span>}
                    </p>
                    {forecast.factors?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {forecast.factors.map((f,i) => <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">{f}</span>)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Forecast chart */}
                <div className="bg-slate-50 rounded-xl p-4">
                  {(() => {
                    const curPr = allPrices.find(p => p.cropId === selCrop)?.modal || forecast.forecast[0]?.predicted || 2000
                    const all = [{ predicted: curPr, date:'Today' }, ...(forecast.forecast||[])]
                    const vals = all.map(d => d.predicted), W = 700, H = 130
                    const min = Math.min(...vals)*0.97, max = Math.max(...vals)*1.03
                    const pts = vals.map((v, i) => `${(i/(all.length-1))*W},${H-((v-min)/(max-min||1))*H}`).join(' ')
                    return (
                      <svg viewBox={`0 0 ${W} ${H+20}`} className="w-full h-36">
                        <defs>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <polygon fill="url(#g2)" points={`0,${H} ${pts} ${W},${H}`}/>
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round" points={pts}/>
                        {all.map((d, i) => {
                          const x=(i/(all.length-1))*W; const y=H-((d.predicted-min)/(max-min||1))*H
                          return <g key={i}>
                            <circle cx={x} cy={y} r={i===0?5:3.5} fill={i===0?'#64748b':'#3b82f6'}/>
                            <text x={x} y={H+14} fill="#94a3b8" fontSize="9" textAnchor="middle">{d.date?.slice(5)||d.date}</text>
                          </g>
                        })}
                        <line x1={W/8} y1="0" x2={W/8} y2={H} stroke="#e2e8f0" strokeDasharray="4,4"/>
                        <text x={W/8+4} y="12" fill="#94a3b8" fontSize="10">Forecast →</text>
                      </svg>
                    )
                  })()}
                </div>

                {/* Forecast table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>{['Day','Date','Predicted (₹)','Low','High'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(forecast.forecast||[]).map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500 font-medium">Day {d.day||i+1}</td>
                          <td className="px-4 py-3 text-slate-500">{d.date}</td>
                          <td className={`px-4 py-3 font-bold text-base ${
                            d.predicted > (allPrices.find(p=>p.cropId===selCrop)?.modal||0) ? 'text-emerald-700' : 'text-red-600'}`}>
                            ₹{(d.predicted||0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-red-400">₹{(d.low||0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-emerald-600">₹{(d.high||0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1"><Info size={11}/>Model: {fcSource === 'gemini' ? 'Gemini 2.0 Flash AI' : 'Statistical Trend'} · Based on Agmarknet historical data</p>
              </div>
            )}
          </div>
        )}

        {/* ── BEST MARKET ── */}
        {tab === 'best' && (
          <div className="p-6">
            {!selCrop ? (
              <div className="text-center text-slate-400 py-12">
                <Target size={32} className="mx-auto mb-2 text-slate-200"/>
                <p className="font-medium">Select a Crop above to find the best market near you</p>
                <p className="text-xs mt-1">Compares real Agmarknet prices across all mandis</p>
              </div>
            ) : bmLoading ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-leaf-500"/>
                <p>Finding best markets from Agmarknet data…</p>
              </div>
            ) : bestMkts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database size={32} className="mx-auto mb-2 text-slate-200"/>
                <p className="font-medium">No cross-market data available for {CROP_INFO[selCrop]?.name}</p>
                <p className="text-xs mt-1">Try a different crop or check back when Agmarknet updates</p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Star size={16} className="text-amber-500"/>
                  Top Markets for {CROP_INFO[selCrop]?.name}
                  <span className="ml-auto text-xs text-slate-400 font-normal">Source: Agmarknet · Sorted by highest price</span>
                </h3>
                <div className="space-y-3">
                  {bestMkts.slice(0, 8).map((m, i) => {
                    const pctAboveAvg = bestMkts.length > 1
                      ? ((m.modal_price - bestMkts[bestMkts.length-1].modal_price) /
                         (bestMkts[0].modal_price - bestMkts[bestMkts.length-1].modal_price + 1) * 100).toFixed(0)
                      : 100
                    return (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md
                        ${i===0?'bg-emerald-50 border-emerald-200':'bg-white border-slate-100'}`}>
                        <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm
                          ${i===0?'bg-emerald-500 text-white':i===1?'bg-slate-300 text-slate-700':i===2?'bg-amber-400 text-white':'bg-slate-100 text-slate-600'}`}>{i+1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{m.market}</p>
                          <p className="text-xs text-slate-500 truncate">{m.district}, {m.state} · {m.variety || m.commodity}</p>
                          {m.date && <p className="text-xs text-slate-400">Price date: {m.date}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-800 text-base">₹{m.modal_price?.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-slate-400">/Quintal</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500">Min: ₹{m.min_price?.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-slate-500">Max: ₹{m.max_price?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full
                          ${i===0?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
                          {i===0?'BEST':i<=2?'GOOD':'AVG'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                  <Database size={10} className="text-leaf-500"/>Real-time data from Agmarknet (data.gov.in) · Prices in ₹/Quintal
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
