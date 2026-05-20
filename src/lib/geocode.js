export async function geocodePostcode(postcode) {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`)
  if (!res.ok) return null
  const { result } = await res.json()
  return result ? { lat: result.latitude, lng: result.longitude } : null
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function boundingBox(lat, lng, radiusMiles) {
  const latDeg = radiusMiles / 69.0
  const lngDeg = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180))
  return { minLat: lat - latDeg, maxLat: lat + latDeg, minLng: lng - lngDeg, maxLng: lng + lngDeg }
}
