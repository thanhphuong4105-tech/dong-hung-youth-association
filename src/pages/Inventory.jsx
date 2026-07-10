import { useState, useMemo } from 'react'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
  XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon,
  ChevronRightIcon, ChevronLeftIcon, ArchiveBoxIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  burgundy: '#4F252A',
  coral:    '#E06464',
  orange:   '#F1745E',
  beige:    '#EDD0AC',
  blush:    '#FBC3B9',
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

// ─── Color map ────────────────────────────────────────────────────────────────
const COLOR_DOT = {
  Red:     '#E06464',
  Pink:    '#F4A0B0',
  Yellow:  '#F5C842',
  White:   '#E8E0D8',
  Blue:    '#5A7EC4',
  Lavender:'#9B89C4',
  Green:   '#6BBF8E',
  Purple:  '#8B5CF6',
  Gold:    '#D4A843',
  Black:   '#4A4A4A',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_INVENTORY = [
  { id: 'ao-dai-001', itemName: 'Red Áo Dài Set',     color: 'Red',     size: 'S',   totalQuantity: 6, availableQuantity: 4, borrowedQuantity: 2, condition: 'Good',        location: 'Storage Closet',  notes: '' },
  { id: 'ao-dai-002', itemName: 'Pink Áo Dài Set',    color: 'Pink',    size: 'M',   totalQuantity: 8, availableQuantity: 8, borrowedQuantity: 0, condition: 'Excellent',    location: 'Temple Storage',  notes: '' },
  { id: 'ao-dai-003', itemName: 'Yellow Áo Dài Set',  color: 'Yellow',  size: 'L',   totalQuantity: 5, availableQuantity: 3, borrowedQuantity: 2, condition: 'Good',        location: 'Storage Closet',  notes: '' },
  { id: 'ao-dai-004', itemName: 'White Áo Dài Set',   color: 'White',   size: 'XS',  totalQuantity: 4, availableQuantity: 4, borrowedQuantity: 0, condition: 'Needs Review', location: 'Dance Room',      notes: '' },
  { id: 'ao-dai-005', itemName: 'Blue Áo Dài Set',    color: 'Blue',    size: 'XL',  totalQuantity: 7, availableQuantity: 6, borrowedQuantity: 1, condition: 'Excellent',    location: 'Temple Storage',  notes: '' },
  { id: 'ao-dai-006', itemName: 'Lavender Áo Dài Set',color: 'Lavender',size: 'XXL', totalQuantity: 6, availableQuantity: 5, borrowedQuantity: 1, condition: 'Good',        location: 'Storage Closet',  notes: '' },
]

const INIT_BORROWS = [
  { id: 'borrow-001', inventoryItemId: 'ao-dai-001', itemName: 'Red Áo Dài Set',    size: 'S',  borrowerName: 'Jade Luong',   eventName: 'Lễ Phật Đản',    quantity: 2, borrowDate: '2026-05-01', expectedReturnDate: '2026-06-01', returnedDate: '',           status: 'Borrowed' },
  { id: 'borrow-002', inventoryItemId: 'ao-dai-003', itemName: 'Yellow Áo Dài Set', size: 'L',  borrowerName: 'Linh Tran',    eventName: 'Vu Lan Báo Hiếu', quantity: 1, borrowDate: '2026-08-01', expectedReturnDate: '2026-08-31', returnedDate: '',           status: 'Borrowed' },
  { id: 'borrow-003', inventoryItemId: 'ao-dai-002', itemName: 'Pink Áo Dài Set',   size: 'M',  borrowerName: 'Amy Nguyen',   eventName: 'Tết Trung Thu',   quantity: 2, borrowDate: '2025-09-20', expectedReturnDate: '2025-10-05', returnedDate: '2025-10-04', status: 'Returned' },
  { id: 'borrow-004', inventoryItemId: 'ao-dai-005', itemName: 'Blue Áo Dài Set',   size: 'XL', borrowerName: 'Hannah Pham',  eventName: 'Lễ Hội Chùa',    quantity: 1, borrowDate: '2026-04-10', expectedReturnDate: '2026-04-20', returnedDate: '2026-04-22', status: 'Overdue'  },
]

const INIT_SALES = [
  { id: 'sale-001', itemName: 'Red Áo Dài Set',  size: 'S', buyerName: 'Thuy Nguyen', eventName: 'Tết 2026',       quantity: 1, saleDate: '2026-01-15', price: '45', notes: '' },
  { id: 'sale-002', itemName: 'Pink Áo Dài Set', size: 'M', buyerName: 'Linh Pham',   eventName: 'Vu Lan 2025',    quantity: 2, saleDate: '2025-08-20', price: '40', notes: 'Discount applied' },
]

const SIZES    = ['XS','S','M','L','XL','XXL','XXXL']
const COLORS   = ['Red','Pink','Yellow','White','Blue','Lavender','Green','Purple','Gold','Black']
const CONDITIONS = ['Excellent','Good','Needs Cleaning','Needs Repair','Needs Review']
const LOCATIONS  = ['Storage Closet','Temple Storage','Dance Room','Office','Other']

// ─── localStorage persistence ─────────────────────────────────────────────────
function useLocalStorage(key, init) {
  const [value, setRaw] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : init
    } catch { return init }
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—'
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return dateStr }
}

function ConditionBadge({ condition }) {
  const styles = {
    'Excellent':      { bg: '#F0FAF4', color: '#2D7A4F', border: '#A8DFC0' },
    'Good':           { bg: '#FEF8EC', color: '#8A6200', border: '#F0D080' },
    'Needs Cleaning': { bg: '#FFF0EC', color: '#C05040', border: '#F4B8A8' },
    'Needs Repair':   { bg: '#FFF0EC', color: '#C05040', border: '#F4B8A8' },
    'Needs Review':   { bg: '#FFF0F5', color: '#B0305A', border: '#F4B0C8' },
  }
  const s = styles[condition] || styles['Good']
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {condition}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'Borrowed': { bg: '#FFF0EC', color: '#C05040', border: '#F4B8A8' },
    'Returned': { bg: '#F0FAF4', color: '#2D7A4F', border: '#A8DFC0' },
    'Overdue':  { bg: '#FFF0F5', color: '#B0305A', border: '#F4B0C8' },
  }
  const s = styles[status] || styles['Borrowed']
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  )
}

function ColorDot({ color }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full inline-block shrink-0 border"
        style={{ backgroundColor: COLOR_DOT[color] || '#ccc', borderColor: '#E0C8C0' }} />
      {color}
    </span>
  )
}

// ─── Derive icon color from item name keywords ────────────────────────────────
const NAME_COLOR_MAP = [
  { keywords: ['red'],      color: '#E06464' },
  { keywords: ['hot pink'], color: '#FF1493' },
  { keywords: ['pink'],     color: '#F4A0B0' },
  { keywords: ['yellow'],   color: '#F5C842' },
  { keywords: ['white'],    color: '#D8CFC8' },
  { keywords: ['blue'],     color: '#5A7EC4' },
  { keywords: ['lavender'], color: '#9B89C4' },
  { keywords: ['green'],    color: '#6BBF8E' },
  { keywords: ['purple'],   color: '#8B5CF6' },
  { keywords: ['gold'],     color: '#D4A843' },
  { keywords: ['black'],    color: '#4A4A4A' },
  { keywords: ['gray', 'grey'], color: '#9E9E9E' },
  { keywords: ['orange'],   color: '#F1745E' },
  { keywords: ['silver'],   color: '#B0B0B0' },
]
function iconColorFromName(name = '') {
  const lower = name.toLowerCase()
  for (const { keywords, color } of NAME_COLOR_MAP) {
    if (keywords.some(k => lower.includes(k))) return color
  }
  return '#F1745E'
}

// ─── T-shirt (crew neck) icon ─────────────────────────────────────────────────
function ShirtIcon({ color = '#F1745E', size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
      {/* Body */}
      <path d="M11 18 L11 38 L29 38 L29 18 Z" fill={color} opacity="0.85" />
      {/* Left short sleeve */}
      <path d="M11 18 L4 16 L3 24 L11 24 Z" fill={color} opacity="0.82" />
      {/* Right short sleeve */}
      <path d="M29 18 L36 16 L37 24 L29 24 Z" fill={color} opacity="0.82" />
      {/* Shoulder seam left */}
      <path d="M15 15 L11 18" stroke="white" strokeWidth="0.7" opacity="0.4" />
      {/* Shoulder seam right */}
      <path d="M25 15 L29 18" stroke="white" strokeWidth="0.7" opacity="0.4" />
      {/* Crew neckline */}
      <ellipse cx="20" cy="16" rx="2.2" ry="1.5" fill="white" opacity="0.9" />
      {/* Hem */}
      <line x1="11" y1="38" x2="29" y2="38" stroke="white" strokeWidth="0.8" opacity="0.3" />
    </svg>
  )
}

function isVatHo(name = '') {
  const n = name.toLowerCase()
  return n.includes('vạt hò') || n.includes('vat ho') || n.includes('vạt ho') || n.includes('vat hò')
}

function isShirt(name = '') {
  return name.toLowerCase().includes('shirt')
}

function ClothingIcon({ itemName, color, size = 28 }) {
  if (isVatHo(itemName))  return <VatHoIcon color={color} size={size} />
  if (isShirt(itemName))  return <ShirtIcon color={color} size={size} />
  return <AoDaiIcon color={color} size={size} />
}

// ─── Áo Dài clothing icon ────────────────────────────────────────────────────
function AoDaiIcon({ color = '#F1745E', size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 56" fill="none">
      <path d="M20 2 C14 2 10 6 8 10 L2 18 L8 20 L10 28 L10 54 L30 54 L30 28 L32 20 L38 18 L32 10 C30 6 26 2 20 2Z"
        fill={color} opacity="0.85" />
      <path d="M14 2 C14 8 10 12 8 10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M26 2 C26 8 30 12 32 10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M10 28 L30 28" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="20" cy="4" rx="4" ry="3" fill={color} opacity="0.5" />
    </svg>
  )
}

// ─── Vạt Hò (Buddhist clothes) icon ─────────────────────────────────────────
function VatHoIcon({ color = '#9E9E9E', size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
      {/* Body — boxy, wide tunic */}
      <path d="M11 14 L8 14 L8 36 L32 36 L32 14 L29 14 Z"
        fill={color} opacity="0.85" />
      {/* Left sleeve — wide and drooping */}
      <path d="M11 14 L8 14 L2 22 L6 23 L11 18 Z"
        fill={color} opacity="0.80" />
      {/* Right sleeve — wide and drooping */}
      <path d="M29 14 L32 14 L38 22 L34 23 L29 18 Z"
        fill={color} opacity="0.80" />
      {/* Round neckline cutout */}
      <ellipse cx="20" cy="14" rx="5" ry="3.5" fill="white" opacity="0.9" />
      {/* Center front seam */}
      <line x1="20" y1="17" x2="20" y2="36" stroke="white" strokeWidth="0.8" opacity="0.5" />
      {/* Hem line */}
      <line x1="8" y1="36" x2="32" y2="36" stroke="white" strokeWidth="0.8" opacity="0.3" />
      {/* Pants hint */}
      <rect x="11" y="36" width="8" height="10" rx="1" fill={color} opacity="0.55" />
      <rect x="21" y="36" width="8" height="10" rx="1" fill={color} opacity="0.55" />
    </svg>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-md h-full overflow-y-auto shadow-2xl"
        style={{ backgroundColor: '#FFFCF8', borderLeft: `1.5px solid ${C.beige}` }}>
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

// ─── Add/Edit Áo Dài Form ─────────────────────────────────────────────────────
function InventoryForm({ initial, onSave, onClose }) {
  const blank = { itemName: '', color: 'Red', size: 'M', totalQuantity: 1, availableQuantity: 1, borrowedQuantity: 0, condition: 'Good', location: 'Storage Closet', notes: '' }
  const [form, setForm] = useState(initial || blank)
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.itemName.trim()) return setErr('Item name is required.')
    onSave(form)
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Item Name *</label>
        <input name="itemName" value={form.itemName} onChange={hc} placeholder="Red Áo Dài Set" required style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Size</label>
          <input name="size" value={form.size} onChange={hc} placeholder="e.g. S, M, L, XL…" style={inputStyle} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Total Quantity</label>
          <input type="number" name="totalQuantity" min="0" value={form.totalQuantity} onChange={hc} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Available Quantity</label>
          <input type="number" name="availableQuantity" min="0" value={form.availableQuantity} onChange={hc} style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={hc} rows={2} placeholder="Any additional notes…" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
          style={{ borderColor: C.beige, color: C.muted, backgroundColor: C.bg }}>Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Save
        </button>
      </div>
    </form>
  )
}

// ─── Borrow Form ──────────────────────────────────────────────────────────────
function BorrowForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    itemName: initial.itemName || '',
    size: initial.size || '',
    borrowerName: initial.borrowerName,
    eventName: initial.eventName || '',
    quantity: initial.quantity,
    borrowDate: initial.borrowDate,
    expectedReturnDate: initial.expectedReturnDate,
    returnedDate: initial.returnedDate || '',
    notes: initial.notes || '',
  } : {
    itemName: '', size: '',
    borrowerName: '', eventName: '', quantity: 1,
    borrowDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: '', returnedDate: '', notes: '',
  })
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.itemName.trim()) return setErr('Item name is required.')
    if (!form.borrowerName.trim()) return setErr('Borrower name is required.')
    if (!form.expectedReturnDate) return setErr('Expected return date is required.')
    const qty = Number(form.quantity)
    if (qty < 1) return setErr('Quantity must be at least 1.')
    onSave({ ...form, quantity: qty })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Item Name *</label>
          <input name="itemName" value={form.itemName} onChange={hc} placeholder="Red Áo Dài Set" required style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Size</label>
          <select name="size" value={form.size} onChange={hc} style={inputStyle}>
            <option value="">—</option>
            {SIZES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Borrower Name *</label>
        <input name="borrowerName" value={form.borrowerName} onChange={hc} placeholder="Nguyen Thi A" required style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Related Event</label>
        <input name="eventName" value={form.eventName} onChange={hc} placeholder="e.g. Tết Trung Thu" style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Quantity Borrowed</label>
        <input type="number" name="quantity" min="1" value={form.quantity} onChange={hc} style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Borrow Date</label>
          <input type="date" name="borrowDate" value={form.borrowDate} onChange={hc} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Expected Return *</label>
          <input type="date" name="expectedReturnDate" value={form.expectedReturnDate} onChange={hc} required style={inputStyle} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Return Date</label>
          {form.returnedDate && (
            <button type="button" onClick={() => setForm(f => ({ ...f, returnedDate: '' }))}
              className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: C.coral }}>Clear</button>
          )}
        </div>
        <input type="date" name="returnedDate" value={form.returnedDate} onChange={hc} style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={hc} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
          style={{ borderColor: C.beige, color: C.muted, backgroundColor: C.bg }}>Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Save
        </button>
      </div>
    </form>
  )
}

// ─── Sale Form ────────────────────────────────────────────────────────────────
function SaleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    itemName: initial.itemName || '',
    size: initial.size || '',
    buyerName: initial.buyerName || '',
    eventName: initial.eventName || '',
    quantity: initial.quantity || 1,
    saleDate: initial.saleDate || new Date().toISOString().slice(0, 10),
    price: initial.price || '',
    notes: initial.notes || '',
  } : {
    itemName: '', size: '', buyerName: '', eventName: '',
    quantity: 1, saleDate: new Date().toISOString().slice(0, 10), price: '', notes: '',
  })
  const [err, setErr] = useState('')
  function hc(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function handleSave(e) {
    e.preventDefault()
    if (!form.itemName.trim()) return setErr('Item name is required.')
    if (!form.buyerName.trim()) return setErr('Buyer name is required.')
    if (Number(form.quantity) < 1) return setErr('Quantity must be at least 1.')
    onSave({ ...form, quantity: Number(form.quantity) })
  }
  return (
    <form onSubmit={handleSave} className="space-y-4">
      {err && <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FFF0EC', border: '1px solid #F4B8A8', color: '#C05040' }}>{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Item Name *</label>
          <input name="itemName" value={form.itemName} onChange={hc} placeholder="Red Áo Dài Set" required style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Size</label>
          <input name="size" value={form.size} onChange={hc} placeholder="e.g. S, M, L…" style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Buyer Name *</label>
        <input name="buyerName" value={form.buyerName} onChange={hc} placeholder="Nguyen Thi A" required style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Related Event / Occasion</label>
        <input name="eventName" value={form.eventName} onChange={hc} placeholder="e.g. Tết 2026" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Quantity Sold</label>
          <input type="number" name="quantity" min="1" value={form.quantity} onChange={hc} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Price ($)</label>
          <input type="number" name="price" min="0" step="0.01" value={form.price} onChange={hc} placeholder="0.00" style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Sale Date</label>
        <input type="date" name="saleDate" value={form.saleDate} onChange={hc} style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted }}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={hc} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
          style={{ borderColor: C.beige, color: C.muted, backgroundColor: C.bg }}>Cancel</button>
        <button type="submit"
          className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Save
        </button>
      </div>
    </form>
  )
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(50,30,10,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ backgroundColor: '#fff', border: `1.5px solid ${C.beige}`, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
        <h3 className="text-lg font-extrabold mb-2" style={{ color: C.burgundy }}>Delete Item?</h3>
        <p className="text-sm mb-6" style={{ color: C.muted }}>This will permanently delete <strong>{name}</strong>. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl border"
            style={{ borderColor: C.beige, color: C.muted }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white"
            style={{ backgroundColor: '#E06464' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Low Stock Card ───────────────────────────────────────────────────────────
function LowStockCard({ inventory, onViewAll }) {
  const LOW_THRESHOLD = 0.5
  const lowItems = inventory.filter(i =>
    i.totalQuantity > 0 && i.availableQuantity / i.totalQuantity <= LOW_THRESHOLD
  )

  return (
    <div className="rounded-3xl p-5" style={{ backgroundColor: C.card, border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 mb-4">
        <ExclamationTriangleIcon className="w-5 h-5" style={{ color: C.orange }} />
        <h3 className="text-sm font-extrabold" style={{ color: C.burgundy }}>Low Stock / Needs Attention</h3>
      </div>
      {lowItems.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: C.faint }}>All items are well stocked!</p>
      ) : (
        <div className="space-y-3">
          {lowItems.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.beige}` }}>
              <div className="shrink-0">
                <ClothingIcon itemName={item.itemName} color={iconColorFromName(item.itemName)} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: C.burgundy }}>{item.itemName} ({item.size})</p>
                <p className="text-xs mt-0.5" style={{ color: item.availableQuantity <= 2 ? C.coral : C.muted }}>
                  <span className="font-semibold">{item.availableQuantity} available</span>
                </p>
                <p className="text-[10px]" style={{ color: C.faint }}>Total: {item.totalQuantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {lowItems.length > 0 && (
        <button onClick={onViewAll} className="mt-4 flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: C.orange }}>
          View all low stock <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6

export default function Inventory() {
  const [inventory, setInventory] = useLocalStorage('dhya_inventory', INIT_INVENTORY)
  const [borrows,   setBorrows]   = useLocalStorage('dhya_borrows',   INIT_BORROWS)
  const [sales,     setSales]     = useLocalStorage('dhya_sales',     INIT_SALES)

  // Drawers / modals
  const [addOpen,       setAddOpen]       = useState(false)
  const [addBorrowOpen, setAddBorrowOpen] = useState(false)
  const [addSaleOpen,   setAddSaleOpen]   = useState(false)
  const [editItem,      setEditItem]      = useState(null)
  const [borrowItem,    setBorrowItem]    = useState(null)
  const [deleteItem,    setDeleteItem]    = useState(null)
  const [editingBorrow, setEditingBorrow] = useState(null)
  const [deleteBorrow,  setDeleteBorrow]  = useState(null)
  const [editingSale,   setEditingSale]   = useState(null)
  const [deleteSale,    setDeleteSale]    = useState(null)
  const [showAllBorrows, setShowAllBorrows] = useState(false)
  const [showAllSales,   setShowAllSales]   = useState(false)
  const [showAllLow,     setShowAllLow]     = useState(false)

  // Filters
  const [search,    setSearch]    = useState('')
  const [sizeF,     setSizeF]     = useState('')
  const [colorF,    setColorF]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [page, setPage] = useState(1)

  // ── Filtered inventory ──
  const filtered = useMemo(() => {
    return inventory.filter(i => {
      const matchSearch = !search || i.itemName.toLowerCase().includes(search.toLowerCase()) || i.color.toLowerCase().includes(search.toLowerCase())
      const matchSize   = !sizeF  || i.size  === sizeF
      const matchColor  = !colorF || i.color === colorF
      const matchStatus = !statusF || (
        statusF === 'available' ? i.availableQuantity > 0 :
        statusF === 'borrowed'  ? i.borrowedQuantity  > 0 :
        statusF === 'low'       ? (i.totalQuantity > 0 && i.availableQuantity / i.totalQuantity <= 0.5) :
        statusF === 'review'    ? (i.condition === 'Needs Review' || i.condition === 'Needs Repair') : true
      )
      return matchSearch && matchSize && matchColor && matchStatus
    }).sort((a, b) => a.itemName.localeCompare(b.itemName))
  }, [inventory, search, sizeF, colorF, statusF])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Handlers ──
  function handleAdd(form) {
    const id = 'ao-dai-' + Date.now()
    const qty = Number(form.totalQuantity)
    const avail = Number(form.availableQuantity)
    setInventory(prev => [...prev, { ...form, id, totalQuantity: qty, availableQuantity: avail, borrowedQuantity: qty - avail }])
    setAddOpen(false)
    setPage(1)
  }

  function handleEdit(form) {
    setInventory(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form, totalQuantity: Number(form.totalQuantity), availableQuantity: Number(form.availableQuantity), borrowedQuantity: Number(form.totalQuantity) - Number(form.availableQuantity) } : i))
    setEditItem(null)
  }

  function handleDelete() {
    setInventory(prev => prev.filter(i => i.id !== deleteItem.id))
    setDeleteItem(null)
  }

  function handleBorrow(form) {
    const qty = Number(form.quantity)
    const newRecord = {
      id: 'borrow-' + Date.now(),
      inventoryItemId: null,
      itemName: form.itemName,
      size: form.size,
      borrowerName: form.borrowerName,
      eventName: form.eventName,
      quantity: qty,
      borrowDate: form.borrowDate,
      expectedReturnDate: form.expectedReturnDate,
      returnedDate: form.returnedDate || '',
      status: form.returnedDate ? 'Returned' : (form.expectedReturnDate && new Date(form.expectedReturnDate) < new Date() ? 'Overdue' : 'Borrowed'),
      notes: form.notes,
    }
    setBorrows(prev => [newRecord, ...prev])
    setAddBorrowOpen(false)
    setBorrowItem(null)
  }

  function handleEditBorrow(form) {
    setBorrows(prev => prev.map(b => b.id === editingBorrow.id
      ? { ...b, itemName: form.itemName, size: form.size, borrowerName: form.borrowerName, eventName: form.eventName, quantity: Number(form.quantity), borrowDate: form.borrowDate, expectedReturnDate: form.expectedReturnDate, returnedDate: form.returnedDate || '', status: form.returnedDate ? 'Returned' : (form.expectedReturnDate && new Date(form.expectedReturnDate) < new Date() ? 'Overdue' : 'Borrowed'), notes: form.notes }
      : b))
    setEditingBorrow(null)
  }

  function handleDeleteBorrow() {
    const record = deleteBorrow
    setBorrows(prev => prev.filter(b => b.id !== record.id))
    if (record.status === 'Borrowed') {
      setInventory(prev => prev.map(i => i.id === record.inventoryItemId
        ? { ...i, availableQuantity: i.availableQuantity + record.quantity, borrowedQuantity: Math.max(0, i.borrowedQuantity - record.quantity) }
        : i))
    }
    setDeleteBorrow(null)
  }

  function handleReturn(borrowId) {
    const record = borrows.find(b => b.id === borrowId)
    if (!record) return
    setBorrows(prev => prev.map(b => b.id === borrowId
      ? { ...b, status: 'Returned', returnedDate: new Date().toISOString().slice(0, 10) }
      : b))
    setInventory(prev => prev.map(i => i.id === record.inventoryItemId
      ? { ...i, availableQuantity: i.availableQuantity + record.quantity, borrowedQuantity: Math.max(0, i.borrowedQuantity - record.quantity) }
      : i))
  }

  function handleSale(form) {
    const id = 'sale-' + Date.now()
    setSales(prev => [{ ...form, id }, ...prev])
    setAddSaleOpen(false)
  }

  function handleEditSale(form) {
    setSales(prev => prev.map(s => s.id === editingSale.id ? { ...s, ...form } : s))
    setEditingSale(null)
  }

  function handleDeleteSale() {
    setSales(prev => prev.filter(s => s.id !== deleteSale.id))
    setDeleteSale(null)
  }

  const displayedBorrows = showAllBorrows ? borrows : borrows.slice(0, 4)
  const displayedSales   = showAllSales   ? sales   : sales.slice(0, 4)

  const selectStyle = { ...inputStyle, width: 'auto', minWidth: '120px', paddingRight: '2rem', cursor: 'pointer' }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Inventory</h2>
          <p className="text-sm" style={{ color: C.muted }}>Track áo dài sizes, colors, quantities, and borrowed items.</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity shrink-0"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          <PlusIcon className="w-4 h-4" /> Add Áo Dài
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* ── Left main column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.faint }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search inventory..."
                style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
            </div>
            <select value={sizeF} onChange={e => { setSizeF(e.target.value); setPage(1) }} style={selectStyle}>
              <option value="">All Sizes</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Inventory Table */}
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: C.card, border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F5EDE4' }}>
              <div className="flex items-center gap-2">
                <ArchiveBoxIcon className="w-5 h-5" style={{ color: '#A08070' }} />
                <h3 className="text-base font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Inventory Tracker</h3>
              </div>
              <button onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                <PlusIcon className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                    {['Item Name','Size','Total Qty','Available','Borrowed','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm" style={{ color: C.faint }}>No items found.</td>
                    </tr>
                  ) : paginated.map((item, i) => (
                    <tr key={item.id}
                      style={{ borderBottom: i < paginated.length - 1 ? `1px solid #F5EDE4` : 'none', backgroundColor: 'transparent' }}
                      className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClothingIcon itemName={item.itemName} color={iconColorFromName(item.itemName)} size={28} />
                          <span className="font-semibold text-xs whitespace-nowrap" style={{ color: C.burgundy }}>{item.itemName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.burgundy }}>{item.size}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-center" style={{ color: C.burgundy }}>{item.totalQuantity}</td>
                      <td className="px-4 py-3 text-xs font-bold text-center" style={{ color: item.availableQuantity > 0 ? '#2D7A4F' : C.faint }}>{item.availableQuantity}</td>
                      <td className="px-4 py-3 text-xs font-bold text-center" style={{ color: item.borrowedQuantity > 0 ? C.coral : C.faint }}>{item.borrowedQuantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditItem(item)} title="Edit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors"
                            style={{ color: C.muted }}>
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteItem(item)} title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ color: C.coral }}>
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#F5EDE4' }}>
              <p className="text-xs" style={{ color: C.faint }}>
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-50 disabled:opacity-30"
                  style={{ color: C.muted, border: `1px solid ${C.beige}` }}>
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: C.orange }}>{page}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-50 disabled:opacity-30"
                  style={{ color: C.muted, border: `1px solid ${C.beige}` }}>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs ml-1" style={{ color: C.faint }}>6 per page</span>
              </div>
            </div>
          </div>

          {/* ── Borrow History ── */}
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: C.card, border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F5EDE4' }}>
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5" style={{ color: '#A08070' }} />
                <h3 className="text-base font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Borrow History</h3>
              </div>
              <button onClick={() => setAddBorrowOpen(true)}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                <PlusIcon className="w-3.5 h-3.5" /> Add Borrow
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                    {['Item Name','Size','Borrower','Event','Qty','Borrow Date','Expected Return','Return Date','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedBorrows.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-sm" style={{ color: C.faint }}>No borrow history yet.</td></tr>
                  ) : displayedBorrows.map((b, i) => (
                    <tr key={b.id}
                      style={{ borderBottom: i < displayedBorrows.length - 1 ? `1px solid #F5EDE4` : 'none' }}
                      className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClothingIcon itemName={b.itemName} color={iconColorFromName(b.itemName)} size={28} />
                          <span className="font-semibold text-xs whitespace-nowrap" style={{ color: C.burgundy }}>{b.itemName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{b.size}</td>
                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: C.burgundy }}>{b.borrowerName}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{b.eventName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-center font-semibold" style={{ color: C.burgundy }}>{b.quantity}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(b.borrowDate)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(b.expectedReturnDate)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(b.returnedDate)}</td>
                      <td className="px-4 py-3">{(() => {
                        const status = b.returnedDate ? 'Returned' : (b.expectedReturnDate && new Date(b.expectedReturnDate) < new Date() ? 'Overdue' : 'Borrowed')
                        return <StatusBadge status={status} />
                      })()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!b.returnedDate && (
                            <button onClick={() => handleReturn(b.id)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:opacity-80 transition-opacity whitespace-nowrap"
                              style={{ backgroundColor: '#F0FAF4', color: '#2D7A4F', border: '1px solid #A8DFC0' }}>
                              <ArrowPathIcon className="w-3 h-3" /> Return
                            </button>
                          )}
                          <button onClick={() => setEditingBorrow(b)} title="Edit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors"
                            style={{ color: C.muted }}>
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteBorrow(b)} title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ color: C.coral }}>
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {borrows.length > 4 && (
              <div className="px-5 py-3 border-t text-center" style={{ borderColor: '#F5EDE4' }}>
                <button onClick={() => setShowAllBorrows(v => !v)}
                  className="text-xs font-semibold flex items-center gap-1 mx-auto hover:opacity-70 transition-opacity"
                  style={{ color: C.orange }}>
                  {showAllBorrows ? 'Show less' : `View all borrow history`}
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {/* ── Sold History ── */}
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: C.card, border: `1.5px solid ${C.beige}`, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F5EDE4' }}>
              <div className="flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5" style={{ color: '#A08070' }} />
                <h3 className="text-base font-extrabold" style={{ color: C.burgundy, fontFamily: "'Nunito', sans-serif" }}>Sold History</h3>
              </div>
              <button onClick={() => setAddSaleOpen(true)}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                <PlusIcon className="w-3.5 h-3.5" /> Add Sale
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FFF0EA', borderBottom: `1.5px solid ${C.beige}` }}>
                    {['Item Name','Size','Buyer','Event / Occasion','Qty','Price','Sale Date','Notes','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedSales.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-sm" style={{ color: C.faint }}>No sold history yet.</td></tr>
                  ) : displayedSales.map((s, i) => (
                    <tr key={s.id}
                      style={{ borderBottom: i < displayedSales.length - 1 ? `1px solid #F5EDE4` : 'none' }}
                      className="hover:bg-orange-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClothingIcon itemName={s.itemName} color={iconColorFromName(s.itemName)} size={28} />
                          <span className="font-semibold text-xs whitespace-nowrap" style={{ color: C.burgundy }}>{s.itemName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{s.size || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: C.burgundy }}>{s.buyerName}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{s.eventName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-center font-semibold" style={{ color: C.burgundy }}>{s.quantity}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap font-semibold" style={{ color: s.price ? '#2D7A4F' : C.faint }}>
                        {s.price ? `$${Number(s.price).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{fmt(s.saleDate)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{s.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingSale(s)} title="Edit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors"
                            style={{ color: C.muted }}>
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteSale(s)} title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ color: C.coral }}>
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sales.length > 4 && (
              <div className="px-5 py-3 border-t text-center" style={{ borderColor: '#F5EDE4' }}>
                <button onClick={() => setShowAllSales(v => !v)}
                  className="text-xs font-semibold flex items-center gap-1 mx-auto hover:opacity-70 transition-opacity"
                  style={{ color: C.orange }}>
                  {showAllSales ? 'Show less' : 'View all sold history'}
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="w-72 shrink-0 hidden lg:block">
          <LowStockCard inventory={inventory} onViewAll={() => setStatusF('low')} />
        </div>
      </div>

      {/* ── Drawers / Modals ── */}
      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add Áo Dài">
        <InventoryForm onSave={handleAdd} onClose={() => setAddOpen(false)} />
      </Drawer>

      <Drawer open={!!editItem} onClose={() => setEditItem(null)} title="Edit Inventory">
        {editItem && <InventoryForm initial={editItem} onSave={handleEdit} onClose={() => setEditItem(null)} />}
      </Drawer>

      <Drawer open={addBorrowOpen} onClose={() => setAddBorrowOpen(false)} title="Add Borrow Record">
        <BorrowForm onSave={handleBorrow} onClose={() => setAddBorrowOpen(false)} />
      </Drawer>

      {deleteItem && <DeleteModal name={deleteItem.itemName} onConfirm={handleDelete} onClose={() => setDeleteItem(null)} />}

      <Drawer open={!!editingBorrow} onClose={() => setEditingBorrow(null)} title="Edit Borrow Record">
        {editingBorrow && (
          <BorrowForm
            initial={editingBorrow}
            onSave={handleEditBorrow}
            onClose={() => setEditingBorrow(null)}
          />
        )}
      </Drawer>

      {deleteBorrow && (
        <DeleteModal
          name={`borrow record for ${deleteBorrow.itemName} (${deleteBorrow.borrowerName})`}
          onConfirm={handleDeleteBorrow}
          onClose={() => setDeleteBorrow(null)}
        />
      )}

      <Drawer open={addSaleOpen} onClose={() => setAddSaleOpen(false)} title="Add Sale Record">
        <SaleForm onSave={handleSale} onClose={() => setAddSaleOpen(false)} />
      </Drawer>

      <Drawer open={!!editingSale} onClose={() => setEditingSale(null)} title="Edit Sale Record">
        {editingSale && <SaleForm initial={editingSale} onSave={handleEditSale} onClose={() => setEditingSale(null)} />}
      </Drawer>

      {deleteSale && (
        <DeleteModal
          name={`sale record for ${deleteSale.itemName} (${deleteSale.buyerName})`}
          onConfirm={handleDeleteSale}
          onClose={() => setDeleteSale(null)}
        />
      )}
    </div>
  )
}
