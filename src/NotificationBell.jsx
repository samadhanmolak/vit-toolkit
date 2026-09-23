import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function NotificationBell({ session }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()

    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.receiver_id === session.user.id) {
          fetchUnreadCount()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchUnreadCount = async () => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', session.user.id)
      .eq('read', false)

    if (error) console.error(error)
    else setUnreadCount(count || 0)
  }

  return (
    <div style={{ display: 'inline-block', position: 'relative', fontSize: '24px' }}>
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: '-8px', right: '-8px',
          background: 'red', color: 'white', borderRadius: '50%',
          padding: '2px 6px', fontSize: '12px', fontWeight: 'bold'
        }}>
          {unreadCount}
        </span>
      )}
    </div>
  )
}