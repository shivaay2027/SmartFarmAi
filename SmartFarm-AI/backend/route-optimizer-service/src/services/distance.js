const axios = require("axios");

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine distance for rapid filtering.
function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Real road distance using Mapbox Directions API (or fallback to OSRM)
async function getRoadDistanceKm(a, b) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (mapboxToken) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${a.lng},${a.lat};${b.lng},${b.lat}?geometries=geojson&access_token=${mapboxToken}`;
      const res = await axios.get(url);
      if (res.data && res.data.routes && res.data.routes.length > 0) {
        const distKm = res.data.routes[0].distance / 1000;
        const coords = res.data.routes[0].geometry.coordinates;
        return { distanceKm: distKm, routeCoordinates: coords };
      }
    } catch (err) {
      console.error("Mapbox Route Error:", err.response?.data?.message || err.message);
    }
  }

  // Fallback to free OSRM
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=simplified&geometries=geojson`;
    const res = await axios.get(url);
    if (res.data && res.data.routes && res.data.routes.length > 0) {
      const distKm = res.data.routes[0].distance / 1000;
      const coords = res.data.routes[0].geometry.coordinates;
      return { distanceKm: distKm, routeCoordinates: coords };
    }
  } catch (err) {
    console.error("OSRM Route Error:", err.message);
  }

  // Ultimate Fallback: Straight-line * 1.3 road curve factor
  return { distanceKm: haversineKm(a, b) * 1.3, routeCoordinates: [[a.lng, a.lat], [b.lng, b.lat]] };
}

module.exports = { haversineKm, getRoadDistanceKm };
