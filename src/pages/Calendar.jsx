import { useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/solid'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS        = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function fmtTime(timeStr) {
  if (!timeStr) return null
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
  } catch { return timeStr }
}

function timeFromDatetime(dt) {
  if (!dt) return null
  const t = dt.split('T')[1]
  return t ? fmtTime(t) : null
}

function datePartOf(dt) {
  return dt ? dt.split('T')[0] : null
}

// ── Event pill inside grid cell ──────────────────────────────────────────────
function EventPill({ item }) {
  const isBirthday = item.type === 'birthday'
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold truncate w-full"
      style={isBirthday
        ? { backgroundColor: '#FFF1F1', color: '#4F252A', border: '1px solid #4F252A' }
        : { backgroundColor: '#FDE8E0', color: '#4F252A' }
      }
    >
      {isBirthday && <span className="shrink-0 text-[10px]">🎂</span>}
      <span className="truncate">
        {isBirthday ? `${item.name}'s Birthday` : item.title}
      </span>
    </div>
  )
}

// ── Upcoming sidebar ─────────────────────────────────────────────────────────
function UpcomingCard({ items }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: '#EDD0AC' }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#F1745E" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <h3 className="text-sm font-bold" style={{ color: '#4F252A' }}>Upcoming</h3>
      </div>
      <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
        {items.length === 0
          ? <p className="text-xs text-center py-6" style={{ color: '#A08070' }}>Nothing upcoming.</p>
          : items.slice(0, 8).map((item, i) => <UpcomingRow key={i} item={item} />)
        }
      </div>
    </div>
  )
}

function UpcomingRow({ item }) {
  const [y, m, d] = item.dateStr.split('-').map(Number)
  const isBirthday = item.type === 'birthday'
  const startTime  = !isBirthday ? timeFromDatetime(item.start_date) : null
  const endTime    = !isBirthday ? timeFromDatetime(item.end_date) : null
  const endDateDiff = item.end_date && datePartOf(item.end_date) !== datePartOf(item.start_date)
  const [ey, em, ed] = endDateDiff ? item.end_date.split('T')[0].split('-').map(Number) : []
  const timeStr = startTime
    ? endTime
      ? `${startTime} – ${endTime}${endDateDiff ? ` (${SHORT_MONTHS[em-1]} ${ed})` : ''}`
      : startTime
    : null

  return (
    <div className="flex gap-3 p-2.5 rounded-xl"
      style={isBirthday
        ? { backgroundColor: '#FFF5F4', border: '1.5px solid #4F252A' }
        : { backgroundColor: '#FFF7F3', border: '1px solid #FDE8E0' }
      }>
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center shrink-0 rounded-xl px-2 py-1 min-w-[40px]"
        style={{ backgroundColor: isBirthday ? '#4F252A' : '#F1745E' }}>
        <span className="text-[9px] font-bold uppercase leading-none" style={{ color: '#ffffff' }}>
          {SHORT_MONTHS[m - 1]}
        </span>
        <span className="text-base font-extrabold leading-tight" style={{ color: '#ffffff' }}>
          {endDateDiff ? `${d}–${ed}` : d}
        </span>
        <span className="text-[8px] font-semibold leading-none" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {y}
        </span>
      </div>
      {/* Info */}
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-xs leading-tight truncate" style={{ color: '#4F252A', fontWeight: isBirthday ? 700 : 600 }}>
          {isBirthday ? `${item.name}'s Birthday` : item.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: isBirthday ? '#7A5550' : '#A08070' }}>
          {isBirthday
            ? <span style={{ color: '#4F252A' }}>🎂 Birthday</span>
            : endDateDiff
              ? <>
                  <span>{SHORT_MONTHS[m-1]} {d}{'  '}{startTime}</span><br/>
                  <span>{SHORT_MONTHS[em-1]} {ed}{'  '}{endTime}</span>
                </>
              : timeStr
          }
        </p>
      </div>
    </div>
  )
}

// ── List view row ─────────────────────────────────────────────────────────────
function ListRow({ item }) {
  const [y, m, d] = item.dateStr.split('-').map(Number)
  const isBirthday = item.type === 'birthday'
  const startTime  = !isBirthday ? timeFromDatetime(item.start_date) : null
  const endTime    = !isBirthday ? timeFromDatetime(item.end_date) : null
  const endDateDiff = item.end_date && datePartOf(item.end_date) !== datePartOf(item.start_date)
  const [, em, ed] = endDateDiff ? item.end_date.split('T')[0].split('-').map(Number) : []
  const timeStr = startTime
    ? endTime
      ? `${startTime} – ${endTime}${endDateDiff ? ` (${SHORT_MONTHS[em-1]} ${ed})` : ''}`
      : startTime
    : null

  return (
    <div className="flex items-center gap-4 p-3.5 rounded-2xl"
      style={isBirthday
        ? { backgroundColor: '#FFF5F4', border: '1.5px solid #4F252A' }
        : { backgroundColor: '#FFF7F3', border: '1px solid #FDE8E0' }
      }>
      <div className="flex flex-col items-center shrink-0 rounded-xl px-3 py-1.5 min-w-[48px]"
        style={{ backgroundColor: isBirthday ? '#4F252A' : '#F1745E' }}>
        <span className="text-[10px] font-bold uppercase" style={{ color: '#ffffff' }}>{SHORT_MONTHS[m-1]}</span>
        <span className="text-lg font-extrabold leading-tight" style={{ color: '#ffffff' }}>{d}</span>
        <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{y}</span>
      </div>
      <div>
        <p style={{ color: '#4F252A', fontWeight: 700, fontSize: '0.875rem' }}>
          {isBirthday ? `🎂 ${item.name}'s Birthday` : item.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: isBirthday ? '#7A5550' : '#A08070' }}>
          {isBirthday ? 'Birthday' : <>{timeStr && `${timeStr} · `}Event{item.location && ` · ${item.location}`}</>}
        </p>
      </div>
    </div>
  )
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function Calendar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const today = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view,  setView]  = useState('month')

  const [events,    setEvents]    = useState([])
  const [birthdays, setBirthdays] = useState([])

  const fetchData = useCallback(async () => {
    const [eventsRes, profilesRes, generalRes] = await Promise.all([
      supabase.from('events').select('id, title, location, start_date, end_date').order('start_date'),
      supabase.from('profiles').select('id, full_name, birthday').not('birthday', 'is', null),
      supabase.from('general_members').select('id, full_name, birthday').not('birthday', 'is', null),
    ])
    setEvents(eventsRes.data || [])
    const all = [
      ...(profilesRes.data || []).map(p => ({ id: `p-${p.id}`, name: p.full_name, birthday: p.birthday })),
      ...(generalRes.data  || []).map(g => ({ id: `g-${g.id}`, name: g.full_name, birthday: g.birthday })),
    ].filter(b => b.birthday)
    setBirthdays(all)
  }, [])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  function itemsForDate(dateStr) {
    const [, dm, dd] = dateStr.split('-').map(Number)
    const items = []
    events.forEach(ev => {
      const start = ev.start_date?.split('T')[0]
      const end   = ev.end_date?.split('T')[0] || start
      if (start && dateStr >= start && dateStr <= end) {
        items.push({ type: 'event', isStart: dateStr === start, isEnd: dateStr === end, ...ev })
      }
    })
    birthdays.forEach(b => {
      const [, bm, bd] = b.birthday.split('-').map(Number)
      if (bm === dm && bd === dd) items.push({ type: 'birthday', ...b })
    })
    return items
  }

  function upcomingItems() {
    const now = new Date(); now.setHours(0,0,0,0)
    const limit = new Date(now); limit.setMonth(limit.getMonth() + 3)
    const result = []
    events.forEach(ev => {
      if (!ev.start_date) return
      const d = new Date(ev.start_date.split('T')[0] + 'T00:00:00')
      if (d >= now && d <= limit) result.push({ type: 'event', sortDate: d, dateStr: ev.start_date.split('T')[0], ...ev })
    })
    const cy = now.getFullYear()
    birthdays.forEach(b => {
      const [, bm, bd] = b.birthday.split('-').map(Number)
      for (const y of [cy, cy + 1]) {
        const d = new Date(y, bm - 1, bd)
        if (d >= now && d <= limit) {
          result.push({ type: 'birthday', sortDate: d, dateStr: isoDate(y, bm - 1, bd), ...b })
          break
        }
      }
    })
    return result.sort((a, b) => a.sortDate - b.sortDate)
  }

  function buildGrid() {
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevDays    = new Date(year, month, 0).getDate()
    const cells = []
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevDays - i, current: false, date: null })
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, current: true, date: isoDate(year, month, d) })
    while (cells.length % 7 !== 0)
      cells.push({ day: cells.length - firstDay - daysInMonth + 1, current: false, date: null })
    return cells
  }

  function buildWeek() {
    const now = new Date(year, month, 1)
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i)
      return { label: DAYS[i], dateStr: isoDate(d.getFullYear(), d.getMonth(), d.getDate()), dayNum: d.getDate() }
    })
  }

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  const grid     = buildGrid()
  const weekDays = buildWeek()
  const upcoming = upcomingItems()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold mb-1" style={{ color: '#4F252A' }}>Calendar</h2>
          <p className="text-sm" style={{ color: '#7A5550' }}>View and manage all events and important dates.</p>
        </div>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0"
          style={{ backgroundColor: '#F1745E' }}>
          <PlusIcon className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Calendar card ── */}
        <div className="flex-1 min-w-0 rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#F0E0D0' }}>
            <div className="flex items-center gap-2">
              {/* Today */}
              <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-colors hover:bg-orange-50"
                style={{ borderColor: '#EDD0AC', color: '#4F252A' }}>
                Today
              </button>
              {/* Arrows */}
              <button onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
                style={{ color: '#7A5550' }}>
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
                style={{ color: '#7A5550' }}>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              {/* Month/Year */}
              <h3 className="text-sm font-extrabold ml-1" style={{ color: '#4F252A' }}>
                {MONTHS[month]} {year}
                <span className="ml-1 text-xs font-semibold" style={{ color: '#A08070' }}>▾</span>
              </h3>
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: '#EDD0AC' }}>
              {['Month','Week','List'].map((v, i) => (
                <button key={v}
                  onClick={() => setView(v.toLowerCase())}
                  className="px-4 py-1.5 text-xs font-bold transition-all"
                  style={{
                    backgroundColor: view === v.toLowerCase() ? '#F1745E' : '#ffffff',
                    color:           view === v.toLowerCase() ? '#ffffff' : '#7A5550',
                    borderLeft:      i > 0 ? '1px solid #EDD0AC' : 'none',
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* ── Month view ── */}
          {view === 'month' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: '#F0E0D0' }}>
                {DAYS.map(d => (
                  <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#A08070' }}>
                    {d}
                  </div>
                ))}
              </div>
              {/* Grid */}
              <div className="grid grid-cols-7">
                {grid.map((cell, i) => {
                  const items   = cell.date ? itemsForDate(cell.date) : []
                  const isToday = cell.date === todayStr
                  const isLast  = i >= grid.length - 7
                  const isRight = (i + 1) % 7 === 0

                  return (
                    <div key={i}
                      className="min-h-[96px] p-1.5 flex flex-col gap-1"
                      style={{
                        borderRight:  !isRight  ? '1px solid #F5E8DC' : 'none',
                        borderBottom: !isLast   ? '1px solid #F5E8DC' : 'none',
                        backgroundColor: isToday ? '#FFF7F3' : '#ffffff',
                      }}>
                      {/* Date number */}
                      <div className="flex justify-end mb-0.5">
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: isToday ? '#F1745E' : 'transparent',
                            color: isToday ? '#ffffff' : cell.current ? '#4F252A' : '#C8A898',
                          }}>
                          {cell.day}
                        </span>
                      </div>
                      {/* Event pills */}
                      <div className="flex flex-col gap-0.5">
                        {items.slice(0, 3).map((item, j) => (
                          <EventPill key={j} item={item} />
                        ))}
                        {items.length > 3 && (
                          <span className="text-[10px] px-1.5 font-semibold" style={{ color: '#A08070' }}>
                            +{items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Week view ── */}
          {view === 'week' && (
            <div>
              <div className="grid grid-cols-7 border-b" style={{ borderColor: '#F0E0D0' }}>
                {weekDays.map(({ label, dateStr, dayNum }) => {
                  const isToday = dateStr === todayStr
                  return (
                    <div key={dateStr} className="flex flex-col items-center py-3 gap-1"
                      style={{ borderRight: '1px solid #F5E8DC' }}>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A08070' }}>{label}</span>
                      <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-extrabold"
                        style={{ backgroundColor: isToday ? '#F1745E' : 'transparent', color: isToday ? '#fff' : '#4F252A' }}>
                        {dayNum}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map(({ dateStr }, i) => {
                  const items   = itemsForDate(dateStr)
                  const isRight = i === 6
                  return (
                    <div key={dateStr}
                      className="min-h-[200px] p-2 flex flex-col gap-1.5"
                      style={{ borderRight: !isRight ? '1px solid #F5E8DC' : 'none' }}>
                      {items.map((item, j) => <EventPill key={j} item={item} />)}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── List view ── */}
          {view === 'list' && (
            <div className="p-5 space-y-2.5">
              {upcoming.length === 0
                ? <p className="text-sm text-center py-12" style={{ color: '#A08070' }}>No upcoming events or birthdays.</p>
                : upcoming.map((item, i) => <ListRow key={i} item={item} />)
              }
            </div>
          )}
        </div>

        {/* ── Upcoming sidebar ── */}
        <div className="w-64 shrink-0">
          <UpcomingCard items={upcoming} />
        </div>
      </div>
    </div>
  )
}
