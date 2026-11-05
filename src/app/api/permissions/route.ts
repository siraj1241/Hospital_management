import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  
  // Get all modules + actions
  const [modules, actions, rolePerms, empPerms] = await Promise.all([
    supabase.from('modules').select('*').order('sort_order'),
    supabase.from('actions').select('*').order('name'),
    // Role-based permissions for this employee's role
    employeeId ? supabase.from('role_permissions').select('*, roles!inner(id)').eq('is_granted', true) : supabase.from('role_permissions').select('module_id, action_id, is_granted'),
    // Employee-specific overrides
    employeeId ? supabase.from('employee_permissions').select('*').eq('employee_id', employeeId) : supabase.from('employee_permissions').select('*'),
  ])
  
  if (modules.error) return NextResponse.json({ error: modules.error.message }, { status: 500 })
  return NextResponse.json({ modules: modules.data, actions: actions.data, rolePermissions: rolePerms.data, employeePermissions: empPerms.data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { employee_id, module_id, action_id, is_granted } = body
  
  const { data, error } = await supabase
    .from('employee_permissions')
    .upsert({ employee_id, module_id, action_id, is_granted }, { onConflict: 'employee_id,module_id,action_id' })
    .select().single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  // Log the change
  await supabase.from('permission_changes').insert({
    employee_id, module_id, action_id,
    change_type: is_granted ? 'GRANT' : 'REVOKE',
    new_value: is_granted,
  })
  
  return NextResponse.json({ permission: data }, { status: 201 })
}
