'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (email === 'admin@medicore.com' && password === 'admin123') {
      localStorage.setItem('hms_user', JSON.stringify({ name: 'Administrator', role: 'SUPER_ADMIN', email }))
      router.push('/')
      return
    }

    setError('Invalid credentials. Use admin@medicore.com / admin123')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-green-500 shadow-lg shadow-blue-500/30 mb-4">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MediCore</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Hospital Management System</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[var(--border)] p-8">
          <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@medicore.com" required className="w-full px-4 py-3 text-sm bg-[var(--background)] rounded-xl border-2 border-[var(--border)] focus:outline-none focus:border-blue-500 transition-colors font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full px-4 py-3 pr-12 text-sm bg-[var(--background)] rounded-xl border-2 border-[var(--border)] focus:outline-none focus:border-blue-500 transition-colors font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded accent-blue-600" /><span className="text-[var(--muted-foreground)]">Remember me</span></label>
              <a href="#" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Forgot password?</a>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : <>Sign In</>}</button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Demo Login:</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">admin@medicore.com / admin123</p>
          </div>
        </div>
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">© 2026 MediCore HMS · Secure Healthcare Platform</p>
      </div>
    </div>
  )
}
