import { useEffect, useState } from 'react'
import { PlusIcon, BanknotesIcon, CreditCardIcon, ScaleIcon as ScaleHeroIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import Modal, { Field, Input, Select, SubmitButton } from '../components/Modal'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['Income', 'Venue', 'Food & Drinks', 'Supplies', 'Marketing', 'Transport', 'Other']

const emptyForm = { label: '', amount: '', category: 'Other', event_id: '' }


const summaryCards = [
  { key: 'income',   label: 'Total Income',   sub: 'All income recorded',         Icon: BanknotesIcon   },
  { key: 'expenses', label: 'Total Expenses', sub: 'All expenses recorded',        Icon: CreditCardIcon  },
  { key: 'balance',  label: 'Balance',        sub: 'Current available balance',    Icon: ScaleHeroIcon   },
]

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function Budget() {
  const { canManage } = useProfile()
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const [itemsRes, eventsRes] = await Promise.all([
      supabase.from('budget_items').select('*, events(title)').order('created_at', { ascending: false }),
      supabase.from('events').select('id, title').order('title'),
    ])
    if (itemsRes.error) setError(itemsRes.error.message)
    else setItems(itemsRes.data)
    if (!eventsRes.error) setEvents(eventsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    if (!session) return
    fetchAll()
  }, [session])

  const totals = items.reduce(
    (acc, item) => {
      const amt = parseFloat(item.amount) || 0
      if (item.category === 'Income') acc.income += amt
      else acc.expenses += amt
      return acc
    },
    { income: 0, expenses: 0 }
  )
  totals.balance = totals.income - totals.expenses
  const summaryValues = { income: totals.income, expenses: totals.expenses, balance: totals.balance }

  function openModal() { setForm(emptyForm); setFormError(''); setShowModal(true) }
  function closeModal() { setShowModal(false) }
  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.label.trim()) return setFormError('Label is required.')
    if (!form.amount || isNaN(parseFloat(form.amount))) return setFormError('Enter a valid amount.')
    setSaving(true)
    const { error } = await supabase.from('budget_items').insert([{
      label: form.label.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      event_id: form.event_id || null,
    }])
    setSaving(false)
    if (error) { setFormError(error.message); return }
    closeModal()
    fetchAll()
  }

  return (
    <div>
      {/* ── Mobile layout ── */}
      <div className="block md:hidden" style={{ backgroundColor: '#FFF7F3', minHeight: '100vh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-2xl font-extrabold" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Budget</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A5550' }}>Monitor income, expenses, and balances.</p>
        </div>

        {/* Metric cards */}
        <div className="px-4 space-y-3 mb-4">
          {summaryCards.map(({ key, label, sub, Icon }) => (
            <div key={key} className="flex items-center gap-4 rounded-2xl p-4"
              style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEF0EE' }}>
                <Icon className="w-5 h-5" style={{ color: '#F1745E' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: '#A08070' }}>{label}</p>
                <p className="text-xl font-extrabold" style={{ color: '#4F252A' }}>
                  {loading ? '—' : fmt(summaryValues[key])}
                </p>
                <p className="text-xs" style={{ color: '#A08070' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div className="px-4">
          <p className="text-sm font-extrabold mb-3" style={{ color: '#4F252A' }}>Recent Transactions</p>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#EDD0AC', borderTopColor: '#F1745E' }} />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#A08070' }}>No transactions yet.</p>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #EDD0AC' }}>
              {items.slice(0, 20).map((item, i) => {
                const isIncome = item.category === 'Income'
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < Math.min(items.length, 20) - 1 ? '1px solid #F5EDE4' : 'none' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isIncome ? '#F0FDF4' : '#FEF2F2' }}>
                      {isIncome
                        ? <BanknotesIcon className="w-4 h-4" style={{ color: '#16A34A' }} />
                        : <CreditCardIcon className="w-4 h-4" style={{ color: '#DC2626' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#4F252A' }}>{item.label}</p>
                      <p className="text-xs truncate" style={{ color: '#A08070' }}>{item.category}{item.events?.title ? ` · ${item.events.title}` : ''}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold" style={{ color: isIncome ? '#16A34A' : '#DC2626' }}>
                      {isIncome ? '+' : '-'}{fmt(Math.abs(item.amount))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Floating Add button */}
        {canManage && (
          <div className="fixed left-4 right-4 z-30" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
            <button onClick={openModal}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{ backgroundColor: '#F1745E' }}>
              <PlusIcon className="w-4 h-4" /> Add Entry
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl mb-1" style={{ color: '#4F252A' }}>Budget</h2>
          <p className="text-sm" style={{ color: '#7A5550' }}>Monitor income, expenses, and balances.</p>
        </div>
        {canManage && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity shrink-0"
            style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}
          >
            <PlusIcon className="w-4 h-4" />
            Add Entry
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {summaryCards.map(({ key, label, sub, Icon }) => (
          <div key={key} className="rounded-3xl p-5 flex items-center gap-4"
            style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            <Icon className="w-7 h-7 shrink-0" style={{ color: '#A08070' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#A08070' }}>{label}</p>
              <p className="text-2xl font-extrabold leading-tight" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>
                {loading ? '—' : fmt(summaryValues[key])}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: '#E8C8A8', borderTopColor: '#F1745E' }} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState onAdd={openModal} />
      ) : (
        <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #EDD0AC', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide grid grid-cols-12 gap-2"
            style={{ backgroundColor: '#FFF7F3', color: '#7A5550', borderBottom: '1px solid #EDD0AC' }}>
            <span className="col-span-5">Label</span>
            <span className="col-span-3">Category</span>
            <span className="col-span-2">Event</span>
            <span className="col-span-2 text-right">Amount</span>
          </div>
          {items.map((item, i) => {
            const isIncome = item.category === 'Income'
            return (
              <div key={item.id}
                className="px-5 py-3.5 grid grid-cols-12 gap-2 items-center text-sm"
                style={{ backgroundColor: i % 2 === 0 ? '#FFF7F3' : '#FFF7F3', borderBottom: i < items.length - 1 ? '1px solid #EDD0AC' : 'none' }}>
                <span className="col-span-5 font-semibold truncate" style={{ color: '#4F252A' }}>{item.label}</span>
                <span className="col-span-3 truncate" style={{ color: '#7A5550' }}>{item.category}</span>
                <span className="col-span-2 truncate text-xs" style={{ color: '#A08070' }}>{item.events?.title || '—'}</span>
                <span className="col-span-2 text-right font-bold" style={{ color: isIncome ? '#F1745E' : '#E06464' }}>
                  {isIncome ? '+' : '-'}{fmt(Math.abs(item.amount))}
                </span>
              </div>
            )
          })}
        </div>
      )}

      </div>{/* end desktop block */}

      {showModal && (
        <Modal title="Add Budget Entry" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }}>
                {formError}
              </div>
            )}
            <Field label="Label *">
              <Input name="label" value={form.label} onChange={handleChange} placeholder="Venue rental deposit" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount ($) *">
                <Input type="number" step="0.01" min="0" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" required />
              </Field>
              <Field label="Category">
                <Select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Linked Event">
              <Select name="event_id" value={form.event_id} onChange={handleChange}>
                <option value="">— None —</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </Select>
            </Field>
            <SubmitButton loading={saving}>Save Entry</SubmitButton>
          </form>
        </Modal>
      )}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ backgroundColor: '#FFF7F3', border: '2px dashed #E8C8A8', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', minHeight: '280px' }}>
      <BanknotesIcon className="w-12 h-12 mb-4" style={{ color: '#A08070' }} />
      <p className="text-xl mb-1" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif", fontSize: '1.35rem' }}>No transactions yet</p>
      <p className="text-sm mb-6" style={{ color: '#A08070' }}>
        {onAdd ? 'Log income or expenses to get started.' : 'No budget entries have been recorded yet.'}
      </p>
      {onAdd && (
        <button onClick={onAdd}
          className="px-7 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
          Add First Entry
        </button>
      )}
    </div>
  )
}
