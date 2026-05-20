import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.toLowerCase().trim()
  if (!username) return NextResponse.json({ available: false })

  const supabase = getSupabase()
  const { data } = await supabase.from('profiles').select('id').eq('username', username).single()
  return NextResponse.json({ available: !data })
}
