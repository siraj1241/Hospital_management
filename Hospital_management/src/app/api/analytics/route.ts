import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  
  try {
    // Employee analytics
    const [totalEmp, activeEmp, doctors, nurses, deptCount, present, absent, onLeave, shiftsToday, attendanceToday] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).not('employee_code', 'is', null),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_activated', true).not('employee_code', 'is', null),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'DOCTOR'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'NURSE'),
      supabase.from('departments').select('id', { count: 'exact', head: true }),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]).in('status', ['PRESENT', 'LATE']),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]).eq('status', 'ABSENT'),
      supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabase.from('employee_shifts').select('*, shift_templates(name, start_time, end_time)').eq('shift_date', new Date().toISOString().split('T')[0]),
      supabase.from('attendance').select('status, late_minutes, overtime_minutes').eq('date', new Date().toISOString().split('T')[0]),
    ])
    
    // Department-wise employee count
    const { data: deptWise } = await supabase.from('users').select('departments(name)').not('employee_code', 'is', null)
    const deptCounts: Record<string, number> = {}
    ;(deptWise || []).forEach(u => {
      const dname = u.departments?.name || 'Unassigned'
      deptCounts[dname] = (deptCounts[dname] || 0) + 1
    })
    
    // Shift coverage
    const shiftData = shiftsToday.data || []
    const shiftBreakdown: Record<string, number> = {}
    shiftData.forEach(s => {
      const sname = s.shift_templates?.name || 'Unknown'
      shiftBreakdown[sname] = (shiftBreakdown[sname] || 0) + 1
    })
    
    // Late arrivals
    const attData = attendanceToday.data || []
    const lateArrivals = attData.filter(a => a.status === 'LATE').length
    const overtime = attData.filter(a => (a.overtime_minutes || 0) > 0).length
    
    // Revenue analytics
    const { data: invoices } = await supabase.from('invoices').select('net_amount, paid_amount, created_at')
    const invData = invoices || []
    const totalRevenue = invData.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
    
    // Bed occupancy
    const { data: beds } = await supabase.from('beds').select('status')
    const bedData = beds || []
    const availableBeds = bedData.filter(b => b.status === 'AVAILABLE').length
    const occupiedBeds = bedData.filter(b => b.status === 'OCCUPIED').length
    
    return NextResponse.json({
      totalEmployees: totalEmp.count || 0,
      activeEmployees: activeEmp.count || 0,
      totalDoctors: doctors.count || 0,
      totalNurses: nurses.count || 0,
      totalDepartments: deptCount.count || 0,
      presentToday: present.count || 0,
      absentToday: absent.count || 0,
      onLeave: onLeave.count || 0,
      lateArrivals,
      overtimeEmployees: overtime,
      departmentBreakdown: deptCounts,
      shiftBreakdown,
      totalShiftsToday: shiftData.length,
      totalRevenue: totalRevenue.toFixed(2),
      availableBeds,
      occupiedBeds,
      totalBeds: bedData.length,
      bedOccupancyRate: bedData.length > 0 ? Math.round((occupiedBeds / bedData.length) * 100) : 0,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
