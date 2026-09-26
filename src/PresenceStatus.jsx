import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function timeAgo(timestamp) {
  const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z'
  const seconds = Math.floor((new Date() - new Date(utcTimestamp)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function PresenceStatus({ userId, isOnline }) {
  const [lastSeen, setLastSeen] = useState(null)
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!isOnline) fetchLastSeen()
  }, [isOnline])

  useEffect(() => {
    const interval = setInterval(() => forceTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchLastSeen = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_seen')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) setLastSeen(data.last_seen)
  }

  if (isOnline) {
    return <span style={{ color: '#22c55e', fontSize: '12px' }}>Online</span>
  }

  return (
    <span style={{ color: '#999', fontSize: '12px' }}>
      {lastSeen ? `Last seen ${timeAgo(lastSeen)}` : ''}
    </span>
  )
}