import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.toLowerCase().trim()
  if (!username) return NextResponse.json({ available: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
  return NextResponse.json({ available: !data })
}
