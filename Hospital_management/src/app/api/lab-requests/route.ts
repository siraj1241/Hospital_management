import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const patient = searchParams.get('patient_id')
  let query = supabase.from('lab_requests').select('*, patients(full_name, patient_code), doctors(full_name), lab_tests(test_name, price)').order('requested_at', { ascending: false })
  if (patient) query = query.eq('patient_id', patient)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { data, error } = await supabase.from('lab_requests').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ request: data }, { status: 201 })
}
