'use client'
import { useState } from 'react'
import { ShoppingCart, Search, Star, Filter, Package, Leaf, FlaskConical } from 'lucide-react'

const products = [
  { id:1,  name:'NP 28:28:0 Fertilizer',       cat:'Fertilizer',  price:1250, unit:'50 kg',  rating:4.7, brand:'IFFCO',        badge:'Bestseller', icon:<FlaskConical size={28}/> },
  { id:2,  name:'Urea (46% N)',                 cat:'Fertilizer',  price:280,  unit:'45 kg',  rating:4.9, brand:'NFL',          badge:'Govt Price',  icon:<FlaskConical size={28}/> },
  { id:3,  name:'DAP (Di-ammonium Phosphate)',  cat:'Fertilizer',  price:1350, unit:'50 kg',  rating:4.8, brand:'KRIBHCO',      badge:'Govt Price',  icon:<FlaskConical size={28}/> },
  { id:4,  name:'Hybrid Tomato Seeds (HD-1)',   cat:'Seeds',       price:385,  unit:'10 g',   rating:4.6, brand:'Mahyco',       badge:'F1 Hybrid',   icon:<Leaf size={28}/> },
  { id:5,  name:'BT Cotton Seeds (Bollgard II)',cat:'Seeds',       price:930,  unit:'450 g',  rating:4.5, brand:'Monsanto',     badge:'',            icon:<Leaf size={28}/> },
  { id:6,  name:'Soybean JS 335 Seeds',         cat:'Seeds',       price:120,  unit:'1 kg',   rating:4.7, brand:'MPKV',         badge:'',            icon:<Leaf size={28}/> },
  { id:7,  name:'Mancozeb 75 WP',               cat:'Pesticide',   price:250,  unit:'500 g',  rating:4.8, brand:'Dhanuka',      badge:'',            icon:<Package size={28}/> },
  { id:8,  name:'Imidacloprid 17.8 SL',         cat:'Pesticide',   price:420,  unit:'500 ml', rating:4.9, brand:'Bayer',        badge:'Top Rated',   icon:<Package size={28}/> },
  { id:9,  name:'Neem Oil (Cold Pressed)',       cat:'Bio Input',   price:180,  unit:'500 ml', rating:4.6, brand:'Organic India', badge:'Organic',    icon:<Leaf size={28}/> },
  { id:10, name:'Trichoderma viride',            cat:'Bio Input',   price:150,  unit:'500 g',  rating:4.7, brand:'T-Stanes',     badge:'Biocontrol',  icon:<Leaf size={28}/> },
  { id:11, name:'Drip Irrigation Starter Kit',  cat:'Equipment',   price:3800, unit:'Set',    rating:4.8, brand:'Netafim',      badge:'',            icon:<Package size={28}/> },
  { id:12, name:'Soil pH Test Kit',             cat:'Equipment',   price:450,  unit:'50 tests',rating:4.5,brand:'AgriTest',     badge:'',            icon:<Package size={28}/> },
]

const CATS = ['All','Seeds','Fertilizer','Pesticide','Bio Input','Equipment']
const CAT_COLOR = { Seeds:'bg-emerald-100 text-emerald-700', Fertilizer:'bg-blue-100 text-blue-700', Pesticide:'bg-orange-100 text-orange-700', 'Bio Input':'bg-leaf-100 text-leaf-700', Equipment:'bg-purple-100 text-purple-700' }

export default function AgriStore() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])

  const filtered = products.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const addToCart = (p) => setCart(prev => prev.find(x=>x.id===p.id) ? prev : [...prev, p])
  const inCart = (id) => cart.some(x=>x.id===id)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agri Inputs Store</h1>
          <p className="text-slate-500 mt-2">Buy quality seeds, fertilizers, pesticides & equipment with free farm delivery.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm cursor-pointer hover:border-leaf-300 transition-colors">
          <ShoppingCart className="text-leaf-500" size={20}/>
          <span className="font-bold text-slate-800">{cart.length} items</span>
          {cart.length > 0 && <span className="bg-leaf-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">₹{cart.reduce((a,p)=>a+p.price,0).toLocaleString('en-IN')}</span>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${cat===c?'bg-leaf-600 text-white border-leaf-600 shadow-md shadow-leaf-600/20':'bg-white text-slate-600 border-slate-200 hover:border-leaf-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(p=>(
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group">
            <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative border-b border-slate-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${CAT_COLOR[p.cat]||'bg-slate-100 text-slate-500'}`}>{p.icon}</div>
              {p.badge && <span className="absolute top-3 right-3 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-md">{p.badge}</span>}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-block mb-2 w-fit ${CAT_COLOR[p.cat]||''}`}>{p.cat}</span>
              <h3 className="font-bold text-slate-800 leading-tight mb-1 text-sm">{p.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{p.brand} · {p.unit}</p>
              <div className="flex items-center gap-1 mb-3">
                <Star size={12} className="text-amber-400 fill-amber-400"/><span className="text-xs font-semibold text-slate-600">{p.rating}</span>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div><span className="text-xl font-black text-leaf-600">₹{p.price.toLocaleString('en-IN')}</span><span className="text-xs text-slate-400 ml-1">/{p.unit}</span></div>
              </div>
            </div>
            <button onClick={()=>addToCart(p)} className={`w-full py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${inCart(p.id)?'bg-emerald-600 text-white':'bg-slate-900 text-white hover:bg-leaf-600'}`}>
              <ShoppingCart size={16}/>{inCart(p.id)?'Added to Cart':'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
