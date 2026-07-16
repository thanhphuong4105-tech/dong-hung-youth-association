import { useEffect, useRef, useState } from 'react'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { notify } from '../lib/notify'
import Modal, { Field, Input, Textarea, SubmitButton } from '../components/Modal'
import EventModal from '../components/EventModal'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'

// ── Helpers ───────────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmtDate(dateStr) {
  if (!dateStr) return ''
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return `${MONTHS_LONG[month - 1]} ${day}, ${year} (${WEEK_DAYS[d.getDay()]})`
  } catch { return dateStr }
}

function fmtTime(dateStr) {
  if (!dateStr) return ''
  try {
    const timePart = dateStr.split('T')[1]
    if (!timePart) return ''
    const [h, m] = timePart.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
  } catch { return '' }
}

function fmtEventDate(dateStr) {
  if (!dateStr) return ''
  try {
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    let result = `${MONTHS_LONG[month - 1]} ${day}, ${year} (${WEEK_DAYS[d.getDay()]})`
    if (timePart) {
      const [h, m] = timePart.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      result += ` · ${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
    }
    return result
  } catch { return dateStr }
}

function fmtEndTime(dateStr) {
  if (!dateStr) return ''
  try {
    const timePart = dateStr.split('T')[1]
    if (!timePart) return ''
    const [h, m] = timePart.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
  } catch { return '' }
}

function isUpcoming(event) {
  if (!event.start_date) return true
  const now = new Date()
  const start = new Date(event.start_date.split('T')[0] + 'T00:00:00')
  return start >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

const EVENT_TYPES = [
  { id: 'temple_main',  label: 'Temple Main Event', description: 'Large ceremonies and festivals at the temple', icon: '🏛️', hasDanceTeam: true },
  { id: 'dhya_activity',label: 'DHYA Activity',     description: 'Youth association gatherings and activities',  icon: '🎉', hasDanceTeam: false },
  { id: 'retreat',      label: 'Retreat',            description: 'Overnight trips and spiritual retreats',       icon: '🏕️', hasDanceTeam: false },
]

const emptyForm = { title: '', description: '', location: '', start_date: '', end_date: '', event_type: '' }

// ── Event thumbnail placeholder ───────────────────────────────────────────────
function EventThumb({ event, large }) {
  const COLORS = [
    { bg: '#FDE8E0', icon: '🏮' },
    { bg: '#FEF3DC', icon: '🌸' },
    { bg: '#E8F0FE', icon: '🎉' },
    { bg: '#F0FDE8', icon: '🏕️' },
    { bg: '#FDE8F0', icon: '🏛️' },
  ]
  const pick = COLORS[(event.title?.charCodeAt(0) || 0) % COLORS.length]
  const cls = large ? 'w-28 h-24 rounded-2xl shrink-0 flex items-center justify-center text-3xl overflow-hidden' : 'w-20 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl overflow-hidden'
  return (
    <div className={cls} style={{ backgroundColor: pick.bg }}>
      {event.image_url
        ? <img src={event.image_url} alt="" className="w-full h-full object-cover" />
        : pick.icon
      }
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ upcoming }) {
  return (
    <span className="px-3 py-1 text-xs font-bold rounded-full shrink-0"
      style={upcoming
        ? { backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #FBC3B9' }
        : { backgroundColor: '#F5F0EB', color: '#A08070', border: '1px solid #EDD0AC' }
      }>
      {upcoming ? 'Upcoming' : 'Past'}
    </span>
  )
}

// ── Three-dots menu ───────────────────────────────────────────────────────────
function EventRowMenu({ onEdit, onDelete }) {
  const [open, setOpen]           = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirming(false) } }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
        style={{ color: '#A08070' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>

      {open && !confirming && (
        <div className="absolute right-0 top-9 z-30 rounded-2xl overflow-hidden min-w-[130px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EDD0AC' }}>
          <button onClick={() => setConfirming(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left hover:bg-red-50"
            style={{ color: '#E06464' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
        </div>
      )}

      {open && confirming && (
        <div className="absolute right-0 top-9 z-30 rounded-2xl p-4 min-w-[160px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EFCAC8' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#4F252A' }}>Delete this event?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl border"
              style={{ borderColor: '#EDD0AC', color: '#7A5550' }}>Cancel</button>
            <button onClick={() => { setOpen(false); setConfirming(false); onDelete() }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: '#E06464' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Type picker modal ─────────────────────────────────────────────────────────
function TypePickerModal({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(79,37,42,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.15)', border: '1.5px solid #EDD0AC' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #EDD0AC' }}>
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: '#4F252A' }}>New Event</h3>
            <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>What type of event is this?</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50" style={{ color: '#7A5550' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {EVENT_TYPES.map(type => (
            <button key={type.id} onClick={() => onSelect(type.id)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
              style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #EDD0AC' }}>
              <span className="text-2xl shrink-0">{type.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: '#4F252A' }}>{type.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{type.description}</p>
              </div>
              {type.hasDanceTeam && (
                <span className="ml-auto shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#FEF0EE', color: '#F1745E', border: '1px solid #FBC3B9' }}>
                  + Dance Team
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ ev, canManage, onClick, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const upcoming = isUpcoming(ev)
  const startTime    = fmtTime(ev.start_date)
  const endTime      = fmtTime(ev.end_date)
  const startDateStr = fmtDate(ev.start_date)
  const endDateStr   = ev.end_date ? fmtDate(ev.end_date) : ''
  const sameDay      = startDateStr === endDateStr
  const timeStr      = startTime ? (endTime ? `${startTime} – ${endTime}` : startTime) : ''

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer transition-all"
      style={{
        backgroundColor: '#ffffff',
        border: `1.5px solid ${hovered ? '#F1745E' : '#EDD0AC'}`,
        borderRadius: '20px',
        boxShadow: hovered ? '0 8px 28px rgba(241,116,94,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
      {/* Top row: image + title/status/menu */}
      <div className="flex items-start gap-3">
        <EventThumb event={ev} large />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-extrabold text-base leading-snug" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>{ev.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge upcoming={upcoming} />
              {canManage && (
                <EventRowMenu onEdit={onEdit} onDelete={onDelete} />
              )}
            </div>
          </div>
          {/* Date */}
          <div className="flex items-center gap-1.5 mb-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E06464" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#7A5550' }}>
              {startDateStr}{!sameDay && endDateStr ? ` – ${endDateStr}` : ''}
            </span>
          </div>
          {/* Time */}
          {timeStr && (
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E06464" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-xs font-semibold" style={{ color: '#7A5550' }}>{timeStr}</span>
            </div>
          )}
          {/* Location */}
          {ev.location && (
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E06464" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-xs font-semibold truncate" style={{ color: '#7A5550' }}>{ev.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Events() {
  const { canManage, profile } = useProfile()
  const profileName = profile?.full_name || null
  const { session }   = useAuth()

  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Filters
  const [tab,    setTab]    = useState('upcoming')   // 'upcoming' | 'past'
  const [search, setSearch] = useState('')

  // Pagination
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [selectedEvent,  setSelectedEvent]  = useState(null)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showForm,       setShowForm]       = useState(false)
  const [editingId,      setEditingId]      = useState(null)
  const [form,           setForm]           = useState(emptyForm)
  const [saving,         setSaving]         = useState(false)
  const [formError,      setFormError]      = useState('')
  const [imageFile,      setImageFile]      = useState(null)
  const [imagePreview,   setImagePreview]   = useState(null)
  const [existingImage,  setExistingImage]  = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
    if (error) setError(error.message)
    else setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { if (session) fetchEvents() }, [session])

  // Derived list
  const filtered = events.filter(ev => {
    const matchTab = tab === 'upcoming' ? isUpcoming(ev) : !isUpcoming(ev)
    const q = search.toLowerCase()
    const matchSearch = !q || ev.title?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Reset page on filter change
  useEffect(() => setPage(1), [tab, search, pageSize])

  function openCreate()        { setShowTypePicker(true) }
  function handleTypeSelect(t) { setShowTypePicker(false); setEditingId(null); setForm({ ...emptyForm, event_type: t }); setFormError(''); setImageFile(null); setImagePreview(null); setExistingImage(null); setShowForm(true) }
  function openEdit(ev)        { setEditingId(ev.id); setForm({ title: ev.title||'', description: ev.description||'', location: ev.location||'', start_date: ev.start_date?.slice(0,16)||'', end_date: ev.end_date?.slice(0,16)||'', event_type: ev.event_type||'' }); setFormError(''); setSelectedEvent(null); setImageFile(null); setImagePreview(null); setExistingImage(ev.image_url||null); setShowForm(true) }
  function closeForm()         { setShowForm(false); setImageFile(null); setImagePreview(null); setExistingImage(null) }
  function handleChange(e)     { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleDelete(id) {
    const ev = events.find(e => e.id === id)
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
    notify({ title: 'Event deleted', body: ev?.title || '', type: 'event', actor_name: profileName || null })
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Title is required.')
    setSaving(true)

    let image_url = existingImage || null

    if (imageFile) {
      setUploadingImage(true)
      const ext  = imageFile.name.split('.').pop()
      const path = `events/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('event-images')
        .upload(path, imageFile, { upsert: true })
      setUploadingImage(false)
      if (upErr) { setSaving(false); setFormError(`Image upload failed: ${upErr.message}`); return }
      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      location:    form.location.trim()    || null,
      start_date:  form.start_date         || null,
      end_date:    form.end_date           || null,
      event_type:  form.event_type         || null,
      image_url,
    }
    const { error } = editingId
      ? await supabase.from('events').update(payload).eq('id', editingId)
      : await supabase.from('events').insert([payload])
    setSaving(false)
    if (error) { setFormError(error.message); return }
    notify({
      title: editingId ? 'Event updated' : 'New event created',
      body:  payload.title,
      type:  'event',
      actor_name: profileName || null,
    })
    closeForm(); fetchEvents()
  }

  return (
    <div>
      {/* ── Mobile layout ── */}
      <div className="block md:hidden" style={{ backgroundColor: '#FFF7F3', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Events</h1>
        </div>

        {/* Search + filter */}
        <div className="px-4 flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0" style={{ color: '#A08070' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
              className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#4F252A' }} />
          </div>
          <button className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
            <FunnelIcon className="w-4 h-4" style={{ color: '#A08070' }} />
          </button>
        </div>

        {/* + New Event button */}
        {canManage && (
          <div className="px-4 mb-4">
            <button onClick={() => setShowTypePicker(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: '#F1745E' }}>
              <PlusIcon className="w-4 h-4" /> New Event
            </button>
          </div>
        )}

        {/* Upcoming / Past tabs */}
        <div className="px-4 flex gap-2 mb-4">
          {['upcoming', 'past'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-xs font-bold capitalize"
              style={tab === t
                ? { backgroundColor: '#F1745E', color: '#fff' }
                : { backgroundColor: '#ffffff', color: '#A08070', border: '1px solid #EDD0AC' }}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        {/* Event cards */}
        <div className="px-4 space-y-3">
          {filtered.map(ev => {
            const upcoming = isUpcoming(ev)
            return (
              <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                className="w-full text-left rounded-2xl overflow-hidden flex items-stretch gap-0"
                style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC', minHeight: '88px' }}>
                {/* Thumbnail */}
                <div className="w-24 shrink-0 flex items-center justify-center" style={{ backgroundColor: '#FEF0EE' }}>
                  {ev.image_url
                    ? <img src={ev.image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl">
                        {ev.event_type === 'retreat' ? '🏕️' : ev.event_type === 'temple_main' ? '🏛️' : '🎉'}
                      </span>
                  }
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-tight" style={{ color: '#4F252A', flex: 1, minWidth: 0 }}>{ev.title}</p>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={upcoming
                        ? { backgroundColor: '#FEF0EE', color: '#E06464', border: '1px solid #FBC3B9' }
                        : { backgroundColor: '#F5F0EB', color: '#A08070', border: '1px solid #EDD0AC' }}>
                      {upcoming ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                  {ev.start_date && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#A08070' }}>
                      <span>📅</span>
                      <span>{fmtEventDate(ev.start_date).split('·')[0].trim()}</span>
                    </p>
                  )}
                  {(ev.start_date || ev.end_date) && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#A08070' }}>
                      <span>🕐</span>
                      <span>{fmtTime(ev.start_date)}{ev.end_date ? ` – ${fmtEndTime(ev.end_date)}` : ''}</span>
                    </p>
                  )}
                  {ev.location && (
                    <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: '#A08070' }}>
                      <span>📍</span>
                      <span className="truncate">{ev.location}</span>
                    </p>
                  )}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-10" style={{ color: '#A08070' }}>No events found.</p>
          )}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: '#4F252A' }}>Events</h2>
          <p className="text-sm" style={{ color: '#7A5550' }}>Manage all events and activities.</p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0"
            style={{ backgroundColor: '#F1745E' }}>
            <PlusIcon className="w-4 h-4" />
            New Event
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
          {error}
        </div>
      )}

      {/* ── Toolbar: tabs + search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: '#F5EDE4' }}>
          {[['upcoming','Upcoming'],['past','Past']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all"
              style={tab === val
                ? { backgroundColor: '#ffffff', color: '#F1745E', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid #FBC3B9' }
                : { color: '#7A5550', border: '1px solid transparent' }
              }>
              {label}
            </button>
          ))}
        </div>

        {/* Search + filter icon */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A08070' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border outline-none"
              style={{ borderColor: '#EDD0AC', backgroundColor: '#ffffff', color: '#4F252A', width: '200px', fontFamily: "'Nunito', sans-serif" }}
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl border hover:bg-orange-50 transition-colors"
            style={{ borderColor: '#EDD0AC', color: '#7A5550', backgroundColor: '#ffffff' }}>
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Event grid ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 animate-spin"
            style={{ borderColor: '#EDD0AC', borderTopColor: '#F1745E' }} />
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center text-center"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC' }}>
          <span className="text-5xl mb-4">📅</span>
          <p className="text-lg font-bold mb-1" style={{ color: '#4F252A' }}>No events found</p>
          <p className="text-sm" style={{ color: '#A08070' }}>
            {search ? `No results for "${search}"` : tab === 'upcoming' ? 'No upcoming events.' : 'No past events.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginated.map(ev => (
            <EventCard
              key={ev.id}
              ev={ev}
              canManage={canManage}
              onClick={() => setSelectedEvent(ev)}
              onEdit={() => openEdit(ev)}
              onDelete={() => handleDelete(ev.id)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-5 gap-4 flex-wrap">
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 hover:bg-orange-50 transition-colors"
              style={{ borderColor: '#EDD0AC', color: '#7A5550', backgroundColor: '#ffffff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i-1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '…'
                ? <span key={`ellipsis-${i}`} className="w-8 text-center text-xs" style={{ color: '#A08070' }}>…</span>
                : (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition-all"
                    style={page === p
                      ? { backgroundColor: '#F1745E', color: '#ffffff', borderColor: '#F1745E' }
                      : { backgroundColor: '#ffffff', color: '#4F252A', borderColor: '#EDD0AC' }
                    }>
                    {p}
                  </button>
                )
              )
            }

            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 hover:bg-orange-50 transition-colors"
              style={{ borderColor: '#EDD0AC', color: '#7A5550', backgroundColor: '#ffffff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Per page */}
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
              className="text-xs border rounded-lg px-2 py-1.5 outline-none"
              style={{ borderColor: '#EDD0AC', color: '#4F252A', backgroundColor: '#ffffff', fontFamily: "'Nunito', sans-serif" }}>
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>
      )}

      </div>{/* end desktop block */}

      {/* ── Modals ── */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onEdit={() => openEdit(selectedEvent)} />
      )}

      {showTypePicker && (
        <TypePickerModal onSelect={handleTypeSelect} onClose={() => setShowTypePicker(false)} />
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit Event' : 'New Event'} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && form.event_type && (() => {
              const t = EVENT_TYPES.find(t => t.id === form.event_type)
              return t ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EDD0AC' }}>
                  <span>{t.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: '#7A5550' }}>{t.label}</span>
                  {t.hasDanceTeam && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#FEF0EE', color: '#F1745E', border: '1px solid #FBC3B9' }}>
                      + Dance Team
                    </span>
                  )}
                </div>
              ) : null
            })()}
            {formError && (
              <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>{formError}</div>
            )}
            <Field label="Title *">
              <Input name="title" value={form.title} onChange={handleChange} placeholder="Event title" required />
            </Field>
            <Field label="Description">
              <Textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What's this event about?" />
            </Field>
            <Field label="Location">
              <Input name="location" value={form.location} onChange={handleChange} placeholder="Location" />
            </Field>

            {/* ── Event photo ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#7A5550' }}>
                Event Photo
              </label>
              {(imagePreview || existingImage) ? (
                <div className="relative rounded-2xl overflow-hidden" style={{ height: '160px', border: '1.5px solid #EDD0AC' }}>
                  <img
                    src={imagePreview || existingImage}
                    alt="Event"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                    <XMarkIcon className="w-4 h-4 text-white" />
                  </button>
                  <label className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-md"
                    style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#4F252A', border: '1px solid #EDD0AC' }}>
                    <PhotoIcon className="w-3.5 h-3.5" style={{ color: '#F1745E' }} />
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer transition-colors hover:bg-orange-50"
                  style={{ height: '120px', border: '2px dashed #EDD0AC', backgroundColor: '#FFFCF8' }}>
                  <PhotoIcon className="w-8 h-8" style={{ color: '#EDD0AC' }} />
                  <span className="text-xs font-semibold" style={{ color: '#A08070' }}>Click to upload a photo</span>
                  <span className="text-xs" style={{ color: '#C8A898' }}>JPG, PNG, WebP</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
              {uploadingImage && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: '#F1745E' }}>Uploading photo…</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date & Time">
                <Input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} />
              </Field>
              <Field label="End Date & Time">
                <Input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} />
              </Field>
            </div>
            <SubmitButton loading={saving}>{editingId ? 'Save Changes' : 'Create Event'}</SubmitButton>
          </form>
        </Modal>
      )}
    </div>
  )
}
