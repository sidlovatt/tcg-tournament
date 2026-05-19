import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { code } = await params
    const { name } = await request.json()

    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, status')
      .eq('code', code.toUpperCase())
      .single()

    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (tournament.status !== 'waiting') return NextResponse.json({ error: 'Tournament already started' }, { status: 409 })

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('tournament_id', tournament.id)
      .ilike('name', name.trim())
      .single()

    if (existing) return NextResponse.json({ error: 'Name already taken' }, { status: 409 })

    const { data: player, error } = await supabase
      .from('players')
      .insert({ tournament_id: tournament.id, name: name.trim() })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ player })
  } catch (err) {
    console.error('Add player error:', err)
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 })
  }
}
