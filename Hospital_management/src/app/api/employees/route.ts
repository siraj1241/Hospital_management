import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  let query = supabase.from('users').select('*, roles(name), departments(name)').order('created_at', { ascending: false }).not('employee_code', 'is', null)
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_code.ilike.%${search}%`)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const empCode = `EMP-${String(Date.now()).slice(-5)}`
  const { data, error } = await supabase.from('users').insert({
    ...body, employee_code: empCode, is_activated: true
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ employee: data }, { status: 201 })
}
