import { useState, useMemo, useEffect, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  burgundy: '#4F252A',
  coral:    '#E06464',
  orange:   '#F1745E',
  beige:    '#EDD0AC',
  bg:       '#FFF7F3',
  card:     '#FFFCF8',
  muted:    '#7A5550',
  faint:    '#A08070',
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: `1.5px solid ${C.beige}`, backgroundColor: '#fff',
  color: C.burgundy, fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none',
}

// ─── Categories ───────────────────────────────────────────────────────────────
const TASK_CATEGORIES = [
  'Event Setup', 'Communication', 'Ceremony', 'Food & Supplies',
  'Dance Team', 'Media', 'Cleanup', 'Other',
]

const ROLE_CATEGORIES = [
  'Leadership', 'Registration', 'Food & Supplies', 'Ceremony',
  'Media', 'Logistics', 'Cleanup', 'Other',
]

const CATEGORY_STYLES = {
  'Event Setup':    { bg: '#FFF0EC', color: '#C05040', border: '#F4B8A8' },
  'Communication':  { bg: '#FEF8EC', color: '#8A6200', border: '#F0D080' },
  'Ceremony':       { bg: '#FEF0F8', color: '#8A3070', border: '#E8A8D0' },
  'Food & Supplies':{ bg: '#F0FAF4', color: '#2D7A4F', border: '#A8DFC0' },
  'Dance Team':     { bg: '#F0F0FF', color: '#4040A0', border: '#B0B0E8' },
  'Media':          { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'Cleanup':        { bg: '#F4F4F4', color: '#555555', border: '#CCCCCC' },
  'Other':          { bg: '#FEF8EC', color: '#7A5550', border: '#EDD0AC' },
  'Leadership':     { bg: '#FFF0EC', color: '#C05040', border: '#F4B8A8' },
  'Registration':   { bg: '#FEF8EC', color: '#8A6200', border: '#F0D080' },
  'Logistics':      { bg: '#F0FAF4', color: '#2D7A4F', border: '#A8DFC0' },
}

function CategoryBadge({ category }) {
  const s = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other']
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {category}
    </span>
  )
}

// ─── Category icons ───────────────────────────────────────────────────────────
function CategoryIcon({ category, size = 20 }) {
  const color = CATEGORY_STYLES[category]?.color || C.faint
  const icons = {
    'Event Setup': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    'Communication': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    'Ceremony': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    'Food & Supplies': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    'Dance Team': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    'Media': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    'Cleanup': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    ),
    'Leadership': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    'Registration': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    'Logistics': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  }
  return icons[category] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

// ─── localStorage ─────────────────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [value, setRaw] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  function setValue(next) {
    setRaw(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      try { localStorage.setItem(key, JSON.stringify(resolved)) } catch {}
      return resolved
    })
  }
  return [value, setValue]
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_TASKS = [
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

const INIT_ROLES = [
  { id: 'r-001', name: 'MC', description: 'Host and guide the event program, introduce performers and speakers.', category: 'Leadership', createdAt: '2026-01-10' },
  { id: 'r-002', name: 'Registration', description: 'Check in attendees, hand out name tags, manage sign-in sheet.', category: 'Registration', createdAt: '2026-01-09' },
  { id: 'r-003', name: 'Food Table', description: 'Set up, manage, and clean up the food and drinks table.', category: 'Food & Supplies', createdAt: '2026-01-08' },
  { id: 'r-004', name: 'Photographer', description: 'Take photos and short videos throughout the event.', category: 'Media', createdAt: '2026-01-07' },
  { id: 'r-005', name: 'Sound System', description: 'Operate microphones, speakers, and audio equipment during the event.', category: 'Logistics', createdAt: '2026-01-07' },
  { id: 'r-006', name: 'Parking', description: 'Direct cars and assist with parking management outside the venue.', category: 'Logistics', createdAt: '2026-01-06' },
  { id: 'r-007', name: 'Decoration Setup', description: 'Set up banners, flowers, lanterns, and other decorative items.', category: 'Event Setup', createdAt: '2026-01-05' },
  { id: 'r-008', name: 'Cleanup Crew', description: 'Manage post-event cleanup, trash removal, and venue reset.', category: 'Cleanup', createdAt: '2026-01-04' },
]

// ─── Three-dot menu ───────────────────────────────────────────────────────────
function ItemMenu({ onEdit, onDelete }) {
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirm(false) } }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative shrink-0" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
        style={{ color: C.faint }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>
      {open && !confirm && (
        <div className="absolute right-0 top-8 z-30 rounded-2xl overflow-hidden min-w-[130px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${C.beige}` }}>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left hover:bg-orange-50"
            style={{ color: C.burgundy }}>
            <PencilIcon className="w-3.5 h-3.5" style={{ color: C.orange }} /> Edit
          </button>
          <div style={{ borderTop: `1px solid ${C.beige}` }} />
          <button onClick={() => setConfirm(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left hover:bg-red-50"
            style={{ color: C.coral }}>
            <TrashIcon className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
      {open && confirm && (
        <div className="absolute right-0 top-8 z-30 rounded-2xl p-4 min-w-[160px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EFCAC8' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: C.burgundy }}>Are you sure?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirm(false)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl border"
              style={{ borderColor: C.beige, color: C.muted }}>Cancel</button>
            <button onClick={() => { setOpen(false); setConfirm(false); onDelete() }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: C.coral }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Right-side Drawer ────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-md h-full overflow-y-auto shadow-2xl"
        style={{ backgroundColor: C.card, borderLeft: `1.5px solid ${C.beige}` }}>
        <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b" style={{ borderColor: C.beige }}>
          <h3 className="text-lg font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-orange-50" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({ initial, onSave, onClose }) {
  const blank = { title: '', description: '', category: 'Event Setup' }
  const [form, setForm] = useState(initial || blank)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return setErr('Task name is required.')
    onSave(form)
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Task Name *</label>
        <input name="title" value={form.title} onChange={hc} placeholder="Enter task name" required style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Description</label>
        <textarea name="description" value={form.description} onChange={hc} rows={4}
          placeholder="Describe the task (optional)" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
          style={{ borderColor: C.beige, color: C.muted, backgroundColor: C.bg }}>Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Save Task
        </button>
      </div>
    </form>
  )
}

// ─── Role Form ────────────────────────────────────────────────────────────────
function RoleForm({ initial, onSave, onClose }) {
  const blank = { name: '', description: '', category: 'Leadership' }
  const [form, setForm] = useState(initial || blank)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return setErr('Role name is required.')
    onSave(form)
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Role Name *</label>
        <input name="name" value={form.name} onChange={hc} placeholder="Enter role name" required style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Description</label>
        <textarea name="description" value={form.description} onChange={hc} rows={4}
          placeholder="Describe the role (optional)" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
          style={{ borderColor: C.beige, color: C.muted, backgroundColor: C.bg }}>Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Save Role
        </button>
      </div>
    </form>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: C.burgundy }}>{task.title}</p>
        <ItemMenu onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} />
      </div>
      {task.description && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: C.faint }}>{task.description}</p>
      )}
    </div>
  )
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({ role, onEdit, onDelete }) {
  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: C.burgundy }}>{role.name}</p>
        <ItemMenu onEdit={() => onEdit(role)} onDelete={() => onDelete(role.id)} />
      </div>
      {role.description && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: C.faint }}>{role.description}</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function Tasks() {
  const [tab, setTab] = useState('tasks')

  const [tasks,  setTasks]  = useLocalStorage('dhya_task_library',  INIT_TASKS)
  const [roles,  setRoles]  = useLocalStorage('dhya_role_library',  INIT_ROLES)

  // Drawer state
  const [addTaskOpen,  setAddTaskOpen]  = useState(false)
  const [editingTask,  setEditingTask]  = useState(null)
  const [addRoleOpen,  setAddRoleOpen]  = useState(false)
  const [editingRole,  setEditingRole]  = useState(null)

  // Filters — tasks
  const [taskSearch,  setTaskSearch]  = useState('')
  const [taskCatF,    setTaskCatF]    = useState('')
  const [taskSort,    setTaskSort]    = useState('recent')
  const [taskPage,    setTaskPage]    = useState(1)

  // Filters — roles
  const [roleSearch,  setRoleSearch]  = useState('')
  const [roleCatF,    setRoleCatF]    = useState('')
  const [roleSort,    setRoleSort]    = useState('recent')
  const [rolePage,    setRolePage]    = useState(1)

  // ── Task handlers ──
  function handleAddTask(form) {
    setTasks(prev => [{ ...form, id: 't-' + Date.now(), createdAt: new Date().toISOString().slice(0,10) }, ...prev])
    setAddTaskOpen(false)
    setTaskPage(1)
  }
  function handleEditTask(form) {
    setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...form } : t))
    setEditingTask(null)
  }
  function handleDeleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // ── Role handlers ──
  function handleAddRole(form) {
    setRoles(prev => [{ ...form, id: 'r-' + Date.now(), createdAt: new Date().toISOString().slice(0,10) }, ...prev])
    setAddRoleOpen(false)
    setRolePage(1)
  }
  function handleEditRole(form) {
    setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...form } : r))
    setEditingRole(null)
  }
  function handleDeleteRole(id) {
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  // ── Filtered + sorted tasks ──
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const q = taskSearch.toLowerCase()
        return (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
          && (!taskCatF || t.category === taskCatF)
      })
      .sort((a, b) => taskSort === 'az' ? a.title.localeCompare(b.title)
        : taskSort === 'za' ? b.title.localeCompare(a.title)
        : b.createdAt.localeCompare(a.createdAt))
  }, [tasks, taskSearch, taskCatF, taskSort])

  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
  const paginatedTasks = filteredTasks.slice((taskPage - 1) * PAGE_SIZE, taskPage * PAGE_SIZE)

  // ── Filtered + sorted roles ──
  const filteredRoles = useMemo(() => {
    return roles
      .filter(r => {
        const q = roleSearch.toLowerCase()
        return (!q || r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
          && (!roleCatF || r.category === roleCatF)
      })
      .sort((a, b) => roleSort === 'az' ? a.name.localeCompare(b.name)
        : roleSort === 'za' ? b.name.localeCompare(a.name)
        : b.createdAt.localeCompare(a.createdAt))
  }, [roles, roleSearch, roleCatF, roleSort])

  const roleTotalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE))
  const paginatedRoles = filteredRoles.slice((rolePage - 1) * PAGE_SIZE, rolePage * PAGE_SIZE)

  const selectStyle = { ...inputStyle, width: 'auto', minWidth: '140px', paddingRight: '2rem', cursor: 'pointer' }

  function Pagination({ page, totalPages, setPage, total }) {
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs" style={{ color: C.faint }}>
          Showing {total === 0 ? 0 : (page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
            style={{ color: C.muted, border: `1px solid ${C.beige}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              className="w-7 h-7 rounded-lg text-xs font-bold"
              style={n === page
                ? { backgroundColor: C.orange, color: '#fff' }
                : { color: C.muted, border: `1px solid ${C.beige}` }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
            style={{ color: C.muted, border: `1px solid ${C.beige}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Tasks &amp; Roles</h2>
          <p className="text-sm" style={{ color: C.muted }}>Manage reusable tasks and volunteer roles for future events.</p>
        </div>
        <button
          onClick={() => tab === 'tasks' ? setAddTaskOpen(true) : setAddRoleOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity shrink-0"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          <PlusIcon className="w-4 h-4" />
          {tab === 'tasks' ? 'New Task' : 'New Role'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: '#F0E0D0' }}>
        {[
          { id: 'tasks', label: 'Tasks', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="5" width="6" height="6" rx="1"/><path d="M3 17h6M13 7h8M13 12h8M13 17h8"/>
            </svg>
          )},
          { id: 'roles', label: 'Roles', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )},
        ].map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all"
            style={{ borderColor: tab === id ? C.orange : 'transparent', color: tab === id ? C.orange : C.muted, marginBottom: '-1.5px' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ══ TASKS TAB ══ */}
      {tab === 'tasks' && (
        <div>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.faint }} />
              <input value={taskSearch} onChange={e => { setTaskSearch(e.target.value); setTaskPage(1) }}
                placeholder="Search tasks…" style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
            </div>
          </div>

          {/* Grid */}
          {paginatedTasks.length === 0 ? (
            <div className="rounded-3xl p-12 flex flex-col items-center text-center"
              style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}` }}>
              <span className="text-4xl mb-3">📋</span>
              <p className="text-base font-bold mb-1" style={{ color: C.burgundy }}>No tasks found</p>
              <p className="text-sm" style={{ color: C.faint }}>Try a different search or add a new task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedTasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onEdit={setEditingTask}
                  onDelete={handleDeleteTask} />
              ))}
            </div>
          )}
          {filteredTasks.length > PAGE_SIZE && (
            <Pagination page={taskPage} totalPages={taskTotalPages} setPage={setTaskPage} total={filteredTasks.length} />
          )}
        </div>
      )}

      {/* ══ ROLES TAB ══ */}
      {tab === 'roles' && (
        <div>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.faint }} />
              <input value={roleSearch} onChange={e => { setRoleSearch(e.target.value); setRolePage(1) }}
                placeholder="Search roles…" style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
            </div>
          </div>

          {/* Grid */}
          {paginatedRoles.length === 0 ? (
            <div className="rounded-3xl p-12 flex flex-col items-center text-center"
              style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}` }}>
              <span className="text-4xl mb-3">🙋</span>
              <p className="text-base font-bold mb-1" style={{ color: C.burgundy }}>No roles found</p>
              <p className="text-sm" style={{ color: C.faint }}>Try a different search or add a new role.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paginatedRoles.map(role => (
                <RoleCard key={role.id} role={role}
                  onEdit={setEditingRole}
                  onDelete={handleDeleteRole} />
              ))}
            </div>
          )}
          {filteredRoles.length > PAGE_SIZE && (
            <Pagination page={rolePage} totalPages={roleTotalPages} setPage={setRolePage} total={filteredRoles.length} />
          )}
        </div>
      )}

      {/* Drawers */}
      <Drawer open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Add Task to Library">
        <TaskForm onSave={handleAddTask} onClose={() => setAddTaskOpen(false)} />
      </Drawer>
      <Drawer open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && <TaskForm initial={editingTask} onSave={handleEditTask} onClose={() => setEditingTask(null)} />}
      </Drawer>
      <Drawer open={addRoleOpen} onClose={() => setAddRoleOpen(false)} title="Add Role to Library">
        <RoleForm onSave={handleAddRole} onClose={() => setAddRoleOpen(false)} />
      </Drawer>
      <Drawer open={!!editingRole} onClose={() => setEditingRole(null)} title="Edit Role">
        {editingRole && <RoleForm initial={editingRole} onSave={handleEditRole} onClose={() => setEditingRole(null)} />}
      </Drawer>
    </div>
  )
}
