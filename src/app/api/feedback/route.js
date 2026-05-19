import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { message, page } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })
    const supabase = getSupabase()
    const { error } = await supabase.from('feedback').insert({ message: message.trim(), page: page || null })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
