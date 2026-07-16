import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  CalendarDaysIcon, UserGroupIcon, CurrencyDollarIcon,
  CalendarIcon, BellAlertIcon, ChartBarIcon,
  AcademicCapIcon, UserIcon, ClipboardDocumentListIcon,
  MusicalNoteIcon, ArchiveBoxIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}


function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Decorative background icons ─────────────────────────────────────────────
function FadedCalendar() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" opacity="0.1">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="13" width="2" height="2" rx="0.5" fill="currentColor"/>
      <rect x="11" y="13" width="2" height="2" rx="0.5" fill="currentColor"/>
      <rect x="15" y="13" width="2" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  )
}
function FadedCheck() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" opacity="0.1">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function FadedPeople() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" opacity="0.1">
      <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 20c0-2.5-1.8-4.5-4-5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function FadedWallet() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" opacity="0.1">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
      <path d="M6 3l12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Overview card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon }) {
  return (
    <div className="rounded-3xl p-5 flex items-center gap-4"
      style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      <Icon className="w-7 h-7 shrink-0" style={{ color: '#A08070' }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: '#A08070' }}>{label}</p>
        <p className="text-2xl font-extrabold leading-tight" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ Icon, title, linkLabel, onLink }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <Icon className="w-5 h-5" style={{ color: '#A08070' }} />
        <h3 className="text-base font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>{title}</h3>
      </div>
      {onLink && (
        <button onClick={onLink} className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: '#F1745E' }}>
          {linkLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { session } = useAuth()
  const navigate    = useNavigate()
  const [stats, setStats] = useState({ events: null, tasks: null, members: null, balance: null })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activityPage, setActivityPage] = useState(1)
  const [reminders, setReminders] = useState([])
  const [memberMap, setMemberMap] = useState({})
  const ACTIVITY_PAGE_SIZE = 5

  const activityClearedAt = typeof window !== 'undefined' ? localStorage.getItem('dhya_activity_cleared_at') : null

  const fetchActivity = useCallback(async () => {
    let q = supabase.from('notifications').select('id, title, body, actor_name, created_at').order('created_at', { ascending: false }).limit(50)
    if (activityClearedAt) q = q.gt('created_at', activityClearedAt)
    const { data } = await q
    setRecentActivity(data || [])
    setActivityPage(1)
  }, [activityClearedAt])

  const clearAllActivity = () => {
    const now = new Date().toISOString()
    localStorage.setItem('dhya_activity_cleared_at', now)
    setRecentActivity([])
    setActivityPage(1)
  }

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString()
    const [eventsRes, tasksRes, profilesRes, generalRes, budgetRes, upcomingRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_date', today),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('general_members').select('id', { count: 'exact', head: true }),
      supabase.from('budget_items').select('amount, category'),
      supabase.from('events').select('id, title, start_date, location').gte('start_date', today).order('start_date', { ascending: true }).limit(5),
    ])

    const memberCount = (profilesRes.count ?? 0) + (generalRes.count ?? 0)
    let balance = 0
    if (!budgetRes.error && budgetRes.data) {
      balance = budgetRes.data.reduce((acc, item) => {
        const amt = parseFloat(item.amount) || 0
        return item.category === 'Income' ? acc + amt : acc - amt
      }, 0)
    }

    setUpcomingEvents(upcomingRes.data || [])
    setStats({
      events:  eventsRes.count  ?? 0,
      tasks:   tasksRes.count   ?? 0,
      members: memberCount,
      balance,
    })
  }, [])

  useEffect(() => {
    if (!session) return
    fetchStats()
    fetchActivity()
    // Fetch reminders from Supabase
    const today = new Date(); today.setHours(0,0,0,0)
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 14)
    const todayStr = today.toISOString().slice(0,10)
    const cutoffStr = cutoff.toISOString().slice(0,10)
    Promise.all([
      supabase.from('event_tasks').select('*').gte('due_date', todayStr).lte('due_date', cutoffStr).neq('status', 'done').order('due_date'),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('general_members').select('id, full_name'),
    ]).then(([taskRes, pRes, gRes]) => {
      const map = {}
      ;(pRes.data || []).forEach(m => { map[`profile:${m.id}`] = m.full_name })
      ;(gRes.data || []).forEach(m => { map[`general:${m.id}`] = m.full_name })
      setMemberMap(map)
      const rows = (taskRes.data || []).map(r => {
        const due = new Date(r.due_date + 'T00:00:00')
        const diffDays = Math.round((due - today) / 86400000)
        return {
          id: r.id,
          title: r.task_title,
          sub: r.due_date,
          assigned_members: r.assigned_members || [],
          when: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
          urgent: diffDays <= 2,
        }
      })
      setReminders(rows)
    })
  }, [session, fetchStats, fetchActivity])

  const cards = [
    { label: 'Upcoming Events', value: stats.events  !== null ? String(stats.events)  : '—', sub: 'Events scheduled ahead',    Icon: CalendarDaysIcon },
    { label: 'Total Members',   value: stats.members !== null ? String(stats.members) : '—', sub: 'Active members',             Icon: UserGroupIcon },
    { label: 'Budget Balance',  value: stats.balance !== null ? fmt(stats.balance)    : '—', sub: 'Current available balance',  Icon: CurrencyDollarIcon },
  ]

  function fmtTimeMobile(dateStr) {
    if (!dateStr) return ''
    try {
      const t = dateStr.split('T')[1]
      if (!t) return ''
      const [h, m] = t.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
    } catch { return '' }
  }

  return (
    <div>
      {/* ── Mobile layout ── */}
      <div className="block md:hidden" style={{ backgroundColor: '#FFF7F3', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* Mobile page header */}
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-2xl font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A5550' }}>Welcome back! Here's what's happening.</p>
        </div>

        <div className="px-4 space-y-3 mt-2">
          {/* Stat cards - stacked */}
          {cards.map(c => (
            <div key={c.label} className="flex items-center gap-4 rounded-2xl p-4"
              style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FEF0EE' }}>
                <c.Icon className="w-5 h-5" style={{ color: '#F1745E' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: '#A08070' }}>{c.label}</p>
                <p className="text-xl font-extrabold" style={{ color: '#4F252A' }}>{c.value}</p>
                <p className="text-xs" style={{ color: '#A08070' }}>{c.sub}</p>
              </div>
              <svg className="w-4 h-4 shrink-0" style={{ color: '#A08070' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}

          {/* Upcoming Events */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F5EDE4' }}>
              <p className="text-sm font-extrabold" style={{ color: '#4F252A' }}>Upcoming Events</p>
              <button onClick={() => navigate('/events')} className="text-xs font-semibold" style={{ color: '#F1745E' }}>View all</button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: '#A08070' }}>No upcoming events.</p>
            ) : upcomingEvents.slice(0, 3).map((ev, i) => {
              const d = new Date(ev.start_date)
              const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              const day = d.getDate()
              const time = fmtTimeMobile(ev.start_date)
              return (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < Math.min(upcomingEvents.length, 3) - 1 ? '1px solid #F5EDE4' : 'none' }}>
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ backgroundColor: '#FFF0EC', border: '1px solid #EFCAC8' }}>
                    <span className="text-[9px] font-extrabold uppercase" style={{ color: '#E06464' }}>{month}</span>
                    <span className="text-sm font-extrabold leading-tight" style={{ color: '#4F252A' }}>{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#4F252A' }}>{ev.title}</p>
                    <p className="text-xs truncate" style={{ color: '#A08070' }}>{time}{ev.location ? ` · ${ev.location}` : ''}</p>
                  </div>
                </div>
              )
            })}
            <div className="px-4 py-3" style={{ borderTop: '1px solid #F5EDE4' }}>
              <button onClick={() => navigate('/calendar')} className="text-xs font-semibold" style={{ color: '#F1745E' }}>
                View full calendar →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-sm font-extrabold mb-3" style={{ color: '#4F252A' }}>Quick Actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              {[
                { label: 'Dance Team',    path: '/dance-team', Icon: MusicalNoteIcon,          desc: 'Team roster & schedule' },
                { label: 'Inventory',     path: '/inventory',  Icon: ArchiveBoxIcon,            desc: 'Track áo dài & items' },
                { label: 'Tasks / Roles', path: '/tasks',      Icon: ClipboardDocumentListIcon, desc: 'Assign & track tasks' },
                { label: 'Calendar',      path: '/calendar',   Icon: CalendarIcon,              desc: 'View upcoming dates' },
              ].map(({ label, path, Icon, desc }) => (
                <button key={path} onClick={() => navigate(path)}
                  className="flex items-center gap-3 p-3 rounded-2xl text-left"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#FEF0EE' }}>
                    <Icon className="w-4 h-4" style={{ color: '#F1745E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight" style={{ color: '#4F252A' }}>{label}</p>
                    <p className="text-[10px] leading-snug" style={{ color: '#A08070' }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block">
      {/* Page heading */}
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold mb-1" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Dashboard</h2>
        <p className="text-sm" style={{ color: '#7A5550' }}>Welcome back! Here's what's happening.</p>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Three-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Upcoming Events */}
        <div className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F5EDE4' }}>
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5" style={{ color: '#A08070' }} />
              <h3 className="text-base font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Upcoming Events</h3>
            </div>
            <button onClick={() => navigate('/events')}
              className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: '#F1745E' }}>
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: '#A08070' }}>No upcoming events scheduled.</p>
          ) : (
            <div>
              {upcomingEvents.map((ev, i) => {
                const d = new Date(ev.start_date)
                const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                const day   = d.getDate()
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50 transition-colors"
                    style={{ borderBottom: i < upcomingEvents.length - 1 ? '1px solid #F5EDE4' : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ backgroundColor: '#FFF0EC', border: '1.5px solid #EFCAC8' }}>
                      <span className="text-[9px] font-extrabold uppercase leading-none" style={{ color: '#E06464' }}>{month}</span>
                      <span className="text-base font-extrabold leading-tight" style={{ color: '#4F252A' }}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#4F252A' }}>{ev.title}</p>
                      {ev.location && <p className="text-xs mt-0.5 truncate" style={{ color: '#A08070' }}>{ev.location}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="px-5 py-3 border-t" style={{ borderColor: '#F5EDE4' }}>
            <button onClick={() => navigate('/calendar')}
              className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: '#F1745E' }}>
              View full calendar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Today's Reminders */}
        <div className="rounded-3xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <SectionHeader Icon={BellAlertIcon} title="Today's Reminders" />
          <div className="space-y-1">
            {reminders.length === 0
              ? <p className="text-sm py-6 text-center" style={{ color: '#A08070' }}>No reminders today.</p>
              : reminders.map((r, i) => {
                const assignees = (r.assigned_members || []).map(k => memberMap[k]).filter(Boolean)
                return (
                <div key={r.id}
                  className="flex items-start gap-3 py-3 transition-colors hover:bg-orange-50 rounded-2xl px-2 -mx-2"
                  style={{ borderBottom: i < reminders.length - 1 ? '1px solid #F5EDE4' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug" style={{ color: '#4F252A' }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>Due by {r.sub}</p>
                    {assignees.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>Assigned to {assignees.join(', ')}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold shrink-0 mt-0.5 whitespace-nowrap"
                    style={{ color: r.urgent ? '#E06464' : '#F1745E' }}>{r.when}</span>
                </div>
              )})}

          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-3xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ChartBarIcon className="w-5 h-5" style={{ color: '#A08070' }} />
              <h3 className="text-base font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Recent Activity</h3>
            </div>
            {recentActivity.length > 0 && (
              <button onClick={clearAllActivity} className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: '#A08070' }}>
                Clear all
              </button>
            )}
          </div>
          {recentActivity.length === 0
            ? <p className="text-sm py-6 text-center" style={{ color: '#A08070' }}>No recent activity yet.</p>
            : (() => {
                const totalPages = Math.ceil(recentActivity.length / ACTIVITY_PAGE_SIZE)
                const paged = recentActivity.slice((activityPage - 1) * ACTIVITY_PAGE_SIZE, activityPage * ACTIVITY_PAGE_SIZE)
                return (
                  <>
                    <div className="space-y-1">
                      {paged.map((a, i) => (
                        <div key={a.id}
                          className="flex items-start gap-3 py-3 transition-colors hover:bg-orange-50 rounded-2xl px-2 -mx-2"
                          style={{ borderBottom: i < paged.length - 1 ? '1px solid #F5EDE4' : 'none' }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug" style={{ color: '#4F252A' }}>{a.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{a.body}{a.actor_name ? ` · ${a.actor_name}` : ''}</p>
                          </div>
                          <span className="text-xs font-medium shrink-0 mt-0.5" style={{ color: '#A08070' }}>{timeAgo(a.created_at)}</span>
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F5EDE4' }}>
                        <button onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage === 1}
                          className="text-xs font-semibold px-3 py-1 rounded-lg disabled:opacity-30 transition-opacity"
                          style={{ color: '#E06464' }}>← Prev</button>
                        <span className="text-xs" style={{ color: '#A08070' }}>{activityPage} / {totalPages}</span>
                        <button onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))} disabled={activityPage === totalPages}
                          className="text-xs font-semibold px-3 py-1 rounded-lg disabled:opacity-30 transition-opacity"
                          style={{ color: '#E06464' }}>Next →</button>
                      </div>
                    )}
                  </>
                )
              })()
          }
        </div>

      </div>

      {/* ── Quick Navigation ── */}
      <div className="mt-8">
        <h3 className="text-base font-extrabold mb-4" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Quick Navigation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Calendar',          path: '/calendar',          Icon: CalendarIcon,                desc: 'View upcoming dates' },
            { label: 'Events',            path: '/events',            Icon: CalendarDaysIcon,            desc: 'Browse & manage events' },
            { label: 'Vietnamese School', path: '/vietnamese-school', Icon: AcademicCapIcon,             desc: 'Classes & attendance' },
            { label: 'Members',           path: '/members',           Icon: UserGroupIcon,               desc: 'Member directory' },
            { label: 'Tasks / Roles',     path: '/tasks',             Icon: ClipboardDocumentListIcon,   desc: 'Assign & track tasks' },
            { label: 'Dance Team',        path: '/dance-team',        Icon: MusicalNoteIcon,             desc: 'Team roster & schedule' },
            { label: 'Inventory',         path: '/inventory',         Icon: ArchiveBoxIcon,              desc: 'Track áo dài & items' },
            { label: 'Budget',            path: '/budget',            Icon: BanknotesIcon,               desc: 'Income & expenses' },
          ].map(({ label, path, Icon, desc }) => (
            <button key={path} onClick={() => navigate(path)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left hover:shadow-md transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <Icon className="w-6 h-6 shrink-0" style={{ color: '#A08070' }} />
              <div>
                <p className="text-sm font-extrabold leading-tight" style={{ color: '#4F252A' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      </div>{/* end desktop block */}
    </div>
  )
}
