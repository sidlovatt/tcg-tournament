import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function PATCH(request, { params }) {
  try {
    const supabase = getSupabase()
    const { id } = await params
    const { eliminated } = await request.json()

    const { error } = await supabase
      .from('players')
      .update({ eliminated: !!eliminated })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Drop player error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
