import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export function usePresence(session) {
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (!session) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: session.user.id } },
    })

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id)
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(new Set(Object.keys(state)))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
          updateLastSeen()
        }
      })

    const interval = setInterval(updateLastSeen, 30000)

    return () => {
      clearInterval(interval)
      updateLastSeen()
      supabase.removeChannel(channel)
    }
  }, [session])

  return onlineUsers
}