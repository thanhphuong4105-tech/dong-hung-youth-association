import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  PlusIcon, ChevronRightIcon, ChevronLeftIcon, XMarkIcon,
  UserGroupIcon, UserIcon, AcademicCapIcon, PencilIcon, TrashIcon, DocumentTextIcon,
  CalendarDaysIcon, CheckIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  burgundy: '#4F252A', coral: '#E06464', orange: '#F1745E',
  beige: '#EDD0AC', blush: '#FBC3B9', bg: '#FFF7F3',
  card: '#FFFCF8', muted: '#7A5550', faint: '#A08070',
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: `1.5px solid ${C.beige}`, backgroundColor: '#fff',
  color: C.burgundy, fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none',
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const INIT_SEMESTERS = [
  { id: 's1', name: 'Fall 2026',   startDate: '2026-08-30', endDate: '2026-12-20', status: 'Upcoming' },
  { id: 's2', name: 'Spring 2026', startDate: '2026-01-11', endDate: '2026-05-24', status: 'Active'   },
  { id: 's3', name: 'Summer 2026', startDate: '2026-06-01', endDate: '2026-08-16', status: 'Completed'},
]

const INIT_CLASSES = [
  { id: 'c1', semesterId: 's1', className: 'Beginner A',   level: 'Beginner',     teacher: 'Jade Luong',  dayOfWeek: 'Sunday', startTime: '10:00', endTime: '11:30', room: 'Room 1' },
  { id: 'c2', semesterId: 's1', className: 'Beginner B',   level: 'Beginner',     teacher: 'Kim Pham',    dayOfWeek: 'Sunday', startTime: '11:45', endTime: '13:15', room: 'Room 2' },
  { id: 'c3', semesterId: 's1', className: 'Intermediate', level: 'Intermediate', teacher: 'Anh Nguyen',  dayOfWeek: 'Sunday', startTime: '13:30', endTime: '15:00', room: 'Room 1' },
  { id: 'c4', semesterId: 's1', className: 'Advanced',     level: 'Advanced',     teacher: 'Minh Tran',   dayOfWeek: 'Sunday', startTime: '15:15', endTime: '16:45', room: 'Room 2' },
  { id: 'c5', semesterId: 's2', className: 'Beginner A',   level: 'Beginner',     teacher: 'Jade Luong',  dayOfWeek: 'Sunday', startTime: '10:00', endTime: '11:30', room: 'Room 1' },
  { id: 'c6', semesterId: 's2', className: 'Intermediate', level: 'Intermediate', teacher: 'Anh Nguyen',  dayOfWeek: 'Sunday', startTime: '13:30', endTime: '15:00', room: 'Room 1' },
  { id: 'c7', semesterId: 's3', className: 'Beginner A',   level: 'Beginner',     teacher: 'Kim Pham',    dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:30', room: 'Room 1' },
  { id: 'c8', semesterId: 's3', className: 'Advanced',     level: 'Advanced',     teacher: 'Minh Tran',   dayOfWeek: 'Saturday', startTime: '11:00', endTime: '12:30', room: 'Room 2' },
]

const INIT_STUDENTS = []

const INIT_LESSONS = [
  { id: 'l1', semesterId: 's1', classId: 'c1', title: 'Vietnamese Alphabet Review', date: '2026-09-06', topic: 'Alphabet and tones',         materials: 'Worksheet 1',      status: 'Planned'   },
  { id: 'l2', semesterId: 's1', classId: 'c1', title: 'Basic Greetings',            date: '2026-09-13', topic: 'Common phrases',              materials: 'Flashcards',       status: 'Planned'   },
  { id: 'l3', semesterId: 's1', classId: 'c1', title: 'Numbers 1–20',               date: '2026-09-20', topic: 'Numbers and counting',        materials: 'Number chart',     status: 'Planned'   },
  { id: 'l4', semesterId: 's1', classId: 'c3', title: 'Reading Comprehension',      date: '2026-09-06', topic: 'Short story analysis',        materials: 'Story booklet',    status: 'Planned'   },
  { id: 'l5', semesterId: 's1', classId: 'c4', title: 'Essay Writing',              date: '2026-09-06', topic: 'Paragraph structure',         materials: 'Writing guide',    status: 'Completed' },
]

const INIT_ATTENDANCE = []

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—'
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return dateStr }
}
function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}
function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase()
}
function calcAge(birthday) {
  if (!birthday) return null
  const today = new Date()
  const dob = new Date(birthday + 'T00:00:00')
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age >= 0 ? age : null
}

const STATUS_COLORS = {
  Upcoming:  { bg: '#EEF0FA', color: '#5A6FB5', border: '#C8D0F0' },
  Active:    { bg: '#F0FAF4', color: '#2D7A4F', border: '#A8DFC0' },
  Completed: { bg: '#F5F5F5', color: '#888',    border: '#DDD'    },
}

const AVATAR_COLORS = ['#F1745E','#E06464','#5A6FB5','#2D7A4F','#8B5CF6','#D4A843','#B0305A']

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div className={`rounded-3xl ${className}`} onClick={onClick}
      style={{ backgroundColor: C.card, border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }) {
  const base = 'font-semibold rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-sm' }
  const variants = {
    primary: { background: 'linear-gradient(135deg, #F1745E, #E06464)', color: '#fff' },
    secondary: { backgroundColor: '#fff', color: C.muted, border: `1.5px solid ${C.beige}` },
    ghost: { color: C.orange },
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${className}`} style={variants[variant]}>
      {children}
    </button>
  )
}

function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-md h-full overflow-y-auto shadow-2xl"
        style={{ backgroundColor: C.card, borderLeft: `1.5px solid ${C.beige}` }}>
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: C.beige }}>
          <h3 className="text-lg font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-orange-50"><XMarkIcon className="w-5 h-5" style={{ color: C.muted }} /></button>
        </div>
        <div className="flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>
        {label}{required && <span style={{ color: C.orange }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Shared member fetcher ────────────────────────────────────────────────────
function useMembersList() {
  const [members, setMembers] = useState([])
  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
      supabase.from('general_members').select('id, full_name').order('full_name'),
    ]).then(([appRes, genRes]) => {
      const appUsers  = (appRes.data || []).map(m => ({ ...m, _type: 'app' }))
      const genMembers = (genRes.data || []).map(m => ({ ...m, _type: 'general' }))
      setMembers([...appUsers, ...genMembers].sort((a, b) =>
        (a.full_name || '').localeCompare(b.full_name || '')
      ))
    })
  }, [])
  return members
}

const AVATAR_PALETTE = ['#F1745E','#E06464','#5A6FB5','#2D7A4F','#8B5CF6','#D4A843']
function memberDisplayName(m) { return m.full_name || m.email || 'Unknown' }
function memberSubtitle(m) {
  if (m._type === 'general') return 'General Member'
  if (m.role) return m.role.replace(/_/g, ' ')
  return m.email || 'App User'
}

// ─── Single Teacher Select ────────────────────────────────────────────────────
function TeacherSelect({ value, onChange }) {
  const members = useMembersList()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = members.filter(m =>
    memberDisplayName(m).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="flex items-center" style={{ ...inputStyle, padding: 0, overflow: 'hidden' }}>
        <input
          value={open ? search : value}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search members..."
          style={{ flex: 1, padding: '0.6rem 0.875rem', background: 'transparent', outline: 'none', border: 'none', color: '#4F252A', fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem' }}
        />
        {value && !open && (
          <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="pr-3" style={{ color: '#A08070' }}>✕</button>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch('') }} />
          <div className="absolute z-20 w-full mt-1 rounded-2xl overflow-hidden shadow-xl"
            style={{ backgroundColor: '#fff', border: '1.5px solid #EDD0AC', maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div className="px-4 py-3 text-sm" style={{ color: '#A08070' }}>No members found</div>
              : filtered.map((m, i) => (
                <button key={`${m._type}-${m.id}`} type="button"
                  onClick={() => { onChange(memberDisplayName(m)); setSearch(''); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length] }}>
                    {memberDisplayName(m)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#4F252A' }}>{memberDisplayName(m)}</p>
                    <p className="text-[10px] capitalize" style={{ color: '#A08070' }}>{memberSubtitle(m)}</p>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Multi-select TA Select ───────────────────────────────────────────────────
function TASelect({ value = [], onChange }) {
  const members = useMembersList()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = members.filter(m =>
    !value.includes(memberDisplayName(m)) &&
    memberDisplayName(m).toLowerCase().includes(search.toLowerCase())
  )

  function addTA(m) {
    onChange([...value, memberDisplayName(m)])
    setSearch('')
  }
  function removeTA(name) {
    onChange(value.filter(v => v !== name))
  }

  return (
    <div className="relative">
      {/* Selected TA chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(name => (
            <span key={name} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#FFF0EA', color: '#E06464', border: '1px solid #F4B8A8' }}>
              {name}
              <button type="button" onClick={() => removeTA(name)} style={{ lineHeight: 1, color: '#E06464' }}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center" style={{ ...inputStyle, padding: 0, overflow: 'hidden' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={value.length ? 'Add another TA...' : 'Search members...'}
          style={{ flex: 1, padding: '0.6rem 0.875rem', background: 'transparent', outline: 'none', border: 'none', color: '#4F252A', fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem' }}
        />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch('') }} />
          <div className="absolute z-20 w-full mt-1 rounded-2xl overflow-hidden shadow-xl"
            style={{ backgroundColor: '#fff', border: '1.5px solid #EDD0AC', maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div className="px-4 py-3 text-sm" style={{ color: '#A08070' }}>{search ? 'No matches' : 'All members selected'}</div>
              : filtered.map((m, i) => (
                <button key={`${m._type}-${m.id}`} type="button"
                  onClick={() => { addTA(m); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length] }}>
                    {memberDisplayName(m)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#4F252A' }}>{memberDisplayName(m)}</p>
                    <p className="text-[10px] capitalize" style={{ color: '#A08070' }}>{memberSubtitle(m)}</p>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Step 1: Semester List ───────────────────────────────────────────────────
function SemesterList({ semesters, classes, students, onOpen, onCreateSemester, onEditSemester, onDeleteSemester }) {
  function statsFor(sem) {
    const cls = classes.filter(c => c.semesterId === sem.id)
    const stu = students.filter(s => s.semesterId === sem.id)
    const teachers = [...new Set(cls.flatMap(c => [c.teacher, ...(c.assistants || [])]).filter(Boolean))]
    return { classes: cls.length, students: stu.length, teachers: teachers.length }
  }

  const statusOrder = { Active: 0, Upcoming: 1, Completed: 2 }
  const sorted = [...semesters].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))

  return (
    <div>
      {/* ── Mobile layout ── */}
      <div className="block md:hidden" style={{ backgroundColor: '#FFF7F3', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div className="px-4 pt-5 pb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Vietnamese School</h1>
            <p className="text-sm mt-0.5" style={{ color: '#7A5550' }}>Manage semesters, students, and classes.</p>
          </div>
          <button onClick={onCreateSemester}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: '#F1745E' }}>
            <PlusIcon className="w-3.5 h-3.5" /> Create Semester
          </button>
        </div>

        <div className="px-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: '#A08070' }}>No semesters yet.</p>
          ) : sorted.map(sem => {
            const stats = statsFor(sem)
            const sc = STATUS_COLORS[sem.status] || STATUS_COLORS.Upcoming
            const n = sem.name?.toLowerCase() || ''
            const emoji = n.includes('spring') ? '🌸' : n.includes('fall') || n.includes('autumn') ? '🍂' : n.includes('summer') ? '☀️' : n.includes('winter') ? '❄️' : '📅'
            return (
              <button key={sem.id} onClick={() => onOpen(sem)}
                className="w-full text-left rounded-2xl p-4"
                style={{ backgroundColor: '#ffffff', border: sem.status === 'Active' ? '2px solid #F1745E' : '1px solid #EDD0AC' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-extrabold truncate" style={{ color: '#4F252A' }}>{sem.name}</p>
                      <p className="text-xs" style={{ color: '#A08070' }}>{fmt(sem.startDate)} – {fmt(sem.endDate)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {sem.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-xs font-bold" style={{ color: '#4F252A' }}>{stats.students}</span>
                    <span className="text-xs" style={{ color: '#A08070' }}>Students</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AcademicCapIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-xs font-bold" style={{ color: '#4F252A' }}>{stats.classes}</span>
                    <span className="text-xs" style={{ color: '#A08070' }}>Classes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-xs font-bold" style={{ color: '#4F252A' }}>{stats.teachers}</span>
                    <span className="text-xs" style={{ color: '#A08070' }}>Teachers</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Vietnamese School</h2>
          <p className="text-sm" style={{ color: C.muted }}>Manage school semesters, students, classes, attendance, and lessons.</p>
        </div>
        <Btn onClick={onCreateSemester}><PlusIcon className="w-4 h-4" /> Create Semester</Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map(sem => {
          const stats = statsFor(sem)
          const sc = STATUS_COLORS[sem.status] || STATUS_COLORS.Upcoming
          const isActive = sem.status === 'Active'
          return (
            <Card key={sem.id} onClick={() => onOpen(sem)} style={{ border: isActive ? `2px solid ${C.orange}` : undefined, cursor: 'pointer' }}
              className="hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const n = sem.name?.toLowerCase() || ''
                      const emoji = n.includes('spring') ? '🌸' : n.includes('fall') || n.includes('autumn') ? '🍂' : n.includes('summer') ? '☀️' : n.includes('winter') ? '❄️' : '📅'
                      const bg    = n.includes('spring') ? '#FFF4F0' : n.includes('fall') || n.includes('autumn') ? '#FFF8F0' : n.includes('summer') ? '#FFFBEC' : n.includes('winter') ? '#F0F4FF' : '#F5F5F5'
                      return (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: bg }}>
                          {emoji}
                        </div>
                      )
                    })()}
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sem.status}
                      </span>
                      <h3 className="text-xl font-extrabold mt-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{sem.name}</h3>
                      <p className="text-xs" style={{ color: C.faint }}>{fmt(sem.startDate)} – {fmt(sem.endDate)}</p>
                    </div>
                  </div>
                  {/* Action buttons — stop propagation so they don't open the semester */}
                  <div className="flex gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEditSemester(sem)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors"
                      title="Edit semester" style={{ color: C.muted }}>
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteSemester(sem)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="Delete semester" style={{ color: C.coral }}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-sm font-bold" style={{ color: C.burgundy }}>{stats.students}</span>
                    <span className="text-xs" style={{ color: C.faint }}>Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-sm font-bold" style={{ color: C.burgundy }}>{stats.classes}</span>
                    <span className="text-xs" style={{ color: C.faint }}>Classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" style={{ color: '#A08070' }} />
                    <span className="text-sm font-bold" style={{ color: C.burgundy }}>{stats.teachers}</span>
                    <span className="text-xs" style={{ color: C.faint }}>Teachers</span>
                  </div>
                </div>

              </div>
            </Card>
          )
        })}
      </div>
      </div>{/* end desktop block */}
    </div>
  )
}

// ─── Semester Form ────────────────────────────────────────────────────────────
function SemesterForm({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'Upcoming' })
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return setErr('Semester name is required.')
    if (!form.startDate || !form.endDate) return setErr('Start and end dates are required.')
    onSave(form)
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <Field label="Semester Name" required><input name="name" value={form.name} onChange={hc} placeholder="Fall 2027" required style={inputStyle} /></Field>
      <Field label="Status">
        <select name="status" value={form.status} onChange={hc} style={inputStyle}>
          <option>Upcoming</option><option>Active</option><option>Completed</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date" required><input type="date" name="startDate" value={form.startDate} onChange={hc} required style={inputStyle} /></Field>
        <Field label="End Date" required><input type="date" name="endDate" value={form.endDate} onChange={hc} required style={inputStyle} /></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Create Semester</button>
      </div>
    </form>
  )
}

// ─── Edit Semester Form ───────────────────────────────────────────────────────
function EditSemesterForm({ semester, onSave, onClose }) {
  const [form, setForm] = useState({ name: semester.name, startDate: semester.startDate, endDate: semester.endDate, status: semester.status })
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return setErr('Semester name is required.')
    if (!form.startDate || !form.endDate) return setErr('Start and end dates are required.')
    onSave({ ...semester, ...form })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <Field label="Semester Name" required><input name="name" value={form.name} onChange={hc} required style={inputStyle} /></Field>
      <Field label="Status">
        <select name="status" value={form.status} onChange={hc} style={inputStyle}>
          <option>Upcoming</option><option>Active</option><option>Completed</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date" required><input type="date" name="startDate" value={form.startDate} onChange={hc} required style={inputStyle} /></Field>
        <Field label="End Date" required><input type="date" name="endDate" value={form.endDate} onChange={hc} required style={inputStyle} /></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Save Changes</button>
      </div>
    </form>
  )
}

// ─── Step 2: Class List ───────────────────────────────────────────────────────
function printRegistrationForm() {
  const origin = window.location.origin
  const formContent = `
<div class="header">
  <img src="${origin}/favicon.ico" alt="DHYA Logo" onerror="this.style.display='none'" />
  <h1>Trường Việt Ngữ DHYA</h1>
  <h2>Đơn Nhập Học – School Application</h2>
</div>
<table>
  <tr>
    <td style="width:50%"><div class="label">Tên Cha – Father's name</div><div class="field-line">&nbsp;</div></td>
    <td style="width:50%"><div class="label">Tên Mẹ – Mother's name</div><div class="field-line">&nbsp;</div></td>
  </tr>
  <tr><td colspan="2"><div class="label">Email</div><div class="field-line">&nbsp;</div></td></tr>
  <tr><td colspan="2"><div class="label">Địa chỉ / Address</div><div class="field-line">&nbsp;</div></td></tr>
  <tr>
    <td><div class="label">Điện thoại nhà / Home Phone</div><div class="field-line">&nbsp;</div></td>
    <td><div class="label">Điện thoại cell / Cell Phone</div><div class="field-line">&nbsp;</div></td>
  </tr>
  <tr>
    <td><div class="label">Student's English Name</div><div class="field-line">&nbsp;</div></td>
    <td><div class="label">Sinh – DOB</div><div style="display:flex;gap:10px;margin-top:3px;font-size:13px"><span>Ngày/Day ______</span><span>Tháng/Month ______</span><span>Năm/Year ______</span></div></td>
  </tr>
  <tr><td colspan="2"><div class="label">Student's Vietnamese Name</div><div class="field-line">&nbsp;</div></td></tr>
  <tr><td colspan="2"><div class="label">Email</div><div class="field-line">&nbsp;</div></td></tr>
  <tr><td colspan="2"><div class="label" style="color:#c0392b">Dị ứng với thức ăn / Foods allergy (If any)</div><div class="field-line">&nbsp;</div></td></tr>
  <tr><td colspan="2"><div style="font-weight:bold">Emergency Contact (Name/Phone)</div><div class="field-line">&nbsp;</div></td></tr>
</table>
<div class="release-box">
  <p><strong>Release Form</strong></p>
  <p>The undersigned, guardian or parent of the student applying for admission to DHYA Vietnamese School, hereby acknowledges and agrees to the following conditions regarding the safety of the student while in attendance of school:</p>
  <ol type="a">
    <li>I am responsible for the safety of the student to and from the class location.</li>
    <li>I release <strong>Dong Hung Youth Association</strong>, operated under <strong>DHYA Vietnamese School</strong>, its staff, and the class location property owner from all legal responsibilities associated with injuries to the students resulting from accidents like fire, terrorist attacks, crime.</li>
    <li>Dong Hung Youth Association <u>cannot</u> accept responsibility for any death, injury, or other loss suffered or caused by the Students resulting from any food eating from the program.</li>
  </ol>
</div>
<table style="margin-top:4px">
  <tr><td colspan="2" style="background:#f0f0f0;font-weight:bold">Phụ Huynh/Giám Hộ (hoặc học sinh trên 18 tuổi)<br/><span style="font-weight:normal">Parent/Guardian (or student if over 18 years of age)</span></td></tr>
  <tr>
    <td style="width:50%"><div class="label">Tên Cha Mẹ / Parents' Name</div><div class="field-line">&nbsp;</div></td>
    <td style="width:50%"><div class="label">Chữ Ký / Signature</div><div class="field-line">&nbsp;</div></td>
  </tr>
  <tr><td colspan="2"><div class="label">Ngày / Today's Date</div><div class="field-line" style="width:180px">&nbsp;</div></td></tr>
</table>
<div class="footer">Chúng tôi rất mong mỏi nhận được sự cộng tác dưới mọi hình thức của quý vị.</div>`

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Đơn Nhập Học – DHYA</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Preview UI ── */
  body { background: #2a2a2a; font-family: Arial, sans-serif; }
  #toolbar {
    position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 100;
    background: #3a3a3a; display: flex; align-items: center; justify-content: center;
    gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  #toolbar button {
    padding: 7px 18px; border: none; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: opacity 0.15s;
  }
  #toolbar button:hover { opacity: 0.85; }
  #btn-print { background: #F1745E; color: #fff; }
  #btn-zoom-in, #btn-zoom-out { background: #555; color: #fff; font-size: 18px; padding: 5px 14px; }
  #zoom-label { color: #ccc; font-size: 13px; min-width: 44px; text-align: center; }
  #preview-area { padding: 72px 24px 40px; display: flex; justify-content: center; min-height: 100vh; }
  #paper {
    background: #fff; width: 210mm;
    padding: 14mm 16mm; transform-origin: top center;
    box-shadow: 0 4px 32px rgba(0,0,0,0.5);
  }

  /* ── Form styles ── */
  .header { text-align: center; margin-bottom: 8px; }
  .header img { width: 60px; height: 60px; object-fit: contain; margin-bottom: 3px; }
  .header h1 { font-family: 'Times New Roman', serif; font-size: 17px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .header h2 { font-family: 'Times New Roman', serif; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 14px; }
  td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; }
  .label { font-style: normal; font-size: 12.5px; }
  .field-line { border-bottom: 1px solid #000; min-height: 18px; display: inline-block; width: 100%; margin-top: 3px; }
  .release-box { border: 1px solid #000; padding: 7px 10px; margin-top: 4px; font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.55; }
  .release-box p { margin-bottom: 5px; }
  .release-box ol { margin-left: 20px; }
  .release-box li { margin-bottom: 4px; }
  .release-box u { text-decoration: underline; }
  .footer { text-align: center; font-style: normal; margin-top: 10px; font-family: 'Times New Roman', serif; font-size: 13px; }

  /* ── Print: hide toolbar, reset paper ── */
  @media print {
    #toolbar { display: none !important; }
    body { background: #fff; }
    #preview-area { padding: 0; }
    #paper { width: 100%; padding: 0; box-shadow: none; transform: none !important; }
    @page { margin: 10mm 14mm; size: A4 portrait; }
  }
</style>
</head>
<body>
<div id="toolbar">
  <button id="btn-zoom-out">−</button>
  <span id="zoom-label">100%</span>
  <button id="btn-zoom-in">+</button>
  <button id="btn-print">🖨 Print</button>
</div>
<div id="preview-area">
  <div id="paper">${formContent}</div>
</div>
<script>
  var zoom = 1;
  function applyZoom() {
    document.getElementById('paper').style.transform = 'scale(' + zoom + ')';
    document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  }
  document.getElementById('btn-zoom-in').onclick = function() { zoom = Math.min(zoom + 0.1, 2); applyZoom(); };
  document.getElementById('btn-zoom-out').onclick = function() { zoom = Math.max(zoom - 0.1, 0.4); applyZoom(); };
  document.getElementById('btn-print').onclick = function() { window.print(); };
</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=950')
  w.document.write(html)
  w.document.close()
}

function printStudentList(semester, semClasses, students) {
  const origin = window.location.origin

  function fmtDate(d) {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return d }
  }

  const classPages = semClasses.map((cls, ci) => {
    const clsStudents = students.filter(s => s.classId === cls.id)
    if (!clsStudents.length) return null

    const teachers = [cls.teacher, ...(cls.assistants || [])].filter(Boolean).join(', ')

    const studentRows = clsStudents.map((s, i) => {
      const englishName = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || '—'
      const dob = fmtDate(s.birthday)
      const age = s.age ?? (s.birthday ? (() => { const today = new Date(); const dob2 = new Date(s.birthday + 'T00:00:00'); let a = today.getFullYear() - dob2.getFullYear(); const m = today.getMonth() - dob2.getMonth(); if (m < 0 || (m === 0 && today.getDate() < dob2.getDate())) a--; return a >= 0 ? a : '' })() : '')
      const parents = s.parents?.length ? s.parents : []
      const parentNames = parents.map(p => p.name).filter(Boolean).join('<br>')
      const phones = parents.map(p => p.phone).filter(Boolean).join('<br>')
      const hasAllergy = s.allergy && s.allergy.trim() && s.allergy.toLowerCase() !== 'none' && s.allergy.toLowerCase() !== 'n/a'
      const allergyText = hasAllergy ? `<span style="font-weight:600">${s.allergy}</span>` : 'None'
      const rowBg = i % 2 === 1 ? '#f5f5f5' : '#fff'
      return `<tr style="background:${rowBg}">
        <td style="text-align:center;font-size:12px">${i + 1}</td>
        <td><div style="font-weight:600">${englishName}</div></td>
        <td style="text-align:center">${age}</td>
        <td>${dob}</td>
        <td>${parentNames || '—'}</td>
        <td>${phones || '—'}</td>
        <td>${allergyText}</td>
        <td></td>
      </tr>`
    }).join('')

    const titleHtml = ci === 0 ? `
      <div class="doc-title">${semester.name} Student List</div>
      <div class="doc-sub">Danh Sách Học Sinh Lớp Tiếng Việt</div>` : ''

    return `<div class="page-sheet">
      ${titleHtml}
      <div class="class-block">
        <div class="class-header">${cls.className} – ${teachers}</div>
        <table>
          <thead><tr><th>No.</th><th>Student Name</th><th>Age</th><th>Birthday</th><th>Parent / Guardian</th><th>Phone</th><th>Allergy</th><th>Paid</th></tr></thead>
          <tbody>${studentRows}</tbody>
        </table>
      </div>
    </div>`
  }).filter(Boolean)

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Student List – ${semester.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #2a2a2a; font-family: Arial, sans-serif; }
  #toolbar {
    position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 100;
    background: #3a3a3a; display: flex; align-items: center; justify-content: center;
    gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  #toolbar button { padding: 7px 18px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  #btn-print { background: #F1745E; color: #fff; }
  #btn-zoom-in, #btn-zoom-out { background: #555; color: #fff; font-size: 18px; padding: 5px 14px; }
  #zoom-label { color: #ccc; font-size: 13px; min-width: 44px; text-align: center; }
  #preview-area { padding: 72px 24px 40px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .page-sheet { background: #fff; width: 280mm; padding: 14mm 16mm; transform-origin: top center; box-shadow: 0 4px 32px rgba(0,0,0,0.5); }
  .doc-title { font-family: Arial, sans-serif; font-weight: 800; font-size: 22px; color: #000; margin-bottom: 2px; text-align: center; text-transform: uppercase; }
  .doc-sub { font-size: 13px; color: #333; margin-bottom: 18px; text-align: center; font-weight: 700; }
  .class-block { border: 1.5px solid #000; }
  .class-header { font-size: 20px; font-weight: 700; padding: 6px 12px; background: #e8e8e8; color: #000; border-bottom: 1.5px solid #000; font-family: Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif; color: #000; }
  th { padding: 7px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #000; background: #f0f0f0; border-bottom: 1px solid #000; white-space: nowrap; }
  td { padding: 8px 12px; vertical-align: middle; border-bottom: 1px solid #ccc; color: #000; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  @media print {
    #toolbar { display: none !important; }
    body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    *, *::before, *::after { color: #000 !important; -webkit-text-fill-color: #000 !important; }
    a, a:visited, a:link { color: #000 !important; text-decoration: none !important; }
    #preview-area { padding: 0 !important; gap: 0 !important; display: block !important; }
    .page-sheet { width: 100% !important; padding: 10mm 12mm !important; box-shadow: none !important; transform: none !important; background: #fff !important; page-break-before: always !important; break-before: always !important; }
    .page-sheet:first-child { page-break-before: avoid !important; break-before: avoid !important; }
    .doc-title { font-size: 22px !important; font-weight: 800 !important; text-align: center !important; text-transform: uppercase !important; margin-bottom: 2px !important; color: #000 !important; }
    .doc-sub { font-size: 13px !important; font-weight: 700 !important; text-align: center !important; margin-bottom: 18px !important; color: #000 !important; }
    .class-block { border: 1.5px solid #000 !important; page-break-inside: avoid !important; }
    .class-header { font-size: 20px !important; font-weight: 700 !important; padding: 6px 12px !important; background: #e8e8e8 !important; border-bottom: 1.5px solid #000 !important; color: #000 !important; }
    table { font-size: 12px !important; border-collapse: collapse !important; }
    th { font-size: 12px !important; font-weight: 700 !important; padding: 7px 12px !important; background: #f0f0f0 !important; border-bottom: 1px solid #000 !important; text-transform: uppercase !important; color: #000 !important; }
    td { font-size: 12px !important; padding: 8px 12px !important; border-bottom: 1px solid #ccc !important; color: #000 !important; }
    td * { color: #000 !important; -webkit-text-fill-color: #000 !important; }
    tr:last-child td { border-bottom: none !important; }
    tr:nth-child(odd) td { background: #fff !important; color: #000 !important; }
    tr:nth-child(even) td { background: #f5f5f5 !important; color: #000 !important; }
    @page { margin: 10mm 12mm; size: A4 landscape; }
  }
</style>
</head>
<body>
<div id="toolbar">
  <button id="btn-zoom-out">−</button>
  <span id="zoom-label">85%</span>
  <button id="btn-zoom-in">+</button>
  <button id="btn-print">🖨 Print</button>
</div>
<div id="preview-area">
  ${classPages.length ? classPages.join('') : '<div class="page-sheet"><p style="text-align:center;color:#888;padding:20px">No students enrolled yet.</p></div>'}
</div>
<script>
  var zoom = 0.85;
  function applyZoom() {
    var sheets = document.querySelectorAll('.page-sheet');
    sheets.forEach(function(s) { s.style.transform = 'scale(' + zoom + ')'; });
    document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  }
  applyZoom();
  document.getElementById('btn-zoom-in').onclick = function() { zoom = Math.min(zoom + 0.1, 2); applyZoom(); };
  document.getElementById('btn-zoom-out').onclick = function() { zoom = Math.max(zoom - 0.1, 0.3); applyZoom(); };
  document.getElementById('btn-print').onclick = function() { window.print(); };
</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=1100,height=950')
  w.document.write(html)
  w.document.close()
}

function FormsMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold border hover:bg-orange-50 transition-colors"
        style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.card }}>
        <DocumentTextIcon className="w-4 h-4" style={{ color: C.orange }} /> Forms
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.beige, backgroundColor: C.bg }}>
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" style={{ color: C.orange }} />
                <h3 className="text-lg font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>School Forms</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-orange-100 transition-colors" style={{ color: C.muted }}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Form list */}
            <div className="px-6 py-4 space-y-3">
<div className="flex items-center justify-between gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.beige}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#FFF0EC', color: C.orange }}>
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.burgundy }}>Student Registration Form</p>
                    <p className="text-xs" style={{ color: C.faint }}>New student enrollment for the semester</p>
                  </div>
                </div>
                <button onClick={() => { setOpen(false); printRegistrationForm() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#FFF0EC', color: C.orange, border: `1px solid #F4B8A8` }}>
                  🖨 Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_MAP_CAL = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 }

function SemesterCalendarModal({ semester, dateForm, setDateForm, classDayOfWeek, onSave, onClose, students = [] }) {
  const targetDay = DAY_MAP_CAL[classDayOfWeek] ?? 0
  const [calEvents, setCalEvents] = useState(dateForm.calEvents || {}) // { 'YYYY-MM-DD': { label, noClass } }
  const [popover, setPopover] = useState(null) // { iso, label, noClass }

  // Build a map of MM-DD → [name, ...] from student birthdays
  const birthdayMap = {}
  for (const s of students) {
    const bday = s.birthday
    if (!bday) continue
    const mmdd = bday.slice(5) // 'MM-DD'
    if (!birthdayMap[mmdd]) birthdayMap[mmdd] = []
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || ''
    if (name) birthdayMap[mmdd].push(name)
  }

  function isoDate(year, month, day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function getMonths() {
    if (!dateForm.startDate || !dateForm.endDate) return []
    const start = new Date(dateForm.startDate + 'T00:00:00')
    const end   = new Date(dateForm.endDate   + 'T00:00:00')
    const months = []
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() })
      cur.setMonth(cur.getMonth() + 1)
    }
    return months
  }

  function isClassDay(year, month, day) {
    const d = new Date(year, month, day)
    if (d.getDay() !== targetDay) return false
    const s = dateForm.startDate ? new Date(dateForm.startDate + 'T00:00:00') : null
    const e = dateForm.endDate   ? new Date(dateForm.endDate   + 'T00:00:00') : null
    return (!s || d >= s) && (!e || d <= e)
  }

  function inRange(year, month, day) {
    const d = new Date(year, month, day)
    const s = dateForm.startDate ? new Date(dateForm.startDate + 'T00:00:00') : null
    const e = dateForm.endDate   ? new Date(dateForm.endDate   + 'T00:00:00') : null
    return s && e && d >= s && d <= e
  }

  function openPopover(iso, classDay) {
    const ev = calEvents[iso] || {}
    setPopover({ iso, label: ev.label || '', noClass: ev.noClass || false, isClassDay: classDay })
  }

  function savePopover() {
    if (!popover.label.trim() && !popover.noClass) {
      const next = { ...calEvents }; delete next[popover.iso]; setCalEvents(next)
    } else {
      setCalEvents(prev => ({ ...prev, [popover.iso]: { label: popover.label.trim(), noClass: popover.noClass } }))
    }
    setPopover(null)
  }

  function removeEvent(iso) {
    const next = { ...calEvents }; delete next[iso]; setCalEvents(next)
    setPopover(null)
  }

  const months = getMonths()

  function MonthGrid({ year, month }) {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div style={{ minWidth: 310 }}>
        <p className="text-base font-extrabold text-center mb-3" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="grid grid-cols-7 gap-0">
          {DOW.map(d => (
            <div key={d} className="text-center text-xs font-bold pb-2" style={{ color: C.faint }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ height: 58 }} />
            const iso      = isoDate(year, month, d)
            const mmdd     = iso.slice(5)
            const classDay = isClassDay(year, month, d)
            const ev       = calEvents[iso]
            const noClass  = ev?.noClass
            const hasLabel = ev?.label
            const inR      = inRange(year, month, d)
            const isEdge   = iso === dateForm.startDate || iso === dateForm.endDate
            const bdays    = birthdayMap[mmdd] || []

            let bg = 'transparent', color = '#444', fw = 400, border = 'none'
            if (isEdge)         { bg = 'transparent'; color = '#C0392B'; fw = 700; border = '2px solid #C0392B' }
            else if (noClass)   { bg = '#e0e0e0'; color = '#999' }
            else if (classDay)  { bg = '#d0e8f8'; color = '#1a5c8a'; fw = 700 }
            else if (hasLabel)  { bg = '#FFF0EC'; color = C.coral; fw = 600 }
            else if (bdays.length) { bg = '#FFF9C4'; color = '#B8860B'; fw = 700 }
            else if (inR)       { bg = '#FFF8F6' }

            return (
              <div key={i} className="flex flex-col items-center cursor-pointer group" style={{ minHeight: 58, paddingTop: 2 }}
                onClick={() => openPopover(iso, classDay)}>
                <div className="flex items-center justify-center text-[11px] rounded-full transition-all group-hover:ring-2 group-hover:ring-orange-300"
                  style={{ width: 52, height: 52, backgroundColor: bg, color, fontWeight: fw, border, flexShrink: 0, fontSize: 13 }}>
                  {d}
                </div>
                {hasLabel && (
                  <div className="text-[8px] leading-tight text-center mt-0.5 w-full px-0.5" style={{ color: noClass ? '#777' : C.coral, wordBreak: 'break-word', maxWidth: 58 }}>
                    {ev.label}
                  </div>
                )}
                {noClass && !hasLabel && (
                  <div className="text-[8px] leading-tight text-center mt-0.5" style={{ color: '#999' }}>off</div>
                )}
                {bdays.map((name, bi) => (
                  <div key={bi} className="text-[10px] leading-tight text-center mt-0.5 w-full px-0.5 truncate"
                    style={{ color: '#B8860B', backgroundColor: '#FFF9C4', borderRadius: 4, maxWidth: 58 }} title={`🎂 ${name}`}>
                    🎂 {name.split(' ')[0]}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', maxHeight: '90vh', width: '95vw', maxWidth: 1100 }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${C.beige}` }}>
          <h3 className="text-lg font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{semester.name} Calendar</h3>
          <p className="text-xs mb-3" style={{ color: C.faint }}>Click any date to add an event or mark a class day as off.</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>Start Date</label>
              <input type="date" value={dateForm.startDate} onChange={e => setDateForm(f => ({ ...f, startDate: e.target.value }))}
                className="rounded-xl px-3 py-1.5 text-sm border outline-none"
                style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.bg }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>End Date</label>
              <input type="date" value={dateForm.endDate} onChange={e => setDateForm(f => ({ ...f, endDate: e.target.value }))}
                className="rounded-xl px-3 py-1.5 text-sm border outline-none"
                style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.bg }} />
            </div>
            <div className="flex gap-3 ml-auto text-xs" style={{ color: C.muted }}>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ border: '2px solid #C0392B' }} /> First/Last day</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#d0e8f8' }} /> Class day</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#e0e0e0' }} /> No class</span>
              <span className="flex items-center gap-1"><span style={{ fontSize: 10 }}>🎂</span> Birthday</span>
            </div>
          </div>
        </div>
        {/* Month grid */}
        <div className="overflow-y-auto flex-1 p-6" onClick={() => popover && setPopover(null)}>
          {months.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: C.faint }}>Select a start and end date above to see the calendar.</p>
            : <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {months.map(({ year, month }) => <MonthGrid key={`${year}-${month}`} year={year} month={month} />)}
              </div>
          }
        </div>
        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: `1px solid ${C.beige}` }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-2xl text-sm font-semibold border hover:opacity-80 transition-opacity"
            style={{ borderColor: C.beige, color: C.muted, backgroundColor: '#ffffff' }}>Cancel</button>
          <button onClick={() => { onSave(calEvents) }} className="flex-1 py-2 rounded-2xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Save</button>
        </div>
      </div>

      {/* Date popover */}
      {popover && (
        <div className="fixed z-60 rounded-2xl shadow-xl p-4 w-56" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          onClick={e => e.stopPropagation()}>
          <p className="text-xs font-extrabold mb-3" style={{ color: C.burgundy }}>{new Date(popover.iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <input type="text" placeholder="Event name (e.g. Christmas Party)" value={popover.label}
            onChange={e => setPopover(p => ({ ...p, label: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && savePopover()}
            className="w-full rounded-xl px-3 py-2 text-xs border outline-none mb-3"
            style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.bg }}
            autoFocus />
          {popover.isClassDay && (
            <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer" style={{ color: C.muted }}>
              <input type="checkbox" checked={popover.noClass} onChange={e => setPopover(p => ({ ...p, noClass: e.target.checked }))}
                className="rounded" />
              No class this day
            </label>
          )}
          <div className="flex gap-2">
            {calEvents[popover.iso] && (
              <button onClick={() => removeEvent(popover.iso)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
                style={{ borderColor: '#F4B8A8', color: C.coral, backgroundColor: '#FFF0EC' }}>Remove</button>
            )}
            <button onClick={() => setPopover(null)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80"
              style={{ borderColor: C.beige, color: C.muted }}>Cancel</button>
            <button onClick={savePopover} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ClassList({ semester, classes, students, attendance, onBack, onOpenClass, onAddClass, onAddStudent, onEditClass, onDeleteClass, onUpdateSemesterDates }) {
  const semClasses = classes.filter(c => c.semesterId === semester.id)
  const semStudents = students.filter(s => s.semesterId === semester.id)
  const [showDateModal, setShowDateModal] = useState(false)
  const [dateForm, setDateForm] = useState({ startDate: semester.startDate || '', endDate: semester.endDate || '', calEvents: semester.calEvents || {} })

  function nearestSunday() {
    const d = new Date()
    const day = d.getDay()
    if (day === 0) return d.toISOString().slice(0, 10)
    const toNext = 7 - day
    const toPrev = day
    const target = new Date(d)
    target.setDate(d.getDate() + (toNext <= toPrev ? toNext : -toPrev))
    return target.toISOString().slice(0, 10)
  }
  const classDateStr = nearestSunday()

  function classAttendancePct(cls) {
    const clsStudents = students.filter(s => s.classId === cls.id)
    if (!clsStudents.length) return null
    const todayRecords = attendance.filter(a => a.classId === cls.id && a.date === classDateStr)
    if (!todayRecords.length) return null
    const present = todayRecords.filter(a => a.status === 'Present').length
    return Math.round((present / clsStudents.length) * 100)
  }

  const todayPresent = attendance.filter(a => a.semesterId === semester.id && a.date === classDateStr && (a.status === 'Present' || a.status === 'Late')).length
  const teachers = [...new Set(semClasses.flatMap(c => [c.teacher, ...(c.assistants || [])]).filter(Boolean))]

  const totalClassDays = (() => {
    const start = semester.startDate ? new Date(semester.startDate + 'T00:00:00') : null
    const end   = semester.endDate   ? new Date(semester.endDate   + 'T00:00:00') : null
    const calEvents = semester.calEvents || {}
    const targetDay = DAY_MAP_CAL[semClasses[0]?.dayOfWeek || 'Sunday'] ?? 0
    if (!start || !end) return '—'
    let count = 0
    const cur = new Date(start)
    const diff = (targetDay - cur.getDay() + 7) % 7
    cur.setDate(cur.getDate() + diff)
    while (cur <= end) {
      if (!calEvents[cur.toISOString().slice(0,10)]?.noClass) count++
      cur.setDate(cur.getDate() + 7)
    }
    return count
  })()

  const LEVEL_COLOR = {
    Introductory: { bg: '#FFF8EC', color: '#8A6200' },
    Beginner:     { bg: '#F0FAF4', color: '#2D7A4F' },
    Intermediate: { bg: '#EEF0FA', color: '#5A6FB5' },
  }

  return (
    <div>
      {/* Back + header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:opacity-70 transition-opacity" style={{ color: C.orange }}>
        <ChevronLeftIcon className="w-4 h-4" /> Back to Semesters
      </button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{semester.name}</h2>
          <p className="text-sm" style={{ color: C.muted }}>Select a class for attendance and semester management.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => { setDateForm({ startDate: semester.startDate || '', endDate: semester.endDate || '', calEvents: semester.calEvents || {} }); setShowDateModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold border hover:bg-orange-50 transition-colors"
            style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.card }}>
            <CalendarDaysIcon className="w-4 h-4" style={{ color: C.orange }} /> Calendar
          </button>
          <button onClick={() => printStudentList(semester, semClasses, students)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold border hover:bg-orange-50 transition-colors"
            style={{ borderColor: C.beige, color: C.burgundy, backgroundColor: C.card }}>
            <DocumentTextIcon className="w-4 h-4" style={{ color: C.orange }} /> Student List
          </button>
          <FormsMenu />
          <button onClick={onAddClass}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            <PlusIcon className="w-4 h-4" /> Add Class
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Students',   value: semStudents.length,                        Icon: UserGroupIcon   },
          { label: 'Classes',          value: semClasses.length,                          Icon: AcademicCapIcon },
          { label: 'Teachers',         value: teachers.length,                            Icon: UserIcon        },
          { label: 'Total Class Days', value: totalClassDays,                             Icon: CalendarDaysIcon },
          { label: 'Attendance Today', value: `${todayPresent} / ${semStudents.length}`, Icon: CheckIcon       },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <s.Icon className="w-7 h-7 shrink-0" style={{ color: '#A08070' }} />
              <div>
                <p className="text-xl font-extrabold" style={{ color: C.burgundy }}>{s.value}</p>
                <p className="text-xs" style={{ color: C.faint }}>{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Classes grid */}
      <h3 className="text-lg font-extrabold mb-4" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>
        Classes for {semester.name}
      </h3>

      {semClasses.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm" style={{ color: C.faint }}>No classes yet. Click "+ Add Class" to create one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {semClasses.map(cls => {
            const clsStudents = students.filter(s => s.classId === cls.id)
            const pct = classAttendancePct(cls)
            const lc = LEVEL_COLOR[cls.level] || LEVEL_COLOR.Introductory
            return (
              <Card key={cls.id} className="p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onOpenClass(cls)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: lc.bg, color: lc.color }}>{cls.level}</span>
                    <h4 className="text-lg font-extrabold mt-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{cls.className}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEditClass(cls)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-colors"
                      title="Edit class" style={{ color: C.muted }}>
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteClass(cls)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="Delete class" style={{ color: C.coral }}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs mt-2">
                  <div className="flex gap-2">
                    <span className="shrink-0 font-semibold" style={{ color: C.faint, minWidth: '90px' }}>Main Teacher</span>
                    <span style={{ color: C.burgundy }}>{cls.teacher || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 font-semibold" style={{ color: C.faint, minWidth: '90px' }}>TA(s)</span>
                    <span style={{ color: C.burgundy }}>
                      {cls.assistants?.length ? cls.assistants.join(', ') : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 font-semibold" style={{ color: C.faint, minWidth: '90px' }}>Hours</span>
                    <span style={{ color: C.burgundy }}>
                      {cls.dayOfWeek && cls.startTime ? `${cls.dayOfWeek} ${fmtTime(cls.startTime)} – ${fmtTime(cls.endTime)}` : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 font-semibold" style={{ color: C.faint, minWidth: '90px' }}>Total Students</span>
                    <span style={{ color: C.burgundy }}>{clsStudents.length}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Semester Calendar Modal */}
      {showDateModal && (
        <SemesterCalendarModal
          semester={semester}
          dateForm={dateForm}
          setDateForm={setDateForm}
          classDayOfWeek={semClasses[0]?.dayOfWeek || 'Sunday'}
          onSave={(calEvents) => { onUpdateSemesterDates(semester.id, { ...dateForm, calEvents }); setShowDateModal(false) }}
          onClose={() => setShowDateModal(false)}
          students={semStudents}
        />
      )}
    </div>
  )
}

const LEVEL_OPTIONS = ['Introductory', 'Beginner', 'Intermediate']
const DAY_OPTIONS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// ─── Shared class form fields ─────────────────────────────────────────────────
function ClassFormFields({ form, setForm }) {
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  return (
    <>
      <Field label="Class Name" required>
        <input name="className" value={form.className} onChange={hc} placeholder="e.g. Introductory – Group A" required style={inputStyle} />
      </Field>
      <Field label="Level">
        <select name="level" value={form.level} onChange={hc} style={inputStyle}>
          {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Main Teacher">
        <TeacherSelect value={form.teacher} onChange={v => setForm(f => ({ ...f, teacher: v }))} />
      </Field>
      <Field label="Teacher Assistant (TA)">
        <TASelect value={form.assistants || []} onChange={v => setForm(f => ({ ...f, assistants: v }))} />
      </Field>
      <Field label="Day of Week">
        <select name="dayOfWeek" value={form.dayOfWeek} onChange={hc} style={inputStyle}>
          {DAY_OPTIONS.map(d => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Time"><input type="time" name="startTime" value={form.startTime} onChange={hc} style={inputStyle} /></Field>
        <Field label="End Time"><input type="time" name="endTime" value={form.endTime} onChange={hc} style={inputStyle} /></Field>
      </div>
    </>
  )
}

// ─── Class Form ───────────────────────────────────────────────────────────────
function ClassForm({ semesterId, onSave, onClose }) {
  const [form, setForm] = useState({ className: '', level: 'Introductory', teacher: '', assistants: [], dayOfWeek: 'Sunday', startTime: '', endTime: '' })
  const [err, setErr] = useState('')
  function handleSave(e) {
    e.preventDefault()
    if (!form.className.trim()) return setErr('Class name is required.')
    onSave({ ...form, semesterId })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <ClassFormFields form={form} setForm={setForm} />
      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Add Class</button>
      </div>
    </form>
  )
}

// ─── Edit Class Form ──────────────────────────────────────────────────────────
function EditClassForm({ cls, onSave, onClose }) {
  const [form, setForm] = useState({ className: cls.className, level: cls.level, teacher: cls.teacher || '', assistants: cls.assistants || [], dayOfWeek: cls.dayOfWeek || 'Sunday', startTime: cls.startTime || '', endTime: cls.endTime || '' })
  const [err, setErr] = useState('')
  function handleSave(e) {
    e.preventDefault()
    if (!form.className.trim()) return setErr('Class name is required.')
    onSave({ ...cls, ...form })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <ClassFormFields form={form} setForm={setForm} />
      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Save Changes</button>
      </div>
    </form>
  )
}

// ─── Student Form ─────────────────────────────────────────────────────────────
function ParentEntry({ parent, index, onChange, onRemove, showRemove }) {
  function hc(e) { onChange(index, { ...parent, [e.target.name]: e.target.value }) }
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#FFF7F3', border: `1.5px solid ${C.beige}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Parent / Guardian {index + 1}</span>
        {showRemove && (
          <button type="button" onClick={() => onRemove(index)}
            className="text-xs font-semibold hover:opacity-70 flex items-center gap-1" style={{ color: C.coral }}>
            <XMarkIcon className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
      <Field label="Name"><input name="name" value={parent.name} onChange={hc} placeholder="Mrs. Nguyen" style={inputStyle} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone"><input name="phone" value={parent.phone} onChange={hc} placeholder="757-123-4567" style={inputStyle} /></Field>
        <Field label="Email"><input name="email" value={parent.email} onChange={hc} placeholder="parent@example.com" style={inputStyle} /></Field>
      </div>
    </div>
  )
}

function StudentForm({ semesterId, classId, classes, registry = [], onSave, onClose }) {
  const semClasses = classes.filter(c => c.semesterId === semesterId)
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthday: '', allergy: '',
    classId: classId || (semClasses[0]?.id || ''),
  })
  const [parents, setParents] = useState([{ name: '', phone: '', email: '' }])
  const [err, setErr] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function updateParent(i, val) { setParents(p => p.map((x, idx) => idx === i ? val : x)) }
  function addParent() { setParents(p => [...p, { name: '', phone: '', email: '' }]) }
  function removeParent(i) { setParents(p => p.filter((_, idx) => idx !== i)) }

  function handleNameChange(e) {
    const val = e.target.value
    setForm(f => ({ ...f, firstName: val }))
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    const q = val.toLowerCase()
    const matches = registry.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      (r.firstName || '').toLowerCase().includes(q)
    )
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  }

  function applyRegistryEntry(entry) {
    setForm(f => ({
      ...f,
      firstName: entry.firstName || '',
      lastName:  entry.lastName  || '',
      birthday:  entry.birthday  || '',
      allergy:   entry.allergy   || '',
    }))
    if (entry.parents?.length) setParents(entry.parents)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.firstName.trim()) return setErr('First name is required.')
    onSave({ ...form, semesterId, age: calcAge(form.birthday), parents })
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required>
          <div className="relative">
            <input name="firstName" value={form.firstName} onChange={handleNameChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Linh" required style={inputStyle} autoComplete="off" />
            {showSuggestions && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full rounded-2xl overflow-hidden shadow-lg"
                style={{ backgroundColor: '#fff', border: '1.5px solid #EDD0AC' }}>
                {suggestions.map((entry, i) => (
                  <button key={i} type="button" onMouseDown={() => applyRegistryEntry(entry)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex items-center justify-between"
                    style={{ color: '#4F252A' }}>
                    <span className="font-semibold">{entry.fullName}</span>
                    {entry.birthday && <span className="text-xs" style={{ color: '#A08070' }}>{entry.birthday}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Last Name"><input name="lastName" value={form.lastName} onChange={hc} placeholder="Nguyen" style={inputStyle} /></Field>
      </div>
      <Field label="Birthday"><input type="date" name="birthday" value={form.birthday} onChange={hc} style={inputStyle} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Class">
          <select name="classId" value={form.classId} onChange={hc} style={inputStyle}>
            {semClasses.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
        </Field>
        <Field label="Allergy"><input name="allergy" value={form.allergy} onChange={hc} placeholder="e.g. Peanuts, None" style={inputStyle} /></Field>
      </div>

      {/* Parents section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Parents / Guardians</span>
          <button type="button" onClick={addParent}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: C.orange }}>
            <PlusIcon className="w-3.5 h-3.5" /> Add Parent
          </button>
        </div>
        {parents.map((p, i) => (
          <ParentEntry key={i} parent={p} index={i} onChange={updateParent} onRemove={removeParent} showRemove={parents.length > 1} />
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Add Student</button>
      </div>
    </form>
  )
}

// ─── Students Tab ─────────────────────────────────────────────────────────────
function StudentsTab({ students, cls, onAddStudent, onUpdateStudent, onDeleteStudent }) {
  const [editingStudent, setEditingStudent] = useState(null)
  const [deletingStudent, setDeletingStudent] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const [editParents, setEditParents] = useState([])

  function openEdit(s) {
    setEditingStudent(s)
    setEditForm({ firstName: s.firstName, lastName: s.lastName, birthday: s.birthday || '', allergy: s.allergy || '' })
    setEditParents(s.parents?.length ? s.parents : [{ name: s.parentName || '', phone: s.parentPhone || '', email: s.parentEmail || '' }])
  }
  function saveEdit(e) {
    e.preventDefault()
    onUpdateStudent({ ...editingStudent, ...editForm, age: calcAge(editForm.birthday), parents: editParents })
    setEditingStudent(null)
  }
  function hef(e) { setEditForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function updateEditParent(i, val) { setEditParents(p => p.map((x, idx) => idx === i ? val : x)) }
  function addEditParent() { setEditParents(p => [...p, { name: '', phone: '', email: '' }]) }
  function removeEditParent(i) { setEditParents(p => p.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
              <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide w-10" style={{ color: C.muted }}>No.</th>
              {['Student Name','Age','Birthday','Parent / Guardian','Phone','Allergy','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0
              ? <tr><td colSpan={8} className="py-10 text-center text-sm" style={{ color: C.faint }}>No students yet. Click "+ Add Student" to enroll one.</td></tr>
              : [...students].sort((a, b) => {
                  const la = (a.lastName || '').toLowerCase(), lb = (b.lastName || '').toLowerCase()
                  if (la !== lb) return la.localeCompare(lb)
                  return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase())
                }).map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? `1px solid #F5EDE4` : 'none' }} className="hover:bg-orange-50">
                <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.faint }}>{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold" style={{ color: C.burgundy }}>{s.firstName} {s.lastName}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{calcAge(s.birthday) ?? '—'}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{s.birthday ? fmt(s.birthday) : '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>
                  {(() => {
                    const pList = s.parents?.length ? s.parents : (s.parentName ? [{ name: s.parentName }] : [])
                    return pList.length ? pList.map((p, i) => <div key={i}>{p.name || '—'}</div>) : '—'
                  })()}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>
                  {(() => {
                    const pList = s.parents?.length ? s.parents : (s.parentPhone ? [{ phone: s.parentPhone }] : [])
                    return pList.length ? pList.map((p, i) => <div key={i}>{p.phone || '—'}</div>) : '—'
                  })()}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: s.allergy ? '#B0305A' : C.faint }}>
                  {s.allergy || <span style={{ color: C.faint }}>None</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100" style={{ color: C.muted }}><PencilIcon className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingStudent(s)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: C.coral }}><TrashIcon className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit student drawer-style modal */}
      {editingStudent && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingStudent(null) }}>
          <div className="w-full max-w-md rounded-3xl p-6 overflow-y-auto max-h-[90vh]" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}` }}>
            <h4 className="font-extrabold text-lg mb-4" style={{ color: C.burgundy }}>Edit Student</h4>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name"><input name="firstName" value={editForm.firstName} onChange={hef} style={inputStyle} /></Field>
                <Field label="Last Name"><input name="lastName" value={editForm.lastName} onChange={hef} style={inputStyle} /></Field>
              </div>
              <Field label="Birthday"><input type="date" name="birthday" value={editForm.birthday} onChange={hef} style={inputStyle} /></Field>
              <Field label="Allergy"><input name="allergy" value={editForm.allergy} onChange={hef} placeholder="e.g. Peanuts, None" style={inputStyle} /></Field>
              {/* Parents */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Parents / Guardians</span>
                  <button type="button" onClick={addEditParent}
                    className="text-xs font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: C.orange }}>
                    <PlusIcon className="w-3.5 h-3.5" /> Add Parent
                  </button>
                </div>
                {editParents.map((p, i) => (
                  <ParentEntry key={i} parent={p} index={i} onChange={updateEditParent} onRemove={removeEditParent} showRemove={editParents.length > 1} />
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Btn variant="secondary" onClick={() => setEditingStudent(null)} className="flex-1">Cancel</Btn>
                <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete student confirm */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.45)' }}>
          <div className="w-full max-w-sm rounded-3xl p-7" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF0EC' }}>
              <TrashIcon className="w-6 h-6" style={{ color: C.coral }} />
            </div>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: C.burgundy }}>Remove Student?</h3>
            <p className="text-sm mb-6" style={{ color: C.muted }}>
              Remove <strong>{deletingStudent.firstName} {deletingStudent.lastName}</strong> from this class? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => setDeletingStudent(null)}>Cancel</Btn>
              <button onClick={() => { onDeleteStudent(deletingStudent.id); setDeletingStudent(null) }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E06464, #C04040)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Class Detail ─────────────────────────────────────────────────────
function ClassDetail({ cls, semester, students, attendance, lessons, onBack, onUpdateAttendance, onAddLesson, onAddStudent, onUpdateStudent, onDeleteStudent }) {
  const [tab, setTab] = useState('attendance')
  const clsStudents = students.filter(s => s.classId === cls.id)
  const todayStr = new Date().toISOString().slice(0, 10)
  function nearestSunday() {
    const d = new Date()
    const day = d.getDay() // 0=Sun
    if (day === 0) return d.toISOString().slice(0, 10)
    // go back to last Sunday if past midweek, else forward to next Sunday
    const toNext = 7 - day
    const toPrev = day
    const target = new Date(d)
    target.setDate(d.getDate() + (toNext <= toPrev ? toNext : -toPrev))
    return target.toISOString().slice(0, 10)
  }
  const [attendDate, setAttendDate] = useState(nearestSunday)
  const [noteStudentId, setNoteStudentId] = useState(null)
  function printAttendance(startDate, endDate) {
    // Generate all class dates (weekly on cls.dayOfWeek) within the semester range
    const DAY_MAP = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 }
    const semStart = startDate ? new Date(startDate + 'T00:00:00') : null
    const semEnd   = endDate   ? new Date(endDate   + 'T00:00:00') : null
    const targetDay = cls.dayOfWeek ? DAY_MAP[cls.dayOfWeek] : 0

    const calEvents = semester.calEvents || {}
    const classDates = []
    if (semStart && semEnd) {
      const cur = new Date(semStart)
      const diff = (targetDay - cur.getDay() + 7) % 7
      cur.setDate(cur.getDate() + diff)
      while (cur <= semEnd) {
        const iso = cur.toISOString().slice(0, 10)
        classDates.push(iso)
        cur.setDate(cur.getDate() + 7)
      }
    }

    // attendance lookup: { studentId: { date: status } }
    const attMap = {}
    attendance.filter(a => a.classId === cls.id).forEach(a => {
      if (!attMap[a.studentId]) attMap[a.studentId] = {}
      attMap[a.studentId][a.date] = a.status
    })

    const fmtCol = d => {
      const dt = new Date(d + 'T00:00:00')
      return `${dt.getMonth()+1}/${dt.getDate()}`
    }

    const teachers = [cls.teacher, ...(cls.assistants || [])].filter(Boolean).join(', ')

    const headerCols = classDates.map(d => {
      const noClass = calEvents[d]?.noClass
      return noClass
        ? `<th style="background:#e0e0e0 !important;color:#999;">${fmtCol(d)}</th>`
        : `<th>${fmtCol(d)}</th>`
    }).join('')
    const bodyRows = clsStudents.map((s, i) => {
      const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()
      const dob = s.birthday || s.dob ? new Date((s.birthday || s.dob) + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : ''
      const cells = classDates.map(d => {
        const status = attMap[s.id]?.[d]
        const noClass = calEvents[d]?.noClass
        let bg = '#ffffff'
        if (noClass) bg = '#e0e0e0'
        else if (status === 'Present') bg = '#d0e8f8'
        else if (status === 'Late') bg = '#ffe08a'
        else if (status === 'Absent') bg = '#f4b8c8'
        else if (d < new Date().toISOString().slice(0,10)) bg = '#f5f5f5'
        const mark = status === 'Present' ? '<span style="color:#2D7A4F;font-size:13px;font-weight:700">✓</span>'
          : status === 'Late' ? '<span style="color:#8A6200;font-size:11px;font-weight:700">L</span>'
          : ''
        return `<td style="background:${bg}">${mark}</td>`
      }).join('')
      return `<tr>
        <td class="name-cell" style="font-weight:700;font-size:12px">
          ${i+1}. ${sName}${dob ? `<br><span style="font-weight:400;font-size:11px;color:#666">DOB: ${dob}</span>` : ''}
        </td>
        ${cells}
      </tr>`
    }).join('')


    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Attendance – ${cls.className}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 24px; color: #222; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h2 { text-align:center; text-decoration:underline; text-transform:uppercase; margin-bottom:4px; font-size:16px; }
  .sub { text-align:center; font-size:13px; color:#444; margin-bottom:16px; }
  table { border-collapse:collapse; width:100%; table-layout:fixed; }
  col.name-col { width:160px; }
  col.date-col { width:auto; }
  th { background:#f0f0f0; border:1px solid #ccc; padding:5px 2px; font-size:11px; text-align:center; }
  th.name-col { text-align:left; padding-left:8px; }
  td { padding:4px 2px; height:34px; text-align:center; border:1px solid #ccc; }
  td.name-cell { text-align:left; padding:6px 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @media print { body { margin:12px; } }
</style></head><body>
<h2>Attendance (${cls.className})</h2>
<div class="sub">Teachers: ${teachers}</div>
<table>
  <colgroup><col class="name-col">${classDates.map(() => '<col class="date-col">').join('')}</colgroup>
  <thead><tr><th class="name-col">Name</th>${headerCols}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`
    const w = window.open('', '_blank', 'width=1100,height=800')
    w.document.write(html)
    w.document.close()
  }
  const [noteText, setNoteText] = useState('')

  // Build attendance map for selected date
  const attendMap = useMemo(() => {
    const map = {}
    attendance.filter(a => a.classId === cls.id && a.date === attendDate).forEach(a => { map[a.studentId] = a })
    return map
  }, [attendance, cls.id, attendDate])

  const [localAttend, setLocalAttend] = useState({})
  // Reset local attendance when date changes
  useMemo(() => { setLocalAttend({}) }, [attendDate, cls.id])

  function getStatus(studentId) {
    return localAttend[studentId]?.status || attendMap[studentId]?.status || null
  }
  function setStatus(studentId, status) {
    setLocalAttend(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }))
    const record = [{
      studentId, classId: cls.id, semesterId: semester.id,
      date: attendDate,
      status,
      notes: getNote(studentId) || '',
    }]
    onUpdateAttendance(record, attendDate)
  }
  function getNote(studentId) {
    return localAttend[studentId]?.notes ?? attendMap[studentId]?.notes ?? ''
  }
  function setNote(studentId, notes) {
    setLocalAttend(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }))
  }

  // Summary
  const presentCount = clsStudents.filter(s => getStatus(s.id) === 'Present').length
  const lateCount    = clsStudents.filter(s => getStatus(s.id) === 'Late').length
  const absentCount  = clsStudents.filter(s => getStatus(s.id) === 'Absent').length
  const pct = clsStudents.length ? Math.round(((presentCount + lateCount) / clsStudents.length) * 100) : 0

  const TABS = [
    { id: 'students',   label: 'Students'   },
    { id: 'attendance', label: 'Attendance' },
    { id: 'lessons',    label: 'Lessons'    },
    { id: 'parents',    label: 'Parents'    },
  ]

  const clsLessons = lessons.filter(l => l.classId === cls.id)

  // Attendance stats across all recorded dates
  const attendanceStats = useMemo(() => {
    const allClsAttendance = attendance.filter(a => a.classId === cls.id)
    return clsStudents.map(s => {
      const records = allClsAttendance.filter(a => a.studentId === s.id)
      const absences = records.filter(a => a.status === 'Absent').length
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()
      return { name, absences }
    })
  }, [attendance, cls.id, clsStudents])

  const perfectStudents = attendanceStats.filter(s => s.absences === 0).map(s => s.name)
  const goodStudents    = attendanceStats.filter(s => s.absences > 0 && s.absences < 3).map(s => s.name)

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:opacity-70 transition-opacity" style={{ color: C.orange }}>
        <ChevronLeftIcon className="w-4 h-4" /> Back to {semester.name} Classes
      </button>

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{cls.className}</h2>
        <p className="text-sm" style={{ color: C.muted }}>Manage class details, students, attendance, lessons, and parents for {semester.name}.</p>
      </div>

      {/* Two-column layout: main content left, summary right */}
      <div className="flex gap-5 items-start">
      {/* Left column */}
      <div className="flex-1 min-w-0">

      {/* Class info card */}
      <Card className="px-6 py-4 mb-6">
        <div className="flex items-center divide-x" style={{ divideColor: C.beige }}>
          {/* Main Teacher */}
          <div className="flex items-center gap-3 pr-8">
            <UserIcon className="w-6 h-6 shrink-0" style={{ color: C.faint }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: C.faint }}>Main Teacher</p>
              <p className="text-sm font-bold whitespace-nowrap" style={{ color: C.burgundy }}>{cls.teacher || '—'}</p>
            </div>
          </div>
          {/* Assistant Teacher(s) */}
          <div className="flex items-center gap-3 px-8">
            <UserGroupIcon className="w-6 h-6 shrink-0" style={{ color: C.faint }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: C.faint }}>Assistant Teacher(s)</p>
              {cls.assistants?.length
                ? cls.assistants.map((a, i) => (
                    <p key={i} className="text-sm font-bold whitespace-nowrap" style={{ color: C.burgundy }}>{a}</p>
                  ))
                : <p className="text-sm font-bold" style={{ color: C.burgundy }}>—</p>
              }
            </div>
          </div>
          {/* Schedule */}
          <div className="flex items-center gap-3 px-8">
            <CalendarDaysIcon className="w-6 h-6 shrink-0" style={{ color: C.faint }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: C.faint }}>Schedule</p>
              {cls.dayOfWeek ? (
                <>
                  <p className="text-sm font-bold" style={{ color: C.burgundy }}>Every {cls.dayOfWeek}</p>
                  {cls.startTime && <p className="text-xs font-semibold" style={{ color: C.muted }}>{fmtTime(cls.startTime)} – {fmtTime(cls.endTime)}</p>}
                </>
              ) : <p className="text-sm font-bold" style={{ color: C.burgundy }}>—</p>}
            </div>
          </div>
          {/* Students */}
          <div className="flex items-center gap-3 pl-8">
            <UserGroupIcon className="w-6 h-6 shrink-0" style={{ color: C.faint }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: C.faint }}>Students</p>
              <p className="text-sm font-bold" style={{ color: C.burgundy }}>{clsStudents.length}</p>
            </div>
            {(perfectStudents.length > 0 || goodStudents.length > 0) && (
              <div className="flex flex-col gap-1 ml-4 pl-4" style={{ borderLeft: `1px solid ${C.beige}` }}>
                {perfectStudents.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#F0FAF4', color: '#2D7A4F' }}>⭐ Perfect Attendance</span>
                    <span className="text-xs font-semibold" style={{ color: C.burgundy }}>{perfectStudents.join(', ')}</span>
                  </div>
                )}
                {goodStudents.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#FFF8EC', color: '#8A6200' }}>👍 Good Attendance</span>
                    <span className="text-xs font-semibold" style={{ color: C.burgundy }}>{goodStudents.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 border-b" style={{ borderColor: C.beige }}>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-sm font-semibold transition-all rounded-t-xl"
              style={tab === t.id
                ? { color: C.orange, borderBottom: `2.5px solid ${C.orange}`, marginBottom: '-1.5px', backgroundColor: '#FFF4F0' }
                : { color: C.muted }}>
              {t.label}
              {t.id === 'attendance' && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FFF0EC', color: C.orange }}>★</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-1">
          {tab === 'students' && (
            <Btn size="sm" onClick={() => onAddStudent(cls.id)}><PlusIcon className="w-3.5 h-3.5" /> Add Student</Btn>
          )}
          {tab === 'lessons' && (
            <Btn size="sm" onClick={onAddLesson}><PlusIcon className="w-3.5 h-3.5" /> Add Lesson</Btn>
          )}
          {tab === 'attendance' && (
            <button onClick={() => printAttendance(semester.startDate, semester.endDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border hover:opacity-80 transition-opacity"
              style={{ borderColor: C.beige, color: C.muted, backgroundColor: '#ffffff' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
              </svg>
              Print Attendance Record
            </button>
          )}
        </div>
      </div>

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && (
        <div>
          <div>
            {/* Date nav card */}
            <div className="rounded-2xl px-5 py-4 mb-3" style={{ backgroundColor: '#ffffff', border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-4">
                <button onClick={() => { const d = new Date(attendDate); d.setDate(d.getDate() - 7); setAttendDate(d.toISOString().slice(0, 10)) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border hover:bg-orange-50 transition-colors"
                  style={{ borderColor: C.beige, color: C.muted }}>
                  <ChevronLeftIcon className="w-3.5 h-3.5" /> Previous Class
                </button>
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4" style={{ color: C.orange }} />
                    <span className="font-extrabold text-base" style={{ color: C.burgundy }}>
                      {new Date(attendDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {cls.dayOfWeek && <span className="text-xs mt-0.5" style={{ color: C.faint }}>(Every {cls.dayOfWeek})</span>}
                </div>
                <button onClick={() => { const d = new Date(attendDate); d.setDate(d.getDate() + 7); setAttendDate(d.toISOString().slice(0, 10)) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border hover:bg-orange-50 transition-colors"
                  style={{ borderColor: C.beige, color: C.orange }}>
                  Next Class <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex justify-end gap-3 mb-4">
              <button onClick={() => {
                  const records = clsStudents.map(s => ({ studentId: s.id, classId: cls.id, semesterId: semester.id, date: attendDate, status: 'Present', notes: getNote(s.id) || '' }))
                  setLocalAttend(prev => { const n = { ...prev }; clsStudents.forEach(s => { n[s.id] = { ...n[s.id], status: 'Present' } }); return n })
                  onUpdateAttendance(records, attendDate)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#F0FAF4', color: '#2D7A4F', border: '1.5px solid #A8DFC0' }}>
                <CheckIcon className="w-3.5 h-3.5" /> Mark All Present
              </button>
              <button onClick={() => {
                  setLocalAttend({})
                  onUpdateAttendance(null, attendDate)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold border hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#FFF0EC', color: C.coral, border: `1.5px solid #F4B8A8` }}>
                <ArrowPathIcon className="w-3.5 h-3.5" /> Clear Attendance
              </button>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                    <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide w-8" style={{ color: C.muted }}>No.</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Student Name</th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Present</th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Late</th>
                    <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide" style={{ color: C.muted }}>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {clsStudents.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: C.faint }}>No students in this class yet.</td></tr>
                  ) : [...clsStudents].sort((a, b) => {
                      const la = (a.lastName || '').toLowerCase(), lb = (b.lastName || '').toLowerCase()
                      if (la !== lb) return la.localeCompare(lb)
                      return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase())
                    }).map((s, i) => {
                    const status = getStatus(s.id)
                    return (
                      <tr key={s.id} style={{ borderBottom: i < clsStudents.length - 1 ? `1px solid #F5EDE4` : 'none' }}
                        className="hover:bg-orange-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.faint }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold" style={{ color: C.burgundy }}>{s.firstName} {s.lastName}</span>
                        </td>
                        {['Present', 'Late', 'Absent'].map(st => {
                          const active = status === st
                          const colors = { Present: { bg: '#E8F8EF', color: '#2D7A4F', border: '#A8DFC0', activeBg: '#D0F0DC' }, Late: { bg: '#FFF8EC', color: '#8A6200', border: '#F0D080', activeBg: '#FFE8A0' }, Absent: { bg: '#FFF0F5', color: '#B0305A', border: '#F4B0C8', activeBg: '#FFD0E0' } }
                          const cc = colors[st]
                          return (
                            <td key={st} className="px-3 py-3 text-center">
                              <button onClick={() => setStatus(s.id, st)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                style={{ backgroundColor: active ? cc.activeBg : cc.bg, color: cc.color, border: `1.5px solid ${active ? cc.color : cc.border}`, fontWeight: active ? 800 : 600, transform: active ? 'scale(1.05)' : 'scale(1)' }}>
                                {st}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            {/* Note modal */}
            {noteStudentId && (() => {
              const s = clsStudents.find(x => x.id === noteStudentId)
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.4)' }}
                  onClick={e => { if (e.target === e.currentTarget) { setNote(noteStudentId, noteText); setNoteStudentId(null) } }}>
                  <div className="w-full max-w-sm rounded-3xl p-6" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}` }}>
                    <h4 className="font-extrabold mb-3" style={{ color: C.burgundy }}>Note for {s?.firstName} {s?.lastName}</h4>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Add a note..." style={{ ...inputStyle, resize: 'vertical' }} />
                    <div className="flex gap-3 mt-4">
                      <Btn variant="secondary" className="flex-1" onClick={() => setNoteStudentId(null)}>Cancel</Btn>
                      <button className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white"
                        style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}
                        onClick={() => { setNote(noteStudentId, noteText); setNoteStudentId(null) }}>Save Note</button>
                    </div>
                  </div>
                </div>
              )
            })()}

          </div>
        </div>
      )}

      {/* ── Students Tab ── */}
      {tab === 'students' && (
        <StudentsTab
          students={clsStudents}
          cls={cls}
          onAddStudent={onAddStudent}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={onDeleteStudent}
        />
      )}

      {/* ── Lessons Tab ── */}
      {tab === 'lessons' && (
        <div>
          <p className="text-sm mb-4" style={{ color: C.muted }}>{clsLessons.length} lessons planned</p>
          <Card className="overflow-hidden">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                  {['Lesson Title','Date','Topic','Materials','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clsLessons.length === 0
                  ? <tr><td colSpan={6} className="py-10 text-center text-sm" style={{ color: C.faint }}>No lessons yet.</td></tr>
                  : clsLessons.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < clsLessons.length - 1 ? `1px solid #F5EDE4` : 'none' }} className="hover:bg-orange-50">
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: C.burgundy }}>{l.title}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(l.date)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{l.topic}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{l.materials}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={l.status === 'Completed' ? { backgroundColor: '#F0FAF4', color: '#2D7A4F', border: '1px solid #A8DFC0' } : { backgroundColor: '#EEF0FA', color: '#5A6FB5', border: '1px solid #C8D0F0' }}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100" style={{ color: C.muted }}><PencilIcon className="w-3.5 h-3.5" /></button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: C.coral }}><TrashIcon className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Parents Tab ── */}
      {tab === 'parents' && (() => {
        const rows = clsStudents.flatMap(s => {
          const pList = s.parents?.length ? s.parents : (s.parentName ? [{ name: s.parentName, phone: s.parentPhone || '', email: s.parentEmail || '' }] : [])
          return pList.map((p, pi) => ({ ...p, studentName: `${s.firstName} ${s.lastName}`, key: `${s.id}-${pi}` }))
        })
        return (
          <Card className="overflow-hidden">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                  {['Parent Name','Student','Phone','Email'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={4} className="py-10 text-center text-sm" style={{ color: C.faint }}>No parents listed. Add students with parent info to see them here.</td></tr>
                  : rows.map((r, i) => (
                  <tr key={r.key} style={{ borderBottom: i < rows.length - 1 ? `1px solid #F5EDE4` : 'none' }} className="hover:bg-orange-50">
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: C.burgundy }}>{r.name || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{r.studentName}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{r.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{r.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      })()}

      </div>{/* end left column */}

      {/* Right column — sticky Attendance Summary */}
      <div className="w-64 shrink-0 sticky top-4">
        <Card className="p-5">
          <h4 className="text-sm font-extrabold mb-4" style={{ color: C.burgundy }}>Attendance Summary</h4>
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F0F0F0" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2D7A4F" strokeWidth="4"
                  strokeDasharray={`${pct * 0.879} ${100 - pct * 0.879}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold" style={{ color: C.burgundy }}>{clsStudents.length}</span>
                <span className="text-[10px]" style={{ color: C.faint }}>Students</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Present', count: presentCount, color: '#2D7A4F', dot: '#A8DFC0' },
              { label: 'Late',    count: lateCount,    color: '#8A6200', dot: '#F0D080' },
              { label: 'Absent',  count: absentCount,  color: '#B0305A', dot: '#F4B0C8' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.dot }} />
                  <span style={{ color: C.muted }}>{r.label}</span>
                </div>
                <span className="font-bold" style={{ color: r.color }}>{r.count} ({clsStudents.length ? Math.round(r.count / clsStudents.length * 100) : 0}%)</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-sm" style={{ borderTop: `1px solid ${C.beige}` }}>
            <span className="font-semibold" style={{ color: C.muted }}>Total Students Present</span>
            <span className="font-extrabold" style={{ color: C.burgundy }}>{presentCount + lateCount}</span>
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <div className="flex gap-2">
            <span className="text-base mt-0.5">💡</span>
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.burgundy }}>Tip: </span>
              Click "Mark All Present" to quickly set all students as present, then update any changes as needed.
            </p>
          </div>
        </Card>
      </div>

      </div>{/* end two-column layout */}

    </div>
  )
}

// ─── Lesson Form ──────────────────────────────────────────────────────────────
function LessonForm({ classId, semesterId, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', date: '', topic: '', materials: '', status: 'Planned' })
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({ ...form, classId, semesterId })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Field label="Lesson Title" required><input name="title" value={form.title} onChange={hc} required style={inputStyle} /></Field>
      <Field label="Date"><input type="date" name="date" value={form.date} onChange={hc} style={inputStyle} /></Field>
      <Field label="Topic"><input name="topic" value={form.topic} onChange={hc} style={inputStyle} /></Field>
      <Field label="Materials"><input name="materials" value={form.materials} onChange={hc} style={inputStyle} /></Field>
      <Field label="Status">
        <select name="status" value={form.status} onChange={hc} style={inputStyle}>
          <option>Planned</option><option>Completed</option><option>Cancelled</option>
        </select>
      </Field>
      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancel</Btn>
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>Add Lesson</button>
      </div>
    </form>
  )
}

// ─── DB mappers ──────────────────────────────────────────────────────────────
function semFromDB(r) { return { id: r.id, name: r.name, startDate: r.start_date || '', endDate: r.end_date || '', status: r.status || 'Upcoming', calEvents: r.cal_events || {} } }
function semToDB(s)   { return { id: s.id, name: s.name, start_date: s.startDate || null, end_date: s.endDate || null, status: s.status || 'Upcoming', cal_events: s.calEvents || {} } }

function clsFromDB(r) { return { id: r.id, semesterId: r.semester_id, className: r.class_name, level: r.level || '', teacher: r.teacher || '', assistants: r.assistants || [], dayOfWeek: r.day_of_week || 'Sunday', startTime: r.start_time || '', endTime: r.end_time || '', room: r.room || '' } }
function clsToDB(c)   { return { id: c.id, semester_id: c.semesterId, class_name: c.className, level: c.level || null, teacher: c.teacher || null, assistants: c.assistants || [], day_of_week: c.dayOfWeek || null, start_time: c.startTime || null, end_time: c.endTime || null, room: c.room || null } }

function stuFromDB(r) { return { id: r.id, semesterId: r.semester_id, classId: r.class_id || null, firstName: r.first_name || '', lastName: r.last_name || '', birthday: r.birthday || '', allergy: r.allergy || '', parents: r.parents || [], age: r.age || null } }
function stuToDB(s)   { return { id: s.id, semester_id: s.semesterId, class_id: s.classId || null, first_name: s.firstName || null, last_name: s.lastName || null, birthday: s.birthday || null, allergy: s.allergy || null, parents: s.parents || [], age: s.age || null } }

function lesFromDB(r) { return { id: r.id, semesterId: r.semester_id, classId: r.class_id, title: r.title, date: r.date || '', topic: r.topic || '', materials: r.materials || '', status: r.status || 'Planned' } }
function lesToDB(l)   { return { id: l.id, semester_id: l.semesterId, class_id: l.classId, title: l.title, date: l.date || null, topic: l.topic || null, materials: l.materials || null, status: l.status || 'Planned' } }

function attFromDB(r) { return { id: r.id, classId: r.class_id, studentId: r.student_id, date: r.date, status: r.status || '', note: r.note || '' } }
function attToDB(a)   { return { id: a.id, class_id: a.classId, student_id: a.studentId, date: a.date, status: a.status || null, note: a.note || null } }

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function VietnameseSchool() {
  const [semesters,  setSemesters]  = useState([])
  const [classes,    setClasses]    = useState([])
  const [students,   setStudents]   = useState([])
  const [attendance, setAttendance] = useState([])
  const [lessons,    setLessons]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [migrating,  setMigrating]  = useState(false)
  const [registry,   setRegistry]   = useState(() => { try { return JSON.parse(localStorage.getItem('dhya_student_registry') || '[]') } catch { return [] } })

  // ── Fetch all data from Supabase ──────────────────────────────────────────
  async function fetchAll() {
    const [semRes, clsRes, stuRes, lesRes, attRes] = await Promise.all([
      supabase.from('vs_semesters').select('*').order('created_at'),
      supabase.from('vs_classes').select('*').order('created_at'),
      supabase.from('vs_students').select('*').order('created_at'),
      supabase.from('vs_lessons').select('*').order('created_at'),
      supabase.from('vs_attendance').select('*'),
    ])
    setSemesters((semRes.data || []).map(semFromDB))
    setClasses((clsRes.data || []).map(clsFromDB))
    setStudents((stuRes.data || []).map(stuFromDB))
    setLessons((lesRes.data || []).map(lesFromDB))
    setAttendance((attRes.data || []).map(attFromDB))
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── Sync registry from students ───────────────────────────────────────────
  useEffect(() => {
    if (!students.length) return
    setRegistry(prev => {
      const updated = [...prev]
      for (const s of students) {
        const fullName = `${s.firstName} ${s.lastName}`.trim()
        if (!fullName) continue
        const exists = updated.findIndex(r => r.fullName.toLowerCase() === fullName.toLowerCase())
        const entry = { fullName, firstName: s.firstName, lastName: s.lastName, birthday: s.birthday || '', allergy: s.allergy || '', parents: s.parents || [] }
        if (exists >= 0) updated[exists] = { ...updated[exists], ...entry }
        else updated.push(entry)
      }
      try { localStorage.setItem('dhya_student_registry', JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [students])

  // ── One-time migration from localStorage ──────────────────────────────────
  async function migrateFromLocalStorage() {
    setMigrating(true)
    try {
      const lsSems = JSON.parse(localStorage.getItem('dhya_vs_semesters') || '[]')
      const lsCls  = JSON.parse(localStorage.getItem('dhya_vs_classes')   || '[]')
      const lsStu  = JSON.parse(localStorage.getItem('dhya_vs_students')  || '[]')
      const lsLes  = JSON.parse(localStorage.getItem('dhya_vs_lessons')   || '[]')
      const lsAtt  = JSON.parse(localStorage.getItem('dhya_vs_attendance')|| '[]')

      if (lsSems.length) {
        const { error } = await supabase.from('vs_semesters').upsert(lsSems.map(s => semToDB({ ...s, calEvents: s.calEvents || {} })), { onConflict: 'id' })
        if (error) { alert('Error importing semesters: ' + error.message); setMigrating(false); return }
      }
      if (lsCls.length) {
        const { error } = await supabase.from('vs_classes').upsert(lsCls.map(clsToDB), { onConflict: 'id' })
        if (error) { alert('Error importing classes: ' + error.message); setMigrating(false); return }
      }
      if (lsStu.length) {
        const { error } = await supabase.from('vs_students').upsert(lsStu.map(s => stuToDB({ ...s, classId: s.classId || null })), { onConflict: 'id' })
        if (error) { alert('Error importing students: ' + error.message); setMigrating(false); return }
      }
      if (lsLes.length) {
        const { error } = await supabase.from('vs_lessons').upsert(lsLes.map(lesToDB), { onConflict: 'id' })
        if (error) { alert('Error importing lessons: ' + error.message); setMigrating(false); return }
      }
      if (lsAtt.length) {
        const { error } = await supabase.from('vs_attendance').upsert(lsAtt.map(a => attToDB({ ...a, id: a.id || `att-${Date.now()}-${Math.random()}` })), { onConflict: 'id' })
        if (error) { alert('Error importing attendance: ' + error.message); setMigrating(false); return }
      }

      await fetchAll()
      alert(`Migration complete! Imported ${lsSems.length} semesters, ${lsCls.length} classes, ${lsStu.length} students.`)
    } catch (e) {
      alert('Migration error: ' + e.message)
    }
    setMigrating(false)
  }

  const hasLocalData = (() => {
    try { return JSON.parse(localStorage.getItem('dhya_vs_semesters') || '[]').length > 0 } catch { return false }
  })()

  // View state
  const [view, setView] = useState({ type: 'semesters' })

  // Drawer state
  const [drawerType, setDrawerType] = useState(null)
  const [drawerClassId, setDrawerClassId] = useState(null)
  const [editingSemester, setEditingSemester] = useState(null)
  const [deletingSemester, setDeletingSemester] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
  const [deletingClass, setDeletingClass] = useState(null)

  async function handleCreateSemester(form) {
    const id = 'sem-' + Date.now()
    await supabase.from('vs_semesters').insert(semToDB({ ...form, id, calEvents: {} }))
    setDrawerType(null)
    fetchAll()
  }
  async function handleEditSemester(updated) {
    await supabase.from('vs_semesters').update(semToDB(updated)).eq('id', updated.id)
    setEditingSemester(null)
    setDrawerType(null)
    fetchAll()
  }
  async function handleDeleteSemester() {
    if (!deletingSemester) return
    await supabase.from('vs_semesters').delete().eq('id', deletingSemester.id)
    setDeletingSemester(null)
    fetchAll()
  }
  async function handleCreateClass(form) {
    const id = 'cls-' + Date.now()
    await supabase.from('vs_classes').insert(clsToDB({ ...form, id }))
    setDrawerType(null)
    fetchAll()
  }
  async function handleEditClass(updated) {
    await supabase.from('vs_classes').update(clsToDB(updated)).eq('id', updated.id)
    setEditingClass(null)
    setDrawerType(null)
    fetchAll()
  }
  async function handleDeleteClass() {
    if (!deletingClass) return
    await supabase.from('vs_classes').delete().eq('id', deletingClass.id)
    setDeletingClass(null)
    fetchAll()
  }
  async function handleCreateStudent(form) {
    const id = 'stu-' + Date.now()
    await supabase.from('vs_students').insert(stuToDB({ ...form, id }))
    setDrawerType(null)
    fetchAll()
  }
  async function handleUpdateStudent(updated) {
    await supabase.from('vs_students').update(stuToDB(updated)).eq('id', updated.id)
    fetchAll()
  }
  async function handleDeleteStudent(id) {
    await supabase.from('vs_students').delete().eq('id', id)
    fetchAll()
  }
  async function handleCreateLesson(form) {
    const id = 'les-' + Date.now()
    await supabase.from('vs_lessons').insert(lesToDB({ ...form, id }))
    setDrawerType(null)
    fetchAll()
  }
  async function handleUpdateAttendance(records, date) {
    if (records === null) {
      await supabase.from('vs_attendance').delete().eq('class_id', view.cls?.id).eq('date', date)
    } else {
      const rows = records.map((r, i) => attToDB({ ...r, id: r.id || `att-${Date.now()}-${i}` }))
      await supabase.from('vs_attendance').upsert(rows, { onConflict: 'id' })
    }
    fetchAll()
  }
  async function handleUpdateSemesterDates(semId, dates) {
    const sem = semesters.find(s => s.id === semId)
    if (!sem) return
    await supabase.from('vs_semesters').update(semToDB({ ...sem, ...dates })).eq('id', semId)
    fetchAll()
  }

  const curSemester = view.semester ? (semesters.find(s => s.id === view.semester.id) || view.semester) : null
  const curClass    = view.cls

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#EDD0AC', borderTopColor: '#F1745E' }} />
    </div>
  )

  return (
    <div>
      {/* Migrate banner — shown when this browser has unsaved localStorage data */}
      {hasLocalData && semesters.length === 0 && (
        <div className="mb-4 px-4 py-3 rounded-2xl flex items-center justify-between gap-3"
          style={{ backgroundColor: '#FFF7F3', border: '1.5px solid #EDD0AC' }}>
          <p className="text-sm" style={{ color: '#4F252A' }}>
            <strong>Local data found.</strong> You have data saved on this browser. Import it to sync across all devices.
          </p>
          <button onClick={migrateFromLocalStorage} disabled={migrating}
            className="shrink-0 px-4 py-1.5 text-sm font-semibold rounded-xl text-white disabled:opacity-60"
            style={{ backgroundColor: '#F1745E' }}>
            {migrating ? 'Importing…' : 'Import to Cloud'}
          </button>
        </div>
      )}

      {/* Step 1 */}
      {view.type === 'semesters' && (
        <SemesterList
          semesters={semesters}
          classes={classes}
          students={students}
          onOpen={sem => setView({ type: 'classes', semester: sem })}
          onCreateSemester={() => setDrawerType('semester')}
          onEditSemester={sem => { setEditingSemester(sem); setDrawerType('editSemester') }}
          onDeleteSemester={sem => setDeletingSemester(sem)}
        />
      )}

      {/* Step 2 */}
      {view.type === 'classes' && curSemester && (
        <ClassList
          semester={curSemester}
          classes={classes}
          students={students}
          attendance={attendance}
          onBack={() => setView({ type: 'semesters' })}
          onOpenClass={cls => setView({ type: 'class-detail', semester: curSemester, cls })}
          onAddClass={() => setDrawerType('class')}
          onAddStudent={() => setDrawerType('student')}
          onEditClass={cls => { setEditingClass(cls); setDrawerType('editClass') }}
          onDeleteClass={cls => setDeletingClass(cls)}
          onUpdateSemesterDates={handleUpdateSemesterDates}
        />
      )}

      {/* Step 3 */}
      {view.type === 'class-detail' && curSemester && curClass && (
        <ClassDetail
          cls={curClass}
          semester={curSemester}
          students={students}
          attendance={attendance}
          lessons={lessons}
          onBack={() => setView({ type: 'classes', semester: curSemester })}
          onUpdateAttendance={handleUpdateAttendance}
          onAddLesson={() => setDrawerType('lesson')}
          onAddStudent={(cid) => { setDrawerClassId(cid || curClass.id); setDrawerType('student') }}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      )}

      {/* Drawers */}
      <Drawer open={drawerType === 'semester'} onClose={() => setDrawerType(null)} title="Create Semester">
        <SemesterForm onSave={handleCreateSemester} onClose={() => setDrawerType(null)} />
      </Drawer>

      <Drawer open={drawerType === 'editSemester'} onClose={() => { setDrawerType(null); setEditingSemester(null) }} title="Edit Semester">
        {editingSemester && <EditSemesterForm semester={editingSemester} onSave={handleEditSemester} onClose={() => { setDrawerType(null); setEditingSemester(null) }} />}
      </Drawer>

      {/* Delete confirmation modal */}
      {deletingSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.45)' }}>
          <div className="w-full max-w-sm rounded-3xl p-7" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF0EC' }}>
              <TrashIcon className="w-6 h-6" style={{ color: C.coral }} />
            </div>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Delete Semester?</h3>
            <p className="text-sm mb-6" style={{ color: C.muted }}>
              Are you sure you want to delete <strong>{deletingSemester.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => setDeletingSemester(null)}>Cancel</Btn>
              <button onClick={handleDeleteSemester}
                className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E06464, #C04040)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={drawerType === 'class'} onClose={() => setDrawerType(null)} title="Add Class">
        <ClassForm semesterId={curSemester?.id} onSave={handleCreateClass} onClose={() => setDrawerType(null)} />
      </Drawer>

      <Drawer open={drawerType === 'editClass'} onClose={() => { setDrawerType(null); setEditingClass(null) }} title="Edit Class">
        {editingClass && <EditClassForm cls={editingClass} onSave={handleEditClass} onClose={() => { setDrawerType(null); setEditingClass(null) }} />}
      </Drawer>

      {/* Delete class confirmation */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.45)' }}>
          <div className="w-full max-w-sm rounded-3xl p-7" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF0EC' }}>
              <TrashIcon className="w-6 h-6" style={{ color: C.coral }} />
            </div>
            <h3 className="text-lg font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Delete Class?</h3>
            <p className="text-sm mb-6" style={{ color: C.muted }}>
              Are you sure you want to delete <strong>{deletingClass.className}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => setDeletingClass(null)}>Cancel</Btn>
              <button onClick={handleDeleteClass}
                className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E06464, #C04040)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={drawerType === 'student'} onClose={() => setDrawerType(null)} title="Add Student">
        <StudentForm semesterId={curSemester?.id} classId={drawerClassId || curClass?.id} classes={classes} registry={registry} onSave={handleCreateStudent} onClose={() => setDrawerType(null)} />
      </Drawer>

      <Drawer open={drawerType === 'lesson'} onClose={() => setDrawerType(null)} title="Add Lesson">
        {curClass && <LessonForm classId={curClass.id} semesterId={curSemester?.id} onSave={handleCreateLesson} onClose={() => setDrawerType(null)} />}
      </Drawer>
    </div>
  )
}
