'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Sprout, 
  Droplet, 
  Map, 
  TrendingUp, 
  Truck, 
  Wrench, 
  Users, 
  ShoppingCart, 
  Mic, 
  Landmark, 
  BookOpen,
  LayoutDashboard
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Crop Health (AI)', href: '/disease-detect', icon: Sprout },
  { name: 'IoT Irrigation', href: '/irrigation', icon: Droplet },
  { name: 'Crop Recommender', href: '/recommend', icon: Map },
  { name: 'Mandi Prices', href: '/prices', icon: TrendingUp },
  { name: 'Route Optimizer', href: '/routes', icon: Truck },
  { name: 'Equipment Rental', href: '/equipment', icon: Wrench },
  { name: 'Labor Hub', href: '/labor', icon: Users },
  { name: 'Agri Inputs', href: '/store', icon: ShoppingCart },
  { name: 'Voice Assistant', href: '/voice', icon: Mic },
  { name: 'Govt Schemes', href: '/schemes', icon: Landmark },
  { name: 'Farm Memory', href: '/memory', icon: BookOpen },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-slate-100 bg-leaf-500 text-white font-bold text-xl tracking-wide gap-2">
        <Sprout size={24} />
        SmartFarm <span className="text-leaf-100 font-normal">AI</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-leaf-50 text-leaf-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon
                  className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-leaf-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="h-9 w-9 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-700 font-bold">
            RK
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Ramesh Kumar</p>
            <p className="text-xs text-slate-500">Farm Owner • 12 Hectares</p>
          </div>
        </div>
      </div>
    </div>
  )
}
