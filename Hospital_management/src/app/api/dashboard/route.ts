import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const [patients, doctors, appts, beds, admissions, invoices, meds, labs] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('beds').select('status'),
      supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'ADMITTED'),
      supabase.from('invoices').select('net_amount, paid_amount, status'),
      supabase.from('medicines').select('name, stock_quantity, min_stock, expiry_date'),
      supabase.from('lab_requests').select('status'),
    ])

    const bedStatuses = beds.data || []
    const availableBeds = bedStatuses.filter(b => b.status === 'AVAILABLE').length
    const occupiedBeds = bedStatuses.filter(b => b.status === 'OCCUPIED').length

    const invData = invoices.data || []
    const totalRevenue = invData.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
    const pendingPayments = invData.filter(i => i.status !== 'PAID').reduce((s, i) => s + (Number(i.net_amount) - Number(i.paid_amount || 0)), 0)

    const medData = meds.data || []
    const lowStock = medData.filter(m => m.stock_quantity <= m.min_stock).map(m => m.name)
    const expiringSoon = medData.filter(m => {
      if (!m.expiry_date) return false
      const d = new Date(m.expiry_date)
      const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff < 90
    }).map(m => m.name)

    const labData = labs.data || []
    const labStats = {
      requested: labData.filter(l => l.status === 'REQUESTED').length,
      processing: labData.filter(l => l.status === 'PROCESSING' || l.status === 'SAMPLE_COLLECTED').length,
      completed: labData.filter(l => l.status === 'COMPLETED' || l.status === 'APPROVED').length,
    }

    return NextResponse.json({
      totalPatients: patients.count || 0,
      totalDoctors: doctors.count || 0,
      todayAppointments: appts.count || 0,
      totalBeds: bedStatuses.length,
      availableBeds,
      occupiedBeds,
      activeAdmissions: admissions.count || 0,
      totalRevenue: totalRevenue.toFixed(2),
      pendingPayments: pendingPayments.toFixed(2),
      lowStockMedicines: lowStock,
      expiringMedicines: expiringSoon,
      labStats,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
