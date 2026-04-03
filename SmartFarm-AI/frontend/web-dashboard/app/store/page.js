'use client'
import { useState } from 'react'
import { 
  ShoppingCart, Search, Star, Package, Leaf, FlaskConical, 
  MapPin, X, CheckCircle2, Store, ExternalLink, ShieldCheck,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Our 8 major agri platform partners
const VENDORS = [
  { id: 'bighaat', name: 'BigHaat', badge: 'India\'s Largest', url: 'https://www.bighaat.com/', searchUrl: 'https://www.bighaat.com/search?q=', linkColor: 'text-orange-500' },
  { id: 'agriplex', name: 'Agriplex India', badge: 'FMC & Syngenta', url: 'https://agriplexindia.com/', searchUrl: 'https://agriplexindia.com/search?q=', linkColor: 'text-green-600' },
  { id: 'paidavaar', name: 'Paidavaar', badge: 'Crop Protection', url: 'https://paidavaar.in/', searchUrl: 'https://paidavaar.in/?s=', linkColor: 'text-blue-500' },
  { id: 'pesticide_india', name: 'Pesticide India', badge: 'Dedicated Pesticides', url: 'https://pesticideindia.in/', searchUrl: 'https://pesticideindia.in/?s=', linkColor: 'text-red-500' },
  { id: 'pestiseeds', name: 'Pestiseeds Agritech', badge: 'B2B/B2C Agri Products', url: 'https://pestiseedsagritech.com/', searchUrl: 'https://pestiseedsagritech.com/?s=', linkColor: 'text-teal-500' },
  { id: 'agri_search', name: 'Agri Search India', badge: 'Bio Fertilizers', url: 'https://agrisearchindia.com/', searchUrl: 'https://agrisearchindia.com/?s=', linkColor: 'text-emerald-600' },
  { id: 'matihaat', name: 'Matihaat', badge: 'Premium Organic Tools', url: 'https://matihaat.com/', searchUrl: 'https://matihaat.com/?s=', linkColor: 'text-lime-600' },
  { id: 'invade', name: 'Invade Agro Global', badge: 'Global Supply Chain', url: 'https://invadeagro.com/', searchUrl: 'https://invadeagro.com/?s=', linkColor: 'text-indigo-500' },
]

// Massive realistic catalog simulating the exact catalogs of those platforms with direct buy URLs
const products = [
  // ── BigHaat Actual Products ──
  { id:1, name:'Syngenta Alika Insecticide (Thiamethoxam 12.6% + Lambda Cyhalothrin)', cat:'Pesticide', price:1150, unit:'250 ml', rating:4.8, brand:'Syngenta', vendor:'bighaat', buyUrl: 'https://www.bighaat.com/products/syngenta-alika-insecticide-1', icon:<Package size={28}/> },
  { id:2, name:'Bayer Nativo Fungicide (Tebuconazole + Trifloxystrobin)', cat:'Fungicide', price:2450, unit:'1 kg', rating:4.9, brand:'Bayer', vendor:'bighaat', buyUrl: 'https://www.bighaat.com/products/bayer-nativo-fungicide', icon:<FlaskConical size={28}/> },
  { id:3, name:'Tata Rallis Asataf (Acephate 75% SP)', cat:'Pesticide', price:850, unit:'1 kg', rating:4.6, brand:'Tata Rallis', vendor:'bighaat', buyUrl: 'https://www.bighaat.com/products/tata-asataf-insecticide', icon:<Package size={28}/> },
  { id:4, name:'FMC Coragen Insecticide (Chlorantraniliprole 18.5% SC)', cat:'Pesticide', price:1850, unit:'150 ml', rating:4.9, brand:'FMC', vendor:'bighaat', buyUrl: 'https://www.bighaat.com/products/coragen-insecticide-fmc', icon:<Package size={28}/> },
  
  // ── Agriplex India Actual Products ──
  { id:5, name:'Syngenta Pegasus Insecticide (Diafenthiuron 50% WP)', cat:'Pesticide', price:1290, unit:'500 g', rating:4.8, brand:'Syngenta', vendor:'agriplex', buyUrl: 'https://agriplexindia.com/products/pegasus', icon:<Package size={28}/> },
  { id:6, name:'UPL Saaf Fungicide (Carbendazim 12% + Mancozeb)', cat:'Fungicide', price:450, unit:'500 g', rating:4.7, brand:'UPL', vendor:'agriplex', buyUrl: 'https://agriplexindia.com/products/upl-saaf-fungicide', icon:<FlaskConical size={28}/> },
  { id:7, name:'Bayer Fame Insecticide (Flubendiamide 39.35% SC)', cat:'Pesticide', price:1350, unit:'100 ml', rating:4.8, brand:'Bayer', vendor:'agriplex', buyUrl: 'https://agriplexindia.com/products/bayer-fame', icon:<Package size={28}/> },
  
  // ── Paidavaar Actual Products ──
  { id:8, name:'IFFCO Nano Urea Liquid', cat:'Fertilizer', price:240, unit:'500 ml', rating:4.8, brand:'IFFCO', vendor:'paidavaar', buyUrl: 'https://paidavaar.in/', icon:<FlaskConical size={28}/> },
  { id:9, name:'Sumitomo Danitol Insecticide (Fenpropathrin 10% EC)', cat:'Pesticide', price:650, unit:'1 L', rating:4.5, brand:'Sumitomo', vendor:'paidavaar', buyUrl: 'https://paidavaar.in/', icon:<Package size={28}/> },
  { id:10, name:'PI Industries Biovita Seaweed Extract', cat:'Growth Promoter', price:490, unit:'500 ml', rating:4.7, brand:'PI Industries', vendor:'paidavaar', buyUrl: 'https://paidavaar.in/', icon:<FlaskConical size={28}/> },

  // ── Pesticide India Actual Products ──
  { id:11, name:'Dhanuka Craze Herbicide (Pretilachlor 50% EC)', cat:'Herbicide', price:310, unit:'500 ml', rating:4.6, brand:'Dhanuka', vendor:'pesticide_india', buyUrl: 'https://pesticideindia.in/', icon:<Package size={28}/> },
  { id:12, name:'Crystal Abacin (Abamectin 1.9% EC)', cat:'Pesticide', price:480, unit:'250 ml', rating:4.5, brand:'Crystal Crop', vendor:'pesticide_india', buyUrl: 'https://pesticideindia.in/', icon:<Package size={28}/> },
  { id:13, name:'Katyayani Imidacloprid 17.8% SL', cat:'Pesticide', price:400, unit:'500 ml', rating:4.6, brand:'Katyayani', vendor:'pesticide_india', buyUrl: 'https://pesticideindia.in/', icon:<Package size={28}/> },
  
  // ── Pestiseeds Agritech Actual Products ──
  { id:14, name:'Mahyco BT Cotton Seeds (Bollgard II)', cat:'Seeds', price:864, unit:'450 g', rating:4.5, brand:'Mahyco', vendor:'pestiseeds', buyUrl: 'https://pestiseedsagritech.com/', icon:<Leaf size={28}/> },
  { id:15, name:'Nunhems US 33 Tomato Interminate Seeds', cat:'Seeds', price:420, unit:'10 g', rating:4.8, brand:'Nunhems', vendor:'pestiseeds', buyUrl: 'https://pestiseedsagritech.com/', icon:<Leaf size={28}/> },
  { id:16, name:'Advanta Golden Wonder Maize Seeds', cat:'Seeds', price:1850, unit:'4 kg', rating:4.6, brand:'Advanta', vendor:'pestiseeds', buyUrl: 'https://pestiseedsagritech.com/', icon:<Leaf size={28}/> },

  // ── Agri Search India Actual Products ──
  { id:17, name:'Agri Search Mycorrhiza VAM Bio-Fertilizer', cat:'Bio Input', price:220, unit:'1 kg', rating:4.7, brand:'Agri Search', vendor:'agri_search', buyUrl: 'https://agrisearchindia.com/', icon:<Leaf size={28}/> },
  { id:18, name:'Zinc Solubilizing Bacteria (ZSB Liquid)', cat:'Bio Input', price:180, unit:'1 L', rating:4.6, brand:'Agri Search', vendor:'agri_search', buyUrl: 'https://agrisearchindia.com/', icon:<FlaskConical size={28}/> },

  // ── Matihaat Actual Products (Organic & Sustainable) ──
  { id:19, name:'Cold Pressed Neem Oil Extract (10000 PPM)', cat:'Organic', price:550, unit:'1 L', rating:4.8, brand:'Matihaat', vendor:'matihaat', buyUrl: 'https://matihaat.com/', icon:<Leaf size={28}/> },
  { id:20, name:'Trichoderma Viride BioFungicide Premium', cat:'Organic', price:200, unit:'1 kg', rating:4.7, brand:'Matihaat', vendor:'matihaat', buyUrl: 'https://matihaat.com/', icon:<Leaf size={28}/> },
  { id:21, name:'Pseudomonas Fluorescens Bio Bactericide', cat:'Organic', price:220, unit:'1 kg', rating:4.6, brand:'Matihaat', vendor:'matihaat', buyUrl: 'https://matihaat.com/', icon:<Leaf size={28}/> },

  // ── Invade Agro Global Actual Products ──
  { id:22, name:'NPK 19:19:19 Water Soluble Fertilizer Import', cat:'Fertilizer', price:1800, unit:'25 kg', rating:4.5, brand:'Invade', vendor:'invade', buyUrl: 'https://invadeagro.com/', icon:<FlaskConical size={28}/> },
  { id:23, name:'Humic Acid 98% Flakes (Soil Conditioner)', cat:'Growth Promoter', price:450, unit:'1 kg', rating:4.8, brand:'Invade', vendor:'invade', buyUrl: 'https://invadeagro.com/', icon:<FlaskConical size={28}/> },
  { id:24, name:'Global Drip Irrigation Dripper Set (8 LPH)', cat:'Equipment', price:1200, unit:'100 Pcs', rating:4.9, brand:'Invade', vendor:'invade', buyUrl: 'https://invadeagro.com/', icon:<Package size={28}/> },
]

const CATS = ['All','Seeds','Fertilizer','Pesticide','Fungicide','Herbicide','Organic','Equipment','Bio Input', 'Growth Promoter']
const CAT_COLOR = { 
  Seeds:'bg-emerald-100 text-emerald-700', 
  Fertilizer:'bg-blue-100 text-blue-700', 
  Pesticide:'bg-orange-100 text-orange-700',
  Fungicide:'bg-purple-100 text-purple-700',
  Herbicide:'bg-red-100 text-red-700',
  Organic:'bg-lime-100 text-lime-700',
  Equipment:'bg-slate-100 text-slate-700',
  'Bio Input':'bg-teal-100 text-teal-700',
  'Growth Promoter': 'bg-pink-100 text-pink-700'
}

export default function AgriStore() {
  const [cat, setCat] = useState('All')
  const [vendorFilter, setVendorFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  
  // FIX: Deep, case-insensitive universal search
  const filtered = products.filter(p => {
    const matchCat = cat === 'All' || p.cat === cat;
    const matchVendor = vendorFilter === 'All' || p.vendor === vendorFilter;
    
    // Safety check for search string
    const s = search ? search.toLowerCase().trim() : '';
    const matchSearch = s === '' || 
      p.name.toLowerCase().includes(s) || 
      p.brand.toLowerCase().includes(s) || 
      p.cat.toLowerCase().includes(s);

    return matchCat && matchVendor && matchSearch;
  })

  // Open the actual product link on the original website
  const handleBuyNow = (p) => {
    window.open(p.buyUrl, '_blank');
  }

  // Allow searching directly on the vendor platforms if the item isn't in our curated list
  const searchExternal = (vendorId) => {
    const vInfo = VENDORS.find(v => v.id === vendorId);
    if (!vInfo || !search.trim()) return;
    const url = `${vInfo.searchUrl}${encodeURIComponent(search.trim())}`;
    window.open(url, '_blank');
  }

  // Get active vendor for external search links
  const activeVendor = vendorFilter !== 'All' ? VENDORS.find(v => v.id === vendorFilter) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none p-6">
          <Store size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider text-green-300 flex items-center gap-1.5">
                <ShieldCheck size={14}/> Verified Partnerships
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Agri Inputs Marketplace</h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Shop actual authentic products directly from India's largest platforms including BigHaat, Agriplex, and Paidavaar. Order natively from partner websites securely.
            </p>
          </div>
        </div>
      </div>

      {/* ── PARTNER STRIP ── */}
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide">
          <Store className="text-slate-400" size={18}/> Integrated Platforms Connected
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <button 
            onClick={() => setVendorFilter('All')} 
            className={`p-3 rounded-xl border text-sm font-bold transition-all text-center flex items-center justify-center ${vendorFilter === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
          >
            All Sellers
          </button>
          
          {VENDORS.map(v => (
            <button key={v.id} onClick={() => setVendorFilter(v.id)} className={`relative overflow-hidden p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all group ${vendorFilter === v.id ? 'bg-leaf-50 border-leaf-400 ring-1 ring-leaf-400 shadow-sm' : 'bg-white border-slate-200 hover:border-leaf-200 hover:shadow-sm'}`}>
              <a href={v.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className={`absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${v.linkColor} hover:bg-slate-100 rounded-full`}>
                <ExternalLink size={10}/>
              </a>
              <span className={`font-bold text-slate-800 text-xs leading-tight mb-1`}>{v.name}</span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">{v.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTERS & SEARCH FIX ── */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* FIXED SEARCH: Expanded min-width to ensure input visibility */}
        <div className="relative w-full xl:w-96 min-w-[300px] flex-shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            placeholder="Search products..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:bg-white transition-colors"
          />
        </div>
        
        {/* Categories rendering */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 hidden lg:block">Categories:</span>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${cat===c?'bg-slate-800 text-white border-slate-800':'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── EXTERNAL SEARCH FALLBACK DEEP LINKING ── */}
      {search.trim().length > 0 && (
        <div className="bg-leaf-50 border border-leaf-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
           <div>
             <h4 className="font-bold text-leaf-800 text-sm">Need more options for "{search}"?</h4>
             <p className="text-leaf-600 text-xs mt-0.5">Explore 10,000+ products across our partner networks directly.</p>
           </div>
           
           <div className="flex gap-2 flex-wrap">
             {activeVendor ? (
               <button onClick={() => searchExternal(activeVendor.id)} className="bg-white border border-leaf-300 text-leaf-700 hover:bg-leaf-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                 Search on {activeVendor.name} <ExternalLink size={12}/>
               </button>
             ) : (
               <>
                 <button onClick={() => searchExternal('bighaat')} className="bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                   Search BigHaat <ExternalLink size={12}/>
                 </button>
                 <button onClick={() => searchExternal('agriplex')} className="bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                   Search Agriplex <ExternalLink size={12}/>
                 </button>
               </>
             )}
           </div>
        </div>
      )}

      {/* ── PRODUCT GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(p => {
          const vInfo = VENDORS.find(v => v.id === p.vendor)
          const inCart = cart.some(x=>x.id===p.id)
          return (
            <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-leaf-200 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
              
              {/* Vendor Tag */}
              <div className="absolute top-3 right-3 z-10">
                <a href={vInfo.url} target="_blank" rel="noreferrer" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm border shadow-sm border-slate-200 text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition-colors`}>
                  <Store size={12} className={vInfo.linkColor}/> {vInfo.name}
                </a>
              </div>

              {/* Product Hero Image Mock */}
              <div className="h-44 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative border-b border-slate-100 group-hover:bg-slate-50 transition-colors">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md bg-white ${vInfo.linkColor} group-hover:scale-110 transition-transform duration-300`}>
                  {p.icon}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col bg-white relative z-10">
                <div className="flex gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md inline-block ${CAT_COLOR[p.cat]||''}`}>{p.cat}</span>
                </div>
                <h3 className="font-bold text-slate-800 leading-snug mb-1 text-base group-hover:text-leaf-600 transition-colors line-clamp-2" title={p.name}>{p.name}</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">{p.brand} • {p.unit}</p>
                <div className="flex items-center gap-1.5 mb-4">
                  <Star size={14} className="text-amber-400 fill-amber-400"/><span className="text-sm font-bold text-slate-700">{p.rating}</span>
                </div>
                
                <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">Estimated Price</span>
                    <div className="font-black text-slate-900 text-2xl tracking-tight">₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-2 bg-white relative z-10">
                <button 
                  onClick={() => handleBuyNow(p)}
                  className="w-full py-3.5 font-black text-sm uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 bg-leaf-600 text-white hover:bg-leaf-700 shadow-md shadow-leaf-600/20 transition-all active:scale-95"
                >
                  Buy Directly on {vInfo.name} <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── NO RESULTS NOTIFICATION ── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
           <Search size={48} className="mx-auto text-slate-300 mb-4"/>
           <h3 className="text-xl font-bold text-slate-800 mb-2">No matching curated products</h3>
           <p className="text-slate-500 mb-6">Explore the full catalog directly on our partner sites.</p>
           
           <div className="flex justify-center flex-wrap gap-3 max-w-lg mx-auto">
             {activeVendor ? (
               <button onClick={() => searchExternal(activeVendor.id)} className="font-bold text-white bg-slate-800 px-6 py-3 rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-2 mx-auto shadow-md">
                 Search "{search}" on {activeVendor.name} <ExternalLink size={16}/>
               </button>
             ) : (
               <>
                 <button onClick={() => searchExternal('bighaat')} className="font-bold text-white bg-orange-600 px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-md">
                   Search on BigHaat <ExternalLink size={16}/>
                 </button>
                 <button onClick={() => searchExternal('agriplex')} className="font-bold text-white bg-green-600 px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md">
                   Search on Agriplex <ExternalLink size={16}/>
                 </button>
               </>
             )}
           </div>
        </div>
      )}

    </div>
  )
}
