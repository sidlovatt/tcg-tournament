import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geocodePostcode, haversineDistance, boundingBox } from '@/lib/geocode'

async function geocodeAddress(q) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'tcg-tournament-app' } }
    )
    const results = await res.json()
    if (!results[0]) return null
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
  } catch { return null }
}

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function getUserIdFromToken(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return null
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return payload.sub || null
  } catch { return null }
}

export async function GET(request) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')
    const locationQuery = searchParams.get('location')
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const radius = parseFloat(searchParams.get('radius') || '10')
    const game = searchParams.get('game')

    let query = supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('is_public', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })

    if (game) query = query.eq('game', game)

    let coords = null
    if (latParam && lngParam) {
      coords = { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
      const box = boundingBox(coords.lat, coords.lng, radius)
      query = query
        .gte('lat', box.minLat).lte('lat', box.maxLat)
        .gte('lng', box.minLng).lte('lng', box.maxLng)
    } else if (locationQuery) {
      coords = await geocodeAddress(locationQuery)
      if (!coords) return NextResponse.json({ error: 'Location not found' }, { status: 400 })
      const box = boundingBox(coords.lat, coords.lng, radius)
      query = query
        .gte('lat', box.minLat).lte('lat', box.maxLat)
        .gte('lng', box.minLng).lte('lng', box.maxLng)
    } else if (postcode) {
      coords = await geocodePostcode(postcode)
      if (!coords) return NextResponse.json({ error: 'Invalid postcode' }, { status: 400 })
      const box = boundingBox(coords.lat, coords.lng, radius)
      query = query
        .gte('lat', box.minLat).lte('lat', box.maxLat)
        .gte('lng', box.minLng).lte('lng', box.maxLng)
    }

    const { data, error } = await query
    if (error) throw error

    let events = data || []
    if (coords) {
      events = events
        .map(e => ({ ...e, distanceMiles: haversineDistance(coords.lat, coords.lng, e.lat, e.lng) }))
        .filter(e => e.distanceMiles <= radius)
        .sort((a, b) => a.distanceMiles - b.distanceMiles)
    }

    return NextResponse.json({ events })
  } catch (err) {
    console.error('Events GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, game, format, description, venue_name, city, postcode, lat, lng, event_date, max_players, is_public } = body

    if (!title || !game || !venue_name || !city || !event_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Please select a location from the address search' }, { status: 400 })
    }

    const eventDateObj = new Date(event_date)
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    if (eventDateObj > maxDate) {
      return NextResponse.json({ error: 'Events can only be created up to 3 months in advance' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title, game, format: format || null, description: description || null,
        venue_name, city,
        postcode: postcode ? postcode.replace(/\s+/g, '').toUpperCase() : null,
        lat: parseFloat(lat), lng: parseFloat(lng),
        event_date, max_players: max_players || null,
        is_public: is_public !== false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Events POST error:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
