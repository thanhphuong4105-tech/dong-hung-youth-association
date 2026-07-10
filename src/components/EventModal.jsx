import { useState, useEffect, useCallback, useRef } from 'react'
import {
  XMarkIcon, PencilIcon, MapPinIcon, CalendarDaysIcon, ClockIcon,
  UserGroupIcon, PlusIcon, DocumentDuplicateIcon, BellAlertIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  orange:      '#F1745E',
  orangeLight: '#FFF7F3',
  orangeMid:   '#FFE0C8',
  sage:        '#F1745E',
  cream:       '#FFF7F3',
  peach:       '#EDD0AC',
  text:        '#4F252A',
  muted:       '#7A5550',
  faint:       '#A08070',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  'Confirmed': { bg: '#FEF0EE', color: '#F1745E', border: '#EDD0AC' },
  'Invited':   { bg: '#FEF0EE', color: '#E06464', border: '#EDD0AC' },
  'Not Asked': { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  'Declined':  { bg: '#FFF7F3', color: '#E06464', border: '#EFCAC8' },
}

// ─── Shared small components ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE['Not Asked']
  return (
    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  )
}

function SummaryItem({ icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0" style={{ color: C.orange }}>{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.muted }}>{label}</p>
        <p className="text-sm font-semibold leading-snug" style={{ color: C.text }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: C.faint }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Custom SVG icons (orange, consistent stroke) ─────────────────────────────
function TodoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M7 9h10M7 12h7M7 15h5"/>
    </svg>
  )
}
function HandsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 00-2-2 2 2 0 00-2 2v0M14 10V4a2 2 0 00-2-2 2 2 0 00-2 2v2M10 10.5V6a2 2 0 00-2-2 2 2 0 00-2 2v8"/>
      <path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15"/>
    </svg>
  )
}
function TeamIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="2.5"/>
      <circle cx="15" cy="7" r="2.5"/>
      <path d="M3 21v-1.5A4.5 4.5 0 017.5 15h3A4.5 4.5 0 0115 19.5V21"/>
      <path d="M16 11.2A4.5 4.5 0 0121 15.5V17"/>
    </svg>
  )
}

// ─── Nav cards config ─────────────────────────────────────────────────────────
const NAV_CARDS = [
  { id: 'todo',      label: 'To-do List',     subtitle: '6 tasks',    Icon: TodoIcon },
  { id: 'volunteer', label: 'Volunteer Roles', subtitle: '12 roles',   Icon: HandsIcon },
  { id: 'dance',     label: 'Dance Team',      subtitle: 'participants', Icon: TeamIcon },
]

// ─── Date helpers ─────────────────────────────────────────────────────────────
function parseDateInfo(dateStr) {
  if (!dateStr) return null
  try {
    // Extract components directly from the stored string — no timezone conversion
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    if (isNaN(localDate.getTime())) return null

    let timeStr = null
    if (timePart) {
      const [h, m] = timePart.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      timeStr = `${h12}:${String(m).padStart(2, '0')} ${ampm}`
    }

    return {
      date:      format(localDate, 'MMM d, yyyy'),
      dayOfWeek: format(localDate, '(EEEE)'),
      time:      timeStr || '—',
    }
  } catch {
    return null
  }
}

// ─── Tab sections ─────────────────────────────────────────────────────────────
// ─── Shared inline helpers ────────────────────────────────────────────────────
function ClockSvg({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  )
}

function DanceEmptyState({ icon, label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: C.orangeLight, color: C.orange }}>{icon}</div>
      <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{label}</p>
      <p className="text-xs" style={{ color: C.faint }}>{sub}</p>
    </div>
  )
}

// Reusable three-dots menu for dance tabs
function DanceRowMenu({ onEdit, onRemove }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!open) return
    const h = () => setOpen(false)
    window.addEventListener('click', h)
    return () => window.removeEventListener('click', h)
  }, [open])
  return (
    <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50"
        style={{ color: C.faint }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>
      {open && !confirming && (
        <div className="absolute right-0 top-8 z-20 rounded-2xl overflow-hidden min-w-[130px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${C.peach}` }}>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-orange-50"
            style={{ color: C.text }}>
            <PencilIcon className="w-4 h-4" style={{ color: C.orange }} /> Edit
          </button>
          <div style={{ borderTop: `1px solid ${C.peach}` }} />
          <button onClick={() => setConfirming(true)}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-red-50"
            style={{ color: '#E06464' }}>
            <XMarkIcon className="w-4 h-4" /> Remove
          </button>
        </div>
      )}
      {confirming && (
        <div className="absolute right-0 top-8 z-20 rounded-2xl p-4 min-w-[175px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EFCAC8' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: C.text }}>Remove this entry?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl border"
              style={{ borderColor: C.peach, color: C.muted }}>Cancel</button>
            <button onClick={() => { setConfirming(false); setOpen(false); onRemove() }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: '#E06464' }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Shared simple form modal wrapper
function DanceFormModal({ title, onClose, onSubmit, saving, err, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1.5px solid ${C.peach}` }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.peach }}>
          <h3 className="text-lg font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          {err && (
            <div className="px-4 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>{err}</div>
          )}
          {children}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
              style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: `1.5px solid #EDD0AC`, backgroundColor: '#FFF7F3',
  color: '#4F252A', fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none',
}

// ─── Participant picker (from Dance Team roster) ──────────────────────────────
function ParticipantPickerModal({ eventId, existingNames, onClose, onSaved }) {
  const [roster, setRoster]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('dance_team_participants')
        .select('id, name, birthday, age, height, weight, clothing_size')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name')
      setRoster(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const already = new Set(existingNames.map(n => n.toLowerCase()))
  const filtered = roster.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    setSaving(true)
    const toInsert = roster
      .filter(p => selected.has(p.id))
      .map(p => ({
        event_id:      eventId,
        name:          p.name,
        height:        p.height        || null,
        weight:        p.weight        || null,
        clothing_size: p.clothing_size || null,
        status:        'confirmed',
      }))
    await supabase.from('dance_participants').insert(toInsert)
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', border: `1.5px solid ${C.peach}`, maxHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.peach}` }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>Add Participants</h3>
            <p className="text-xs mt-0.5" style={{ color: C.faint }}>Select from the Dance Team roster</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{ width: '100%', padding: '0.5rem 0.875rem', borderRadius: '0.75rem', border: `1.5px solid ${C.peach}`, backgroundColor: '#FFF7F3', color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: C.peach, borderTopColor: C.orange }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: C.faint }}>
              No participants in the Dance Team roster yet.
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map(p => {
                const isAdded = already.has(p.name.toLowerCase())
                const checked = selected.has(p.id)
                const initials = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <button key={p.id} onClick={() => !isAdded && toggle(p.id)}
                    disabled={isAdded}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left"
                    style={{
                      backgroundColor: isAdded ? '#F5F5F5' : checked ? C.orangeLight : 'transparent',
                      border: `1.5px solid ${isAdded ? '#E5E5E5' : checked ? C.orange : 'transparent'}`,
                      opacity: isAdded ? 0.6 : 1,
                      cursor: isAdded ? 'default' : 'pointer',
                    }}>
                    {/* Checkbox */}
                    <div className="w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: isAdded ? '#CCC' : checked ? C.orange : C.peach, backgroundColor: isAdded ? '#E0E0E0' : checked ? C.orange : '#fff' }}>
                      {isAdded
                        ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                    </div>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: isAdded ? 'linear-gradient(135deg, #CCC, #AAA)' : 'linear-gradient(135deg, #F1745E, #E06464)' }}>{initials}</div>
                    {/* Name + age */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm" style={{ color: isAdded ? '#999' : C.text }}>{p.name}</p>
                      {p.age && <p className="text-xs" style={{ color: C.faint }}>Age {p.age}</p>}
                    </div>
                    {isAdded && <span className="text-xs shrink-0" style={{ color: '#AAA' }}>Already added</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0 flex gap-3" style={{ borderTop: `1px solid ${C.peach}` }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
            style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>Cancel</button>
          <button onClick={handleAdd} disabled={selected.size === 0 || saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            {saving ? 'Adding…' : `Add ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Participants Tab ─────────────────────────────────────────────────────────
const PARTICIPANT_STATUS = {
  confirmed: { label: 'Confirmed', bg: '#FEF0EE', color: '#F1745E', border: '#EDD0AC' },
  pending:   { label: 'Pending',   bg: '#FEF0EE', color: '#E06464', border: '#EDD0AC' },
  declined:  { label: 'Declined',  bg: '#FFF7F3', color: '#E06464', border: '#EFCAC8' },
}

function ParticipantModal({ eventId, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:   editing?.name   ?? '',
    role:   editing?.role   ?? '',
    height:        editing?.height        ?? '',
    weight:        editing?.weight        ?? '',
    clothing_size: editing?.clothing_size ?? '',
    status:        editing?.status        ?? 'confirmed',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  async function handleSave(e) {
    e.preventDefault(); setErr('')
    if (!form.name.trim()) return setErr('Name is required.')
    setSaving(true)
    const payload = {
      name:   form.name.trim(),
      role:   form.role.trim()   || null,
      height:        form.height.trim()        || null,
      weight:        form.weight.trim()        || null,
      clothing_size: form.clothing_size.trim() || null,
      status:        form.status,
    }
    const { error } = editing
      ? await supabase.from('dance_participants').update(payload).eq('id', editing.id)
      : await supabase.from('dance_participants').insert([{ ...payload, event_id: eventId }])
    setSaving(false)
    if (error) return setErr(error.message)
    onSaved(); onClose()
  }
  return (
    <DanceFormModal title={editing ? 'Edit Participant' : 'Add Participant'} onClose={onClose} onSubmit={handleSave} saving={saving} err={err}>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Name *</label>
        <input name="name" value={form.name} onChange={hc} placeholder="Full name" required style={inputStyle} /></div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Role</label>
        <input name="role" value={form.role} onChange={hc} placeholder="e.g. Lead dancer, Support" style={inputStyle} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Height</label>
          <input name="height" value={form.height} onChange={hc} placeholder="5'4&quot;" style={inputStyle} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Weight</label>
          <input name="weight" value={form.weight} onChange={hc} placeholder="120 lbs" style={inputStyle} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Size</label>
          <input name="clothing_size" value={form.clothing_size} onChange={hc} placeholder="S / M / L" style={inputStyle} /></div>
      </div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Status</label>
        <select name="status" value={form.status} onChange={hc} style={inputStyle}>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </select></div>
    </DanceFormModal>
  )
}

function ParticipantsTab({ eventId, onCountChange }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const dragIndex = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const [epRes, rosterRes] = await Promise.all([
      supabase.from('dance_participants').select('*').eq('event_id', eventId),
      supabase.from('dance_team_participants').select('name, birthday, age, height, weight, clothing_size'),
    ])
    const roster = rosterRes.data || []
    const rosterMap = {}
    roster.forEach(p => { rosterMap[p.name?.toLowerCase()] = p })

    function calcAge(birthday) {
      if (!birthday) return null
      const today = new Date()
      const dob = new Date(birthday + 'T00:00:00')
      let age = today.getFullYear() - dob.getFullYear()
      const m = today.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
      return age >= 0 ? age : null
    }

    // Merge live data from dance_team_participants by name
    const merged = (epRes.data || []).map(p => {
      const live = rosterMap[p.name?.toLowerCase()] || {}
      return {
        ...p,
        birthday:      live.birthday      ?? null,
        age:           live.age           ?? null,
        height:        live.height        ?? p.height        ?? null,
        weight:        live.weight        ?? p.weight        ?? null,
        clothing_size: live.clothing_size ?? p.clothing_size ?? null,
      }
    })

    const r = merged.slice().sort((a, b) => {
      const ageA = calcAge(a.birthday) ?? parseFloat(a.age) ?? Infinity
      const ageB = calcAge(b.birthday) ?? parseFloat(b.age) ?? Infinity
      return ageA - ageB
    })
    setRows(r); onCountChange(r.length); setLoading(false)
  }, [eventId, onCountChange])

  useEffect(() => { fetch() }, [fetch])

  async function remove(id) {
    await supabase.from('dance_participants').delete().eq('id', id); fetch()
  }

  function onDragStart(i) {
    dragIndex.current = i
  }

  function onDragOver(e, i) {
    e.preventDefault()
    setDragOver(i)
  }

  async function onDrop(i) {
    const from = dragIndex.current
    if (from === null || from === i) { setDragOver(null); return }
    const reordered = [...rows]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(i, 0, moved)
    setRows(reordered)
    setDragOver(null)
    dragIndex.current = null
    // Persist new order
    await Promise.all(
      reordered.map((row, idx) =>
        supabase.from('dance_participants').update({ sort_order: idx + 1 }).eq('id', row.id)
      )
    )
  }

  function onDragEnd() {
    dragIndex.current = null
    setDragOver(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold" style={{ color: C.text }}>Participants</span>
        <button onClick={() => setModal('picker')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          <PlusIcon className="w-3.5 h-3.5" /> Add Participant
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: C.peach, borderTopColor: C.orange }} />
        </div>
      ) : rows.length === 0 ? (
        <DanceEmptyState icon={<TeamIcon size={28} />} label="No participants yet" sub='Click "Add Participant" to get started.' />
      ) : (
        <div className="rounded-2xl" style={{ border: `1.5px solid ${C.peach}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1px solid ${C.peach}` }}>
                {['No.', 'Name', 'Age', 'Height', 'Weight', 'Size', ''].map((h, i) => (
                  <th key={i}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: C.muted, width: i === 0 ? '3rem' : i === 2 ? '3.5rem' : 'auto' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const age = (() => {
                  if (row.birthday) {
                    const today = new Date(), dob = new Date(row.birthday + 'T00:00:00')
                    let a = today.getFullYear() - dob.getFullYear()
                    const m = today.getMonth() - dob.getMonth()
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--
                    return a >= 0 ? a : null
                  }
                  return row.age ?? null
                })()
                return (
                  <tr key={row.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderBottom: i < rows.length - 1 ? `1px solid ${C.peach}` : 'none',
                    }}>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: C.faint }}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                          {row.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: C.text }}>{row.name}</p>
                          {row.role && <p className="text-xs" style={{ color: C.faint }}>{row.role}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: C.muted }}>{age != null ? age : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.height || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.weight || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.clothing_size || '—'}</td>
                    <td className="px-4 py-3">
                      <DanceRowMenu onEdit={() => setModal(row)} onRemove={() => remove(row.id)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'picker' && (
        <ParticipantPickerModal eventId={eventId} existingNames={rows.map(r => r.name)}
          onClose={() => setModal(null)} onSaved={fetch} />
      )}
      {modal && modal !== 'picker' && (
        <ParticipantModal eventId={eventId} editing={modal}
          onClose={() => setModal(null)} onSaved={fetch} />
      )}
    </>
  )
}

// ─── Practice Schedule Tab ────────────────────────────────────────────────────
function PracticeModal({ eventId, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    practice_date: editing?.practice_date ? editing.practice_date.slice(0, 10) : '',
    start_time:    editing?.start_time    ?? editing?.practice_time ?? '',
    end_time:      editing?.end_time      ?? '',
    location:      editing?.location      ?? '',
    notes:         editing?.notes         ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  async function handleSave(e) {
    e.preventDefault(); setErr('')
    if (!form.practice_date) return setErr('Date is required.')
    setSaving(true)
    const payload = { practice_date: form.practice_date, practice_time: form.start_time || null, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location.trim() || null, notes: form.notes.trim() || null }
    const { error } = editing
      ? await supabase.from('dance_practices').update(payload).eq('id', editing.id)
      : await supabase.from('dance_practices').insert([{ ...payload, event_id: eventId }])
    setSaving(false)
    if (error) return setErr(error.message)
    onSaved(); onClose()
  }
  return (
    <DanceFormModal title={editing ? 'Edit Practice' : 'Add Practice'} onClose={onClose} onSubmit={handleSave} saving={saving} err={err}>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Date *</label>
        <input type="date" name="practice_date" value={form.practice_date} onChange={hc} required style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Start Time</label>
          <input type="time" name="start_time" value={form.start_time} onChange={hc} style={inputStyle} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>End Time</label>
          <input type="time" name="end_time" value={form.end_time} onChange={hc} style={inputStyle} /></div>
      </div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Location</label>
        <input name="location" value={form.location} onChange={hc} placeholder="e.g. Dong Hung Temple" style={inputStyle} /></div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={hc} rows={2} placeholder="Any extra notes…"
          style={{ ...inputStyle, resize: 'vertical' }} /></div>
    </DanceFormModal>
  )
}

function PracticeScheduleTab({ eventId, onNextPractice }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('dance_practices').select('*').eq('event_id', eventId).order('practice_date')
    const r = data || []; setRows(r)
    const today = new Date().toISOString().slice(0, 10)
    const next = r.find(p => p.practice_date >= today)
    onNextPractice(next || null)
    setLoading(false)
  }, [eventId, onNextPractice])

  useEffect(() => { fetch() }, [fetch])

  async function remove(id) {
    await supabase.from('dance_practices').delete().eq('id', id); fetch()
  }

  async function toggleReminder(row) {
    await supabase.from('dance_practices').update({ reminder_sent: !row.reminder_sent }).eq('id', row.id); fetch()
  }

  function fmtDate(d) {
    try {
      const [year, month, day] = d.slice(0, 10).split('-').map(Number)
      return format(new Date(year, month - 1, day), 'EEE, MMM d, yyyy')
    } catch { return d }
  }
  function fmtTime(t) {
    if (!t) return null
    try { const [h, m] = t.split(':'); const d = new Date(); d.setHours(+h, +m); return format(d, 'h:mm a') } catch { return t }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold" style={{ color: C.text }}>Practice Schedule</span>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          <PlusIcon className="w-3.5 h-3.5" /> Add Practice
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: C.peach, borderTopColor: C.orange }} /></div>
      ) : rows.length === 0 ? (
        <DanceEmptyState icon={<CalendarDaysIcon className="w-7 h-7" />} label="No practices scheduled" sub='Click "Add Practice" to schedule one.' />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map(row => (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: '#fff', border: `1.5px solid ${C.peach}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.orangeLight, color: C.orange }}>
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{fmtDate(row.practice_date)}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {(row.start_time || row.practice_time) && <span className="text-xs" style={{ color: C.faint }}>🕐 {fmtTime(row.start_time || row.practice_time)}{row.end_time ? ` – ${fmtTime(row.end_time)}` : ''}</span>}
                  {row.location     && <span className="text-xs" style={{ color: C.faint }}>📍 {row.location}</span>}
                  {row.notes        && <span className="text-xs" style={{ color: C.faint }}>📝 {row.notes}</span>}
                </div>
              </div>
              <button onClick={() => toggleReminder(row)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors"
                style={row.reminder_sent
                  ? { backgroundColor: '#FEF0EE', color: '#F1745E', border: '1px solid #EDD0AC' }
                  : { backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #EDD0AC' }}>
                {row.reminder_sent ? 'Sent' : 'Not sent'}
              </button>
              <DanceRowMenu onEdit={() => setModal(row)} onRemove={() => remove(row.id)} />
            </div>
          ))}
        </div>
      )}
      {modal && (
        <PracticeModal eventId={eventId} editing={modal === 'add' ? null : modal}
          onClose={() => setModal(null)} onSaved={fetch} />
      )}
    </>
  )
}

// ─── Parents Tab ──────────────────────────────────────────────────────────────
const PARENT_STATUS = {
  confirmed: { label: 'Confirmed', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  invited:   { label: 'Invited',   bg: '#FEF0EE', color: '#E06464', border: '#EDD0AC' },
  not_asked: { label: 'Not Asked', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
  declined:  { label: 'Declined',  bg: '#FFF7F3', color: '#E06464', border: '#EFCAC8' },
}

// ─── localStorage helpers for dance parents ───────────────────────────────────
function getDanceParentsStore() {
  try { return JSON.parse(localStorage.getItem('dhya_dance_parents') || '{}') } catch { return {} }
}
function saveDanceParentsStore(data) {
  localStorage.setItem('dhya_dance_parents', JSON.stringify(data))
}

function ParentModal({ eventId, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    parent_name:    editing?.parent_name    ?? '',
    phone_number:   editing?.phone_number   ?? '',
    children_names: editing?.children_names?.join(', ') ?? '',
    status:         editing?.status         ?? 'not_asked',
    notes:          editing?.notes          ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Autocomplete from dance_team_parents (Supabase)
  const [danceParents, setDanceParents] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    supabase.from('dance_team_parents').select('parent_name, phone, children_names').order('parent_name')
      .then(({ data }) => setDanceParents(data || []))
      .catch(() => {})
  }, [])

  function handleParentNameChange(e) {
    const val = e.target.value
    setForm(f => ({ ...f, parent_name: val }))
    const q = val.trim().toLowerCase()
    const matches = q ? danceParents.filter(p => p.parent_name.toLowerCase().includes(q)) : danceParents
    setSuggestions(matches)
    setShowSuggestions(danceParents.length > 0)
  }

  function applyParent(p) {
    const children = (p.children_names || []).join(', ')
    setForm(f => ({ ...f, parent_name: p.parent_name, phone_number: p.phone || f.phone_number, children_names: children }))
    setSuggestions([])
    setShowSuggestions(false)
  }

  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  function handleSave(e) {
    e.preventDefault(); setErr('')
    if (!form.parent_name.trim()) return setErr('Parent name is required.')
    setSaving(true)
    const children = form.children_names.split(',').map(s => s.trim()).filter(Boolean)
    const store = getDanceParentsStore()
    const list = store[eventId] || []
    if (editing) {
      const idx = list.findIndex(r => r.id === editing.id)
      if (idx >= 0) list[idx] = { ...list[idx], parent_name: form.parent_name.trim(), phone_number: form.phone_number.trim() || null, children_names: children.length ? children : null, status: form.status, notes: form.notes.trim() || null }
    } else {
      list.push({ id: crypto.randomUUID(), parent_name: form.parent_name.trim(), phone_number: form.phone_number.trim() || null, children_names: children.length ? children : null, status: form.status, notes: form.notes.trim() || null, sort_order: list.length })
    }
    store[eventId] = list
    saveDanceParentsStore(store)
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <DanceFormModal title={editing ? 'Edit Parent' : 'Add Parent'} onClose={onClose} onSubmit={handleSave} saving={saving} err={err}>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Parent Name *</label>
        <div className="relative">
          <input
            name="parent_name"
            value={form.parent_name}
            onChange={handleParentNameChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => {
              const q = form.parent_name.trim().toLowerCase()
              const matches = q ? danceParents.filter(p => p.parent_name.toLowerCase().includes(q)) : danceParents
              setSuggestions(matches)
              setShowSuggestions(danceParents.length > 0)
            }}
            placeholder="Select or type a parent name…"
            required
            autoComplete="off"
            style={{ ...inputStyle, paddingRight: '2.5rem' }}
          />
          <button type="button" tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); setShowSuggestions(s => !s); if (!showSuggestions) setSuggestions(danceParents) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ color: C.muted }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showSuggestions && (
            <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg"
              style={{ border: `1.5px solid ${C.peach}`, backgroundColor: '#fff', maxHeight: 220, overflowY: 'auto' }}>
              {suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm" style={{ color: C.faint }}>No parents found. You can still type a name manually.</p>
              ) : suggestions.map((p, i) => (
                <div key={i}
                  onMouseDown={() => applyParent(p)}
                  className="px-4 py-2.5 cursor-pointer hover:bg-orange-50 transition-colors"
                  style={{ borderBottom: i < suggestions.length - 1 ? `1px solid ${C.peach}` : 'none' }}>
                  <p className="text-sm font-semibold" style={{ color: C.text }}>{p.parent_name}</p>
                  {p.children_names?.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: C.faint }}>👶 {p.children_names.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Phone Number</label>
        <input name="phone_number" value={form.phone_number} onChange={hc} placeholder="(757) 123-4567" style={inputStyle} /></div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Children Names <span style={{ color: C.faint, fontWeight: 400 }}>(comma separated)</span></label>
        <input name="children_names" value={form.children_names} onChange={hc} placeholder="Linh Nguyen, Bao Nguyen" style={inputStyle} /></div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Status</label>
        <select name="status" value={form.status} onChange={hc} style={inputStyle}>
          <option value="not_asked">Not Asked</option>
          <option value="invited">Invited</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
        </select></div>
      <div><label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={hc} rows={2} placeholder="Any notes…" style={{ ...inputStyle, resize: 'vertical' }} /></div>
    </DanceFormModal>
  )
}

function ParentsTab({ eventId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [copied, setCopied] = useState(null)
  const dragIndex = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const store = getDanceParentsStore()
    const list = (store[eventId] || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    setRows(list)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetch() }, [fetch])

  function remove(id) {
    const store = getDanceParentsStore()
    store[eventId] = (store[eventId] || []).filter(r => r.id !== id)
    saveDanceParentsStore(store)
    fetch()
  }

  function onDragStart(i) { dragIndex.current = i }
  function onDragOver(e, i) { e.preventDefault(); setDragOver(i) }
  function onDrop(i) {
    const from = dragIndex.current
    if (from === null || from === i) { setDragOver(null); return }
    const reordered = [...rows]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(i, 0, moved)
    setRows(reordered)
    setDragOver(null)
    dragIndex.current = null
    const store = getDanceParentsStore()
    store[eventId] = reordered.map((r, idx) => ({ ...r, sort_order: idx }))
    saveDanceParentsStore(store)
  }
  function onDragEnd() { dragIndex.current = null; setDragOver(null) }

  function inviteText(row) {
    const children = row.children_names?.join(', ') || 'your child'
    return `Hi ${row.parent_name}, we'd like to invite ${children} to participate in the Dance Team for our upcoming event. Please reply to confirm. Thank you! — Dong Hung Youth Association`
  }

  function copyAll() {
    const text = rows.filter(r => r.status !== 'confirmed').map(inviteText).join('\n\n—\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied('all'); setTimeout(() => setCopied(null), 2000)
  }

  function copyOne(row) {
    navigator.clipboard.writeText(inviteText(row)).catch(() => {})
    setCopied(row.id); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold" style={{ color: C.text }}>Parents</span>
        <div className="flex items-center gap-2">
          <button onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors"
            style={{ borderColor: C.peach, color: copied === 'all' ? C.sage : C.muted, backgroundColor: C.cream }}>
            <DocumentDuplicateIcon className="w-3.5 h-3.5" />
            {copied === 'all' ? 'Copied!' : 'Generate Invite Text'}
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            <PlusIcon className="w-3.5 h-3.5" /> Add Parent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: C.peach, borderTopColor: C.orange }} /></div>
      ) : rows.length === 0 ? (
        <DanceEmptyState icon={<UserGroupIcon className="w-7 h-7" />} label="No parents added yet" sub='Click "Add Parent" to track participation.' />
      ) : (
        <div className="rounded-2xl" style={{ border: `1.5px solid ${C.peach}` }}>
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1px solid ${C.peach}` }}>
                {['', 'No.', 'Name', 'Phone', 'Children', 'Status', ''].map((h, i) => (
                  <th key={i}
                    className="text-left px-2 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: C.muted, width: i === 0 ? '1.5rem' : i === 1 ? '2rem' : i === 2 ? '120px' : i === 3 ? '100px' : i === 4 ? '110px' : i === 5 ? '72px' : '44px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const sc = PARENT_STATUS[row.status] || PARENT_STATUS.not_asked
                return (
                  <tr key={row.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={() => onDrop(i)}
                    onDragEnd={onDragEnd}
                    style={{
                      backgroundColor: dragOver === i ? C.orangeLight : '#ffffff',
                      borderBottom: i < rows.length - 1 ? `1px solid ${C.peach}` : 'none',
                      opacity: dragIndex.current === i ? 0.4 : 1,
                      transition: 'background-color 0.15s',
                    }}>
                    <td className="pl-2 pr-0 py-2.5" style={{ cursor: 'grab', color: C.faint }}>
                      <svg width="10" height="14" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
                        <circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/>
                        <circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/>
                      </svg>
                    </td>
                    <td className="px-2 py-2.5 text-xs font-medium" style={{ color: C.faint }}>{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                          style={{ fontSize: 9, background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                          {row.parent_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <p className="font-semibold truncate text-xs" style={{ color: C.text }}>{row.parent_name}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-xs whitespace-nowrap" style={{ color: C.muted }}>{row.phone_number || '—'}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: C.muted }}>
                      {row.children_names?.length
                        ? row.children_names.map((n, ci) => <div key={ci} className="truncate">{n}</div>)
                        : '—'}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                    </td>
                    <td className="px-1 py-2.5">
                      <div className="flex items-center">
                        <button onClick={() => copyOne(row)}
                          className="p-1 rounded-lg hover:bg-orange-50 transition-colors"
                          title="Copy invite text"
                          style={{ color: copied === row.id ? C.sage : C.faint }}>
                          <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                        </button>
                        <DanceRowMenu onEdit={() => setModal(row)} onRemove={() => remove(row.id)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <ParentModal eventId={eventId} editing={modal === 'add' ? null : modal}
          onClose={() => setModal(null)} onSaved={fetch} />
      )}
    </>
  )
}

// ─── Dance Team Section (real data) ──────────────────────────────────────────
function DanceTeamSection({ eventId, onCountChange }) {
  const [activeTab, setActiveTab] = useState('participants')
  const [participantCount, setParticipantCount] = useState(null)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [pendingParents, setPendingParents] = useState(0)
  const [totalPractices, setTotalPractices] = useState(0)
  const [nextPractice, setNextPractice] = useState(null)
  const [hasPractices, setHasPractices] = useState(false)

  const handleParticipantCount = useCallback(n => {
    setParticipantCount(n); onCountChange(n)
  }, [onCountChange])

  // Fetch confirmed count separately for the stat card
  useEffect(() => {
    supabase.from('dance_participants').select('id, status').eq('event_id', eventId)
      .then(({ data }) => {
        const rows = data || []
        setConfirmedCount(rows.filter(r => r.status === 'confirmed').length)
      })
    const parentRows = getDanceParentsStore()[eventId] || []
    setPendingParents(parentRows.filter(r => r.status === 'invited').length)
    supabase.from('dance_practices').select('id, practice_date, reminder_sent').eq('event_id', eventId).order('practice_date')
      .then(({ data }) => {
        const rows = data || []
        setTotalPractices(rows.length)
        setHasPractices(rows.length > 0)
        const today = new Date().toISOString().slice(0, 10)
        setNextPractice(rows.find(p => p.practice_date >= today) || null)
      })
  }, [eventId, activeTab])

  const TABS = [
    { id: 'participants', label: 'Participants' },
    { id: 'schedule',     label: 'Practice Schedule' },
    { id: 'parents',      label: 'Parents' },
  ]

  function fmtNextPractice(p) {
    if (!p) return '—'
    try {
      const [year, month, day] = p.practice_date.slice(0, 10).split('-').map(Number)
      return format(new Date(year, month - 1, day), 'EEE, MMM d, yyyy')
    } catch { return p.practice_date }
  }

  const allSent = hasPractices && nextPractice?.reminder_sent
  const overviewCards = [
    { label: 'Confirmed Participants', value: confirmedCount.toString(),    sub: null, badge: null, Icon: TeamIcon, valueSize: '1rem' },
    { label: 'Total Practices',        value: totalPractices.toString(),    sub: null, badge: null, Icon: () => <ClockSvg size={20} />, valueSize: '1rem' },
    { label: 'Next Practice',          value: fmtNextPractice(nextPractice), sub: null, badge: null, Icon: () => <CalendarDaysIcon className="w-5 h-5" />, valueSize: '1rem' },
    { label: 'Reminder Status',        value: null, sub: null,
      badge: hasPractices ? (allSent ? 'Sent' : 'Not sent yet') : 'No practices',
      badgeStyle: allSent
        ? { backgroundColor: '#FEF0EE', color: '#F1745E', border: '1px solid #EDD0AC' }
        : { backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #EDD0AC' },
      Icon: () => <BellAlertIcon className="w-5 h-5" /> },
  ]

  return (
    <div>
      <h3 className="text-base font-bold mb-4" style={{ color: C.orange, fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem' }}>
        Dance Team Overview
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {overviewCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-4"
            style={{ backgroundColor: '#ffffff', border: `1px solid ${C.peach}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="mb-2" style={{ color: C.orange }}><card.Icon size={20} /></div>
            <p className="text-xs font-medium mb-1.5 leading-tight whitespace-nowrap" style={{ color: C.muted }}>{card.label}</p>
            {card.value !== null && (
              <p className="font-bold leading-tight" style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: card.valueSize || '1.4rem' }}>
                {card.value}
              </p>
            )}
            {card.badge && (
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1"
                style={card.badgeStyle || { backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #EDD0AC' }}>
                {card.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex border-b mb-5 gap-1" style={{ borderColor: C.peach }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === tab.id ? C.orange : C.muted,
              borderBottom: `2px solid ${activeTab === tab.id ? C.orange : 'transparent'}`,
              marginBottom: '-1px',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'participants' && <ParticipantsTab eventId={eventId} onCountChange={handleParticipantCount} />}
      {activeTab === 'schedule'     && <PracticeScheduleTab eventId={eventId} onNextPractice={setNextPractice} />}
      {activeTab === 'parents'      && <ParentsTab eventId={eventId} />}
    </div>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:     { label: 'Pending',     bg: '#FEF0EE', color: '#E06464', border: '#EDD0AC' },
  in_progress: { label: 'In Progress', bg: '#EEF0FA', color: '#5A6FB5', border: '#D0D5F0' },
  done:        { label: 'Done',        bg: '#FEF0EE', color: '#F1745E', border: '#EDD0AC' },
}
const STATUS_CYCLE = { pending: 'in_progress', in_progress: 'done', done: 'pending' }

function fmtDue(dateStr) {
  if (!dateStr) return null
  try {
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
    const d = new Date(year, month - 1, day)
    if (isNaN(d.getTime())) return null
    return 'Due by ' + d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return null }
}

// ─── Add Task to Event popup ──────────────────────────────────────────────────
const INIT_TASK_LIBRARY = [
  { id: 't-001', title: 'Remind parents of dance team and thỉnh sư', description: 'Send reminder to parents and coordinate with thỉnh sư for event preparation.', category: 'Communication', createdAt: '2026-01-10' },
  { id: 't-002', title: 'Set up livestream', description: 'Prepare equipment, test connection, and set up livestream platform.', category: 'Media', createdAt: '2026-01-09' },
  { id: 't-003', title: 'Prepare coolers and have them ready at the tent', description: 'Fill coolers with ice and drinks, and transport them to the event tent.', category: 'Food & Supplies', createdAt: '2026-01-08' },
  { id: 't-004', title: 'Prepare registration table', description: 'Set up sign-in sheet, pens, name tags, and registration supplies.', category: 'Event Setup', createdAt: '2026-01-08' },
  { id: 't-005', title: 'Prepare DHYA tent', description: 'Set up tent, tables, chairs, banners, and decorations before the event starts.', category: 'Event Setup', createdAt: '2026-01-07' },
  { id: 't-006', title: 'Create dance moves', description: 'Choreograph and practice dance performance for the event.', category: 'Dance Team', createdAt: '2026-01-07' },
  { id: 't-007', title: 'Prepare event flyer', description: 'Design flyer and share it on social media and community channels.', category: 'Communication', createdAt: '2026-01-06' },
  { id: 't-008', title: 'Prepare flags, gong, incense tray, flowers', description: 'Gather all ceremonial items and ensure they are clean and ready.', category: 'Ceremony', createdAt: '2026-01-06' },
  { id: 't-009', title: 'Bring waffle makers', description: 'Prepare waffle makers and ingredients for the food booth.', category: 'Food & Supplies', createdAt: '2026-01-05' },
  { id: 't-010', title: 'Check dance team outfits', description: 'Make sure all dancers have the correct outfits and accessories.', category: 'Dance Team', createdAt: '2026-01-05' },
  { id: 't-011', title: 'Post-event cleanup', description: 'Break down tables, chairs, tents, and dispose of trash properly.', category: 'Cleanup', createdAt: '2026-01-04' },
  { id: 't-012', title: 'Edit and upload event photos', description: 'Collect photos from photographers, edit, and upload to the group page.', category: 'Media', createdAt: '2026-01-04' },
]
function getTaskLibrary() {
  try {
    const s = localStorage.getItem('dhya_task_library')
    if (s) return JSON.parse(s)
    localStorage.setItem('dhya_task_library', JSON.stringify(INIT_TASK_LIBRARY))
    return INIT_TASK_LIBRARY
  } catch { return INIT_TASK_LIBRARY }
}
const INIT_ROLE_LIBRARY = [
  { id: 'r-001', name: 'MC', description: 'Host and guide the event program, introduce performers and speakers.', category: 'Leadership', createdAt: '2026-01-10' },
  { id: 'r-002', name: 'Registration', description: 'Check in attendees, hand out name tags, manage sign-in sheet.', category: 'Registration', createdAt: '2026-01-09' },
  { id: 'r-003', name: 'Food Table', description: 'Set up, manage, and clean up the food and drinks table.', category: 'Food & Supplies', createdAt: '2026-01-08' },
  { id: 'r-004', name: 'Photographer', description: 'Take photos and short videos throughout the event.', category: 'Media', createdAt: '2026-01-07' },
  { id: 'r-005', name: 'Sound System', description: 'Operate microphones, speakers, and audio equipment during the event.', category: 'Logistics', createdAt: '2026-01-07' },
  { id: 'r-006', name: 'Parking', description: 'Direct cars and assist with parking management outside the venue.', category: 'Logistics', createdAt: '2026-01-06' },
  { id: 'r-007', name: 'Decoration Setup', description: 'Set up banners, flowers, lanterns, and other decorative items.', category: 'Event Setup', createdAt: '2026-01-05' },
  { id: 'r-008', name: 'Cleanup Crew', description: 'Manage post-event cleanup, trash removal, and venue reset.', category: 'Cleanup', createdAt: '2026-01-04' },
]
function getRoleLibrary() {
  try {
    const s = localStorage.getItem('dhya_role_library')
    if (s) return JSON.parse(s)
    localStorage.setItem('dhya_role_library', JSON.stringify(INIT_ROLE_LIBRARY))
    return INIT_ROLE_LIBRARY
  } catch { return INIT_ROLE_LIBRARY }
}

function AddTaskPopup({ eventId, onClose, onAdded }) {
  const [available, setAvailable] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const library = getTaskLibrary()
        const { data: existing } = await supabase.from('event_tasks').select('task_id').eq('event_id', eventId)
        const linkedIds = new Set((existing || []).map(r => r.task_id))
        const sorted = [...library].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        setAvailable(sorted.filter(t => !linkedIds.has(t.id)))
      } catch { setAvailable([]) }
      setLoadingTasks(false)
    }
    load()
  }, [eventId])

  const filtered = available.filter(t =>
    (t.title || '').toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    setSaving(true)
    const library = getTaskLibrary()
    const rows = [...selected].map((taskId, i) => {
      const t = library.find(x => x.id === taskId)
      return { event_id: eventId, task_id: taskId, task_title: t?.title || '', status: 'pending', assigned_members: [], sort_order: i }
    })
    await supabase.from('event_tasks').insert(rows)
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1.5px solid ${C.peach}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.peach }}>
          <h3 className="text-lg font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
            Add Task to Event
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50 transition-colors" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
            style={{ borderColor: C.peach, backgroundColor: '#FFF7F3' }}>
            <svg className="w-4 h-4 shrink-0" style={{ color: C.faint }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}
            />
          </div>
        </div>

        {/* Task list */}
        <div className="px-6 py-2 max-h-72 overflow-y-auto">
          {loadingTasks ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: C.peach, borderTopColor: C.orange }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: C.faint }}>
              {available.length === 0 ? 'No tasks in library yet. Add some in the Tasks & Roles page.' : 'No tasks match your search'}
            </p>
          ) : (
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
              {filtered.map(task => {
                const checked = selected.has(task.id)
                const due = fmtDue(task.due_date)
                return (
                  <div key={task.id}
                    className="flex items-center gap-3 py-3.5 cursor-pointer"
                    style={{ borderBottom: `1px solid ${C.peach}` }}
                    onClick={() => toggle(task.id)}>
                    <div
                      className="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
                      style={{ borderColor: checked ? C.orange : '#D1C4B8', backgroundColor: checked ? C.orange : 'transparent' }}>
                      {checked && (
                        <svg className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{task.title}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-5 border-t" style={{ borderColor: C.peach }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
            style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={saving || selected.size === 0}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            {saving ? 'Saving…' : `Add Selected (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar initials stack ────────────────────────────────────────────────────
function AvatarStack({ names }) {
  if (!names || names.length === 0) return null
  const show = names.slice(0, 3)
  const extra = names.length - show.length
  const colors = ['#F1745E', '#5A6FB5', '#F1745E']
  return (
    <span className="flex items-center" style={{ gap: 0 }}>
      {show.map((name, i) => {
        const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
        return (
          <span
            key={i}
            title={name}
            className="flex items-center justify-center text-white font-bold rounded-full border-2 border-white shrink-0"
            style={{
              width: 22, height: 22, fontSize: 9,
              backgroundColor: colors[i % colors.length],
              marginLeft: i === 0 ? 0 : -7,
              zIndex: show.length - i,
              position: 'relative',
            }}>
            {initials}
          </span>
        )
      })}
      {extra > 0 && (
        <span className="text-xs font-semibold" style={{ color: C.faint, marginLeft: 3 }}>+{extra}</span>
      )}
    </span>
  )
}

// ─── To-do List section ───────────────────────────────────────────────────────
// ─── Three-dots menu for a todo task row ─────────────────────────────────────
function TodoTaskMenu({ onEdit, onRemove }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
        style={{ color: C.faint }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 rounded-2xl overflow-hidden min-w-[175px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: `1px solid ${C.peach}` }}>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-orange-50"
            style={{ color: C.text }}>
            <PencilIcon className="w-4 h-4" style={{ color: C.orange }} /> Edit Task
          </button>
          <div style={{ borderTop: `1px solid ${C.peach}` }} />
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onRemove() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-red-50"
            style={{ color: '#E06464' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
            Remove
          </button>
        </div>
      )}

    </div>
  )
}

// ─── Pill-based multi-select for member assignment ────────────────────────────
const PILL_COLORS = [
  { bg: '#FFF7F3', color: '#E06464', border: '#EFCAC8' },
  { bg: '#EEF0FA', color: '#3A4F95', border: '#C0C8E8' },
  { bg: '#FEF0EE', color: '#2E6040', border: '#A8D8B0' },
  { bg: '#F5EEF8', color: '#6A3A95', border: '#D0B8E8' },
  { bg: '#FFF5E0', color: '#A06010', border: '#E8D090' },
]

function getPillColor(index) { return PILL_COLORS[index % PILL_COLORS.length] }

function MemberMultiSelect({ members, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  function removePill(e, id) {
    e.stopPropagation()
    onChange(selected.filter(x => x !== id))
  }

  // Maintain stable color per member index in members list
  function pillColor(id) {
    const idx = members.findIndex(m => m.id === id)
    return getPillColor(idx >= 0 ? idx : 0)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — shows pills or placeholder */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full min-h-[2.4rem] flex items-center flex-wrap gap-1.5 px-3 py-1.5 rounded-xl border text-left"
        style={{ borderColor: open ? C.orange : C.peach, backgroundColor: '#FFF7F3', outline: 'none', cursor: 'pointer' }}>
        {selected.length === 0 ? (
          <span className="text-sm" style={{ color: C.faint, fontFamily: "'Nunito', sans-serif" }}>Select members…</span>
        ) : (
          selected.map(id => {
            const m = members.find(x => x.id === id)
            if (!m) return null
            const pc = pillColor(id)
            return (
              <span key={id}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                {m.full_name}
                <span
                  role="button"
                  onClick={e => removePill(e, id)}
                  className="ml-0.5 leading-none hover:opacity-70 cursor-pointer"
                  style={{ fontSize: '0.75rem' }}>×</span>
              </span>
            )
          })
        )}
        <svg className="w-4 h-4 shrink-0 ml-auto"
          style={{ color: C.faint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown checklist */}
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden"
          style={{ backgroundColor: '#fff', border: `1.5px solid ${C.peach}`, boxShadow: '0 8px 24px rgba(0,0,0,0.13)', maxHeight: 200, overflowY: 'auto' }}>
          {members.length === 0 && (
            <p className="px-4 py-3 text-sm" style={{ color: C.faint }}>No members found.</p>
          )}
          {members.map((m, idx) => {
            const checked = selected.includes(m.id)
            const pc = getPillColor(idx)
            return (
              <div
                key={m.id}
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-orange-50"
                onMouseDown={e => e.preventDefault()}
                onClick={() => toggle(m.id)}>
                <div className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
                  style={{ borderColor: checked ? C.orange : '#D1C4B8', backgroundColor: checked ? C.orange : 'transparent' }}>
                  {checked && (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-sm" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>{m.full_name}</span>
                {checked && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                    ✓
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Edit task modal (inside EventModal context) ──────────────────────────────
const TODO_STATUS_OPTIONS = ['pending', 'in_progress', 'done']
const TODO_STATUS_LABELS  = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }

function EditTodoTaskModal({ task, eventId, onClose, onSaved }) {
  const [allMembers, setAllMembers] = useState({ appUsers: [], generalMembers: [] })
  const [form, setForm] = useState({
    title:            task.title    || '',
    due_date:         task.due_date ? task.due_date.slice(0, 10) : '',
    status:           task.status   || 'pending',
    // Seed from assigned_members (encoded text[]); fall back from uuid array
    assigned_members: task.assigned_members?.length > 0
      ? task.assigned_members
      : (task.assigned_to_multiple || []).map(id => `profile:${id}`),
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name').order('full_name'),
      supabase.from('general_members').select('id, full_name').order('full_name'),
      supabase.from('dance_team_participants').select('id, name').order('name'),
    ]).then(([pRes, gRes, dRes]) => {
      setAllMembers({ appUsers: pRes.data || [], generalMembers: gRes.data || [], danceTeam: dRes.data || [] })
    })
  }, [])

  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return setErr('Title is required.')
    setSaving(true)
    try {
      // Update title in task library
      const library = getTaskLibrary()
      const libIdx = library.findIndex(t => t.id === task.id)
      if (libIdx >= 0) { library[libIdx] = { ...library[libIdx], title: form.title.trim() } }
      localStorage.setItem('dhya_task_library', JSON.stringify(library))

      // Update per-event fields in Supabase
      const { error } = await supabase.from('event_tasks')
        .update({
          task_title:       form.title.trim(),
          due_date:         form.due_date || null,
          status:           form.status,
          assigned_members: form.assigned_members,
        })
        .eq('event_id', eventId)
        .eq('task_id', task.id)
      if (error) throw error
    } catch (ex) {
      setSaving(false)
      return setErr(ex.message)
    }
    setSaving(false)
    onSaved(); onClose()
  }

  const fieldStyle = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '0.875rem',
    border: `1.5px solid ${C.peach}`, backgroundColor: '#FFF7F3',
    color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', outline: 'none',
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[70] flex"
      style={{ backgroundColor: 'rgba(40,24,8,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* Right-side drawer */}
      <div className="ml-auto h-full flex flex-col"
        style={{
          width: '420px', maxWidth: '100vw',
          backgroundColor: C.cream,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          borderLeft: `1.5px solid ${C.peach}`,
          borderTopLeftRadius: '1.5rem',
          borderBottomLeftRadius: '1.5rem',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6 border-b shrink-0"
          style={{ borderColor: C.peach }}>
          <h3 className="text-2xl font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
            Edit Task
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-orange-100 transition-colors" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {err && (
            <div className="px-4 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
              {err}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Title *
            </label>
            <input name="title" value={form.title} onChange={hc} required
              placeholder="e.g. Set up registration table"
              style={fieldStyle} />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Assigned To
            </label>
            <VolunteerMultiSelect
              members={allMembers}
              selected={form.assigned_members}
              onChange={val => setForm(f => ({ ...f, assigned_members: val }))}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Status
            </label>
            <select name="status" value={form.status} onChange={hc} style={fieldStyle}>
              {TODO_STATUS_OPTIONS.map(s => <option key={s} value={s}>{TODO_STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Due Date
            </label>
            <input type="date" name="due_date" value={form.due_date} onChange={hc} style={fieldStyle} />
          </div>
        </form>

        {/* Footer buttons — always visible */}
        <div className="px-7 py-5 border-t shrink-0 flex gap-3" style={{ borderColor: C.peach }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl border transition-colors hover:bg-orange-50"
            style={{ borderColor: C.peach, color: C.muted, backgroundColor: '#fff' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)', boxShadow: '0 4px 14px rgba(200,90,48,0.3)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TodoSection({ eventId, onCountChange }) {
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAddPopup, setShowAddPopup] = useState(false)
  const [editingTask, setEditingTask]   = useState(null)
  const [allMembers, setAllMembers] = useState({ appUsers: [], generalMembers: [], danceTeam: [] })
  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name').order('full_name'),
      supabase.from('general_members').select('id, full_name').order('full_name'),
      supabase.from('dance_team_participants').select('id, name').order('name'),
    ]).then(([pRes, gRes, dRes]) => {
      setAllMembers({ appUsers: pRes.data || [], generalMembers: gRes.data || [], danceTeam: dRes.data || [] })
    })
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('event_tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      const rows = (data || []).map(r => ({
        id:               r.task_id,
        dbId:             r.id,
        title:            r.task_title || '',
        due_date:         r.due_date || null,
        status:           r.status   || 'pending',
        assigned_members: r.assigned_members || [],
      }))
      rows.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      })
      setTasks(rows)
      onCountChange(rows.length)
    } catch { setTasks([]); onCountChange(0) }
    setLoading(false)
  }, [eventId, onCountChange])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function cycleStatus(task) {
    await supabase.from('event_tasks')
      .update({ status: STATUS_CYCLE[task.status] || 'pending' })
      .eq('event_id', eventId).eq('task_id', task.id)
    fetchTasks()
  }

  async function removeFromEvent(id) {
    await supabase.from('event_tasks').delete().eq('event_id', eventId).eq('task_id', id)
    fetchTasks()
  }

  async function deleteTask(id) {
    // Remove from library
    const library = getTaskLibrary()
    localStorage.setItem('dhya_task_library', JSON.stringify(library.filter(t => t.id !== id)))
    // Remove from all events in Supabase
    await supabase.from('event_tasks').delete().eq('task_id', id)
    fetchTasks()
  }

  return (
    <>
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem' }}>
            To-do List
          </h3>
          <button
            onClick={() => setShowAddPopup(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            <PlusIcon className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>

        {/* Task list or empty state */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: C.peach, borderTopColor: C.orange }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: C.orangeLight }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="2" width="8" height="4" rx="1"/>
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>No tasks yet</p>
            <p className="text-xs" style={{ color: C.faint }}>Click "Add Task" to assign tasks to this event.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task, index) => {
              const sc = STATUS_CFG[task.status] || STATUS_CFG.pending
              const due = fmtDue(task.due_date)
              const memberLookup = [
                ...(allMembers.appUsers      || []).map(m => ({ key: `profile:${m.id}`, name: m.full_name })),
                ...(allMembers.generalMembers || []).map(m => ({ key: `general:${m.id}`, name: m.full_name })),
                ...(allMembers.danceTeam      || []).map(m => ({ key: `dance:${m.id}`,   name: m.name })),
              ]
              const displayNames = (task.assigned_members || []).map(k => {
                const found = memberLookup.find(e => e.key === k)
                return found ? found.name : k
              }).filter(Boolean)
              return (
                <div key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: '#ffffff', border: `1.5px solid ${C.peach}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  {/* Status dot — click to cycle */}
                  <button
                    onClick={() => cycleStatus(task)}
                    title="Click to advance status"
                    className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: sc.color,
                      backgroundColor: task.status === 'done' ? sc.color : 'transparent',
                    }}>
                    {task.status === 'done' && (
                      <svg className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: C.text, textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}>
                      {task.title}
                    </p>
                    {(due || displayNames.length > 0) && (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {due && <span className="text-xs" style={{ color: C.faint }}>📅 {due}</span>}
                        {displayNames.length > 0 && (
                          <span className="text-xs" style={{ color: C.faint }}>👤 {displayNames.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {sc.label}
                  </span>

                  {/* Three-dots menu */}
                  <TodoTaskMenu
                    onEdit={() => setEditingTask(task)}
                    onRemove={() => removeFromEvent(task.id)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddPopup && (
        <AddTaskPopup
          eventId={eventId}
          onClose={() => setShowAddPopup(false)}
          onAdded={fetchTasks}
        />
      )}

      {editingTask && (
        <EditTodoTaskModal
          task={editingTask}
          eventId={eventId}
          onClose={() => setEditingTask(null)}
          onSaved={fetchTasks}
        />
      )}
    </>
  )
}

// ─── Assign Role modal ────────────────────────────────────────────────────────
// ─── Volunteer multi-select (app users + general members, encoded keys) ───────
function VolunteerMultiSelect({ members, selected, onChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  // Flatten both member types with email for app users
  const allOptions = [
    ...(members.appUsers || []).map((m, i) => ({
      key:   `profile:${m.id}`,
      label: m.full_name || m.email,
      sub:   m.email || '',
      group: 'App Users',
      idx:   i,
    })),
    ...(members.generalMembers || []).map((m, i) => ({
      key:   `general:${m.id}`,
      label: m.full_name,
      sub:   '',
      group: 'General Members',
      idx:   (members.appUsers || []).length + i,
    })),
    ...(members.danceTeam || []).map((m, i) => ({
      key:   `dance:${m.id}`,
      label: m.name,
      sub:   'Dance Team',
      group: 'Dance Team',
      idx:   (members.appUsers || []).length + (members.generalMembers || []).length + i,
    })),
  ]

  const filtered = search.trim()
    ? allOptions.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.sub.toLowerCase().includes(search.toLowerCase())
      )
    : allOptions

  useEffect(() => {
    if (!open) { setSearch(''); return }
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch('') }
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  function toggle(key) {
    onChange(selected.includes(key) ? selected.filter(x => x !== key) : [...selected, key])
  }
  function removePill(e, key) { e.stopPropagation(); onChange(selected.filter(x => x !== key)) }

  const groups = ['App Users', 'General Members', 'Dance Team']

  return (
    <div ref={ref} className="relative">
      {/* Trigger: pill chips + chevron */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full min-h-[2.6rem] flex items-start flex-wrap gap-1.5 px-3 py-2 rounded-xl border text-left"
        style={{ borderColor: open ? C.orange : C.peach, backgroundColor: '#FFF7F3', outline: 'none', cursor: 'pointer' }}>
        {selected.length === 0 ? (
          <span className="text-sm self-center" style={{ color: C.faint, fontFamily: "'Nunito', sans-serif" }}>Select volunteers…</span>
        ) : (
          selected.map(key => {
            const opt = allOptions.find(o => o.key === key)
            if (!opt) return null
            const pc = getPillColor(opt.idx)
            return (
              <span key={key}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                {opt.label}
                <span role="button" onClick={e => removePill(e, key)}
                  className="ml-0.5 leading-none cursor-pointer hover:opacity-60"
                  style={{ fontSize: '0.8rem' }}>×</span>
              </span>
            )
          })
        )}
        <svg className="w-4 h-4 shrink-0 self-center ml-auto"
          style={{ color: C.faint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: '#fff', border: `1.5px solid ${C.peach}`, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', maxHeight: 280 }}>

          {/* Search */}
          <div className="px-3 py-2.5 border-b" style={{ borderColor: C.peach }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#F7F0EA', border: `1px solid ${C.peach}` }}>
              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: C.faint }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members..."
                onMouseDown={e => e.stopPropagation()}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}
              />
            </div>
          </div>

          {/* Member list */}
          <div style={{ overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-sm text-center" style={{ color: C.faint }}>No members match</p>
            )}
            {groups.map(group => {
              const opts = filtered.filter(o => o.group === group)
              if (opts.length === 0) return null
              return (
                <div key={group}>
                  <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide"
                    style={{ color: C.muted, backgroundColor: '#FDFAF7' }}>{group}</div>
                  {opts.map(opt => {
                    const checked = selected.includes(opt.key)
                    const pc = getPillColor(opt.idx)
                    return (
                      <div key={opt.key}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => toggle(opt.key)}>
                        <div className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
                          style={{ borderColor: checked ? C.orange : '#D1C4B8', backgroundColor: checked ? C.orange : 'transparent' }}>
                          {checked && (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: C.text }}>{opt.label}</p>
                          {opt.sub && <p className="text-xs truncate" style={{ color: C.faint }}>{opt.sub}</p>}
                        </div>
                        {checked && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>✓</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function AssignRoleModal({ eventId, members, editingRole, onClose, onSaved }) {
  function seedSelected(role) {
    if (!role) return []
    const existing = role.assigned_volunteers || []
    if (existing.length > 0) return existing
    if (role.assigned_to) return [`profile:${role.assigned_to}`]
    if (role.assigned_general_member_id) return [`general:${role.assigned_general_member_id}`]
    return []
  }

  const [form, setForm] = useState({
    role_name:           editingRole?.role_name    ?? '',
    description:         editingRole?.description  ?? '',
    assigned_volunteers: seedSelected(editingRole),
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSave(e) {
    e.preventDefault()
    setErr('')
    if (!form.role_name.trim()) return setErr('Role name is required.')
    setSaving(true)

    const volunteers   = form.assigned_volunteers
    const firstProfile = volunteers.find(v => v.startsWith('profile:'))
    const firstGeneral = volunteers.find(v => v.startsWith('general:'))

    const payload = {
      role_name:                  form.role_name.trim(),
      description:                form.description.trim() || null,
      assigned_volunteers:        volunteers.length > 0 ? volunteers : null,
      assigned_to:                firstProfile ? firstProfile.slice('profile:'.length) : null,
      assigned_general_member_id: firstGeneral ? firstGeneral.slice('general:'.length) : null,
    }
    const { error } = editingRole
      ? await supabase.from('volunteer_roles').update(payload).eq('id', editingRole.id)
      : await supabase.from('volunteer_roles').insert([{ ...payload, event_id: eventId }])
    setSaving(false)
    if (error) return setErr(error.message)
    onSaved(); onClose()
  }

  const fieldStyle = {
    width: '100%', padding: '0.7rem 1rem', borderRadius: '0.875rem',
    border: `1.5px solid ${C.peach}`, backgroundColor: '#FFF7F3',
    color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', outline: 'none',
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[60] flex"
      style={{ backgroundColor: 'rgba(40,24,8,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* Right-side drawer */}
      <div className="ml-auto h-full flex flex-col"
        style={{
          width: '420px', maxWidth: '100vw',
          backgroundColor: C.cream,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          borderLeft: `1.5px solid ${C.peach}`,
          borderTopLeftRadius: '1.5rem',
          borderBottomLeftRadius: '1.5rem',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6 border-b shrink-0"
          style={{ borderColor: C.peach }}>
          <h3 className="text-2xl font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
            {editingRole ? 'Edit Role' : 'Assign Role'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-orange-100 transition-colors" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {err && (
            <div className="px-4 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
              {err}
            </div>
          )}

          {/* Role Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Role Name *
            </label>
            <input name="role_name" value={form.role_name} onChange={hc}
              placeholder="e.g. Registration, MC, Decorator"
              required style={fieldStyle} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={hc}
              rows={4}
              placeholder="Describe what this role is responsible for..."
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          {/* Assign to Member */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Assign to Member
            </label>
            <VolunteerMultiSelect
              members={members}
              selected={form.assigned_volunteers}
              onChange={val => setForm(f => ({ ...f, assigned_volunteers: val }))}
            />
          </div>
        </form>

        {/* Footer buttons — always visible */}
        <div className="px-7 py-5 border-t shrink-0 flex gap-3" style={{ borderColor: C.peach }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl border transition-colors hover:bg-orange-50"
            style={{ borderColor: C.peach, color: C.muted, backgroundColor: '#fff' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)', boxShadow: '0 4px 14px rgba(200,90,48,0.3)' }}>
            {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Three-dots menu for a role card ─────────────────────────────────────────
function RoleMenu({ role, onEdit, onRemove }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function handle(e) { setOpen(false) }
    window.addEventListener('click', handle)
    return () => window.removeEventListener('click', handle)
  }, [open])

  return (
    <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-orange-50"
        style={{ color: C.faint }}>
        {/* Three dots */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>

      {open && !confirming && (
        <div className="absolute right-0 top-8 z-10 rounded-2xl overflow-hidden min-w-[140px]"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${C.peach}` }}>
          <button
            onClick={() => { setOpen(false); onEdit(role) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-orange-50 transition-colors"
            style={{ color: C.text }}>
            <PencilIcon className="w-4 h-4" style={{ color: C.orange }} />
            Edit Role
          </button>
          <div style={{ borderTop: `1px solid ${C.peach}` }} />
          <button
            onClick={() => { setConfirming(true) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-red-50 transition-colors"
            style={{ color: '#E06464' }}>
            <XMarkIcon className="w-4 h-4" />
            Remove
          </button>
        </div>
      )}

      {confirming && (
        <div className="absolute right-0 top-8 z-10 rounded-2xl p-4 min-w-[180px]"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid #EFCAC8` }}>
          <p className="text-xs font-semibold mb-3" style={{ color: C.text }}>Remove this role?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl border"
              style={{ borderColor: C.peach, color: C.muted }}>
              Cancel
            </button>
            <button onClick={() => { setConfirming(false); setOpen(false); onRemove(role.id) }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: '#E06464' }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Role picker (from dhya_role_library localStorage) ───────────────────────
function RolePickerModal({ eventId, existingNames, onClose, onSaved }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(new Set())
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    try {
      const roles = getRoleLibrary()
      const sorted = [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setTemplates(sorted)
    } catch { setTemplates([]) }
    setLoading(false)
  }, [])

  const already = new Set(existingNames.map(n => n.toLowerCase()))
  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  function toggle(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleAdd() {
    if (selected.size === 0) return
    setSaving(true)
    const toInsert = templates.filter(t => selected.has(t.id)).map(t => ({
      event_id:    eventId,
      role_name:   t.name,
      description: t.description || null,
    }))
    await supabase.from('volunteer_roles').insert(toInsert)
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', border: `1.5px solid ${C.peach}`, maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.peach}` }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>Add Volunteer Roles</h3>
            <p className="text-xs mt-0.5" style={{ color: C.faint }}>Select from the roles library</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 shrink-0">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles…"
            style={{ width: '100%', padding: '0.5rem 0.875rem', borderRadius: '0.75rem', border: `1.5px solid ${C.peach}`, backgroundColor: '#FFF7F3', color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none' }} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: C.peach, borderTopColor: C.orange }} /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: C.faint }}>
              {templates.length === 0 ? 'No roles in the library yet. Add some in the Tasks & Roles page.' : 'No roles match your search.'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map(t => {
                const isAdded = already.has(t.name.toLowerCase())
                const checked = selected.has(t.id)
                return (
                  <button key={t.id} onClick={() => !isAdded && toggle(t.id)} disabled={isAdded}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left"
                    style={{
                      backgroundColor: isAdded ? '#F5F5F5' : checked ? C.orangeLight : 'transparent',
                      border: `1.5px solid ${isAdded ? '#E5E5E5' : checked ? C.orange : 'transparent'}`,
                      opacity: isAdded ? 0.6 : 1,
                      cursor: isAdded ? 'default' : 'pointer',
                    }}>
                    <div className="w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: isAdded ? '#CCC' : checked ? C.orange : C.peach, backgroundColor: isAdded ? '#E0E0E0' : checked ? C.orange : '#fff' }}>
                      {(isAdded || checked) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke={isAdded ? '#999' : '#fff'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm" style={{ color: isAdded ? '#999' : C.text }}>{t.name}</p>
                      {t.description && <p className="text-xs truncate" style={{ color: C.faint }}>{t.description}</p>}
                    </div>
                    {isAdded && <span className="text-xs shrink-0" style={{ color: '#AAA' }}>Already added</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 shrink-0 flex gap-3" style={{ borderTop: `1px solid ${C.peach}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
            style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>Cancel</button>
          <button onClick={handleAdd} disabled={selected.size === 0 || saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            {saving ? 'Adding…' : `Add ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Volunteer Roles section ──────────────────────────────────────────────────
function VolunteerSection({ eventId, onCountChange, onAssignedCountChange }) {
  const [roles, setRoles] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const fetchRoles = useCallback(async () => {
    setLoading(true)
    const [rolesRes, appUsersRes, generalRes, danceRes] = await Promise.all([
      supabase
        .from('volunteer_roles')
        .select('id, role_name, description, assigned_to, assigned_general_member_id, assigned_volunteers, sort_order, profiles(full_name), general_members(full_name)')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name'),
      supabase
        .from('general_members')
        .select('id, full_name')
        .order('full_name'),
      supabase
        .from('dance_team_participants')
        .select('id, name')
        .order('name'),
    ])
    const rows = rolesRes.data || []
    setRoles(rows)
    setMembers({
      appUsers:       appUsersRes.data || [],
      generalMembers: generalRes.data  || [],
      danceTeam:      danceRes.data    || [],
    })
    onCountChange(rows.length)
    // Count unique volunteers across all roles (no double-counting)
    const uniqueVolunteers = new Set()
    rows.forEach(role => {
      const vols = role.assigned_volunteers || []
      if (vols.length > 0) {
        vols.forEach(v => uniqueVolunteers.add(v))
      } else {
        if (role.assigned_to) uniqueVolunteers.add(`profile:${role.assigned_to}`)
        if (role.assigned_general_member_id) uniqueVolunteers.add(`general:${role.assigned_general_member_id}`)
      }
    })
    onAssignedCountChange(uniqueVolunteers.size)
    setLoading(false)
  }, [eventId, onCountChange])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  async function removeRole(id) {
    await supabase.from('volunteer_roles').delete().eq('id', id)
    fetchRoles()
  }

  function openEdit(role) {
    setEditingRole(role)
    setShowModal(true)
  }

  function openCreate() {
    setEditingRole(null)
    setShowModal(true)
  }

  // Member initials avatar
  function memberInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <div>
        {/* Header row with button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem' }}>
            Volunteer Roles
          </h3>
          <button onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            <PlusIcon className="w-3.5 h-3.5" />
            Assign Role
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: C.peach, borderTopColor: C.orange }} />
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: C.orangeLight }}>
              <HandsIcon size={30} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>No roles assigned yet</p>
            <p className="text-xs" style={{ color: C.faint }}>Click "Assign Role" to add volunteer positions.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {roles.map((role, index) => {
              // Resolve display names: prefer assigned_volunteers array, fall back to single columns
              let displayNames = []
              if (role.assigned_volunteers?.length > 0) {
                const allOpts = [
                  ...(members.appUsers      || []).map(m => ({ key: `profile:${m.id}`, label: m.full_name || m.email })),
                  ...(members.generalMembers || []).map(m => ({ key: `general:${m.id}`, label: m.full_name })),
                  ...(members.danceTeam      || []).map(m => ({ key: `dance:${m.id}`,   label: m.name })),
                ]
                displayNames = role.assigned_volunteers
                  .map(k => allOpts.find(o => o.key === k)?.label)
                  .filter(Boolean)
              }
              if (displayNames.length === 0) {
                const fallback = role.profiles?.full_name || role.general_members?.full_name
                if (fallback) displayNames = [fallback]
              }
              return (
                <div key={role.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: '#ffffff', border: `1.5px solid ${C.peach}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>

                  {/* Hand icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: C.orangeLight, color: C.orange }}>
                    <HandsIcon size={18} />
                  </div>

                  {/* Role name + assigned names */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: C.text }}>
                      {role.role_name}
                    </p>
                    {displayNames.length > 0 && (
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: C.muted }}>
                        {displayNames.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Unassigned badge */}
                  {displayNames.length === 0 && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #EDD0AC' }}>
                      Unassigned
                    </span>
                  )}

                  {/* Three-dots menu */}
                  <RoleMenu role={role} onEdit={openEdit} onRemove={removeRole} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showPicker && (
        <RolePickerModal
          eventId={eventId}
          existingNames={roles.map(r => r.role_name)}
          onClose={() => setShowPicker(false)}
          onSaved={fetchRoles}
        />
      )}

      {showModal && (
        <AssignRoleModal
          eventId={eventId}
          members={members}
          editingRole={editingRole}
          onClose={() => { setShowModal(false); setEditingRole(null) }}
          onSaved={fetchRoles}
        />
      )}
    </>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function EventModal({ event, onClose, onEdit }) {
  const [activeSection, setActiveSection] = useState(null)
  const [todoCount, setTodoCount] = useState(null)
  const [volunteerCount, setVolunteerCount] = useState(null)
  const [assignedVolunteerCount, setAssignedVolunteerCount] = useState(null)
  const [danceCount, setDanceCount] = useState(null)
  const handleTodoCount = useCallback(n => setTodoCount(n), [])
  const handleVolunteerCount = useCallback(n => setVolunteerCount(n), [])
  const handleAssignedVolunteerCount = useCallback(n => setAssignedVolunteerCount(n), [])
  const handleDanceCount = useCallback(n => setDanceCount(n), [])
  const dateInfo = parseDateInfo(event.start_date)

  // Fetch all counts on open so the summary bar is populated immediately
  useEffect(() => {
    async function fetchCounts() {
      const [todoRes, rolesRes, danceRes] = await Promise.all([
        supabase.from('event_tasks').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
        supabase.from('volunteer_roles').select('id, assigned_to, assigned_general_member_id, assigned_volunteers').eq('event_id', event.id),
        supabase.from('dance_participants').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
      ])
      setTodoCount(todoRes.count ?? 0)
      if (!rolesRes.error) {
        const rows = rolesRes.data || []
        setVolunteerCount(rows.length)
        const unique = new Set()
        rows.forEach(role => {
          const vols = role.assigned_volunteers || []
          if (vols.length > 0) vols.forEach(v => unique.add(v))
          else {
            if (role.assigned_to) unique.add(`profile:${role.assigned_to}`)
            if (role.assigned_general_member_id) unique.add(`general:${role.assigned_general_member_id}`)
          }
        })
        setAssignedVolunteerCount(unique.size)
      }
      if (!danceRes.error) setDanceCount(danceRes.count ?? 0)
    }
    fetchCounts()
  }, [event.id])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function toggleSection(id) {
    setActiveSection(prev => prev === id ? null : id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(50, 30, 10, 0.4)', backdropFilter: 'blur(2px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl flex flex-col"
        style={{ backgroundColor: C.cream, boxShadow: '0 24px 64px rgba(0,0,0,0.20)', border: `1.5px solid ${C.peach}`, maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4 shrink-0 rounded-t-3xl"
          style={{ backgroundColor: C.cream, borderBottom: `1px solid ${C.peach}` }}>
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl leading-tight" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>
                {event.title}
              </h2>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl border shrink-0 transition-opacity hover:opacity-80"
                style={{ borderColor: C.orange, color: C.orange, backgroundColor: C.orangeLight }}>
                <PencilIcon className="w-3.5 h-3.5" />
                Edit Event Info
              </button>
            </div>
            {event.description && (
              <p className="mt-1 text-sm" style={{ color: C.muted }}>{event.description}</p>
            )}
          </div>
          <button onClick={onClose}
            className="shrink-0 p-1.5 rounded-full transition-colors hover:bg-orange-50"
            style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-5 overflow-y-auto flex-1">
          {/* ── Event summary row ── */}
          <div className="rounded-2xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
            style={{ backgroundColor: '#ffffff', border: `1px solid ${C.peach}` }}>
            <SummaryItem
              icon={<MapPinIcon className="w-5 h-5" />}
              label="Location"
              value={event.location || '—'}
            />
            <SummaryItem
              icon={<CalendarDaysIcon className="w-5 h-5" />}
              label="Date"
              value={dateInfo ? dateInfo.date : '—'}
              sub={dateInfo ? dateInfo.dayOfWeek : null}
            />
            <SummaryItem
              icon={<ClockSvg />}
              label="Time"
              value={dateInfo ? dateInfo.time : '—'}
            />
            <SummaryItem
              icon={<UserGroupIcon className="w-5 h-5" />}
              label="Volunteers"
              value={assignedVolunteerCount !== null ? `${assignedVolunteerCount}` : '—'}
            />
          </div>

          {/* ── Navigation cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {NAV_CARDS.filter(card => card.id !== 'dance' || event.event_type === 'temple_main').map(card => {
              const active = activeSection === card.id
              const subtitle =
                card.id === 'todo' && todoCount !== null
                  ? `${todoCount} task${todoCount !== 1 ? 's' : ''}`
                  : card.id === 'volunteer' && volunteerCount !== null
                  ? `${volunteerCount} role${volunteerCount !== 1 ? 's' : ''}`
                  : card.id === 'dance' && danceCount !== null
                  ? `${danceCount} participant${danceCount !== 1 ? 's' : ''}`
                  : card.subtitle
              return (
                <button key={card.id} onClick={() => toggleSection(card.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                  style={{
                    backgroundColor: active ? C.orangeLight : '#ffffff',
                    border: `1.5px solid ${active ? C.orange : C.peach}`,
                    boxShadow: active ? '0 2px 16px rgba(230,106,44,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: active ? C.orangeMid : C.orangeLight, color: C.orange }}>
                    <card.Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: active ? C.orange : C.text }}>{card.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.faint }}>{subtitle}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: active ? C.orange : C.faint, transform: active ? 'rotate(90deg)' : 'none' }} />
                </button>
              )
            })}
          </div>

          {/* ── Section content ── */}
          {activeSection && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFF7F3', border: `1px solid ${C.peach}` }}>
              {activeSection === 'todo'      && <TodoSection eventId={event.id} onCountChange={handleTodoCount} />}
              {activeSection === 'volunteer' && <VolunteerSection eventId={event.id} onCountChange={handleVolunteerCount} onAssignedCountChange={handleAssignedVolunteerCount} />}
              {activeSection === 'dance' && event.event_type === 'temple_main' && <DanceTeamSection eventId={event.id} onCountChange={handleDanceCount} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
