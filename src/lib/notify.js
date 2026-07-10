import { supabase } from './supabase'

export async function notify({ title, body = null, type = 'info', actor_name = null }) {
  const { error } = await supabase.from('notifications').insert([{ title, body, type, actor_name }])
  if (error) console.error('[notify] failed:', error.message)
}
