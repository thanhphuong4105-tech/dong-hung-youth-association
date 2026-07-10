import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin } from '../lib/roles'

/**
 * Returns the current user's profile row and a convenience `canManage` boolean.
 * Waits for auth to finish resolving before querying — prevents 403s from
 * firing requests before the session token is available.
 */
export function useProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .eq('id', session.user.id)
        .single()
      if (!cancelled) {
        setProfile(data)
        setLoading(false)
      }
    }
    fetchProfile()

    return () => { cancelled = true }
  }, [session])

  return {
    profile,
    loading,
    canManage: isAdmin(profile?.role),
  }
}
