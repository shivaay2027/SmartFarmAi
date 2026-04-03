'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Volume2, VolumeX, Image as ImageIcon,
  X, ThumbsUp, ThumbsDown, Wifi, WifiOff, ChevronRight,
  Leaf, TrendingUp, CloudRain, Landmark, Droplet, AlertTriangle,
  CheckCircle, Loader, Globe, RotateCcw, Sparkles
} from 'lucide-react'

const API = 'http://localhost:8001'

// ── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en',       label: 'English',  stt: 'en-IN' },
  { code: 'hi',       label: 'हिंदी',    stt: 'hi-IN' },
  { code: 'hinglish', label: 'Hinglish', stt: 'hi-IN' },
  { code: 'mr',       label: 'मराठी',    stt: 'mr-IN' },
  { code: 'ta',       label: 'தமிழ்',    stt: 'ta-IN' },
  { code: 'te',       label: 'తెలుగు',   stt: 'te-IN' },
]

// ── Offline FAQ responses ───────────────────────────────────────────────────
const OFFLINE_FAQ = [
  { match: ['wheat','gehun','गेहूं'], reply: 'Wheat MSP is ₹2,275 per quintal (2024-25). Best harvest time is March–May.' },
  { match: ['rice','paddy','dhaan','धान'], reply: 'Paddy MSP is ₹2,300 per quintal. Kharif crop — harvest September–November.' },
  { match: ['tomato','tamatar','टमाटर'], reply: 'Tomato prices fluctuate heavily. Check your local mandi when internet is restored.' },
  { match: ['disease','bimari','बीमारी'], reply: 'For disease detection, upload a clear leaf photo once you are online.' },
  { match: ['weather','mausam','बारिश'], reply: 'Check local weather once internet is restored. For now, check with fellow farmers nearby.' },
  { match: ['scheme','yojana','योजना'], reply: 'PM-KISAN gives ₹6,000/year. PM Fasal Bima protects your crops. Apply at your nearest Common Service Centre.' },
]

// ── Suggested prompts per language ─────────────────────────────────────────
const SUGGESTED = {
  en: ['Wheat price in Bhopal today', 'Best crop for my field', 'What is PMFBY scheme?', 'Show current weather'],
  hi: ['भोपाल में गेहूं का भाव', 'मेरे खेत के लिए कौन सी फसल?', 'पीएम किसान के बारे में बताओ', 'मौसम की जानकारी दो'],
  hinglish: ['Bhopal mandi mein wheat ka rate', 'Meri fasal ke liye best crop kya hai?', 'PM-KISAN ke baare mein batao'],
  mr: ['भोपाळमध्ये गव्हाचा भाव', 'माझ्या शेतासाठी कोणते पीक?'],
  ta: ['இன்று கோதுமை விலை என்ன?', 'என் நிலத்திற்கு எந்த பயிர்?'],
  te: ['నేడు గోధుమ ధర ఎంత?', 'నా పొలానికి ఏ పంట?'],
}

// ── Severity badge helper ────────────────────────────────────────────────────
function SeverityBadge({ sev }) {
  const map = {
    High:   'bg-red-100 text-red-700 border border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low:    'bg-blue-100 text-blue-700 border border-blue-200',
    None:   'bg-green-100 text-green-700 border border-green-200',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[sev] || map.None}`}>{sev}</span>
}

// ── Rich intent data cards ────────────────────────────────────────────────────
function IntentCard({ intent, data }) {
  if (!data || Object.keys(data).length === 0) return null

  if (intent === 'mandi_price' && data.prices?.length > 0) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
        <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
          <TrendingUp size={12}/> MANDI PRICES — {data.commodity?.toUpperCase() || 'COMMODITY'}
        </p>
        <div className="space-y-1.5">
          {data.prices.slice(0,4).map((p, i) => (
            <div key={i} className="flex justify-between items-center bg-white rounded-lg px-3 py-1.5 border border-green-100">
              <span className="text-xs text-slate-600 truncate max-w-[55%]">
                {p.market || p.mandi_name || 'Mandi'}, {p.district || p.state || ''}
              </span>
              <span className="text-sm font-bold text-green-700">₹{p.modal_price?.toLocaleString()}<span className="text-xs font-normal text-slate-400">/q</span></span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (intent === 'crop_recommend' && data.top_crops?.length > 0) {
    return (
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
          <Leaf size={12}/> TOP CROP RECOMMENDATIONS
        </p>
        <div className="space-y-1.5">
          {data.top_crops.map((c, i) => (
            <div key={i} className="bg-white rounded-lg px-3 py-2 border border-emerald-100 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-slate-800">#{i+1} {c.name}</span>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">Suit: {c.suitability_pct}%</span>
                  <span className="text-xs text-slate-500">Risk: {c.risk_pct}%</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-600">₹{c.profit_inr?.toLocaleString()}</span>
                <p className="text-xs text-slate-400">profit</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (intent === 'disease_detect' && (data.disease_name || data.class)) {
    const disease = data.disease_name || data.class || 'Unknown'
    const severity = data.severity || 'Medium'
    const isHealthy = data.is_healthy
    return (
      <div className={`mt-3 rounded-xl border p-3 ${isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
            {isHealthy ? <CheckCircle size={12} className="text-green-600"/> : <AlertTriangle size={12} className="text-red-600"/>}
            DISEASE ANALYSIS — {data.crop_name?.toUpperCase()}
          </p>
          <SeverityBadge sev={severity}/>
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">{disease}</p>
        {data.immediate_action && (
          <div className="bg-white rounded-lg px-3 py-1.5 border border-red-100 mt-1">
            <p className="text-xs font-bold text-red-600">Immediate Action:</p>
            <p className="text-xs text-slate-700 mt-0.5">{data.immediate_action}</p>
          </div>
        )}
        {data.confidence && (
          <p className="text-xs text-slate-400 mt-2">Confidence: {data.confidence}%</p>
        )}
      </div>
    )
  }

  if (intent === 'weather_check' && data.temperature_c !== undefined) {
    return (
      <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <p className="text-xs font-bold text-sky-700 mb-2 flex items-center gap-1">
          <CloudRain size={12}/> CURRENT WEATHER — {data.place?.toUpperCase()}
        </p>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{data.temperature_c}°C</p>
            <p className="text-xs text-slate-500">{data.condition}</p>
          </div>
          <div className="border-l border-sky-200 pl-4 space-y-1">
            <p className="text-xs text-slate-600">💧 Humidity: {data.humidity_pct}%</p>
            <p className="text-xs text-slate-600">🌬 Wind: {data.wind_kmh} km/h</p>
          </div>
        </div>
      </div>
    )
  }

  if (intent === 'scheme_info' && data.schemes?.length > 0) {
    return (
      <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
        <p className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1">
          <Landmark size={12}/> GOVERNMENT SCHEMES
        </p>
        <div className="space-y-1.5">
          {data.schemes.slice(0,3).map((s, i) => (
            <div key={i} className="bg-white rounded-lg px-3 py-2 border border-violet-100 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                <p className="text-xs text-slate-500 truncate">{s.category}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${s.eligible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.eligible ? '✓ Eligible' : 'Check'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

// ── Animated waveform bars ────────────────────────────────────────────────────
function Waveform({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {[0,1,2,3,4].map(i => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-white"
          animate={active ? { height: ['6px','18px','8px','16px','6px'] } : { height: '6px' }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-bl-sm border border-slate-200 shadow-sm w-fit">
      {[0,1,2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-green-400"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

// ── Toast notification ──────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-xl shadow-lg z-50"
    >
      {message}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VoiceAssistant() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState('en')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [inputText, setInputText] = useState('')
  const [attachedImage, setAttachedImage] = useState(null)   // { base64, preview }
  const [toast, setToast] = useState(null)
  const [autoSpeak, setAutoSpeak] = useState(true)

  const [history, setHistory] = useState([
    {
      id: 'init',
      role: 'ai',
      text: 'Namaste! 🌱 I am your SmartFarm AI Voice Assistant. Ask me about mandi prices, crop recommendations, disease detection, weather, or government schemes. You can speak or type in Hindi, English, or your local language.',
      intent: 'smalltalk',
      data: {},
      feedback: null,
    }
  ])

  // ── Refs ───────────────────────────────────────────────────────────────────
  const recogRef = useRef(null)
  const audioRef = useRef(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  // ── Online/offline detection ───────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    setIsOnline(navigator.onLine)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, isProcessing])

  // ── STT init ───────────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setToast('Speech recognition not supported in this browser.'); return }

    const recog = new SR()
    recog.lang = LANGUAGES.find(l => l.code === lang)?.stt || 'en-IN'
    recog.continuous = false
    recog.interimResults = true

    recog.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setInputText(transcript)
    }
    recog.onend = () => {
      setIsRecording(false)
      recogRef.current = null
    }
    recog.onerror = (e) => {
      setIsRecording(false)
      recogRef.current = null
      if (e.error !== 'no-speech') setToast(`Mic error: ${e.error}`)
    }

    recog.start()
    recogRef.current = recog
    setIsRecording(true)
  }, [lang])

  const stopRecording = useCallback(() => {
    recogRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggleMic = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text, detectedLang) => {
    if (isMuted || !autoSpeak) return
    setIsSpeaking(true)
    try {
      const res = await fetch(`${API}/api/v1/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 500), lang: detectedLang || lang }),
      })
      const json = await res.json()
      if (json.status === 'success' && json.audio_base64) {
        const blob = new Blob([Uint8Array.from(atob(json.audio_base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
        audio.onerror = () => setIsSpeaking(false)
        audio.play()
        return
      }
    } catch (_) {}
    // Fallback: browser speechSynthesis
    try {
      const utter = new SpeechSynthesisUtterance(text.slice(0, 300))
      utter.lang = LANGUAGES.find(l => l.code === (detectedLang || lang))?.stt || 'en-IN'
      utter.onend = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utter)
    } catch (_) { setIsSpeaking(false) }
  }, [isMuted, autoSpeak, lang])

  const stopSpeaking = () => {
    audioRef.current?.pause()
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  // ── Offline FAQ resolver ───────────────────────────────────────────────────
  const offlineReply = (msg) => {
    const ml = msg.toLowerCase()
    const faq = OFFLINE_FAQ.find(f => f.match.some(w => ml.includes(w)))
    return faq?.reply || 'You are offline. Please reconnect to access live mandi prices, crop recommendations, and weather data.'
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text, imgData) => {
    const msg = (text || inputText).trim()
    if (!msg && !imgData) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: msg || '📷 [Crop image attached]',
      intent: null, data: {}, feedback: null,
    }
    setHistory(h => [...h, userMsg])
    setInputText('')
    setAttachedImage(null)
    setIsProcessing(true)

    // Build history for context (last 5 turns)
    const historyPayload = history.slice(-10).map(m => ({ role: m.role, text: m.text }))

    // Try the backend first even if browser says offline (it may be wrong)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const res = await fetch(`${API}/api/v1/voice/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: msg,
          history: historyPayload,
          lang,
          image_base64: imgData?.base64 || null,
        }),
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      const aiMsg = {
        id: Date.now().toString(),
        role: 'ai',
        text: data.reply || 'Sorry, I could not understand that.',
        intent: data.intent || 'general_farming',
        data: data.data || {},
        feedback: null,
        lang_detected: data.lang_detected,
      }
      setHistory(h => [...h, aiMsg])
      speak(data.reply, data.lang_detected)
    } catch (err) {
      clearTimeout(timeoutId)
      // If backend unreachable, fall through to offline FAQ
      const reply = !isOnline || err.name === 'AbortError'
        ? offlineReply(msg)
        : 'SmartFarm backend is not responding. Please make sure Python server is running on port 8001 with GEMINI_API_KEY set.'
      const errMsg = {
        id: Date.now().toString(), role: 'ai',
        text: reply,
        intent: err.name === 'AbortError' ? 'timeout' : 'error',
        data: {}, feedback: null,
      }
      setHistory(h => [...h, errMsg])
    } finally {
      setIsProcessing(false)
    }
  }, [inputText, history, lang, isOnline, speak])

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result.split(',')[1]
      setAttachedImage({ base64: b64, preview: ev.target.result })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Feedback handler ───────────────────────────────────────────────────────
  const handleFeedback = (id, type) => {
    setHistory(h => h.map(m => m.id === id ? { ...m, feedback: type } : m))
    setToast(type === 'up' ? '👍 Thank you for your feedback!' : '👎 We will improve this response.')
  }

  // ── Keyboard send ──────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]
  const suggestions = SUGGESTED[lang] || SUGGESTED.en

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col gap-0">

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={22} className="text-green-500" />
            Voice AI Assistant
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Speak or type in your local language — SmartFarm AI hears you</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg ${isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {/* Language selector */}
          <div className="relative">
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="appearance-none text-xs font-medium pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Globe size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>
          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak(v => !v)}
            title={autoSpeak ? 'Mute auto-speak' : 'Enable auto-speak'}
            className={`p-1.5 rounded-lg border text-xs ${autoSpeak ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
          >
            {autoSpeak ? <Volume2 size={14}/> : <VolumeX size={14}/>}
          </button>
        </div>
      </div>

      {/* ── Offline banner ── */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3 flex items-center gap-2 text-sm text-red-700 flex-shrink-0"
          >
            <WifiOff size={14}/>
            <span>आप ऑफलाइन हैं — You are offline. Basic FAQ answers available. Live data unavailable.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat + input container ── */}
      <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-slate-200 shadow-sm bg-white min-h-0">

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <AnimatePresence initial={false}>
            {history.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI avatar */}
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm">
                    <Leaf size={14} className="text-white"/>
                  </div>
                )}

                <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                  }`}>
                    {/* Message text */}
                    <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.text}</p>

                    {/* Rich data card */}
                    {msg.role === 'ai' && msg.intent && msg.data && (
                      <IntentCard intent={msg.intent} data={msg.data} />
                    )}

                    {/* AI message actions */}
                    {msg.role === 'ai' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        {/* TTS replay */}
                        <button
                          onClick={() => speak(msg.text, msg.lang_detected)}
                          className="text-slate-400 hover:text-green-600 transition-colors"
                          title="Listen"
                        >
                          <Volume2 size={14}/>
                        </button>
                        <div className="flex-1"/>
                        {/* Feedback */}
                        <button
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1 rounded transition-colors ${msg.feedback === 'up' ? 'text-green-600' : 'text-slate-300 hover:text-green-500'}`}
                          title="Helpful"
                        >
                          <ThumbsUp size={13}/>
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1 rounded transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                          title="Not helpful"
                        >
                          <ThumbsDown size={13}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Intent tag */}
                  {msg.role === 'ai' && msg.intent && msg.intent !== 'smalltalk' && msg.intent !== 'offline' && msg.intent !== 'error' && (
                    <span className="mt-1 ml-1 text-xs text-slate-400 capitalize">{msg.intent.replace('_', ' ')}</span>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center ml-2 flex-shrink-0 mt-1 font-bold text-slate-600 text-xs shadow-sm">
                    RK
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-2 mt-1 shadow-sm">
                <Leaf size={14} className="text-white"/>
              </div>
              <TypingDots/>
            </motion.div>
          )}

          {/* Speaking indicator */}
          {isSpeaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-xs text-green-600 flex items-center justify-center gap-1"
            >
              <Volume2 size={12}/> Speaking…
              <button onClick={stopSpeaking} className="underline ml-1">Stop</button>
            </motion.div>
          )}

          <div ref={chatEndRef}/>
        </div>

        {/* ── Suggested prompts ── */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-slate-50 border-t border-slate-100 flex-shrink-0 no-scrollbar">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInputText(s); inputRef.current?.focus() }}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all"
            >
              <ChevronRight size={10}/>
              {s}
            </button>
          ))}
        </div>

        {/* ── Image preview ── */}
        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3 flex-shrink-0"
            >
              <img src={attachedImage.preview} alt="crop" className="h-16 w-16 object-cover rounded-xl border border-slate-200"/>
              <div>
                <p className="text-xs font-semibold text-slate-700">📷 Crop image attached</p>
                <p className="text-xs text-slate-500">Send your message to detect disease</p>
              </div>
              <button onClick={() => setAttachedImage(null)} className="ml-auto text-slate-400 hover:text-red-500">
                <X size={16}/>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input bar ── */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach crop image for disease detection"
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
              attachedImage ? 'bg-green-100 border-green-300 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
            }`}
          >
            <ImageIcon size={18}/>
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening…' : `Ask in ${selectedLang.label}…`}
              disabled={isRecording}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all disabled:opacity-60"
            />
            {isRecording && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-1">
                  {[0,1,2,3,4].map(i => (
                    <motion.div key={i} className="w-0.5 bg-red-400 rounded-full"
                      animate={{ height: ['4px','14px','6px','12px','4px'] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mic button */}
          <button
            id="voice-mic-btn"
            onClick={toggleMic}
            disabled={isProcessing}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? 'bg-red-500 shadow-red-500/40 scale-110'
                : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30 hover:scale-105'
            } disabled:opacity-50`}
          >
            {isRecording ? (
              <div className="flex items-center justify-center">
                <Waveform active={isRecording}/>
              </div>
            ) : (
              <Mic size={20} className="text-white"/>
            )}
          </button>

          {/* Send button */}
          <button
            id="voice-send-btn"
            onClick={() => sendMessage(inputText, attachedImage)}
            disabled={isProcessing || (!inputText.trim() && !attachedImage)}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? <Loader size={18} className="text-white animate-spin"/>
              : <Send size={18} className="text-white"/>
            }
          </button>
        </div>
      </div>

      {/* ── Feature badges ── */}
      <div className="flex gap-2 mt-3 flex-wrap justify-center flex-shrink-0">
        {[
          { icon: Mic,        label: 'Voice STT'       },
          { icon: Volume2,    label: 'TTS Playback'    },
          { icon: TrendingUp, label: 'Live Mandi'      },
          { icon: Leaf,       label: 'Crop AI'         },
          { icon: ImageIcon,  label: 'Disease Detect'  },
          { icon: CloudRain,  label: 'Weather'         },
          { icon: Landmark,   label: 'Schemes'         },
          { icon: WifiOff,    label: 'Offline Mode'    },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-100 rounded-full px-2.5 py-1 shadow-sm">
            <Icon size={10} className="text-green-500"/>
            {label}
          </div>
        ))}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
