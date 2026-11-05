import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  let query = supabase.from('doctors').select('*, departments(name)').order('created_at', { ascending: false })
  if (search) query = query.or(`full_name.ilike.%${search}%,specialization.ilike.%${search}%`)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ doctors: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const doctorCode = `DOC-${Date.now().toString().slice(-8)}`
  const { data, error } = await supabase.from('doctors').insert({ ...body, doctor_code: doctorCode }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ doctor: data }, { status: 201 })
}
