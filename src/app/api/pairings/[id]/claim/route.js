import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    const { result, claimedBy } = await request.json()

    if (!['player1', 'player2', 'draw'].includes(result)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 400 })
    }

    const { data: pairing, error: fetchErr } = await supabase
      .from('pairings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !pairing) return NextResponse.json({ error: 'Pairing not found' }, { status: 404 })
    if (pairing.result !== 'pending') return NextResponse.json({ error: 'Result already confirmed' }, { status: 400 })

    const { error } = await supabase
      .from('pairings')
      .update({ pending_result: result, pending_claimed_by: claimedBy || 'player' })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    await supabase.from('pairings').update({ pending_result: null, pending_claimed_by: null }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
