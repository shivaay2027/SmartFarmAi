'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, MapPin, Ruler, CheckCircle, Save } from 'lucide-react'

export default function FarmerProfileSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    land_size_hectares: '',
    category: 'General',
    primary_crop: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // In a real app we'd POST this to a /api/v1/profile endpoint to save to MongoDB.
    // For this demonstration we will mock saving to localStorage and use FARMER_123.
    localStorage.setItem('smartfarm_profile_setup', 'true')
    localStorage.setItem('smartfarm_farmer_name', formData.name)
    localStorage.setItem('smartfarm_farmer_state', formData.state)
    
    // Slight artificial delay for UX
    setTimeout(() => {
      setLoading(false)
      router.push('/schemes')
    }, 1200)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="bg-leaf-600 p-8 text-center">
          <div className="bg-white/20 p-4 rounded-full inline-flex mb-4">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Farmer Profile Setup</h1>
          <p className="text-leaf-100 font-medium">
            To find the exact government schemes you are eligible for, we need some quick details about your farm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 focus:ring-1 focus:ring-leaf-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={16} /> State
                </label>
                <select 
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 bg-slate-50"
                >
                  <option value="" disabled>Select your state</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Ruler size={16} /> Land Size (Hectares)
                </label>
                <input 
                  type="number" 
                  name="land_size_hectares"
                  step="0.1"
                  min="0"
                  required
                  value={formData.land_size_hectares}
                  onChange={handleChange}
                  placeholder="e.g. 1.5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Social Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 bg-slate-50"
                >
                  <option value="General">General</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Primary Crop (Optional)</label>
                <input 
                  type="text" 
                  name="primary_crop"
                  value={formData.primary_crop}
                  onChange={handleChange}
                  placeholder="e.g. Wheat, Rice"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-leaf-500 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <CheckCircle size={16} className="text-leaf-500" /> Information securely stored
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="bg-leaf-600 hover:bg-leaf-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:bg-leaf-400"
            >
              {loading ? (
                <>Saving Profile...</>
              ) : (
                <><Save size={18} /> Continue to Schemes</>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}
