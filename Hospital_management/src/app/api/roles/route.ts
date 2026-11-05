import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const [roles, modules, actions] = await Promise.all([
    supabase.from('roles').select('*, role_permissions(module_id, action_id, is_granted)').order('name'),
    supabase.from('modules').select('*').order('sort_order'),
    supabase.from('actions').select('*').order('name'),
  ])
  if (roles.error) return NextResponse.json({ error: roles.error.message }, { status: 500 })
  return NextResponse.json({ roles: roles.data, modules: modules.data, actions: actions.data })
}
