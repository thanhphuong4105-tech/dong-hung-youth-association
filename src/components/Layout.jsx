import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import {
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  ChevronDownIcon,
  BellIcon,
  CameraIcon,
  ArchiveBoxIcon,
  AcademicCapIcon,
  EllipsisHorizontalIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/dashboard',         label: 'Dashboard',         icon: HomeIcon },
  { to: '/calendar',          label: 'Calendar',          icon: CalendarDaysIcon },
  { to: '/events',            label: 'Events',            icon: CalendarIcon },
  { to: '/vietnamese-school', label: 'Vietnamese School', icon: AcademicCapIcon },
  { to: '/tasks',             label: 'Tasks/Roles',       icon: CheckCircleIcon },
  { to: '/members',           label: 'Members',           icon: UserGroupIcon },
  { to: '/dance-team',        label: 'Dance Team',        icon: MusicalNoteIcon },
  { to: '/inventory',         label: 'Inventory',         icon: ArchiveBoxIcon },
  { to: '/budget',            label: 'Budget',            icon: CurrencyDollarIcon },
  { to: '/profile',           label: 'Profile',           icon: UserCircleIcon },
]

// Primary bottom nav tabs (always visible on mobile)
const bottomNavPrimary = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/calendar',  label: 'Calendar',  icon: CalendarDaysIcon },
  { to: '/events',    label: 'Events',    icon: CalendarIcon },
]

// Secondary items shown in the "More" sheet
const bottomNavMore = [
  { to: '/vietnamese-school', label: 'Vietnamese School', icon: AcademicCapIcon },
  { to: '/tasks',             label: 'Tasks & Roles',     icon: CheckCircleIcon },
  { to: '/members',           label: 'Members',           icon: UserGroupIcon },
  { to: '/dance-team',        label: 'Dance Team',        icon: MusicalNoteIcon },
  { to: '/inventory',         label: 'Inventory',         icon: ArchiveBoxIcon },
  { to: '/budget',            label: 'Budget',            icon: CurrencyDollarIcon },
  { to: '/profile',           label: 'Profile',           icon: UserCircleIcon },
]

function userInitials(name, email) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return 'A'
}

/* ── Temple illustration for sidebar bottom ── */
function TempleIllustration() {
  return (
    <svg viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Sky gradient fill */}
      <rect width="260" height="160" fill="#FFF7F3"/>
      {/* Background hills */}
      <ellipse cx="200" cy="130" rx="90" ry="45" fill="#FDDDD4" opacity="0.6"/>
      <ellipse cx="60" cy="140" rx="75" ry="38" fill="#FBC3B9" opacity="0.5"/>
      {/* Sun / moon circle */}
      <circle cx="195" cy="60" r="22" fill="#F1745E" opacity="0.18"/>
      <circle cx="195" cy="60" r="14" fill="#F1745E" opacity="0.28"/>
      {/* Temple base platform */}
      <rect x="88" y="112" width="84" height="8" rx="2" fill="#E06464" opacity="0.7"/>
      <rect x="94" y="108" width="72" height="6" rx="1.5" fill="#E06464" opacity="0.55"/>
      {/* Temple body */}
      <rect x="102" y="86" width="56" height="24" rx="2" fill="#E06464" opacity="0.65"/>
      {/* Door */}
      <rect x="120" y="96" width="20" height="14" rx="2" fill="#4F252A" opacity="0.25"/>
      {/* Temple roof layer 1 (bottom) */}
      <path d="M84 88 Q130 72 176 88 L170 92 Q130 78 90 92 Z" fill="#E06464" opacity="0.75"/>
      {/* Temple roof layer 2 */}
      <path d="M94 80 Q130 64 166 80 L161 84 Q130 70 99 84 Z" fill="#F1745E" opacity="0.8"/>
      {/* Temple roof layer 3 (top) */}
      <path d="M104 72 Q130 56 156 72 L152 76 Q130 62 108 76 Z" fill="#F1745E" opacity="0.85"/>
      {/* Roof spire */}
      <line x1="130" y1="56" x2="130" y2="44" stroke="#E06464" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="130" cy="42" r="3" fill="#F1745E"/>
      {/* Left tree trunk */}
      <rect x="54" y="105" width="5" height="25" rx="2" fill="#E06464" opacity="0.5"/>
      {/* Left tree foliage */}
      <ellipse cx="56" cy="98" rx="12" ry="14" fill="#FBC3B9" opacity="0.7"/>
      <ellipse cx="56" cy="92" rx="9" ry="10" fill="#F1745E" opacity="0.35"/>
      {/* Right tree trunk */}
      <rect x="198" y="108" width="5" height="22" rx="2" fill="#E06464" opacity="0.5"/>
      {/* Right tree foliage */}
      <ellipse cx="200" cy="100" rx="13" ry="15" fill="#FBC3B9" opacity="0.65"/>
      <ellipse cx="200" cy="94" rx="9" ry="10" fill="#F1745E" opacity="0.3"/>
      {/* Ground */}
      <path d="M0 138 Q65 125 130 132 Q195 139 260 128 L260 160 L0 160 Z" fill="#FBC3B9" opacity="0.45"/>
      <path d="M0 148 Q65 138 130 143 Q195 148 260 140 L260 160 L0 160 Z" fill="#EDD0AC" opacity="0.55"/>
      {/* Lotus flower left */}
      <ellipse cx="30" cy="148" rx="10" ry="5" fill="#F1745E" opacity="0.25"/>
      <path d="M30 148 Q25 138 30 135 Q35 138 30 148Z" fill="#FBC3B9" opacity="0.7"/>
      <path d="M30 148 Q22 140 24 135 Q29 137 30 148Z" fill="#FBC3B9" opacity="0.6"/>
      <path d="M30 148 Q38 140 36 135 Q31 137 30 148Z" fill="#FBC3B9" opacity="0.6"/>
      {/* Lotus flower right */}
      <ellipse cx="230" cy="150" rx="10" ry="5" fill="#F1745E" opacity="0.2"/>
      <path d="M230 150 Q225 140 230 137 Q235 140 230 150Z" fill="#EDD0AC" opacity="0.8"/>
      <path d="M230 150 Q222 142 224 137 Q229 139 230 150Z" fill="#EDD0AC" opacity="0.65"/>
      <path d="M230 150 Q238 142 236 137 Q231 139 230 150Z" fill="#EDD0AC" opacity="0.65"/>
    </svg>
  )
}

/* ── Page-level decorative waves ── */
function PeachWave() {
  return (
    <svg className="absolute bottom-0 left-0 w-72 h-48 opacity-40 pointer-events-none" viewBox="0 0 300 200" fill="none">
      <path d="M0 200 C30 160, 60 140, 100 150 C140 160, 160 120, 200 130 C240 140, 260 110, 300 120 L300 200 Z" fill="#FBC3B9"/>
      <path d="M0 200 C40 180, 80 170, 120 175 C160 180, 180 155, 220 165 C260 175, 280 155, 300 160 L300 200 Z" fill="#FBC3B9" opacity="0.7"/>
    </svg>
  )
}
function SageWave() {
  return (
    <svg className="absolute bottom-0 right-0 w-72 h-48 opacity-35 pointer-events-none" viewBox="0 0 300 200" fill="none">
      <path d="M0 120 C40 110, 60 140, 100 130 C140 120, 160 160, 200 150 C240 140, 260 160, 300 140 L300 200 L0 200 Z" fill="#EDD0AC"/>
      <path d="M0 155 C40 148, 80 165, 120 158 C160 151, 180 170, 220 163 C260 156, 280 168, 300 162 L300 200 L0 200 Z" fill="#EDD0AC" opacity="0.7"/>
    </svg>
  )
}

/* ── Notification Bell ── */
const TYPE_ICON = {
  event:  '📅',
  member: '👤',
  task:   '✅',
  budget: '💰',
  dance:  '💃',
  info:   '🔔',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)  return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NotificationBell() {
  const { session } = useAuth()
  const [open, setOpen]               = useState(false)
  const [items, setItems]             = useState([])
  const [lastRead, setLastRead]       = useState(() => localStorage.getItem('dhya_notif_last_read') || '')
  const [clearedAt, setClearedAt]     = useState(() => localStorage.getItem('dhya_notif_cleared_at') || '')
  const ref = useRef(null)

  // Fetch recent 30 notifications
  async function fetchNotifs() {
    const cleared = localStorage.getItem('dhya_notif_cleared_at') || ''
    let query = supabase
      .from('notifications')
      .select('id, title, body, type, actor_name, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
    if (cleared) query = query.gt('created_at', cleared)
    const { data, error } = await query
    if (error) { console.error('[NotificationBell] fetch failed:', error.message); return }
    setItems(data || [])
  }

  useEffect(() => { if (session) fetchNotifs() }, [session])

  // Realtime subscription
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const cleared = localStorage.getItem('dhya_notif_cleared_at') || ''
        if (cleared && payload.new.created_at <= cleared) return
        setItems(prev => [payload.new, ...prev].slice(0, 30))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  // Close on outside click
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  function handleOpen() {
    setOpen(o => !o)
    if (!open) {
      const now = new Date().toISOString()
      setLastRead(now)
      localStorage.setItem('dhya_notif_last_read', now)
    }
  }

  function markAllRead() {
    const now = new Date().toISOString()
    setLastRead(now)
    localStorage.setItem('dhya_notif_last_read', now)
  }

  function clearAll() {
    const now = new Date().toISOString()
    setClearedAt(now)
    localStorage.setItem('dhya_notif_cleared_at', now)
    setItems([])
  }

  const unread = items.filter(n => !lastRead || n.created_at > lastRead).length

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-orange-50 transition-colors"
        style={{ color: '#7A5550' }}>
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold"
            style={{ backgroundColor: '#E06464' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden flex flex-col"
          style={{ backgroundColor: '#FFFCF8', border: '1.5px solid #EDD0AC', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '420px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid #F0E0D0' }}>
            <span className="text-sm font-extrabold" style={{ color: '#4F252A' }}>Notifications</span>
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold hover:opacity-70 transition-opacity"
                    style={{ color: '#F1745E' }}>
                    Read all
                  </button>
                )}
                <button onClick={clearAll} className="text-xs font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: '#A08070' }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
          {/* List */}
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BellIcon className="w-8 h-8" style={{ color: '#EDD0AC' }} />
                <p className="text-xs font-semibold" style={{ color: '#A08070' }}>No notifications yet</p>
              </div>
            ) : items.map((n, i) => {
              const isUnread = !lastRead || n.created_at > lastRead
              return (
                <div key={n.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-orange-50"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid #F5EDE4' : 'none', backgroundColor: isUnread ? '#FFF7F3' : 'transparent' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base"
                    style={{ backgroundColor: '#FEF0EE' }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug" style={{ color: '#4F252A' }}>{n.title}</p>
                    {n.body && <p className="text-xs mt-0.5 leading-snug" style={{ color: '#7A5550' }}>{n.body}</p>}
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: '#A08070' }}>
                      {n.actor_name && <span style={{ color: '#F1745E' }}>{n.actor_name} · </span>}
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: '#F1745E' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Avatar dropdown ── */
function AvatarDropdown({ profileInitials, profileAvatar, profileName, profileEmail, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function go(path, hash) {
    setOpen(false)
    navigate(path)
    if (hash) {
      // wait for navigation then scroll
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-80"
        style={{ outline: 'none' }}
      >
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-extrabold shadow-sm select-none"
          style={{ backgroundColor: '#F1745E' }}
        >
          {profileAvatar
            ? <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
            : profileInitials
          }
        </div>
        <ChevronDownIcon
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ color: '#A08070', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden z-50"
          style={{
            backgroundColor: '#FFF7F3',
            border: '1.5px solid #EDD0AC',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #EDD0AC', backgroundColor: '#FFF7F3' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}
              >
                {profileAvatar
                  ? <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                  : profileInitials
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#4F252A' }}>
                  {profileName || 'My Account'}
                </p>
                <p className="text-xs truncate" style={{ color: '#A08070' }}>{profileEmail}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button
              onClick={() => go('/profile')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors hover:opacity-70"
              style={{ color: '#4F252A', backgroundColor: 'transparent' }}
            >
              <UserCircleIcon className="w-4 h-4 shrink-0" style={{ color: '#F1745E' }} />
              My Profile
            </button>

            <button
              onClick={() => { setOpen(false); navigate('/profile?tab=password') }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors hover:opacity-70"
              style={{ color: '#4F252A', backgroundColor: 'transparent' }}
            >
              <KeyIcon className="w-4 h-4 shrink-0" style={{ color: '#F1745E' }} />
              Update Password
            </button>

            {/* Divider */}
            <div className="my-1.5 mx-3" style={{ borderTop: '1px solid #EDD0AC' }} />

            <button
              onClick={() => { setOpen(false); onSignOut() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors hover:opacity-70"
              style={{ color: '#E06464', backgroundColor: 'transparent' }}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Mobile Bottom Navigation ── */
function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = bottomNavMore.some(item => location.pathname === item.to)

  function handleNav(to) {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* More sheet backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More slide-up sheet */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-50 md:hidden rounded-t-2xl overflow-hidden transition-transform duration-300 ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ backgroundColor: '#FFF7F3', borderTop: '1.5px solid #F2DDD0', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)' }}
      >
        <div className="px-2 pt-3 pb-4">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#F2DDD0' }} />
          <p className="text-xs font-bold px-3 mb-2" style={{ color: '#A08070' }}>MORE</p>
          <div className="grid grid-cols-4 gap-1">
            {bottomNavMore.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <button
                  key={to}
                  onClick={() => handleNav(to)}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-colors"
                  style={{ backgroundColor: active ? '#FFE8E0' : 'transparent' }}
                >
                  <Icon className="w-5 h-5" style={{ color: active ? '#F1745E' : '#7A5550' }} />
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: active ? '#E06464' : '#7A5550' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-stretch"
        style={{ backgroundColor: '#ffffff', borderTop: '1.5px solid #F2DDD0', height: '64px' }}
      >
        {bottomNavPrimary.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <button
              key={to}
              onClick={() => { setMoreOpen(false); navigate(to) }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: active ? '#E06464' : '#A08070' }}
            >
              <Icon className="w-5 h-5" style={{ color: active ? '#F1745E' : '#A08070' }} />
              <span className="text-[10px] font-semibold">{label}</span>
              {active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F1745E' }} />}
            </button>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          style={{ color: isMoreActive || moreOpen ? '#E06464' : '#A08070' }}
        >
          <EllipsisHorizontalIcon className="w-5 h-5" style={{ color: isMoreActive || moreOpen ? '#F1745E' : '#A08070' }} />
          <span className="text-[10px] font-semibold">More</span>
          {(isMoreActive || moreOpen) && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#F1745E' }} />}
        </button>
      </nav>
    </>
  )
}

/* ── Sidebar ── */
function Sidebar({ onClose, orgLogo, onOrgLogoChange, canManage }) {
  return (
    <aside className="w-64 flex flex-col relative overflow-hidden" style={{ backgroundColor: '#FFF7F3', borderRight: '1.5px solid #F2DDD0' }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-lg select-none shadow-md"
              style={{ backgroundColor: '#4F252A', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.05em' }}
            >
              {orgLogo
                ? <img src={orgLogo} alt="Org logo" className="w-full h-full object-cover" />
                : 'DH'
              }
            </div>
            {canManage && (
              <label
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer shadow border-2 border-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#F1745E' }}
                title="Change organization photo">
                <CameraIcon className="w-2.5 h-2.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={onOrgLogoChange} />
              </label>
            )}
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight" style={{ color: '#4F252A' }}>Dong Hung</p>
            <p className="text-xs leading-tight font-medium" style={{ color: '#A08070' }}>Youth Association</p>
          </div>
        </div>
        <div className="mt-4 border-b" style={{ borderColor: '#F2DDD0' }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              ['flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
               isActive ? '' : 'hover:bg-orange-50'].join(' ')
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: '#FFE8E0', color: '#E06464' }
              : { color: '#4F252A' }
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4.5 h-4.5 shrink-0" style={{ color: isActive ? '#F1745E' : '#A08070', width: '18px', height: '18px' }} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Temple illustration */}
      <div className="mt-auto">
        <TempleIllustration />
      </div>
    </aside>
  )
}

/* ── Layout ── */
export default function Layout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { canManage } = useProfile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileName,   setProfileName]   = useState('')
  const [profileAvatar, setProfileAvatar] = useState(null)
  const [orgLogo, setOrgLogo] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single()
      if (data?.full_name)  setProfileName(data.full_name)
      if (data?.avatar_url) setProfileAvatar(data.avatar_url)
    }
    fetchProfile()
  }, [session])

  useEffect(() => {
    async function fetchOrgLogo() {
      const { data } = await supabase.from('org_settings').select('logo_url').eq('id', 1).single()
      if (data?.logo_url) setOrgLogo(data.logo_url)
    }
    if (session) fetchOrgLogo()
  }, [session])

  async function handleOrgLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setOrgLogo(URL.createObjectURL(file))
    const ext = file.name.split('.').pop()
    const path = `org-logo.${ext}`
    const { error: upErr } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
    if (upErr) { console.error('[OrgLogo] Storage upload failed:', upErr.message); return }
    const { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    const { error: dbErr } = await supabase.from('org_settings').update({ logo_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', 1)
    if (dbErr) { console.error('[OrgLogo] DB save failed:', dbErr.message); return }
    setOrgLogo(publicUrl)
  }

  // Re-fetch avatar when Profile page signals an update (same tab)
  useEffect(() => {
    function onAvatarUpdated(e) { setProfileAvatar(e.detail) }
    window.addEventListener('dhya_avatar_updated', onAvatarUpdated)
    return () => window.removeEventListener('dhya_avatar_updated', onAvatarUpdated)
  }, [])

  const profileInitials = userInitials(profileName, session?.user?.email)
  const profileEmail = session?.user?.email || ''

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const location = useLocation()
  const currentPage = navItems.find(n => location.pathname === n.to)?.label || 'DHYA Management App'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFF7F3' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar orgLogo={orgLogo} onOrgLogoChange={handleOrgLogoChange} canManage={canManage} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <header
          className="px-4 md:px-8 py-3.5 flex items-center justify-between shrink-0"
          style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #F2DDD0' }}
        >
          {/* Mobile: page title | Desktop: app name */}
          <span className="text-sm font-bold md:hidden" style={{ color: '#4F252A' }}>
            {currentPage}
          </span>
          <span className="text-sm font-semibold hidden md:block" style={{ color: '#4F252A' }}>
            DHYA Management App
          </span>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <AvatarDropdown
              profileInitials={profileInitials}
              profileAvatar={profileAvatar}
              profileName={profileName}
              profileEmail={profileEmail}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8" style={{ backgroundColor: '#FFF7F3' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}
