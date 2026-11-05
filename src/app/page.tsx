'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Stethoscope, Calendar, BedDouble, Pill,
  FlaskConical, Receipt, Bell, Search, Menu, X, Activity, DollarSign,
  UserPlus, Clock, AlertTriangle, ChevronRight, Plus, Phone, Mail,
  Building2, Heart, TrendingUp, CheckCircle2, LogOut
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════

interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  todayAppointments: number
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  activeAdmissions: number
  totalRevenue: string
  pendingPayments: string
  lowStockMedicines: string[]
  expiringMedicines: string[]
  labStats: { requested: number; processing: number; completed: number }
}

interface Patient {
  id: string; patient_code: string; full_name: string; email: string;
  phone: string; gender: string; date_of_birth: string; blood_group: string;
  address: string; emergency_contact: string; emergency_phone: string;
  allergies: string; status: string; created_at: string
}

interface Doctor {
  id: string; doctor_code: string; full_name: string; specialization: string;
  qualifications: string; consultation_fee: number; phone: string;
  is_available: boolean; departments?: { name: string }
}

interface Appointment {
  id: string; patient_id: string; doctor_id: string; appointment_date: string;
  time_slot: string; status: string; reason: string; notes: string
  patients?: { full_name: string; patient_code: string; phone: string }
  doctors?: { full_name: string; specialization: string }
}

interface Bed {
  id: string; bed_number: string; room_number: string; status: string
  wards?: { name: string; type: string }
  patients?: { full_name: string } | null
}

interface Medicine {
  id: string; name: string; generic_name: string; category: string;
  stock_quantity: number; min_stock: number; selling_price: number;
  expiry_date: string; batch_no: string
}

// ═══════════════════════════════════════════════════════════════
//  Main App
// ═══════════════════════════════════════════════════════════════

type Tab = 'dashboard' | 'patients' | 'doctors' | 'appointments' | 'beds' | 'pharmacy' | 'lab' | 'billing'

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('hms_user')
    if (!user) {
      router.push('/login')
    } else {
      setAuthed(true)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('hms_user')
    router.push('/login')
  }

  if (!authed) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar tab={tab} setTab={setTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
      <div className="flex-1 overflow-y-auto">
        <Header setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <main className="p-4 sm:p-6">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'patients' && <Patients />}
          {tab === 'doctors' && <Doctors />}
          {tab === 'appointments' && <Appointments />}
          {tab === 'beds' && <Beds />}
          {tab === 'pharmacy' && <Pharmacy />}
          {tab === 'lab' && <Laboratory />}
          {tab === 'billing' && <Billing />}
        </main>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Sidebar
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'beds', label: 'Beds & Wards', icon: BedDouble },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: Receipt },
]

function Sidebar({ tab, setTab, sidebarOpen, setSidebarOpen, onLogout }: {
  tab: Tab; setTab: (t: Tab) => void; sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void; onLogout: () => void
}) {
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:static z-40 w-64 h-full bg-[var(--card)] border-r border-[var(--border)] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <p className="font-bold text-sm">MediCore</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">HMS</p>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-md shadow-blue-500/20' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--border)]">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Header
// ═══════════════════════════════════════════════════════════════

function Header({ setSidebarOpen, onLogout }: { setSidebarOpen: (v: boolean) => void; onLogout: () => void }) {
  return (
    <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input placeholder="Search patients, doctors..." className="pl-9 pr-4 py-2 text-sm bg-[var(--muted)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-blue-500 transition-colors w-64" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
          <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center text-white text-xs font-bold">A</div>
          <span className="text-sm font-medium hidden sm:block">Admin</span>
        </div>
        <button onClick={onLogout} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Dashboard
// ═══════════════════════════════════════════════════════════════

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setStats(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorBox message={error} />
  if (!stats) return null

  const cards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'bg-green-500', change: '+5%' },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: 'bg-purple-500', change: '+8%' },
    { label: 'Active Admissions', value: stats.activeAdmissions, icon: Activity, color: 'bg-orange-500', change: '+3%' },
    { label: 'Available Beds', value: `${stats.availableBeds}/${stats.totalBeds}`, icon: BedDouble, color: 'bg-teal-500', change: '' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: DollarSign, color: 'bg-indigo-500', change: '+15%' },
    { label: 'Pending Payments', value: `₹${stats.pendingPayments}`, icon: Receipt, color: 'bg-red-500', change: '' },
    { label: 'Lab Tests (Pending)', value: stats.labStats.requested, icon: FlaskConical, color: 'bg-pink-500', change: '' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Hospital overview & statistics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.change && <span className="text-xs font-semibold text-green-500">{card.change}</span>}
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        {stats.lowStockMedicines.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Low Stock Alerts</h3>
            </div>
            <div className="space-y-1">
              {stats.lowStockMedicines.map(m => (
                <p key={m} className="text-sm text-red-600 dark:text-red-400">• {m}</p>
              ))}
            </div>
          </div>
        )}
        {stats.expiringMedicines.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Expiring Soon</h3>
            </div>
            <div className="space-y-1">
              {stats.expiringMedicines.map(m => (
                <p key={m} className="text-sm text-amber-600 dark:text-amber-400">• {m}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bed occupancy */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold mb-4">Bed Occupancy</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--muted-foreground)]">Occupied: {stats.occupiedBeds}</span>
              <span className="text-[var(--muted-foreground)]">Available: {stats.availableBeds}</span>
            </div>
            <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                style={{ width: `${stats.totalBeds > 0 ? (stats.occupiedBeds / stats.totalBeds) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">Occupancy</p>
          </div>
        </div>
      </div>

      {/* Lab stats */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold mb-4">Laboratory Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.labStats.requested}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Requested</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.labStats.processing}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Processing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.labStats.completed}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Patients
// ═══════════════════════════════════════════════════════════════

function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(r => r.json())
      .then(d => { setPatients(d.patients || []) })
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{patients.length} registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, ID, or phone..."
        className="w-full px-4 py-2.5 text-sm bg-[var(--card)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
      />

      {loading ? <LoadingSpinner /> : (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Gender</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Blood</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No patients found</td></tr>
                ) : patients.map(p => (
                  <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs">{p.patient_code}</td>
                    <td className="px-4 py-3 font-medium">{p.full_name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{p.phone || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{p.gender || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{p.blood_group || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <PatientForm onClose={() => { setShowForm(false); load() }} />}
    </div>
  )
}

function PatientForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', gender: 'MALE', date_of_birth: '', blood_group: '', address: '', emergency_contact: '', emergency_phone: '', allergies: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to register')
    else onClose()
    setSaving(false)
  }

  return (
    <Modal title="Register New Patient" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name *" value={form.full_name} onChange={v => setForm({ ...form, full_name: v })} required />
          <Input label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <Input label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
          <Select label="Gender" value={form.gender} onChange={v => setForm({ ...form, gender: v })} options={['MALE', 'FEMALE', 'OTHER']} />
          <Input label="Date of Birth" value={form.date_of_birth} onChange={v => setForm({ ...form, date_of_birth: v })} type="date" />
          <Select label="Blood Group" value={form.blood_group} onChange={v => setForm({ ...form, blood_group: v })} options={['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
          <Input label="Emergency Contact" value={form.emergency_contact} onChange={v => setForm({ ...form, emergency_contact: v })} />
          <Input label="Emergency Phone" value={form.emergency_phone} onChange={v => setForm({ ...form, emergency_phone: v })} />
        </div>
        <Input label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
        <Input label="Allergies" value={form.allergies} onChange={v => setForm({ ...form, allergies: v })} />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Doctors
// ═══════════════════════════════════════════════════════════════

function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/doctors${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(r => r.json())
      .then(d => setDoctors(d.doctors || []))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Doctors</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{doctors.length} doctors</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..." className="w-full px-4 py-2.5 text-sm bg-[var(--card)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]" />
      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(d => (
            <div key={d.id} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold">
                  {d.full_name[0]}
                </div>
                <div>
                  <p className="font-semibold">{d.full_name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{d.specialization || 'General'}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-[var(--muted-foreground)]"><span className="font-mono text-xs">{d.doctor_code}</span></p>
                {d.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {d.phone}</p>}
                <p className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> ₹{d.consultation_fee}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${d.is_available ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {d.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Appointments
// ═══════════════════════════════════════════════════════════════

const APPT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CHECKED_IN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_CONSULTATION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

function Appointments() {
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/appointments${filterDate ? `?date=${filterDate}` : ''}`)
      .then(r => r.json())
      .then(d => setAppts(d.appointments || []))
      .finally(() => setLoading(false))
  }, [filterDate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{appts.length} appointments</p>
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 text-sm bg-[var(--card)] rounded-lg border border-[var(--border)]" />
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No appointments found</td></tr>
                ) : appts.map(a => (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 font-medium">{a.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3">{a.doctors?.full_name || '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{a.appointment_date}</td>
                    <td className="px-4 py-3">{a.time_slot}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs ${APPT_STATUS_COLORS[a.status] || ''}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Beds
// ═══════════════════════════════════════════════════════════════

const BED_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  OCCUPIED: 'bg-red-500',
  RESERVED: 'bg-amber-500',
  MAINTENANCE: 'bg-gray-500',
  CLEANING: 'bg-blue-500',
}

function Beds() {
  const [beds, setBeds] = useState<Bed[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/beds').then(r => r.json()).then(d => setBeds(d.beds || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Beds & Wards</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {Object.entries(BED_STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-sm">{status}</span>
            <span className="text-sm font-bold">{beds.filter(b => b.status === status).length}</span>
          </div>
        ))}
      </div>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
          {beds.map(b => (
            <div key={b.id} className="relative group">
              <div className={`p-3 rounded-lg border-2 ${b.status === 'AVAILABLE' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : b.status === 'OCCUPIED' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-900/20'}`}>
                <BedDouble className="w-5 h-5 mx-auto mb-1 text-[var(--muted-foreground)]" />
                <p className="text-xs font-medium text-center">{b.bed_number}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] text-center">{b.wards?.name || ''}</p>
              </div>
              {b.patients?.full_name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {b.patients.full_name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Pharmacy
// ═══════════════════════════════════════════════════════════════

function Pharmacy() {
  const [meds, setMeds] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/medicines${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(r => r.json())
      .then(d => setMeds(d.medicines || []))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pharmacy</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..." className="w-full px-4 py-2.5 text-sm bg-[var(--card)] rounded-lg border border-[var(--border)]" />
      {loading ? <LoadingSpinner /> : (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {meds.map(m => (
                  <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{m.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${m.stock_quantity <= m.min_stock ? 'text-red-500' : 'text-green-500'}`}>{m.stock_quantity}</span>
                      {m.stock_quantity <= m.min_stock && <span className="ml-1 text-xs text-red-500">⚠ LOW</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">₹{m.selling_price}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{m.expiry_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Laboratory
// ═══════════════════════════════════════════════════════════════

function Laboratory() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/lab-requests').then(r => r.json()).then(d => setRequests(d.requests || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Laboratory</h1>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No lab requests</td></tr>
              ) : requests.map(r => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="px-4 py-3 font-medium">{r.patients?.full_name || '—'}</td>
                  <td className="px-4 py-3">{r.lab_tests?.test_name || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{new Date(r.requested_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Billing
// ═══════════════════════════════════════════════════════════════

function Billing() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(d => setInvoices(d.invoices || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0)
  const pending = invoices.reduce((s, i) => s + (Number(i.net_amount) - Number(i.paid_amount || 0)), 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Billing & Finance</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">Total Revenue</span></div>
          <p className="text-2xl font-bold text-green-500">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-2"><Receipt className="w-4 h-4 text-red-500" /><span className="text-sm font-medium">Pending</span></div>
          <p className="text-2xl font-bold text-red-500">₹{pending.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Amount</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Paid</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No invoices</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_no}</td>
                  <td className="px-4 py-3 font-medium">{inv.patients?.full_name || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">₹{inv.net_amount}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">₹{inv.paid_amount}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${inv.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Shared Components
// ═══════════════════════════════════════════════════════════════

function LoadingSpinner() { return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div> }
function ErrorBox({ message }: { message: string }) { return <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm">{message}</div> }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--muted)] rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="mt-1 w-full px-3 py-2 text-sm bg-[var(--background)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]" />
    </label>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 text-sm bg-[var(--background)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]">
        {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </label>
  )
}
