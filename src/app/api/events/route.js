import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { geocodePostcode, haversineDistance, boundingBox } from '@/lib/geocode'

export async function GET(request) {
  try {
    const supabase = getSupabase()
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
    const supabase = getSupabase()
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, game, format, description, venue_name, city, postcode, event_date, max_players, is_public } = body

    if (!title || !game || !venue_name || !city || !postcode || !event_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const coords = await geocodePostcode(postcode)
    if (!coords) return NextResponse.json({ error: 'Invalid postcode — must be a valid UK postcode' }, { status: 400 })

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
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
