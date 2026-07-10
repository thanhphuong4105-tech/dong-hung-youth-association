import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    // Confirm session is set before navigating
    if (data.session) {
      navigate('/dashboard', { replace: true })
    } else {
      // Fallback: wait for onAuthStateChange to fire
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          subscription.unsubscribe()
          navigate('/dashboard', { replace: true })
        }
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#FFF7F3' }}>
      {/* Background waves */}
      <svg className="absolute bottom-0 left-0 w-80 h-52 opacity-40 pointer-events-none" viewBox="0 0 320 210" fill="none">
        <path d="M0 210 C40 170, 80 150, 130 160 C180 170, 210 130, 260 140 C290 148, 308 130, 320 125 L320 210 Z" fill="#FBC3B9"/>
      </svg>
      <svg className="absolute bottom-0 right-0 w-80 h-52 opacity-30 pointer-events-none" viewBox="0 0 320 210" fill="none">
        <path d="M0 130 C50 120, 80 155, 130 142 C180 129, 210 158, 260 148 C290 141, 308 155, 320 148 L320 210 L0 210 Z" fill="#EDD0AC"/>
      </svg>

      <div
        className="w-full max-w-md rounded-3xl p-8 relative z-10"
        style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #EDD0AC', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md select-none"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)', fontFamily: "'Nunito', sans-serif" }}
          >
            DH
          </div>
          <h2 className="text-3xl mb-1" style={{ color: '#4F252A' }}>Welcome back</h2>
          <p className="text-sm" style={{ color: '#7A5550' }}>Dong Hung Youth Association</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#4F252A' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #E8C8A8', color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#4F252A' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #E8C8A8', color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
