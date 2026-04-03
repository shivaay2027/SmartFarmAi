'use client'
import { useState } from 'react'
import { Users, Star, MapPin, Phone, Check, Search, Filter } from 'lucide-react'

const workers = [
  { id:1, name:'Suresh Yadav',    skills:['Harvesting','Sowing','Irrigation'], rating:4.9, exp:'8 yrs', dist:'1.2 km', rate:650,  available:true,  lang:'Hindi',             img:'SY' },
  { id:2, name:'Ramkali Devi',    skills:['Weeding','Transplanting'],           rating:4.7, exp:'5 yrs', dist:'3.1 km', rate:550,  available:true,  lang:'Hindi, Bhojpuri',   img:'RD' },
  { id:3, name:'Arjun Patil',     skills:['Tractor Operator','Spraying'],       rating:4.8, exp:'10 yrs',dist:'5.5 km', rate:850,  available:false, lang:'Marathi, Hindi',    img:'AP' },
  { id:4, name:'Krishnamma S.',   skills:['Harvesting','Grading','Packing'],    rating:4.6, exp:'6 yrs', dist:'2.8 km', rate:600,  available:true,  lang:'Telugu, Kannada',   img:'KS' },
  { id:5, name:'Mohan Gawli',     skills:['Drone Operator','Spraying'],         rating:5.0, exp:'3 yrs', dist:'8.2 km', rate:1200, available:true,  lang:'Marathi',           img:'MG' },
  { id:6, name:'Fatima Shaikh',   skills:['Weeding','Sowing','Fertilization'],  rating:4.5, exp:'4 yrs', dist:'4.0 km', rate:500,  available:false, lang:'Urdu, Hindi',       img:'FS' },
]

export default function LaborHub() {
  const [search, setSearch] = useState('')
  const [showAvail, setShowAvail] = useState(false)
  const list = workers.filter(w =>
    (!showAvail || w.available) &&
    (w.name.toLowerCase().includes(search.toLowerCase()) || w.skills.some(s=>s.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Labor Hub</h1>
          <p className="text-slate-500 mt-2">Hire skilled agricultural workers near your farm on-demand.</p>
        </div>
        <div className="bg-leaf-50 border border-leaf-200 px-4 py-2 rounded-xl text-sm font-semibold text-leaf-700">
          {workers.filter(w=>w.available).length} workers available nearby
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or skill..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"/>
        </div>
        <button onClick={()=>setShowAvail(!showAvail)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showAvail?'bg-leaf-600 text-white border-leaf-600':'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
          <Filter size={16}/> Available Only
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl font-bold text-white flex items-center justify-center flex-shrink-0 ${w.available ? 'bg-leaf-500' : 'bg-slate-400'}`}>{w.img}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{w.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={13} className="text-amber-400 fill-amber-400"/>
                  <span className="text-sm font-semibold text-slate-700">{w.rating}</span>
                  <span className="text-xs text-slate-400">• {w.exp}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${w.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {w.available ? 'Available' : 'Busy'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {w.skills.map(s=><span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md border border-slate-200">{s}</span>)}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1"><MapPin size={12}/>{w.dist}</span>
              <span>•</span>
              <span>Speaks: {w.lang}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div><span className="text-xl font-black text-leaf-600">₹{w.rate}</span><span className="text-xs text-slate-400">/day</span></div>
              <button disabled={!w.available} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${w.available ? 'bg-slate-900 text-white hover:bg-leaf-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {w.available ? <><Phone size={14}/> Hire Now</> : <><Check size={14}/> Booked</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
