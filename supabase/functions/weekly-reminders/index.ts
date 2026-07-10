import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'DHYA <reminders@yourdomain.com>' // update with your Resend verified domain

Deno.serve(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 14)
  const todayStr = today.toISOString().slice(0, 10)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // Fetch tasks due within 2 weeks that have assignees
  const { data: tasks } = await supabase
    .from('event_tasks')
    .select('*, events(name)')
    .gte('due_date', todayStr)
    .lte('due_date', cutoffStr)
    .not('assigned_members', 'is', null)

  if (!tasks || tasks.length === 0) {
    return new Response('No tasks to remind', { status: 200 })
  }

  // Build member email map
  const [{ data: profiles }, { data: generals }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('general_members').select('id, full_name, email'),
  ])

  const memberMap: Record<string, { name: string; email: string }> = {}
  ;(profiles || []).forEach(m => { if (m.email) memberMap[`profile:${m.id}`] = { name: m.full_name, email: m.email } })
  ;(generals || []).forEach(m => { if (m.email) memberMap[`general:${m.id}`] = { name: m.full_name, email: m.email } })

  // Group tasks by assignee email
  const byEmail: Record<string, { name: string; tasks: typeof tasks }> = {}
  for (const task of tasks) {
    for (const key of (task.assigned_members || [])) {
      const member = memberMap[key]
      if (!member) continue
      if (!byEmail[member.email]) byEmail[member.email] = { name: member.name, tasks: [] }
      byEmail[member.email].tasks.push(task)
    }
  }

  // Send one email per assignee
  const sends = Object.entries(byEmail).map(async ([email, { name, tasks: memberTasks }]) => {
    const taskRows = memberTasks.map(t => {
      const due = new Date(t.due_date + 'T00:00:00')
      const diffDays = Math.round((due - today) / 86400000)
      const when = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #F5EDE4;">${t.task_title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F5EDE4;">${t.events?.name || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F5EDE4;color:${diffDays <= 2 ? '#E06464' : '#F1745E'};font-weight:600;">${when} (${t.due_date})</td>
      </tr>`
    }).join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#4F252A;">Hi ${name},</h2>
        <p style="color:#7A5550;">Here are your upcoming tasks for Dong Hung Youth Association:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#FFF0EA;">
              <th style="padding:8px 12px;text-align:left;color:#4F252A;">Task</th>
              <th style="padding:8px 12px;text-align:left;color:#4F252A;">Event</th>
              <th style="padding:8px 12px;text-align:left;color:#4F252A;">Due</th>
            </tr>
          </thead>
          <tbody>${taskRows}</tbody>
        </table>
        <p style="color:#A08070;margin-top:24px;font-size:13px;">This is an automated reminder from DHYA Management App.</p>
      </div>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: '📋 DHYA Task Reminder', html }),
    })
  })

  await Promise.all(sends)
  return new Response(`Sent reminders to ${Object.keys(byEmail).length} assignees`, { status: 200 })
})
