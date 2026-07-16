import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'

const C = {
  burgundy: '#4F252A',
  coral:    '#F1745E',
  orange:   '#E06464',
  beige:    '#EDD0AC',
  muted:    '#7A5550',
  faint:    '#A08070',
}

const APP_ROLES   = ['admin', 'board_member', 'member']
const MEMBER_ROLES = ['Founder', 'President', 'Vice President', 'Board Member', 'Secretary', 'Member']
const STATUSES    = ['Active', 'Inactive']

const ROLE_BADGE = {
  'Founder':        { bg: '#F9EDEE', color: '#4F252A', border: '#D4A8AC' },
  'President':      { bg: '#FEF0EE', color: '#C04040', border: '#EFCAC8' },
  'Vice President': { bg: '#FFF3EE', color: '#D05030', border: '#F4C4B0' },
  'Board Member':   { bg: '#FFF0F4', color: '#B0305A', border: '#FBC3B9' },
  'Secretary':      { bg: '#FFFAEF', color: '#8A6200', border: '#EDD0AC' },
  'Member':         { bg: '#F5F4F2', color: '#7A5550', border: '#D8D0C8' },
  'Admin':          { bg: '#EEF0FA', color: '#5A6FB5', border: '#C8D0F0' },
}

const AVATAR_COLORS = ['#F1745E','#E06464','#5A6FB5','#2D7A4F','#8B5CF6','#D4A843','#B0305A','#4A90C4']

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '12px',
  border: '1.5px solid #EDD0AC', fontSize: '14px', color: '#4F252A',
  backgroundColor: '#fff', outline: 'none', fontFamily: "'Nunito', sans-serif",
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return dateStr }
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const ROLE_DISPLAY = {
  admin:          'Admin',
  board_member:   'Board Member',
  vice_president: 'Vice President',
  president:      'President',
  secretary:      'Secretary',
  founder:        'Founder',
  member:         'Member',
}

function formatRole(role) {
  if (!role) return 'Member'
  return ROLE_DISPLAY[role.toLowerCase()] || MEMBER_ROLES.find(r => r.toLowerCase() === role.toLowerCase()) || role
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-extrabold uppercase tracking-wide mb-1.5" style={{ color: '#A08070' }}>
        {label}{required && <span style={{ color: '#E06464' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const emptyGeneralForm = { full_name: '', phone_number: '', birthday: '', role: 'Member', phap_danh: '', notes: '' }

export default function Members() {
  const { session } = useAuth()
  const { canManage } = useProfile()

  const [appUsers, setAppUsers]           = useState([])
  const [generalMembers, setGeneralMembers] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  const [orderedIds, setOrderedIds]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('dhya_members_order') || '[]') } catch { return [] }
  })
  const dragIndex                         = useRef(null)
  const [dragOver, setDragOver]           = useState(null)

  const [search, setSearch]               = useState('')
  const [roleFilter, setRoleFilter]       = useState('All Roles')
  const [statusFilter, setStatusFilter]   = useState('All Status')

  // General member add/edit drawer
  const [drawer, setDrawer]               = useState(null)
  const [form, setForm]                   = useState(emptyGeneralForm)
  const [formErr, setFormErr]             = useState('')
  const [saving, setSaving]               = useState(false)

  const [deleting, setDeleting]           = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [profilesRes, membersRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, avatar_url, phone_number, birthday, notes, phap_danh').order('full_name'),
      supabase.from('general_members').select('*').order('full_name'),
    ])
    if (profilesRes.error) setError(profilesRes.error.message)
    else setAppUsers(profilesRes.data || [])
    if (membersRes.error) setError(e => e || membersRes.error.message)
    else setGeneralMembers(membersRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (session) fetchAll() }, [session, fetchAll])

  // Combine both into a unified list for display
  const allMembers = useMemo(() => {
    const fromProfiles = appUsers.map(u => ({
      _type: 'profile',
      _id:   u.id,
      name:  u.full_name || 'Unnamed',
      role:  formatRole(u.role),
      email: u.email || '',
      contactNumber: u.phone_number || '',
      birthday: u.birthday || '',
      phap_danh: u.phap_danh || '',
      status: 'Active',
      notes: u.notes || '',
      avatar_url: u.avatar_url,
    }))
    const fromGeneral = generalMembers.map(m => ({
      _type: 'general',
      _id:   m.id,
      name:  m.full_name || 'Unnamed',
      role:  m.role || 'Member',
      email: m.email || '',
      contactNumber: m.phone_number || '',
      birthday: m.birthday || '',
      phap_danh: m.phap_danh || '',
      status: m.status || 'Active',
      notes: m.notes || '',
      avatar_url: null,
    }))
    return [...fromProfiles, ...fromGeneral].sort((a, b) => a.name.localeCompare(b.name))
  }, [appUsers, generalMembers])

  const filtered = useMemo(() => {
    let list = allMembers.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (roleFilter !== 'All Roles' && m.role !== roleFilter) return false
      if (statusFilter !== 'All Status' && m.status !== statusFilter) return false
      return true
    })
    if (orderedIds.length > 0) {
      const indexMap = {}
      orderedIds.forEach((id, i) => { indexMap[id] = i })
      list = [...list].sort((a, b) => {
        const ia = indexMap[a._type + a._id] ?? 9999
        const ib = indexMap[b._type + b._id] ?? 9999
        return ia - ib
      })
    }
    return list
  }, [allMembers, search, roleFilter, statusFilter, orderedIds])

  // ── Add general member
  function openAdd() {
    setForm(emptyGeneralForm)
    setFormErr('')
    setDrawer({ mode: 'add' })
  }

  function openEdit(m) {
    if (m._type === 'profile') {
      const p = appUsers.find(x => x.id === m._id)
      setForm({ full_name: p.full_name || '', phone_number: p.phone_number || '', birthday: p.birthday || '', role: formatRole(p.role), phap_danh: p.phap_danh || '', notes: p.notes || '' })
      setFormErr('')
      setDrawer({ mode: 'edit', id: m._id, type: 'profile' })
    } else {
      const gm = generalMembers.find(x => x.id === m._id)
      setForm({ full_name: gm.full_name || '', phone_number: gm.phone_number || '', birthday: gm.birthday || '', role: gm.role || 'Member', phap_danh: gm.phap_danh || '', notes: gm.notes || '' })
      setFormErr('')
      setDrawer({ mode: 'edit', id: m._id, type: 'general' })
    }
  }

  function closeDrawer() { setDrawer(null) }
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  // Convert display role back to DB value for profiles table
  const ROLE_TO_DB = {
    'Admin': 'admin', 'Board Member': 'board_member', 'Vice President': 'vice_president',
    'President': 'president', 'Secretary': 'secretary', 'Founder': 'founder', 'Member': 'member',
  }

  async function handleSave() {
    if (!form.full_name.trim()) return setFormErr('Name is required.')
    setSaving(true)
    let err
    if (drawer.mode === 'add') {
      const payload = { full_name: form.full_name.trim(), role: form.role }
      if (form.phone_number) payload.phone_number = form.phone_number
      if (form.birthday)     payload.birthday     = form.birthday
      if (form.phap_danh)    payload.phap_danh    = form.phap_danh
      if (form.notes)        payload.notes        = form.notes
      const { error: e } = await supabase.from('general_members').insert([payload])
      err = e
    } else if (drawer.type === 'profile') {
      const { error: e } = await supabase.from('profiles').update({
        full_name:    form.full_name.trim(),
        phap_danh:    form.phap_danh    || null,
        phone_number: form.phone_number || null,
        birthday:     form.birthday     || null,
        notes:        form.notes        || null,
      }).eq('id', drawer.id)
      err = e
      if (e) console.error('Profile update error:', e)
    } else {
      const payload = { full_name: form.full_name.trim(), role: form.role }
      if (form.phone_number !== undefined) payload.phone_number = form.phone_number || null
      if (form.birthday     !== undefined) payload.birthday     = form.birthday || null
      if (form.phap_danh    !== undefined) payload.phap_danh    = form.phap_danh || null
      if (form.notes        !== undefined) payload.notes        = form.notes || null
      const { error: e } = await supabase.from('general_members').update(payload).eq('id', drawer.id)
      err = e
    }
    setSaving(false)
    if (err) {
      console.error('Save member error:', err)
      return setFormErr(err.message || 'Failed to save. Please try again.')
    }
    closeDrawer()
    fetchAll()
  }

  async function handleDelete() {
    if (deleting._type === 'general') {
      await supabase.from('general_members').delete().eq('id', deleting._id)
    }
    setDeleting(null)
    fetchAll()
  }

  function handleDragStart(e, i) {
    dragIndex.current = i
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, i) {
    e.preventDefault()
    setDragOver(i)
  }
  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) { setDragOver(null); return }
    const newList = [...filtered]
    const [moved] = newList.splice(dragIndex.current, 1)
    newList.splice(i, 0, moved)
    const newOrder = newList.map(m => m._type + m._id)
    setOrderedIds(newOrder)
    localStorage.setItem('dhya_members_order', JSON.stringify(newOrder))
    setDragOver(null)
    dragIndex.current = null
  }
  function handleDragEnd() {
    setDragOver(null)
    dragIndex.current = null
  }

  const roleOptions = ['All Roles', ...MEMBER_ROLES, 'Admin']
  const selectStyle = { padding: '8px 12px', borderRadius: '12px', border: '1.5px solid #EDD0AC', backgroundColor: '#fff', color: C.muted, fontSize: '14px', outline: 'none' }

  return (
    <div>
      {/* ── Mobile layout ── */}
      <div className="block md:hidden" style={{ backgroundColor: '#FFF7F3', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-2xl font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Members</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A5550' }}>View and manage organization members.</p>
        </div>

        {/* Search */}
        <div className="px-4 mb-4 mt-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0" style={{ color: '#A08070' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#4F252A' }} />
          </div>
        </div>

        {/* Add Member button */}
        {canManage && (
          <div className="px-4 mb-4">
            <button onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: '#F1745E' }}>
              <PlusIcon className="w-4 h-4" /> Add Member
            </button>
          </div>
        )}

        {/* Stats strip */}
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-[10px] font-semibold" style={{ color: '#A08070' }}>Founder</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#4F252A' }}>Ven. Thích Chúc Đỗ</p>
              </div>
              <div className="w-px h-8" style={{ backgroundColor: '#EDD0AC' }} />
              <div className="text-center flex-1 px-2">
                <p className="text-[10px] font-semibold" style={{ color: '#A08070' }}>Total Members</p>
                <p className="text-xl font-extrabold mt-0.5" style={{ color: '#4F252A' }}>{allMembers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Member list */}
        <div className="px-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#EDD0AC', borderTopColor: '#F1745E' }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: '#A08070' }}>No members found.</p>
          ) : filtered.map((m, i) => {
            const badge = ROLE_BADGE[m.role] || ROLE_BADGE['Member']
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
            return (
              <div key={m._type + m._id}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: avatarColor }}>
                    {initials(m.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#4F252A' }}>{m.name}</p>
                  {m.phap_danh && <p className="text-xs truncate" style={{ color: '#A08070' }}>{m.phap_danh}</p>}
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {m.role}
                </span>
                <svg className="w-4 h-4 shrink-0" style={{ color: '#A08070' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Members</h2>
          <p className="text-sm" style={{ color: C.muted }}>View and manage organization members and contact information.</p>
        </div>
        {canManage && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity shrink-0"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
            <PlusIcon className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      {/* Overview Card */}
      <div className="rounded-2xl mb-6 px-6 py-4 flex flex-wrap gap-x-0 gap-y-3 items-stretch"
        style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {/* Founder */}
        <div className="flex items-center gap-3 pr-6 mr-6" style={{ borderRight: '1px solid #EDD0AC' }}>
          <UserIcon className="w-5 h-5 shrink-0" style={{ color: C.faint }} />
          <div>
            <div className="text-xs" style={{ color: C.faint }}>Founder</div>
            <div className="text-sm font-bold" style={{ color: C.burgundy }}>Ven. Thích Chúc Đỗ</div>
          </div>
        </div>
        {/* Executive Advisors */}
        <div className="flex items-center gap-3 pr-6 mr-6" style={{ borderRight: '1px solid #EDD0AC' }}>
          <UsersIcon className="w-5 h-5 shrink-0" style={{ color: C.faint }} />
          <div>
            <div className="text-xs" style={{ color: C.faint }}>Executive Advisor(s)</div>
            <div className="text-sm font-bold" style={{ color: C.burgundy }}>Ven. Thích Chúc Hội, Ven. Thích Chúc Thanh, Ven. Thích Chúc Thông</div>
          </div>
        </div>
        {/* Total Members */}
        <div className="flex items-center gap-3">
          <UsersIcon className="w-5 h-5 shrink-0" style={{ color: C.faint }} />
          <div>
            <div className="text-xs" style={{ color: C.faint }}>Total Members</div>
            <div className="text-sm font-bold" style={{ color: C.burgundy }}>{allMembers.length}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.faint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl"
            style={{ border: '1.5px solid #EDD0AC', backgroundColor: '#fff', color: C.burgundy, outline: 'none' }} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: '#E8C8A8', borderTopColor: '#F1745E' }} />
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1.5px solid #EDD0AC', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#FFF0EA', borderBottom: '1.5px solid #EDD0AC' }}>
                <th className="pl-3 pr-1 py-3 w-6" />
              {['No.', 'Name', 'Pháp danh', 'Birthday', 'Role', 'Contact Number', 'Email', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap" style={{ color: C.faint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-14 text-center text-sm" style={{ color: C.faint }}>No members found.</td></tr>

              ) : filtered.map((m, i) => {
                const badge = ROLE_BADGE[m.role] || ROLE_BADGE['Member']
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
                const isProfile = m._type === 'profile'
                return (
                  <tr key={m._type + m._id}
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDrop={e => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F5EDE4' : 'none',
                      backgroundColor: dragOver === i ? '#FFF0EC' : '#ffffff',
                      borderTop: dragOver === i ? '2px solid #F1745E' : undefined,
                      transition: 'background-color 0.15s',
                      cursor: 'grab',
                    }}>
                    <td className="pl-3 pr-1 py-3 w-6">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: C.faint, display: 'block' }}>
                        <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
                        <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
                      </svg>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.faint }}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: avatarColor }}>
                            {initials(m.name)}
                          </div>
                        )}
                        <span className="font-semibold" style={{ color: C.burgundy }}>{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{m.phap_danh || '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(m.birthday)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{m.contactNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{m.email || '—'}</td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(m)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors"
                            style={{ color: C.faint }}>
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          {!isProfile && (
                            <button onClick={() => setDeleting(m)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                              style={{ color: '#E06464' }}>
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      </div>{/* end desktop block */}

      {/* Add / Edit Drawer (general members only) */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(50,30,10,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={closeDrawer} />
          <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md overflow-y-auto flex flex-col"
            style={{ backgroundColor: '#fff', borderLeft: `1.5px solid ${C.beige}`, boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: C.beige }}>
              <h3 className="text-lg font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>
                {drawer.mode === 'add' ? 'Add Member' : 'Edit Member'}
              </h3>
              <button onClick={closeDrawer} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-50" style={{ color: C.faint }}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 flex-1">
              {formErr && <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{formErr}</div>}
              <Field label="Full Name" required>
                <input name="full_name" value={form.full_name} onChange={hc} placeholder="Nguyen Van A" style={inputStyle} />
              </Field>
              <Field label="Pháp danh">
                <input name="phap_danh" value={form.phap_danh} onChange={hc} placeholder="e.g. Tâm An" style={inputStyle} />
              </Field>
              <Field label="Role">
                <select name="role" value={form.role} onChange={hc} style={inputStyle}>
                  {MEMBER_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Birthday">
                <input type="date" name="birthday" value={form.birthday} onChange={hc} style={inputStyle} />
              </Field>
              <Field label="Phone Number">
                <input name="phone_number" value={form.phone_number} onChange={hc} placeholder="(757) 123-4567" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea name="notes" value={form.notes} onChange={hc} rows={3} placeholder="Optional notes..." style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
            </div>
            <div className="flex gap-3 px-6 py-5 border-t shrink-0" style={{ borderColor: C.beige }}>
              <button onClick={closeDrawer} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border hover:opacity-80" style={{ borderColor: C.beige, color: C.muted }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                {saving ? 'Saving…' : drawer.mode === 'add' ? 'Save Member' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(50,30,10,0.45)', backdropFilter: 'blur(2px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
            <h4 className="font-extrabold text-lg mb-2" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Remove Member?</h4>
            <p className="text-sm mb-6" style={{ color: C.muted }}>
              Are you sure you want to remove <strong style={{ color: C.burgundy }}>{deleting.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border" style={{ borderColor: C.beige, color: C.muted }}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white" style={{ backgroundColor: '#E06464' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
