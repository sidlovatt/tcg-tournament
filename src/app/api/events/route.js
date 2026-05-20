import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geocodePostcode, haversineDistance, boundingBox } from '@/lib/geocode'

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
    if (postcode) {
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
    const { title, game, format, description, venue_name, city, postcode, event_date, max_players, is_public } = body

    if (!title || !game || !venue_name || !city || !postcode || !event_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const coords = await geocodePostcode(postcode)
    if (!coords) return NextResponse.json({ error: 'Invalid postcode — must be a valid UK postcode' }, { status: 400 })

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title, game, format: format || null, description: description || null,
        venue_name, city,
        postcode: postcode.replace(/\s+/g, '').toUpperCase(),
        lat: coords.lat, lng: coords.lng,
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
