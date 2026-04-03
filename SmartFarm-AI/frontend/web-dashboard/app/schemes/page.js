'use client'
import { useState, useEffect } from 'react'
import { Landmark, Check, AlertCircle, Search, Filter, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function GovernmentSchemes() {
  const router = useRouter()
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [language, setLanguage] = useState('en')
  const [farmerName, setFarmerName] = useState('Fetching profile...')

  useEffect(() => {
    // Basic auth requirement check
    const isSetup = localStorage.getItem('smartfarm_profile_setup')
    if (!isSetup) {
      router.replace('/schemes/profile')
      return
    }
    const lsName = localStorage.getItem('smartfarm_farmer_name')
    if (lsName) setFarmerName(lsName)
    
    fetchSchemes()
  }, [language])

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8001/api/v1/schemes?lang=${language}&farmer_id=FARMER_123`)
      if (res.ok) {
        const data = await res.json()
        setSchemes(data.data)
        setFarmerName(data.farmer)
      } else {
        console.error("Failed to fetch schemes")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const filteredSchemes = schemes.filter(s => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = query === '' || 
                          (s.name?.toLowerCase().includes(query)) || 
                          (s.category?.toLowerCase().includes(query)) ||
                          (s.desc?.toLowerCase().includes(query)) ||
                          (s.full_explanation?.toLowerCase().includes(query))
    const matchesFilter = filter === 'All' || s.category === filter
    return matchesSearch && matchesFilter
  })

  // Derive missing benefits metric
  const missingBenefitsCount = schemes.filter(s => s.eligible).length

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Government Support & Schemes</h1>
          <p className="text-slate-500 mt-2">AI-matched agricultural financial aid policies for <strong>{farmerName}</strong>.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
            <Globe size={18} className="text-slate-500" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none cursor-pointer text-slate-700"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              {/* Other languages can be added here once translations are seeded */}
            </select>
          </div>

          <div className="bg-leaf-50 px-4 py-3 rounded-xl border border-leaf-200 flex items-center gap-3">
             <div className="bg-leaf-500 rounded-full h-10 w-10 flex items-center justify-center text-white font-bold text-sm">
               {missingBenefitsCount}
             </div>
             <div>
               <p className="text-sm font-bold text-leaf-800">Missing Benefits</p>
               <p className="text-xs text-leaf-600 font-medium">Eligible but not applied</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search schemes, subsidies, insurance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 focus:ring-1 focus:ring-leaf-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {['All', 'Income Support', 'Insurance', 'Subsidies', 'Infrastructure', 'Mechanization', 'Horticulture', 'Animal Husbandry', 'Fisheries', 'Debt Relief'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === cat ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-leaf-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map(scheme => (
            <div key={scheme.id} className={`p-6 bg-white rounded-2xl border flex flex-col transition-all hover:shadow-md ${
              scheme.eligible ? 'border-slate-200 hover:border-leaf-400' : 'opacity-70 border-slate-100 hover:opacity-100'
            }`}>
              <div className="flex justify-between items-start mb-4">
                 <span className="bg-slate-50 text-slate-600 text-xs px-2 py-1 rounded-md font-medium border border-slate-200">
                   {scheme.category}
                 </span>
                 {scheme.eligible ? (
                   <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-200">
                     <Check size={14} /> Eligible for You
                   </span>
                 ) : (
                   <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200">
                     <AlertCircle size={14} /> Not Eligible for You
                   </span>
                 )}
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 pr-4">{scheme.name}</h3>
              <p className="text-leaf-600 font-semibold text-sm mb-3 text-balance">{scheme.desc}</p>
              
              {/* Highlight AI Extracted Reason / Eligibility Rule */}
              {scheme.eligible && scheme.eligibility_reason && (
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-4 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-1">AI Match Reason:</span>
                  {scheme.eligibility_reason}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-sm font-bold ${scheme.match > 80 ? 'text-leaf-600' : 'text-slate-500'}`}>
                  {scheme.eligible ? 'High Chance' : 'Review Rules'}
                </span>
                <Link href={`/schemes/${scheme.id}?lang=${language}`}>
                  <button className="px-5 py-2 flex items-center gap-2 rounded-lg font-bold text-sm transition-colors bg-slate-900 text-white hover:bg-leaf-600 shadow-sm">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))}
          
          {filteredSchemes.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500">
              No schemes completely match your current filters.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
