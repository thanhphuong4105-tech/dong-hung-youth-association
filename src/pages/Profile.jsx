import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRole } from '../lib/roles'
import {
  UserCircleIcon,
  LockClosedIcon,

  CameraIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

function initials(name, email) {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return '?'
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 1rem',
  borderRadius: '0.75rem',
  border: '1.5px solid #EDD0AC',
  backgroundColor: '#ffffff',
  color: '#4F252A',
  fontFamily: "'Nunito', sans-serif",
  fontSize: '0.875rem',
  outline: 'none',
}

const readOnlyStyle = {
  ...inputStyle,
  backgroundColor: '#FAF6F0',
  color: '#A08070',
  cursor: 'not-allowed',
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#7A5550' }}>
        {label}{required && <span style={{ color: '#F1745E' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function Alert({ type, message }) {
  if (!message) return null
  const styles = type === 'success'
    ? { backgroundColor: '#FEF8F0', border: '1px solid #EDD0AC', color: '#4F252A' }
    : { backgroundColor: '#FFF7F3', border: '1px solid #EFCAC8', color: '#E06464' }
  return (
    <div className="px-4 py-3 rounded-2xl text-sm font-medium mb-4" style={styles}>
      {message}
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'profile',       label: 'Profile Settings', Icon: UserCircleIcon },
  { id: 'password',      label: 'Password',          Icon: LockClosedIcon },
]

export default function Profile() {
  const { session } = useAuth()
  const user = session?.user
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return ['profile','password'].includes(tab) ? tab : 'profile'
  })
  const [profile, setProfile]     = useState({ full_name: '', role: '', birthday: '' })
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Avatar
  const [avatarUrl,      setAvatarUrl]      = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Profile form
  const [firstName, setFirstName]   = useState('')
  const [lastName,  setLastName]    = useState('')
  const [phone,     setPhone]       = useState('')
  const [birthday,  setBirthday]    = useState('')
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword,     setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [passwordMsg, setPasswordMsg]           = useState({ type: '', text: '' })
  const [savingPassword, setSavingPassword]     = useState(false)

  useEffect(() => {
    if (!user) return
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, birthday, avatar_url')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setProfile(data)
        const parts = (data.full_name || '').split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
        setBirthday(data.birthday || '')
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      }
      setLoadingProfile(false)
    }
    fetchProfile()
  }, [user])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileMsg({ type: '', text: '' })
    setSavingProfile(true)
    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name, birthday: birthday || null })
      .eq('id', user.id)
    setSavingProfile(false)
    if (error) {
      setProfileMsg({ type: 'error', text: error.message })
    } else {
      setProfile(p => ({ ...p, full_name, birthday }))
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg({ type: '', text: '' })
    if (newPassword.length < 6) return setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
    if (newPassword !== confirmPassword) return setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
    setSavingPassword(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (signInError) { setSavingPassword(false); return setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' }) }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Show preview instantly
    const preview = URL.createObjectURL(file)
    setAvatarUrl(preview)
    // Upload to Supabase Storage
    setUploadingAvatar(true)
    const ext  = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (upErr) { setUploadingAvatar(false); setProfileMsg({ type: 'error', text: `Avatar upload failed: ${upErr.message}` }); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(publicUrl)
    setUploadingAvatar(false)
    setProfileMsg({ type: 'success', text: 'Profile photo updated!' })
    window.dispatchEvent(new CustomEvent('dhya_avatar_updated', { detail: publicUrl }))
  }

  async function handleRemoveAvatar() {
    setAvatarUrl(null)
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    setProfileMsg({ type: 'success', text: 'Profile photo removed.' })
  }

  const displayInitials = initials(profile.full_name, user?.email)
  const roleLabel = formatRole(profile.role)

  // Format birthday for display
  function formatBirthday(val) {
    if (!val) return ''
    try {
      return new Date(val + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return val }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-4xl mb-1" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Profile Settings</h2>
        <p className="text-sm" style={{ color: '#7A5550' }}>Manage your account information and preferences.</p>
      </div>

      {/* Main card */}
      <div className="rounded-3xl overflow-hidden flex min-h-[520px]"
        style={{ backgroundColor: '#ffffff', border: '1.5px solid #EDD0AC', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        {/* ── Left inner menu ── */}
        <div className="shrink-0 w-64 border-r p-4 flex flex-col gap-1" style={{ borderColor: '#EDD0AC', backgroundColor: '#FFFCF8' }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all"
                style={active
                  ? { backgroundColor: '#FEF0EE', color: '#F1745E' }
                  : { color: '#7A5550' }}>
                <Icon className="w-5 h-5 shrink-0" style={{ color: active ? '#F1745E' : '#A08070' }} />
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 p-8">

          {/* ── Profile Settings tab ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <Alert type={profileMsg.type} message={profileMsg.text} />

              {/* Avatar row */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold select-none shadow-md"
                    style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      : displayInitials
                    }
                  </div>
                  <label
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: uploadingAvatar ? '#EDD0AC' : '#F1745E' }}
                    title="Change photo">
                    {uploadingAvatar
                      ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <CameraIcon className="w-3.5 h-3.5 text-white" />
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                {avatarUrl && (
                  <button type="button" onClick={handleRemoveAvatar}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border hover:opacity-80 transition-opacity"
                    style={{ borderColor: '#EDD0AC', color: '#7A5550', backgroundColor: '#ffffff' }}>
                    Remove Avatar
                  </button>
                )}
              </div>

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="First Name" required>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="First name" style={inputStyle} />
                </Field>

                <Field label="Last Name" required>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Last name" style={inputStyle} />
                </Field>

                <Field label="Email" required>
                  <input value={user?.email || ''} readOnly style={readOnlyStyle} />
                </Field>

                <Field label="Phone Number" required>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 rounded-xl border shrink-0 text-sm"
                      style={{ borderColor: '#EDD0AC', backgroundColor: '#ffffff', color: '#4F252A' }}>
                      <span>🇺🇸</span>
                      <span style={{ color: '#A08070' }}>▾</span>
                    </div>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="(757) 123-4567" style={{ ...inputStyle }} />
                  </div>
                </Field>

                <Field label="Role">
                  <div className="relative">
                    <input value={roleLabel} readOnly style={{ ...readOnlyStyle, paddingRight: '2.5rem' }} />
                    <LockClosedIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#A08070' }} />
                  </div>
                </Field>

                <Field label="Birthday">
                  <div className="relative">
                    <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '2.75rem' }} />
                    <CalendarDaysIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#A08070' }} />
                  </div>
                </Field>
              </div>

              {/* Save button */}
              <div className="mt-8">
                <button type="submit" disabled={savingProfile || loadingProfile}
                  className="px-8 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ── Password tab ── */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="max-w-md">
              <h3 className="text-xl font-bold mb-6" style={{ color: '#4F252A', fontFamily: "'Nunito', sans-serif" }}>Change Password</h3>
              <Alert type={passwordMsg.type} message={passwordMsg.text} />
              <div className="space-y-5">
                <Field label="Current Password" required>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••" required style={inputStyle} />
                </Field>
                <Field label="New Password" required>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters" required style={inputStyle} />
                </Field>
                <Field label="Confirm New Password" required>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password" required style={inputStyle} />
                </Field>
              </div>
              <div className="mt-8">
                <button type="submit" disabled={savingPassword}
                  className="px-8 py-2.5 text-white text-sm font-semibold rounded-2xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #F1745E, #E06464)' }}>
                  {savingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  )
}
