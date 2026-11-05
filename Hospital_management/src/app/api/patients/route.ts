import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  let query = supabase.from('patients').select('*').order('created_at', { ascending: false })
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,patient_code.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patients: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const patientCode = `PAT-${Date.now().toString().slice(-8)}`
  const { data, error } = await supabase.from('patients').insert({ ...body, patient_code: patientCode }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ patient: data }, { status: 201 })
}
