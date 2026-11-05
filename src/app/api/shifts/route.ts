import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('employee_shifts')
    .select('*, users(full_name, employee_code, role, departments(name)), shift_templates(name, start_time, end_time, color), departments(name)')
    .eq('shift_date', date)
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // Also get shift templates
  const { data: templates } = await supabase.from('shift_templates').select('*').eq('is_active', true).order('start_time')
  
  return NextResponse.json({ shifts: data, templates: templates || [] })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { data, error } = await supabase.from('employee_shifts').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ shift: data }, { status: 201 })
}
