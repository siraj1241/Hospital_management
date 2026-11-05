import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  // Fetch shifts + templates + employees separately (avoids join issues)
  const [shiftsRes, templatesRes, employeesRes] = await Promise.all([
    supabase.from('employee_shifts').select('*').eq('shift_date', date).order('created_at', { ascending: false }),
    supabase.from('shift_templates').select('*').eq('is_active', true).order('start_time'),
    supabase.from('users').select('id, full_name, employee_code, role, department_id').not('employee_code', 'is', null),
  ])

  if (shiftsRes.error) return NextResponse.json({ error: shiftsRes.error.message }, { status: 500 })

  // Fetch departments
  const deptIds = (employeesRes.data || []).map(e => e.department_id).filter(Boolean)
  const { data: depts } = deptIds.length > 0
    ? await supabase.from('departments').select('id, name').in('id', deptIds)
    : { data: [] }
  const deptMap = new Map((depts || []).map(d => [d.id, d.name]))

  // Merge manually
  const empMap = new Map((employeesRes.data || []).map(e => [e.id, e]))
  const tmplMap = new Map((templatesRes.data || []).map(t => [t.id, t]))

  const shifts = (shiftsRes.data || []).map(s => {
    const emp = empMap.get(s.employee_id)
    return {
      ...s,
      users: emp ? {
        full_name: emp.full_name,
        employee_code: emp.employee_code,
        role: emp.role,
        department_name: deptMap.get(emp.department_id) || null,
      } : null,
      shift_templates: tmplMap.get(s.shift_template_id) || null,
    }
  })

  return NextResponse.json({ shifts, templates: templatesRes.data || [] })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { data, error } = await supabase.from('employee_shifts').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ shift: data }, { status: 201 })
}
