'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Droplet, ThermometerSun, Wind, AlertCircle } from 'lucide-react'

// Mock Data
const sensors = [
  { id: 1, name: 'Plot Alpha (Wheat)', moisture: 35, npk: [120, 45, 80], status: 'Warning' },
  { id: 2, name: 'Plot Beta (Tomato)', moisture: 62, npk: [150, 60, 90], status: 'Optimal' },
  { id: 3, name: 'Plot Delta (Corn)', moisture: 28, npk: [90, 30, 70], status: 'Critical' }
]

export default function IrrigationDashboard() {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">IoT Precision Irrigation</h1>
          <p className="text-slate-500 mt-2">Digital Twin & Real-time Sensor Telemetry Network</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            Calibrate Sensors
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all">
            Start Irrigation Pump
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sensor Highlights */}
        {sensors.map(s => (
          <div key={s.id} className={`p-6 rounded-2xl border shadow-sm ${
            s.status === 'Critical' ? 'bg-red-50 border-red-200' :
            s.status === 'Warning' ? 'bg-orange-50 border-orange-200' :
            'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">{s.name}</h3>
              {s.status === 'Critical' && <AlertCircle className="text-red-500" size={20} />}
            </div>
            
            <div className="flex items-end gap-2 mb-4">
              <span className={`text-4xl font-black ${
                s.status === 'Critical' ? 'text-red-600' :
                s.status === 'Warning' ? 'text-orange-500' :
                'text-blue-500'
              }`}>{s.moisture}%</span>
              <span className="text-slate-500 text-sm mb-1 font-medium">Moisture</span>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-200/60">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nitrogen</span>
                <span className="font-bold text-slate-700">{s.npk[0]} mg/kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phosphorus</span>
                <span className="font-bold text-slate-700">{s.npk[1]} mg/kg</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${s.status === 'Critical' ? 'bg-red-500 w-1/4' : 'bg-blue-500 w-3/4'}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> MQTT LIVE
            </span>
          </div>
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
             Farm Digital Twin Map
          </h3>
          <div className="h-[400px] w-full rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-500">
             [3D Digital Twin Map Visualization Component would render here]
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">AI Irrigation Forecaster</h3>
          <div className="flex-1 space-y-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 font-medium font-mono mb-2">AUTO_SCHEDULE_REC</p>
                <h4 className="font-bold text-blue-900 text-lg mb-1">Delay Irrigation</h4>
                <p className="text-sm text-blue-700">"Plot 3 moisture will reach stress level in 20 hours. Suggest delaying pump activation due to 80% expected rainfall tonight."</p>
             </div>
          </div>
          <button className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors">
            Apply AI Suggestion
          </button>
        </div>
      </div>
    </div>
  )
}
