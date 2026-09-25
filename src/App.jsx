import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import CreateListing from './CreateListing'
import Listings from './Listings'
import Purchases from './Purchases'
import NotificationBell from './NotificationBell'
import AdminPanel from './AdminPanel'
import Analytics from './Analytics'
import { usePresence } from './usePresence'

function App() {
  const [session, setSession] = useState(null)
  const onlineUsers = usePresence(session)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <div>
      <Auth />
      {session && <NotificationBell session={session} />}
      {session && <CreateListing session={session} />}
      {session && <Listings session={session} onlineUsers={onlineUsers} />}
      {session && <Purchases session={session} />}
      {session && <AdminPanel session={session} />}
      {session && session.user.id === 'b074885c-4a54-4dbc-b19f-11e6d068c04a' && <Analytics />}
    </div>
  )
}

export default App