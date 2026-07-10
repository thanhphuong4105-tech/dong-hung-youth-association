import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #EDD0AC' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl" style={{ color: '#4F252A' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:opacity-70 transition-opacity"
            style={{ color: '#7A5550' }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Shared form field components */
export function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" style={{ color: '#4F252A' }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#E06464' }}>{error}</p>}
    </div>
  )
}

const inputBase = {
  backgroundColor: '#FFF7F3',
  border: '1.5px solid #E8C8A8',
  color: '#4F252A',
  fontFamily: "'Nunito', sans-serif",
  borderRadius: '0.75rem',
  width: '100%',
  padding: '0.625rem 1rem',
  fontSize: '0.875rem',
  outline: 'none',
}

export function Input({ className = '', style = {}, ...props }) {
  return <input className={className} style={{ ...inputBase, ...style }} {...props} />
}

export function Textarea({ className = '', style = {}, ...props }) {
  return <textarea className={className} style={{ ...inputBase, resize: 'vertical', ...style }} {...props} />
}

export function Select({ className = '', style = {}, children, ...props }) {
  return (
    <select className={className} style={{ ...inputBase, ...style }} {...props}>
      {children}
    </select>
  )
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 px-4 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}
    >
      {loading ? 'Saving…' : children}
    </button>
  )
}
