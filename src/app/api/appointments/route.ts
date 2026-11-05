import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  let query = supabase.from('appointments').select('*, patients(full_name, patient_code, phone), doctors(full_name, specialization)').order('appointment_date', { ascending: false })
  if (date) query = query.eq('appointment_date', date)
  if (status) query = query.eq('status', status)
  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  // Prevent double booking
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', body.doctor_id)
    .eq('appointment_date', body.appointment_date)
    .eq('time_slot', body.time_slot)
    .neq('status', 'CANCELLED')
    .limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Time slot already booked for this doctor' }, { status: 409 })
  }
  const { data, error } = await supabase.from('appointments').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ appointment: data }, { status: 201 })
}
