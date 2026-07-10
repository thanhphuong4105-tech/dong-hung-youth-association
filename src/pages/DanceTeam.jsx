import { useState, useEffect, useCallback, useRef } from 'react'
import { PlusIcon, XMarkIcon, PencilIcon, TrashIcon, UserGroupIcon, UsersIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  orange:      '#F1745E',
  orangeLight: '#FFF7F3',
  orangeMid:   '#FBC3B9',
  sage:        '#4F252A',
  sageLight:   '#FFF7F3',
  sageMid:     '#EDD0AC',
  cream:       '#FFF7F3',
  peach:       '#EDD0AC',
  text:        '#4F252A',
  muted:       '#7A5550',
  faint:       '#A08070',
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
  border: `1.5px solid ${C.peach}`, backgroundColor: '#FFF7F3',
  color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: '0.875rem', outline: 'none',
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function Avatar({ name }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
      {initials(name)}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-4 animate-spin"
        style={{ borderColor: C.peach, borderTopColor: C.orange }} />
    </div>
  )
}

function EmptyState({ Icon, label, sub, onAdd, addLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-10 h-10 mb-3" style={{ color: '#A08070' }} />}
      <p className="text-base font-semibold mb-1" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>{label}</p>
      <p className="text-sm mb-5" style={{ color: C.faint }}>{sub}</p>
      {onAdd && (
        <button onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          <PlusIcon className="w-4 h-4" /> {addLabel}
        </button>
      )}
    </div>
  )
}

// ─── Three-dots row menu ──────────────────────────────────────────────────────
function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirming(false) } }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
        style={{ color: C.faint }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
        </svg>
      </button>

      {open && !confirming && (
        <div className="absolute right-0 top-9 z-20 rounded-2xl overflow-hidden min-w-[140px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${C.peach}` }}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-orange-50"
            style={{ color: C.text }}>
            <PencilIcon className="w-4 h-4" style={{ color: C.orange }} /> Edit
          </button>
          <div style={{ borderTop: `1px solid ${C.peach}` }} />
          <button onClick={e => { e.stopPropagation(); setConfirming(true) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left hover:bg-red-50"
            style={{ color: '#E06464' }}>
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {open && confirming && (
        <div className="absolute right-0 top-9 z-20 rounded-2xl p-4 min-w-[170px]"
          style={{ backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #EFCAC8' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: C.text }}>Delete this entry?</p>
          <div className="flex gap-2">
            <button onClick={e => { e.stopPropagation(); setConfirming(false) }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl border"
              style={{ borderColor: C.peach, color: C.muted }}>Cancel</button>
            <button onClick={e => { e.stopPropagation(); setOpen(false); setConfirming(false); onDelete() }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white"
              style={{ backgroundColor: '#E06464' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1.5px solid ${C.peach}` }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.peach }}>
          <h3 className="text-lg font-bold" style={{ color: C.text, fontFamily: "'Nunito', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-orange-50" style={{ color: C.muted }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function FormButtons({ onClose, saving, label }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
        style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>Cancel</button>
      <button type="submit" disabled={saving}
        className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>{children}</label>
}

function ErrBox({ msg }) {
  if (!msg) return null
  return <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>{msg}</div>
}

// ─── Table shell ──────────────────────────────────────────────────────────────
function TableShell({ headers, children }) {
  return (
    <div className="rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: '#FFF0EA', borderBottom: '1.5px solid #EDD0AC' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A08070', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function TableRow({ i, total, children }) {
  return (
    <tr style={{ backgroundColor: '#ffffff', borderBottom: i < total - 1 ? '1px solid #F5E8DC' : 'none' }}>
      {children}
    </tr>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICIPANTS
// ═══════════════════════════════════════════════════════════════════════════════
const PARTICIPANT_STATUS = {
  active:   { label: 'Active',   bg: '#FFF7F3', color: '#F1745E', border: '#EDD0AC' },
  inactive: { label: 'Inactive', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
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

function ParticipantModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:          editing?.name          ?? '',
    birthday:      editing?.birthday      ?? '',
    height:        editing?.height        ?? '',
    weight:        editing?.weight        ?? '',
    clothing_size: editing?.clothing_size ?? '',
    notes:         editing?.notes         ?? '',
  })
  const [parents, setParents] = useState(
    editing?.parents?.length
      ? editing.parents
      : [{ name: '', phone: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  function updateParent(idx, field, value) {
    setParents(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }
  function addParent() { setParents(ps => [...ps, { name: '', phone: '' }]) }
  function removeParent(idx) { setParents(ps => ps.filter((_, i) => i !== idx)) }

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (!form.name.trim()) return setErr('Name is required.')
    setSaving(true)
    const cleanParents = parents.filter(p => p.name.trim() || p.phone.trim()).map(p => ({ name: p.name.trim(), phone: p.phone.trim() }))
    const payload = {
      name:          form.name.trim(),
      birthday:      form.birthday || null,
      age:           calcAge(form.birthday),
      height:        form.height.trim() || null,
      weight:        form.weight.trim() || null,
      clothing_size: form.clothing_size.trim() || null,
      parents:       cleanParents.length ? cleanParents : null,
      notes:         form.notes.trim() || null,
    }
    const { error } = editing
      ? await supabase.from('dance_team_participants').update(payload).eq('id', editing.id)
      : await supabase.from('dance_team_participants').insert([payload])
    if (error) { setSaving(false); return setErr(error.message) }

    // Sync measurements to any event-specific rows with the same name
    if (editing) {
      await supabase.from('dance_participants')
        .update({
          height:        payload.height,
          weight:        payload.weight,
          clothing_size: payload.clothing_size,
        })
        .eq('name', payload.name)
    }

    // Auto-sync parents to dance_team_parents table
    for (const parent of cleanParents) {
      if (!parent.name) continue
      const childName = form.name.trim()
      const { data: existing } = await supabase
        .from('dance_team_parents')
        .select('id, children_names, phone')
        .ilike('parent_name', parent.name)
        .maybeSingle()
      if (existing) {
        const children = existing.children_names || []
        if (!children.includes(childName)) {
          await supabase.from('dance_team_parents')
            .update({ children_names: [...children, childName], phone: existing.phone || parent.phone || null })
            .eq('id', existing.id)
        }
      } else {
        await supabase.from('dance_team_parents').insert([{
          parent_name: parent.name,
          phone: parent.phone || null,
          children_names: [childName],
        }])
      }
    }

    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <ModalShell title={editing ? 'Edit Participant' : 'Add Participant'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrBox msg={err} />
        <div><FieldLabel>Name *</FieldLabel><input name="name" value={form.name} onChange={hc} required style={inputStyle} /></div>
        <div><FieldLabel>Birthday</FieldLabel><input type="date" name="birthday" value={form.birthday} onChange={hc} style={inputStyle} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><FieldLabel>Height</FieldLabel><input name="height" value={form.height} onChange={hc} placeholder="5'2&quot;" style={inputStyle} /></div>
          <div><FieldLabel>Weight</FieldLabel><input name="weight" value={form.weight} onChange={hc} placeholder="110 lbs" style={inputStyle} /></div>
          <div><FieldLabel>Clothing Size</FieldLabel><input name="clothing_size" value={form.clothing_size} onChange={hc} placeholder="S / M / L" style={inputStyle} /></div>
        </div>

        {/* Dynamic parents list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Parents / Guardians</FieldLabel>
            <button type="button" onClick={addParent}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors hover:bg-orange-50"
              style={{ borderColor: C.orange, color: C.orange, backgroundColor: C.orangeLight }}>
              + Add Parent
            </button>
          </div>
          <div className="space-y-2">
            {parents.map((p, idx) => (
              <div key={idx} className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: '#FFF7F3', border: `1px solid ${C.peach}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: C.muted }}>Parent {idx + 1}</span>
                  {parents.length > 1 && (
                    <button type="button" onClick={() => removeParent(idx)}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                      style={{ color: '#E06464' }}>
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  placeholder="Parent / guardian name"
                  value={p.name}
                  onChange={e => updateParent(idx, 'name', e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="(757) 123-4567"
                  value={p.phone}
                  onChange={e => updateParent(idx, 'phone', e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        <div><FieldLabel>Notes</FieldLabel><textarea name="notes" value={form.notes} onChange={hc} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        <FormButtons onClose={onClose} saving={saving} label={editing ? 'Save Changes' : 'Add Participant'} />
      </form>
    </ModalShell>
  )
}

const PAGE_SIZE = 10

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
      <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
      <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  )
}

function ParticipantsTab({ participants, loading, canManage, onEdit, onDelete, onAdd, onReorder }) {
  const [page, setPage] = useState(1)
  const [dragOver, setDragOver] = useState(null)
  const dragIndex = useRef(null)

  if (loading) return <Spinner />
  if (participants.length === 0) return (
    <EmptyState Icon={UserGroupIcon} label="No participants yet" sub="Add your first dance team participant." onAdd={canManage ? onAdd : null} addLabel="Add Participant" />
  )

  const sorted = [...participants].sort((a, b) => {
    const ageA = calcAge(a.birthday) ?? a.age ?? 999
    const ageB = calcAge(b.birthday) ?? b.age ?? 999
    return ageA - ageB
  })
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleDragStart(e, localIdx) {
    dragIndex.current = (page - 1) * PAGE_SIZE + localIdx
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e, localIdx) {
    e.preventDefault()
    setDragOver(localIdx)
  }
  function handleDrop(e, localIdx) {
    e.preventDefault()
    const from = dragIndex.current
    const to = (page - 1) * PAGE_SIZE + localIdx
    setDragOver(null)
    dragIndex.current = null
    if (from !== to) onReorder(from, to)
  }
  function handleDragEnd() {
    setDragOver(null)
    dragIndex.current = null
  }

  return (
    <div className="space-y-4">
      <TableShell headers={['', 'No.', 'Name', 'Age', 'Height', 'Weight', 'Clothing Size', 'Parents / Guardians', '']}>
        {paged.map((row, i) => {
          const rowParents = Array.isArray(row.parents) ? row.parents : []
          const no = (page - 1) * PAGE_SIZE + i + 1
          const isOver = dragOver === i
          return (
            <tr key={row.id}
              draggable={canManage}
              onDragStart={e => handleDragStart(e, i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                backgroundColor: isOver ? C.orangeLight : '#ffffff',
                borderBottom: i < paged.length - 1 ? '1px solid #F5E8DC' : 'none',
                borderTop: isOver ? `2px solid ${C.orange}` : undefined,
                transition: 'background-color 0.15s',
                cursor: canManage ? 'grab' : 'default',
              }}>
              <td className="pl-3 pr-1 py-3 w-6">
                {canManage && (
                  <span style={{ color: C.faint, display: 'flex', alignItems: 'center' }}>
                    <GripIcon />
                  </span>
                )}
              </td>
              <td className="px-3 py-3 w-10 text-center text-xs font-semibold" style={{ color: C.faint }}>{no}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={row.name} />
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: C.text }}>{row.name}</p>
                    {row.notes && <p className="text-xs truncate" style={{ color: C.faint }}>{row.notes}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{calcAge(row.birthday) ?? row.age ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.height || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.weight || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.clothing_size || '—'}</td>
              <td className="px-4 py-3">
                {rowParents.length === 0 ? (
                  <span style={{ color: C.muted }}>—</span>
                ) : (
                  <div className="space-y-1">
                    {rowParents.map((p, pi) => (
                      <div key={pi}>
                        <span className="font-medium" style={{ color: C.text }}>{p.name || '—'}</span>
                        {p.phone && <span className="text-xs ml-1.5" style={{ color: C.faint }}>{p.phone}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {canManage && <RowMenu onEdit={() => onEdit(row)} onDelete={() => onDelete(row.id)} />}
              </td>
            </tr>
          )
        })}
      </TableShell>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: C.faint }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, participants.length)} of {participants.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-40"
              style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-8 h-8 text-xs font-semibold rounded-xl transition-colors"
                style={n === page
                  ? { backgroundColor: C.orange, color: '#fff' }
                  : { backgroundColor: C.cream, color: C.muted, border: `1px solid ${C.peach}` }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-40"
              style={{ borderColor: C.peach, color: C.muted, backgroundColor: C.cream }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARENTS
// ═══════════════════════════════════════════════════════════════════════════════
function ParentModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    parent_name:    editing?.parent_name    ?? '',
    phone:          editing?.phone          ?? '',
    email:          editing?.email          ?? '',
    children_names: editing?.children_names?.join(', ') ?? '',
    notes:          editing?.notes          ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (!form.parent_name.trim()) return setErr('Parent name is required.')
    setSaving(true)
    const children = form.children_names.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      parent_name:    form.parent_name.trim(),
      phone:          form.phone.trim() || null,
      email:          form.email.trim() || null,
      children_names: children.length ? children : null,
      notes:          form.notes.trim() || null,
    }
    const { error } = editing
      ? await supabase.from('dance_team_parents').update(payload).eq('id', editing.id)
      : await supabase.from('dance_team_parents').insert([payload])
    setSaving(false)
    if (error) return setErr(error.message)
    onSaved(); onClose()
  }

  return (
    <ModalShell title={editing ? 'Edit Parent' : 'Add Parent'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrBox msg={err} />
        <div><FieldLabel>Parent Name *</FieldLabel><input name="parent_name" value={form.parent_name} onChange={hc} required style={inputStyle} /></div>
        <div><FieldLabel>Phone</FieldLabel><input name="phone" value={form.phone} onChange={hc} placeholder="(757) 123-4567" style={inputStyle} /></div>
        <div><FieldLabel>Email</FieldLabel><input type="email" name="email" value={form.email} onChange={hc} placeholder="parent@example.com" style={inputStyle} /></div>
        <div><FieldLabel>Children <span style={{ color: C.faint, fontWeight: 400 }}>(comma separated)</span></FieldLabel>
          <input name="children_names" value={form.children_names} onChange={hc} placeholder="Linh Nguyen, Bao Nguyen" style={inputStyle} /></div>
        <div><FieldLabel>Notes</FieldLabel><textarea name="notes" value={form.notes} onChange={hc} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        <FormButtons onClose={onClose} saving={saving} label={editing ? 'Save Changes' : 'Add Parent'} />
      </form>
    </ModalShell>
  )
}

function ParentsTab({ parents, loading, canManage, onEdit, onDelete, onAdd }) {
  if (loading) return <Spinner />
  if (parents.length === 0) return (
    <EmptyState Icon={UsersIcon} label="No parents yet" sub="Add parent/guardian contact information." onAdd={canManage ? onAdd : null} addLabel="Add Parent" />
  )
  return (
    <TableShell headers={['Parent Name', 'Phone', 'Email', 'Children', 'Notes', '']}>
      {parents.map((row, i) => (
        <TableRow key={row.id} i={i} total={parents.length}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={row.parent_name} />
              <p className="font-semibold" style={{ color: C.text }}>{row.parent_name}</p>
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.phone || '—'}</td>
          <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.email || '—'}</td>
          <td className="px-4 py-3" style={{ color: C.muted }}>{row.children_names?.join(', ') || '—'}</td>
          <td className="px-4 py-3 max-w-[180px]">
            <p className="text-sm truncate" style={{ color: C.faint }}>{row.notes || '—'}</p>
          </td>
          <td className="px-4 py-3">
            {canManage && <RowMenu onEdit={() => onEdit(row)} onDelete={() => onDelete(row.id)} />}
          </td>
        </TableRow>
      ))}
    </TableShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SONGS
// ═══════════════════════════════════════════════════════════════════════════════
function SongModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:      editing?.title      ?? '',
    artist:     editing?.artist     ?? '',
    event_name: editing?.event_name ?? '',
    year:       editing?.year       ?? '',
    notes:      editing?.notes      ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (!form.title.trim()) return setErr('Song title is required.')
    setSaving(true)
    const payload = {
      title:      form.title.trim(),
      artist:     form.artist.trim() || null,
      event_name: form.event_name.trim() || null,
      year:       form.year ? parseInt(form.year) : null,
      notes:      form.notes.trim() || null,
    }
    const { error } = editing
      ? await supabase.from('dance_songs').update(payload).eq('id', editing.id)
      : await supabase.from('dance_songs').insert([payload])
    setSaving(false)
    if (error) return setErr(error.message)
    onSaved(); onClose()
  }

  return (
    <ModalShell title={editing ? 'Edit Song' : 'Add Song'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrBox msg={err} />
        <div><FieldLabel>Song Title *</FieldLabel><input name="title" value={form.title} onChange={hc} required placeholder="Senorita" style={inputStyle} /></div>
        <div><FieldLabel>Artist</FieldLabel><input name="artist" value={form.artist} onChange={hc} placeholder="Shawn Mendes" style={inputStyle} /></div>
        <div><FieldLabel>Event Used For</FieldLabel><input name="event_name" value={form.event_name} onChange={hc} placeholder="Lễ Vu Lan 2024" style={inputStyle} /></div>
        <div><FieldLabel>Year</FieldLabel><input name="year" type="number" min="2000" max="2100" value={form.year} onChange={hc} placeholder="2025" style={inputStyle} /></div>
        <div><FieldLabel>Notes</FieldLabel><textarea name="notes" value={form.notes} onChange={hc} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        <FormButtons onClose={onClose} saving={saving} label={editing ? 'Save Changes' : 'Add Song'} />
      </form>
    </ModalShell>
  )
}

function SongsTab({ songs, loading, canManage, onEdit, onDelete, onAdd }) {
  if (loading) return <Spinner />
  if (songs.length === 0) return (
    <EmptyState Icon={MusicalNoteIcon} label="No songs yet" sub="Track songs used in past performances." onAdd={canManage ? onAdd : null} addLabel="Add Song" />
  )
  return (
    <TableShell headers={['Song', 'Artist', 'Event Used For', 'Year', 'Notes', '']}>
      {songs.map((row, i) => (
        <TableRow key={row.id} i={i} total={songs.length}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.sageLight, color: C.sage }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <p className="font-semibold" style={{ color: C.text }}>{row.title}</p>
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.artist || '—'}</td>
          <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.event_name || '—'}</td>
          <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>{row.year || '—'}</td>
          <td className="px-4 py-3 max-w-[160px]">
            <p className="text-sm truncate" style={{ color: C.faint }}>{row.notes || '—'}</p>
          </td>
          <td className="px-4 py-3">
            {canManage && <RowMenu onEdit={() => onEdit(row)} onDelete={() => onDelete(row.id)} />}
          </td>
        </TableRow>
      ))}
    </TableShell>
  )
}

// ─── Songs sidebar card ───────────────────────────────────────────────────────
function SongsSidebar({ songs, onAdd, canManage }) {
  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: C.cream, border: `1.5px solid ${C.peach}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.peach }}>
        <div className="flex items-center gap-2">
          <span style={{ color: C.sage }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </span>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Songs Used ({songs.length})</h3>
        </div>
        {canManage && (
          <button onClick={onAdd}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors hover:bg-orange-50"
            style={{ borderColor: C.orange, color: C.orange, backgroundColor: C.orangeLight }}>
            + Add Song
          </button>
        )}
      </div>
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {songs.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: C.faint }}>No songs recorded yet.</p>
        ) : songs.slice(0, 8).map(song => (
          <div key={song.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
            style={{ backgroundColor: C.sageLight, border: `1px solid ${C.sageMid}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: C.sageMid, color: C.sage }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: C.sage }}>{song.title}</p>
              {song.artist && <p className="text-xs truncate" style={{ color: '#C07060' }}>{song.artist}</p>}
            </div>
          </div>
        ))}
        {songs.length > 8 && (
          <p className="text-xs text-center pt-1" style={{ color: C.orange }}>+{songs.length - 8} more songs</p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DanceTeam() {
  const { session } = useAuth()
  const { canManage } = useProfile()

  const [activeTab, setActiveTab] = useState('participants')
  const [participants, setParticipants] = useState([])
  const [parents, setParents] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState({ participants: true, parents: true, songs: true })
  const [modal, setModal] = useState(null) // null | { type, data }

  const fetchParticipants = useCallback(async () => {
    setLoading(l => ({ ...l, participants: true }))
    const { data } = await supabase.from('dance_team_participants').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('name')
    setParticipants(data || [])
    setLoading(l => ({ ...l, participants: false }))
  }, [])

  const fetchParents = useCallback(async () => {
    setLoading(l => ({ ...l, parents: true }))
    const { data } = await supabase.from('dance_team_parents').select('*').order('parent_name')
    setParents(data || [])
    setLoading(l => ({ ...l, parents: false }))
  }, [])

  const fetchSongs = useCallback(async () => {
    setLoading(l => ({ ...l, songs: true }))
    const { data } = await supabase.from('dance_songs').select('*').order('title')
    setSongs(data || [])
    setLoading(l => ({ ...l, songs: false }))
  }, [])

  useEffect(() => {
    if (!session) return
    fetchParticipants(); fetchParents(); fetchSongs()
  }, [session, fetchParticipants, fetchParents, fetchSongs])

  async function deleteParticipant(id) {
    await supabase.from('dance_team_participants').delete().eq('id', id); fetchParticipants()
  }

  async function reorderParticipants(from, to) {
    const updated = [...participants]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setParticipants(updated)
    await Promise.all(updated.map((p, idx) =>
      supabase.from('dance_team_participants').update({ sort_order: idx }).eq('id', p.id)
    ))
  }
  async function deleteParent(id) {
    await supabase.from('dance_team_parents').delete().eq('id', id); fetchParents()
  }
  async function deleteSong(id) {
    await supabase.from('dance_songs').delete().eq('id', id); fetchSongs()
  }

  const TABS = [
    { id: 'participants', label: 'Participants' },
    { id: 'parents',      label: 'Parents' },
    { id: 'songs',        label: 'Songs' },
  ]

  const summaryCards = [
    { label: 'Total Participants', value: participants.length, Icon: UserGroupIcon },
    { label: 'Parents/Guardians', value: parents.length,      Icon: UsersIcon     },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl mb-1" style={{ color: C.sage }}>Dance Team</h2>
        <p className="text-sm" style={{ color: C.muted }}>Manage dance team participants, parent information, and songs.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-3xl p-5 flex items-center gap-4"
            style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            <card.Icon className="w-7 h-7 shrink-0" style={{ color: '#A08070' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#A08070' }}>{card.label}</p>
              <p className="text-2xl font-extrabold leading-tight" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">

        {/* Left: tabs + table */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-5 border-b" style={{ borderColor: C.peach }}>
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="px-5 py-2.5 text-sm font-semibold transition-all relative"
                  style={{ color: activeTab === tab.id ? C.orange : C.muted }}>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: C.orange }} />
                  )}
                </button>
              ))}
            </div>
            {canManage && (
              <button onClick={() => setModal({ type: 'participant', data: null })}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity shrink-0 mb-1"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                <PlusIcon className="w-4 h-4" /> Add Participant
              </button>
            )}
          </div>

          {activeTab === 'participants' && (
            <ParticipantsTab
              participants={participants}
              loading={loading.participants}
              canManage={canManage}
              onEdit={row => setModal({ type: 'participant', data: row })}
              onDelete={deleteParticipant}
              onAdd={() => setModal({ type: 'participant', data: null })}
              onReorder={reorderParticipants}
            />
          )}
          {activeTab === 'parents' && (
            <ParentsTab
              parents={parents}
              loading={loading.parents}
              canManage={canManage}
              onEdit={row => setModal({ type: 'parent', data: row })}
              onDelete={deleteParent}
              onAdd={() => setModal({ type: 'parent', data: null })}
            />
          )}
          {activeTab === 'songs' && (
            <SongsTab
              songs={songs}
              loading={loading.songs}
              canManage={canManage}
              onEdit={row => setModal({ type: 'song', data: row })}
              onDelete={deleteSong}
              onAdd={() => setModal({ type: 'song', data: null })}
            />
          )}
        </div>

        {/* Right: Songs sidebar */}
        <div className="xl:w-72 w-full shrink-0">
          <SongsSidebar
            songs={songs}
            onAdd={() => setModal({ type: 'song', data: null })}
            canManage={canManage}
          />
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'participant' && (
        <ParticipantModal editing={modal.data} onClose={() => setModal(null)} onSaved={() => { fetchParticipants(); fetchParents() }} />
      )}
      {modal?.type === 'parent' && (
        <ParentModal editing={modal.data} onClose={() => setModal(null)} onSaved={fetchParents} />
      )}
      {modal?.type === 'song' && (
        <SongModal editing={modal.data} onClose={() => setModal(null)} onSaved={fetchSongs} />
      )}
    </div>
  )
}
