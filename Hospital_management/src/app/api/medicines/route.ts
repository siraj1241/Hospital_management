import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const deptId = searchParams.get('department_id')

  // Fetch medicines + departments separately
  let query = supabase.from('medicines').select('*').order('name')
  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (deptId) query = query.eq('department_id', deptId)

  const [medsRes, deptsRes] = await Promise.all([
    query.limit(200),
    supabase.from('departments').select('id, name').order('name'),
  ])

  if (medsRes.error) return NextResponse.json({ error: medsRes.error.message }, { status: 500 })

  // Merge department names
  const deptMap = new Map((deptsRes.data || []).map(d => [d.id, d.name]))
  const medicines = (medsRes.data || []).map(m => ({
    ...m,
    department_name: m.department_id ? deptMap.get(m.department_id) || null : null,
  }))

  return NextResponse.json({ medicines, departments: deptsRes.data || [] })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { data, error } = await supabase.from('medicines').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ medicine: data }, { status: 201 })
}
