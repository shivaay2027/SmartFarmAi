'use client'
import { useState } from 'react'
import { Search, ShoppingCart, Star, Filter, ArrowRight } from 'lucide-react'

// Mock Data
const equipmentData = [
  { id: 1, name: 'Mahindra 575 DI Tractor', type: 'Tractor', hp: '45 HP', price: 800, rating: 4.8, owner: 'Raju Patel', distance: '2.4 km', img: 'tractor' },
  { id: 2, name: 'DJI Agras T40 Drone', type: 'Drone', hp: 'Battery', price: 1500, rating: 4.9, owner: 'Kisan Tech Co', distance: '5.1 km', img: 'drone' },
  { id: 3, name: 'John Deere Harvester', type: 'Harvester', hp: '75 HP', price: 2500, rating: 4.6, owner: 'Amit Singh', distance: '12 km', img: 'harvester' }
]

export default function EquipmentMarketplace() {
  const [activeTab, setActiveTab] = useState('Rent')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Krishi Equipment Network</h1>
          <p className="text-slate-500 mt-2">Rent or lease heavy machinery on-demand from local farmers.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'Rent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('Rent')}
          >
            Find Equipment
          </button>
          <button 
            className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'List' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('List')}
          >
            List My Tractor
          </button>
        </div>
      </div>

      {activeTab === 'Rent' && (
        <>
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search tractors, harvesters, rotavators..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 text-slate-700 font-medium hover:bg-slate-50">
              <Filter size={18} /> Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentData.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                <div className="h-48 bg-slate-100 relative pt-6 flex justify-center items-center overflow-hidden">
                   {/* Fallback pattern since we don't have real images */}
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                   <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:scale-105 transition-transform">
                      {item.img.toUpperCase()}
                   </div>
                   <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700 flex items-center gap-1 shadow-sm">
                     <Star size={12} className="text-amber-500 fill-amber-500" /> {item.rating}
                   </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">{item.type}</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{item.hp} • Offered by {item.owner}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-leaf-600">₹{item.price}</span>
                      <span className="text-slate-500 text-xs"> / hour</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{item.distance} away</span>
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white font-medium py-3 flex items-center justify-center gap-2 hover:bg-leaf-600 transition-colors">
                  Book Now <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
