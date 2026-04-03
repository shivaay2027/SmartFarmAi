'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../routes/krishiRouteI18n.js';
import 'leaflet/dist/leaflet.css';

// ── CSS (scoped via class prefix kr-) ─────────────────────────────────────────
const css = `
  .kr-page { background: radial-gradient(1200px 700px at 20% 0%, rgba(37,99,235,0.25),transparent 60%), radial-gradient(1200px 700px at 90% 0%, rgba(31,122,90,0.20),transparent 60%), #0b1220; min-height:100vh; padding:20px 18px 40px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#e8eefc; }
  .kr-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
  .kr-title { font-size:26px; font-weight:800; }
  .kr-subtitle { color:#9fb0d0; margin-top:4px; font-size:13px; }
  .kr-pill { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); padding:6px 12px; border-radius:999px; font-size:12px; color:#9fb0d0; }
  .kr-grid { display:grid; grid-template-columns:360px 1fr; gap:14px; }
  @media(max-width:980px){.kr-grid{grid-template-columns:1fr;}}
  .kr-card { border:1px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)); border-radius:16px; padding:14px; }
  .kr-card-title { font-weight:800; margin-bottom:10px; }
  .kr-muted { color:#9fb0d0; font-size:13px; }
  .kr-form { display:flex; flex-direction:column; gap:10px; }
  .kr-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .kr-label { display:flex; flex-direction:column; gap:6px; font-size:12px; color:#9fb0d0; }
  .kr-input,.kr-select { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#e8eefc; padding:10px; border-radius:12px; outline:none; width:100%; }
  .kr-input:focus,.kr-select:focus { border-color:rgba(37,99,235,0.6); }
  .kr-select option { background:#111f3a; color:#e8eefc; }
  .kr-btn-primary { border:none; background:linear-gradient(90deg,rgba(37,99,235,0.9),rgba(31,122,90,0.9)); color:white; padding:11px 12px; border-radius:12px; font-weight:800; cursor:pointer; width:100%; }
  .kr-btn-primary:disabled { opacity:0.65; cursor:not-allowed; }
  .kr-btn-secondary { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#e8eefc; padding:10px 12px; border-radius:12px; cursor:pointer; }
  .kr-divider { height:1px; background:rgba(255,255,255,0.08); margin:4px 0; }
  .kr-checkbox-row { display:flex; align-items:center; gap:10px; font-size:13px; color:#e8eefc; cursor:pointer; }
  .kr-error { margin-top:10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(220,38,38,0.35); background:rgba(220,38,38,0.12); color:#fecaca; font-size:13px; }
  .kr-warn { margin-bottom:10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(180,83,9,0.35); background:rgba(180,83,9,0.14); color:#fde68a; font-size:13px; }
  .kr-impact-banner { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
  @media(max-width:600px){.kr-impact-banner{grid-template-columns:1fr;}}
  .kr-impact-chip { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); border-radius:14px; padding:12px 14px; text-align:center; }
  .kr-impact-chip.highlight { border-color:rgba(180,83,9,0.45); background:rgba(180,83,9,0.12); }
  .kr-impact-chip.savings { border-color:rgba(34,197,94,0.45); background:rgba(34,197,94,0.10); }
  .kr-impact-value { font-size:22px; font-weight:900; line-height:1.2; }
  .kr-impact-chip.highlight .kr-impact-value { color:#fde68a; }
  .kr-impact-chip.savings .kr-impact-value { color:#4ade80; }
  .kr-impact-label { font-size:11px; color:#9fb0d0; margin-top:4px; }
  .kr-cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:12px; }
  @media(max-width:700px){.kr-cards{grid-template-columns:1fr 1fr;}}
  .kr-profit-card { text-align:left; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); border-radius:14px; padding:12px; cursor:pointer; transition:background 0.15s; }
  .kr-profit-card:hover { background:rgba(255,255,255,0.07); }
  .kr-profit-card.selected { border-color:rgba(37,99,235,0.6); }
  .kr-profit-card.winner { border-color:rgba(180,83,9,0.6); }
  .kr-pc-title { display:flex; align-items:center; justify-content:space-between; gap:8px; font-weight:800; }
  .kr-star { font-size:11px; padding:3px 8px; border-radius:999px; border:1px solid rgba(180,83,9,0.5); background:rgba(180,83,9,0.16); color:#fde68a; }
  .kr-pc-meta { color:#9fb0d0; font-size:12px; margin-top:6px; }
  .kr-pc-value { font-size:18px; font-weight:900; margin-top:8px; }
  .kr-split { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  @media(max-width:700px){.kr-split{grid-template-columns:1fr;}}
  .kr-panel { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); border-radius:16px; padding:12px; margin-top:12px; }
  .kr-panel-title { font-weight:800; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .kr-breakdown { display:flex; flex-direction:column; gap:8px; }
  .kr-kv { display:flex; justify-content:space-between; gap:12px; font-size:13px; }
  .kr-k { color:#9fb0d0; } .kr-v { color:#e8eefc; } .kr-v.strong { font-weight:900; }
  .kr-good { color:#4ade80; font-size:12px; margin-left:6px; } .kr-bad { color:#fecaca; font-size:12px; margin-left:6px; }
  .kr-mini-warn,.kr-mini-info { margin-top:8px; padding:10px 12px; border-radius:12px; font-size:13px; }
  .kr-mini-warn { border:1px solid rgba(180,83,9,0.35); background:rgba(180,83,9,0.14); color:#fde68a; }
  .kr-mini-info { border:1px solid rgba(37,99,235,0.35); background:rgba(37,99,235,0.12); color:#bfdbfe; }
  .kr-map-wrap { border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); position:relative; min-height:380px; }
  .leaflet-container { background:#0f1a30 !important; }
  .leaflet-popup-content-wrapper { background:#0f1a30; color:#e8eefc; border:1px solid rgba(255,255,255,0.12); border-radius:12px; }
  .leaflet-popup-tip { background:#0f1a30; }
  .kr-map-fallback { background:#0f1a30; border-radius:14px; border:1px solid rgba(255,255,255,0.08); padding:20px; text-align:center; color:#9fb0d0; font-size:13px; min-height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  .kr-muted-small { color:#9fb0d0; font-size:12px; margin-top:8px; }
  .kr-share-row { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
  .kr-lang-select { padding:5px 8px; border-radius:6px; background:#36454F; color:white; border:1px solid #4ade80; font-size:13px; }
`;

const BACKEND_URL = 'http://localhost:4001';

async function apiGet(path) {
  const res = await fetch(BACKEND_URL + path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(BACKEND_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `POST ${path} failed`);
  return data;
}

function formatINR(x) {
  return Number(x || 0).toLocaleString('en-IN');
}

// Leaflet map with real OpenStreetMap tiles, demand heatmap, animated route arcs
// Uses react-leaflet which is already in the project's package.json
function KrishiMap({ origin, markets, winnerMandiId, selectedMandiId, onSelectMandi, pinDropMode, onPinDrop }) {
  const mapRef = React.useRef(null);
  const mapContainerRef = React.useRef(null);
  const markerRefs = React.useRef({});
  const [mapReady, setMapReady] = React.useState(false);

  // Demand color
  function demandColor(idx, isWinner, alpha = 1) {
    if (isWinner) return `rgba(251,191,36,${alpha})`;
    if (idx > 0.75) return `rgba(185,28,28,${alpha})`;
    if (idx > 0.5) return `rgba(217,119,6,${alpha})`;
    return `rgba(37,99,235,${alpha})`;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Dynamic import Leaflet (SSR safe)
    Promise.all([
      import('leaflet'),
    ]).then(([L]) => {
      L = L.default || L;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (!mapContainerRef.current) return;

      // Fix leaflet default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [origin.lat, origin.lng],
        zoom: 7,
        zoomControl: true,
      });

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Farm origin marker (green)
      const farmIcon = L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 8px rgba(34,197,94,0.8);display:flex;align-items:center;justify-content:center;font-size:11px;">🌾</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const farmMarker = L.marker([origin.lat, origin.lng], { icon: farmIcon }).addTo(map);
      farmMarker.bindPopup(`<b>📍 Your Farm</b><br/>${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`);

      // Pin-drop click handler
      map.on('click', (e) => {
        if (!pinDropMode) return;
        onPinDrop(e.latlng.lat, e.latlng.lng);
      });

      // Mandi markers + route arcs
      markets.forEach(m => {
        const isWinner = m.mandiId === winnerMandiId;
        const isSelected = m.mandiId === selectedMandiId;
        const color = demandColor(m.demandIndex, isWinner);
        const r = isWinner ? 18 : 13;
        const innerR = isWinner ? 10 : 7;

        // Circle marker (demand-colored)
        const circle = L.circleMarker([m.location.lat, m.location.lng], {
          radius: r,
          fillColor: color,
          color: isWinner ? '#fbbf24' : (isSelected ? 'white' : 'rgba(0,0,0,0.4)'),
          weight: isWinner ? 3 : (isSelected ? 2 : 1),
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        // Inner glow circle for winner
        if (isWinner) {
          L.circleMarker([m.location.lat, m.location.lng], {
            radius: r + 8,
            fillColor: '#fbbf24',
            color: 'transparent',
            fillOpacity: 0.18,
          }).addTo(map);
        }

        const profitStr = Number(m.netProfit).toLocaleString('en-IN');
        const shortName = m.mandiName.replace(' APMC', '').replace(' Mandi', '').replace(' Market', '');
        circle.bindPopup(
          `<div style="min-width:160px">
            <b>${isWinner ? '⭐ ' : ''}${m.mandiName}</b><br/>
            <span style="color:#6b7280">${m.distanceKm} km away</span><br/>
            <table style="margin-top:6px;font-size:12px;width:100%">
              <tr><td>Price</td><td><b>₹${Number(m.pricePerQuintal).toLocaleString('en-IN')}/q</b></td></tr>
              <tr><td>Net Profit</td><td><b style="color:${isWinner ? '#d97706' : '#059669'}">₹${profitStr}</b></td></tr>
              <tr><td>Demand</td><td>${Math.round(m.demandIndex * 100)}/100</td></tr>
            </table>
          </div>`
        );

        markerRefs.current[m.mandiId] = circle;

        circle.on('click', () => onSelectMandi(m.mandiId));

        // Route line from farm to mandi
        const routeCoords = m.route?.coordinates
          ? m.route.coordinates.map(([lng, lat]) => [lat, lng])
          : [[origin.lat, origin.lng], [m.location.lat, m.location.lng]];

        L.polyline(routeCoords, {
          color: isWinner ? '#fbbf24' : (isSelected ? '#4ade80' : 'rgba(99,102,241,0.4)'),
          weight: isWinner ? 3 : (isSelected ? 2 : 1.5),
          dashArray: isWinner ? null : '6 6',
          opacity: isWinner ? 0.9 : 0.5,
        }).addTo(map);

        // Label above marker
        const label = L.divIcon({
          html: `<div style="background:rgba(15,26,48,0.85);color:${isWinner ? '#fbbf24' : '#c7d2fe'};padding:2px 6px;border-radius:6px;font-size:10px;font-weight:${isWinner ? 700 : 500};white-space:nowrap;border:1px solid rgba(255,255,255,0.1);pointer-events:none">${shortName}</div>`,
          className: '',
          iconAnchor: [0, r + 18],
        });
        L.marker([m.location.lat, m.location.lng], { icon: label, interactive: false }).addTo(map);
      });

      // Fit all markers in view
      const allLatLngs = [
        [origin.lat, origin.lng],
        ...markets.map(m => [m.location.lat, m.location.lng]),
      ];
      if (allLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] });
      }

      setMapReady(true);
    }).catch(err => {
      console.error('Leaflet load error:', err);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lng, markets, winnerMandiId, selectedMandiId, pinDropMode]);

  // Update cursor for pin-drop mode
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.style.cursor = pinDropMode ? 'crosshair' : '';
  }, [pinDropMode]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainerRef} style={{ height: 380, borderRadius: 14, overflow: 'hidden' }} />
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 28, left: 10, background: 'rgba(11,18,32,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#9fb0d0', zIndex: 1000, backdropFilter: 'blur(4px)', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: '#e8eefc' }}>Demand</div>
        {[['#2563eb','Low'],['#d97706','Medium'],['#b91c1c','High'],['#fbbf24','Winner ⭐']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KrishiRouteApp() {
  const { t, i18n } = useTranslation();
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState(null);
  const [backendError, setBackendError] = useState(false);

  const [crop, setCrop] = useState('onion');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('quintal');
  const [vehicle, setVehicle] = useState('TATA_ACE');
  const [radiusKm, setRadiusKm] = useState(150);
  const [originLat, setOriginLat] = useState(19.9975);
  const [originLng, setOriginLng] = useState(73.7898);
  const [poolEnabled, setPoolEnabled] = useState(false);
  const [neighborQty, setNeighborQty] = useState(10);
  const [neighborUnit, setNeighborUnit] = useState('quintal');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMandiId, setSelectedMandiId] = useState(null);
  const [pinDropMode, setPinDropMode] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await apiGet('/api/meta');
        if (!alive) return;
        setMeta(m);
        if (m?.crops?.[0]?.id) setCrop(m.crops[0].id);
        if (m?.vehicles?.[0]?.id) setVehicle(m.vehicles[0].id);
      } catch (e) {
        if (!alive) return;
        setBackendError(true);
        setError('⚠️ Route Optimizer backend not running. Start it with: cd backend/route-optimizer-service && npm start');
      } finally {
        if (alive) setLoadingMeta(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const origin = useMemo(() => ({ lat: Number(originLat), lng: Number(originLng) }), [originLat, originLng]);
  const markets = result?.markets || [];
  const winnerMandiId = result?.winnerMandiId || null;
  const selected = markets.find(m => m.mandiId === selectedMandiId) || markets.find(m => m.mandiId === winnerMandiId) || null;

  const impactMetrics = useMemo(() => {
    if (markets.length === 0) return null;
    const winner = markets.find(m => m.mandiId === winnerMandiId);
    const sorted = [...markets].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearest = sorted[0];
    const bestMargin = Math.max(...markets.map(m => m.profitMargin || 0));
    const savings = winner && nearest && winner.mandiId !== nearest.mandiId
      ? Math.round(winner.netProfit - nearest.netProfit) : 0;
    return { marketsCompared: markets.length, bestMargin: bestMargin.toFixed(1), savings, nearestName: nearest?.mandiName || '', winnerName: winner?.mandiName || '', winnerDist: winner?.distanceKm || 0, nearestDist: nearest?.distanceKm || 0 };
  }, [markets, winnerMandiId]);

  async function optimize(e) {
    e.preventDefault();
    setError(null); setLoading(true); setResult(null); setSelectedMandiId(null);
    try {
      const data = await apiPost('/api/optimize', {
        crop, quantity: Number(quantity), unit, vehicle, radiusKm: Number(radiusKm),
        origin: { lat: Number(originLat), lng: Number(originLng) },
        pooling: poolEnabled ? { enabled: true, neighborQuantity: Number(neighborQty), neighborUnit } : { enabled: false },
      });
      setResult(data);
      setSelectedMandiId(data?.winnerMandiId ?? null);
    } catch (e2) {
      setError(e2?.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setOriginLat(pos.coords.latitude.toFixed(6)); setOriginLng(pos.coords.longitude.toFixed(6)); },
      () => setError('Could not fetch your location.')
    );
  }

  const historyData = useMemo(() => {
    if (!selected?.priceHistory) return [];
    return selected.priceHistory.map(p => ({ date: p.date.slice(5), price: p.pricePerQuintal }));
  }, [selected]);

  const chartData = useMemo(() => markets.map(m => ({
    name: m.mandiName.replace(' APMC', '').replace(' Mandi', '').replace(' Market', ''),
    netProfit: Math.round(m.netProfit), revenue: Math.round(m.revenue), totalCost: Math.round(m.totalCost),
    isWinner: m.mandiId === winnerMandiId,
  })), [markets, winnerMandiId]);

  const shareText = useMemo(() => {
    const winner = markets.find(m => m.mandiId === winnerMandiId);
    return winner ? `🌾 SmartFarm Route Optimizer Result:\n⭐ Best: ${winner.mandiName} (${winner.distanceKm}km)\n💰 Net Profit: ₹${formatINR(winner.netProfit)}\n📊 ${markets.length} mandis compared` : '';
  }, [markets, winnerMandiId]);

  const LANG_OPTIONS = [
    ['en','English'],['hi','हिंदी'],['bn','বাংলা'],['mr','मराठी'],['te','తెలుగు'],
    ['ta','தமிழ்'],['gu','ગુજરાતી'],['ur','اردو'],['kn','ಕನ್ನಡ'],
    ['pa','ਪੰਜਾਬੀ'],['ml','മലയാളം'],['or','ଓଡ଼ିଆ'],['as','অসমীয়া'],
  ];

  return (
    <>
      <style>{css}</style>
      <div className="kr-page">
        {/* Header */}
        <div className="kr-header">
          <div>
            <div className="kr-title">🌾 {t('appTitle', 'Krishi-Route')}</div>
            <div className="kr-subtitle">{t('appSubtitle', 'Most profitable mandi, not just nearest.')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select className="kr-lang-select" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
              {LANG_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="kr-pill">Live API</div>
          </div>
        </div>

        {backendError && (
          <div className="kr-warn" style={{ marginBottom: 14 }}>
            🔌 <strong>Route Optimizer backend not running.</strong> Start it:<br />
            <code style={{ fontSize: 12, opacity: 0.8 }}>cd backend/route-optimizer-service &amp;&amp; npm start</code>
          </div>
        )}

        <div className="kr-grid">
          {/* ── Input Panel ─────────────────────────────── */}
          <section className="kr-card">
            <div className="kr-card-title">📍 {t('tripInput', 'Trip Input')}</div>
            {loadingMeta ? (
              <div className="kr-muted">{t('loadingOptions', 'Loading options…')}</div>
            ) : (
              <form className="kr-form" onSubmit={optimize}>
                <div className="kr-row">
                  <label className="kr-label">{t('crop', 'Crop')}
                    <select className="kr-select" value={crop} onChange={e => setCrop(e.target.value)}>
                      {(meta?.crops || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="kr-label">{t('vehicle', 'Vehicle')}
                    <select className="kr-select" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                      {(meta?.vehicles || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="kr-row">
                  <label className="kr-label">{t('quantity', 'Quantity')}
                    <input className="kr-input" type="number" min="0.1" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} />
                  </label>
                  <label className="kr-label">{t('unit', 'Unit')}
                    <select className="kr-select" value={unit} onChange={e => setUnit(e.target.value)}>
                      <option value="quintal">{t('quintal', 'Quintal')}</option>
                      <option value="ton">{t('ton', 'Ton')}</option>
                    </select>
                  </label>
                </div>

                <div className="kr-row">
                  <label className="kr-label">{t('searchRadius', 'Search radius (km)')} <span title="Best: 50–200 km" style={{ cursor: 'help', marginLeft: 4 }}>ⓘ</span>
                    <input className="kr-input" type="number" min="10" step="10" value={radiusKm} onChange={e => setRadiusKm(e.target.value)} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" className="kr-btn-secondary" onClick={useMyLocation} style={{ width: '100%' }}>
                      📍 {t('useMyLocation', 'Use my location')}
                    </button>
                  </div>
                </div>

                <div className="kr-row">
                  <label className="kr-label">{t('originLat', 'Origin Latitude')}
                    <input className="kr-input" value={originLat} onChange={e => setOriginLat(e.target.value)} />
                  </label>
                  <label className="kr-label">{t('originLng', 'Origin Longitude')}
                    <input className="kr-input" value={originLng} onChange={e => setOriginLng(e.target.value)} />
                  </label>
                </div>

                <div className="kr-divider" />

                <label className="kr-checkbox-row">
                  <input type="checkbox" checked={poolEnabled} onChange={e => setPoolEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
                  🤝 {t('enableCostSharing', 'Enable cost-sharing (ride-share)')}
                </label>

                {poolEnabled && (
                  <div className="kr-row">
                    <label className="kr-label">{t('neighborQty', 'Neighbor quantity')}
                      <input className="kr-input" type="number" min="0.1" step="0.1" value={neighborQty} onChange={e => setNeighborQty(e.target.value)} />
                    </label>
                    <label className="kr-label">{t('neighborUnit', 'Neighbor unit')}
                      <select className="kr-select" value={neighborUnit} onChange={e => setNeighborUnit(e.target.value)}>
                        <option value="quintal">{t('quintal', 'Quintal')}</option>
                        <option value="ton">{t('ton', 'Ton')}</option>
                      </select>
                    </label>
                  </div>
                )}

                <button className="kr-btn-primary" disabled={loading || backendError}>
                  {loading ? `⏳ ${t('optimizing', 'Optimizing…')}` : `🔍 ${t('compareMandis', 'Compare mandis')}`}
                </button>
              </form>
            )}
            {error && <div className="kr-error">{error}</div>}
          </section>

          {/* ── Results Panel ───────────────────────────── */}
          <section className="kr-card">
            <div className="kr-card-title">📊 {t('decisionDashboard', 'Decision dashboard')}</div>

            {result?.warnings?.length > 0 && (
              <div className="kr-warn">{result.warnings.map(w => <div key={w}>{w}</div>)}</div>
            )}

            {markets.length === 0 ? (
              <div className="kr-muted">{t('runComparisonMsg', 'Run a comparison to see profits across nearby mandis.')}</div>
            ) : (
              <>
                {/* Impact Metrics */}
                {impactMetrics && (
                  <div className="kr-impact-banner">
                    <div className="kr-impact-chip">
                      <div className="kr-impact-value">{impactMetrics.marketsCompared}</div>
                      <div className="kr-impact-label">{t('marketsCompared', 'Markets Compared')}</div>
                    </div>
                    <div className="kr-impact-chip highlight">
                      <div className="kr-impact-value">{impactMetrics.bestMargin}%</div>
                      <div className="kr-impact-label">{t('bestMargin', 'Best Profit Margin')}</div>
                    </div>
                    {impactMetrics.savings > 0 ? (
                      <div className="kr-impact-chip savings">
                        <div className="kr-impact-value">+₹{formatINR(impactMetrics.savings)}</div>
                        <div className="kr-impact-label">{t('potentialSavings', { nearestDist: impactMetrics.nearestDist, winnerDist: impactMetrics.winnerDist })}</div>
                      </div>
                    ) : (
                      <div className="kr-impact-chip">
                        <div className="kr-impact-value">✓</div>
                        <div className="kr-impact-label">{t('nearestIsWinner', 'Nearest mandi is the best choice!')}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mandi Cards */}
                <div className="kr-cards">
                  {markets.map(m => {
                    const isWinner = m.mandiId === winnerMandiId;
                    const isSelected = m.mandiId === selected?.mandiId;
                    return (
                      <button key={m.mandiId} type="button"
                        className={`kr-profit-card ${isWinner ? 'winner' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedMandiId(m.mandiId)}>
                        <div className="kr-pc-title">
                          {m.mandiName.replace(' APMC', '').replace(' Mandi', '').replace(' Market', '')}
                          {isWinner && <span className="kr-star">{t('winner', 'Winner ⭐')}</span>}
                        </div>
                        <div className="kr-pc-meta">{m.distanceKm} {t('km', 'km')} • ₹{formatINR(m.pricePerQuintal)}/q</div>
                        <div className="kr-pc-value">₹{formatINR(m.netProfit)}</div>
                        <div className="kr-pc-meta">{t('profitMargin', { margin: m.profitMargin })}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Share buttons */}
                <div className="kr-share-row">
                  <button type="button" className="kr-btn-secondary" style={{ fontSize: 13, padding: '6px 12px', background: 'rgba(37,211,102,0.15)', borderColor: 'rgba(37,211,102,0.4)', color: '#4ade80' }}
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}>
                    💬 {t('shareWhatsApp', 'Share on WhatsApp')}
                  </button>
                  <button type="button" className="kr-btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }}
                    onClick={() => navigator.clipboard?.writeText(shareText)}>
                    📋 {t('copyResult', 'Copy Result')}
                  </button>
                </div>

                {/* Profit Charts + Breakdown */}
                <div className="kr-split">
                  {/* Bar chart — rendered as simple table-based viz */}
                  <div className="kr-panel">
                    <div className="kr-panel-title">📈 {t('profitComparison', 'Profit comparison')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {chartData.map((m, i) => {
                        const maxProfit = Math.max(...chartData.map(d => d.netProfit));
                        const pct = maxProfit > 0 ? Math.max(0, Math.round((m.netProfit / maxProfit) * 100)) : 0;
                        return (
                          <div key={i}>
                            <div style={{ fontSize: 12, color: '#9fb0d0', marginBottom: 3 }}>{m.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 20, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: m.isWinner ? '#fbbf24' : '#1f7a5a', borderRadius: 6, transition: 'width 0.5s' }} />
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, minWidth: 80, color: m.isWinner ? '#fbbf24' : '#4ade80' }}>
                                ₹{formatINR(m.netProfit)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mandi Breakdown */}
                  <div className="kr-panel">
                    <div className="kr-panel-title">🏪 {t('selectedMandiBreakdown', 'Selected mandi breakdown')}</div>
                    {selected ? (
                      <div className="kr-breakdown">
                        <div className="kr-kv"><div className="kr-k">{t('mandi', 'Mandi')}</div><div className="kr-v">{selected.mandiName}</div></div>
                        <div className="kr-kv"><div className="kr-k">{t('distance', 'Distance')}</div><div className="kr-v">{selected.distanceKm} {t('km', 'km')}</div></div>
                        <div className="kr-kv"><div className="kr-k">{t('revenue', 'Revenue')}</div><div className="kr-v">₹{formatINR(selected.revenue)}</div></div>
                        <div className="kr-kv"><div className="kr-k">{t('transportCost', 'Transport cost')}</div><div className="kr-v">₹{formatINR(selected.transportCost)}</div></div>
                        <div className="kr-kv"><div className="kr-k">{t('handling', 'Handling')}</div><div className="kr-v">₹{formatINR(selected.handlingCost)}</div></div>
                        <div className="kr-kv"><div className="kr-k">{t('netProfit', 'Net profit')}</div><div className="kr-v strong">₹{formatINR(selected.netProfit)}</div></div>
                        {selected.soloNetProfit !== undefined && selected.soloNetProfit !== selected.netProfit && (
                          <div className="kr-kv"><div className="kr-k">{t('soloTripProfit', 'Solo trip profit')}</div><div className="kr-v">₹{formatINR(selected.soloNetProfit)}</div></div>
                        )}
                        {selected.prediction?.predictedPricePerQuintal && (
                          <>
                            <div className="kr-kv">
                              <div className="kr-k">{t('predictedPriceNextDay', 'Predicted price (next day)')}</div>
                              <div className="kr-v">₹{formatINR(selected.prediction.predictedPricePerQuintal)}/q
                                <span className={selected.prediction.change >= 0 ? 'kr-good' : 'kr-bad'}>
                                  ({selected.prediction.change >= 0 ? '+' : ''}{selected.prediction.change}/q, {selected.prediction.changePct}%)
                                </span>
                              </div>
                            </div>
                            {selected.predictedNetProfit != null && (
                              <div className="kr-kv"><div className="kr-k">{t('predictedNetProfit', 'Predicted net profit')}</div><div className="kr-v">₹{formatINR(selected.predictedNetProfit)}</div></div>
                            )}
                          </>
                        )}
                        {selected.volatilityAlert && (
                          <div className={`kr-mini-${selected.volatilityAlert.key === 'volatility_uptrend' ? 'info' : 'warn'}`}>
                            {t(selected.volatilityAlert.key, selected.volatilityAlert.params || {})}
                          </div>
                        )}
                        {selected.seasonalityInsight && (
                          <div className="kr-mini-info">
                            {t(selected.seasonalityInsight.key, selected.seasonalityInsight.params ? { day: t(selected.seasonalityInsight.params.day) } : {})}
                          </div>
                        )}
                        {selected.perishabilityWarning && (
                          <div className="kr-mini-warn">
                            {t(selected.perishabilityWarning.key, { crop: selected.perishabilityWarning.params?.crop, km: selected.perishabilityWarning.params?.km, maxKm: selected.perishabilityWarning.params?.maxKm })}
                          </div>
                        )}
                        {selected.pooling?.enabled && (
                          selected.pooling.possible ? (
                            <div className="kr-mini-info">
                              {t('rideSharingInfo', { savings: formatINR(selected.pooling.savings), savingsPct: selected.pooling.savingsPct })}
                            </div>
                          ) : (
                            <div className="kr-mini-warn">{selected.pooling.note}</div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="kr-muted">{t('selectMandiCardMsg', 'Select a mandi card to see the breakdown.')}</div>
                    )}
                  </div>
                </div>

                {/* Historical Price Chart */}
                <div className="kr-panel">
                  <div className="kr-panel-title">📅 {t('historicalPriceTrend', 'Historical price trend (last 7 days)')}</div>
                  {historyData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {historyData.map((d, i) => {
                        const maxP = Math.max(...historyData.map(h => h.price));
                        const pct = maxP > 0 ? Math.round((d.price / maxP) * 100) : 0;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: 11, color: '#9fb0d0', minWidth: 40 }}>{d.date}</div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#2563eb,#38bdf8)', borderRadius: 4 }} />
                            </div>
                            <div style={{ fontSize: 12, minWidth: 65, color: '#e8eefc', textAlign: 'right' }}>₹{formatINR(d.price)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="kr-muted">{t('selectMandiRecentPricesMsg', 'Select a mandi to see its recent prices.')}</div>
                  )}
                </div>

                {/* Route Map */}
                <div className="kr-panel">
                  <div className="kr-panel-title">
                    🗺️ {t('routeMapMVP', 'Route map')}
                    <button type="button" onClick={() => setPinDropMode(p => !p)}
                      style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: pinDropMode ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.15)', background: pinDropMode ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)', color: pinDropMode ? '#4ade80' : '#9fb0d0', fontWeight: pinDropMode ? 700 : 400 }}>
                      📍 {pinDropMode ? t('pinDropActive', 'Dropping Pin — click map!') : t('pinDropBtn', 'Drop Pin')}
                    </button>
                  </div>
                  {pinDropMode && <div className="kr-mini-info" style={{ marginBottom: 8 }}>{t('pinDropHint', 'Click anywhere on the map to set your farm location.')}</div>}
                  <div className="kr-map-wrap">
                    <KrishiMap
                      origin={origin}
                      markets={markets}
                      winnerMandiId={winnerMandiId}
                      selectedMandiId={selectedMandiId}
                      onSelectMandi={setSelectedMandiId}
                      pinDropMode={pinDropMode}
                      onPinDrop={(lat, lng) => {
                        setOriginLat(lat.toFixed(6));
                        setOriginLng(lng.toFixed(6));
                        setPinDropMode(false);
                      }}
                    />
                  </div>
                  <div className="kr-muted-small">
                    {t('mapNote', 'Green circle = your farm. Click mandi nodes to select.')}<br />
                    {t('heatmapNote', 'Demand heatmap: blue = lower demand, amber = medium, red = higher demand.')}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
