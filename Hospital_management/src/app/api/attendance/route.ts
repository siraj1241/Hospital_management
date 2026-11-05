import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('attendance')
    .select('*, users(full_name, employee_code, role, departments(name))')
    .eq('date', date)
    .order('check_in_time', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attendance: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const today = new Date().toISOString().split('T')[0]
  
  // Check if already checked in
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', body.employee_id)
    .eq('date', today)
    .single()
  
  if (existing && existing.check_in_time && !existing.check_out_time) {
    // Check out
    const checkOut = new Date()
    const checkIn = new Date(existing.check_in_time)
    const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
    const overtime = hoursWorked > 8 ? Math.round((hoursWorked - 8) * 60) : 0
    
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out_time: checkOut.toISOString(), overtime_minutes: overtime })
      .eq('id', existing.id)
      .select().single()
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ attendance: data })
  } else if (existing) {
    return NextResponse.json({ error: 'Already checked out' }, { status: 400 })
  }
  
  // Check in
  const now = new Date()
  const lateMinutes = now.getHours() > 9 ? (now.getHours() - 9) * 60 + now.getMinutes() : 0
  
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: body.employee_id,
      date: today,
      check_in_time: now.toISOString(),
      status: lateMinutes > 15 ? 'LATE' : 'PRESENT',
      late_minutes: lateMinutes,
    })
    .select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ attendance: data }, { status: 201 })
}
