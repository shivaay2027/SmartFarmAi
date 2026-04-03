'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Sprout, Droplet, TrendingUp, Truck, Wrench, Users, ShoppingCart, Mic
} from 'lucide-react'

const modules = [
  { id: 1, title: 'Crop Health AI', icon: <Sprout size={32} />, desc: 'Detect diseases from leaf images via YOLOv8', color: 'bg-green-100 text-green-600', link: '/disease-detect' },
  { id: 2, title: 'IoT Irrigation', icon: <Droplet size={32} />, desc: 'Real-time soil moisture and digital twin', color: 'bg-blue-100 text-blue-600', link: '/irrigation' },
  { id: 3, title: 'Mandi Prices', icon: <TrendingUp size={32} />, desc: 'AI forecasted crop prices and trends', color: 'bg-purple-100 text-purple-600', link: '/prices' },
  { id: 4, title: 'Route Optimizer', icon: <Truck size={32} />, desc: 'Calculate the most profitable route', color: 'bg-orange-100 text-orange-600', link: '/routes' },
  { id: 5, title: 'Equipment', icon: <Wrench size={32} />, desc: 'Rent tractors, drones, and harvesters', color: 'bg-slate-200 text-slate-700', link: '/equipment' },
  { id: 6, title: 'Labor Hub', icon: <Users size={32} />, desc: 'Hire skilled workers near your farm', color: 'bg-teal-100 text-teal-600', link: '/labor' },
  { id: 7, title: 'Agri Inputs', icon: <ShoppingCart size={32} />, desc: 'Buy seeds, fertilizers & pesticides', color: 'bg-amber-100 text-amber-600', link: '/store' },
  { id: 8, title: 'Voice AI', icon: <Mic size={32} />, desc: 'Multilingual queries via LLM', color: 'bg-rose-100 text-rose-600', link: '/voice' },
]

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Segment */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Farm Overview</h1>
          <p className="text-slate-500 mt-2">Welcome back, Ramesh! Your field is in good condition.</p>
        </div>
        <div className="text-right glass-panel px-6 py-3 rounded-xl">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Curr Weather</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold text-slate-800">28°C</span>
            <span className="text-slate-400">|</span>
            <span className="text-blue-500 font-medium">Clear Sky</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium pb-1">Soil Moisture (Avg)</p>
            <h3 className="text-2xl font-bold text-slate-800">42% <span className="text-sm text-leaf-500 font-normal">Optimal</span></h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Droplet size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium pb-1">Expected Yield</p>
            <h3 className="text-2xl font-bold text-slate-800">12.5 <span className="text-sm text-slate-500 font-normal">Tons (Tomato)</span></h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Sprout size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium pb-1">System Status</p>
            <h3 className="text-2xl font-bold text-slate-800">All Systems Go</h3>
          </div>
          <div className="flex gap-1">
            <span className="h-3 w-3 rounded-full bg-green-500 block animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <h2 className="text-xl font-bold text-slate-800 mb-6">Operations Hub</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod, i) => (
          <Link href={mod.link} key={mod.id}>
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-leaf-200 transition-colors h-full cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${mod.color} group-hover:scale-110 transition-transform`}>
                {mod.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{mod.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{mod.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
