'use client'
import { Suspense } from 'react'
import { KrishiRouteApp } from './KrishiRouteApp'

export default function RouteOptimizerPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: 'center', color: '#9fb0d0' }}>
        🌾 Loading Route Optimizer…
      </div>
    }>
      <KrishiRouteApp />
    </Suspense>
  )
}
