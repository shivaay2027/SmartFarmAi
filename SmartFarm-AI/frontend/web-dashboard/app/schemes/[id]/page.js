'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Volume2, Link as LinkIcon, FileText, Check } from 'lucide-react'

export default function SchemeDetail() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const schemeId = params.id
  const lang = searchParams.get('lang') || 'en'
  const farmerId = 'FARMER_123' // Mock auth

  const [scheme, setScheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchDetailedScheme = async () => {
      try {
        const res = await fetch(`http://localhost:8001/api/v1/schemes?lang=${lang}&farmer_id=${farmerId}`)
        const data = await res.json()
        const found = data.data.find(s => s.id === schemeId)
        // Simulate fetching details by merging missing static data not in list API
        if (found) {
            setScheme({
                ...found,
                benefits: ["₹6,000 per year in 3 installments", "Direct bank transfer"],
                eligibility_rules: ["Must own cultivable land", "Must have Aadhaar linked bank account"],
                required_documents: ["Aadhaar Card", "Bank Passbook", "Land Ownership Proof (Khasra/Khatauni)"],
                application_process: ["Visit local CSC or pmkisan.gov.in", "Register with Aadhaar and land details", "Wait for verification"],
                official_link: "https://pmkisan.gov.in/"
            })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDetailedScheme()
  }, [schemeId, lang])

  const handlePlayAudio = async () => {
    if (!scheme) return
    setIsPlaying(true)
    try {
      const res = await fetch('http://localhost:8001/api/v1/schemes/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: scheme.full_explanation || scheme.desc,
            lang: lang
        })
      })
      const data = await res.json()
      if (data.status === 'success' && data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`)
        audio.play()
        audio.onended = () => setIsPlaying(false)
      } else {
        setIsPlaying(false)
      }
    } catch (e) {
      console.error(e)
      setIsPlaying(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-leaf-600"></div>
    </div>
  )

  if (!scheme) return <div className="text-center py-20">Scheme not found</div>

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Schemes
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`p-8 border-b ${scheme.eligible ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <span className="bg-white text-slate-600 text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider shadow-sm border border-slate-200 mb-3 inline-block">
                {scheme.category}
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">
                {scheme.name}
              </h1>
              <p className="text-lg text-slate-700 font-medium">{scheme.desc}</p>
            </div>
            {scheme.eligible ? (
              <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm whitespace-nowrap">
                <CheckCircle size={20} /> You are Eligible!
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm whitespace-nowrap">
                <XCircle size={20} /> Action Required
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <button 
            onClick={handlePlayAudio} 
            disabled={isPlaying}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isPlaying 
                ? 'bg-leaf-100 text-leaf-800 border border-leaf-200 cursor-not-allowed animate-pulse' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Volume2 size={18} className={isPlaying ? 'text-leaf-600' : 'text-slate-400'} />
            {isPlaying ? 'Playing Explanation...' : 'Listen to this scheme'}
          </button>
          
          <a href={scheme.official_link} target="_blank" rel="noreferrer" 
             className="flex items-center gap-2 bg-leaf-600 hover:bg-leaf-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
            Apply Now <LinkIcon size={16} />
          </a>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-10">
          
          {/* AI Explanation block */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-leaf-100 text-leaf-700 px-2 py-0.5 rounded text-sm">AI Base</span>
              Simple Explanation
            </h2>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <p className="text-slate-700 text-lg leading-relaxed">{scheme.full_explanation}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               Why you matched
            </h2>
            <div className={`rounded-xl p-5 border ${scheme.eligible ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-slate-700 font-medium">{scheme.eligibility_reason}</p>
                {scheme.missing_requirements?.length > 0 && (
                  <div className="mt-3 text-sm text-red-600 font-bold flex flex-col gap-1">
                    Missing: {scheme.missing_requirements.join(", ")}
                  </div>
                )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Required Docs */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <FileText size={20} className="text-slate-400" /> Documents Required
              </h2>
              <ul className="space-y-3">
                {scheme.required_documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <Check size={18} className="text-leaf-500 mt-0.5 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* How to Apply */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4">How to Apply</h2>
              <ol className="space-y-4">
                {scheme.application_process.map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex items-center justify-center bg-slate-100 text-slate-500 font-bold rounded-full w-6 h-6 shrink-0 text-sm">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
