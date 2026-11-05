import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const { data, error } = await supabase.from('payments').select('*, invoices(invoice_no), patients(full_name)').order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payments: data })
}

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  const body = await req.json()
  const { data, error } = await supabase.from('payments').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Update invoice paid_amount
  if (body.invoice_id) {
    const { data: inv } = await supabase.from('invoices').select('net_amount, paid_amount').eq('id', body.invoice_id).single()
    if (inv) {
      const newPaid = Number(inv.paid_amount || 0) + Number(body.amount)
      const status = newPaid >= Number(inv.net_amount) ? 'PAID' : 'PARTIAL'
      await supabase.from('invoices').update({ paid_amount: newPaid, status }).eq('id', body.invoice_id)
    }
  }
  return NextResponse.json({ payment: data }, { status: 201 })
}
