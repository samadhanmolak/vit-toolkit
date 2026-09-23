import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import CreateListing from './CreateListing'
import Listings from './Listings'
import Purchases from './Purchases'
import NotificationBell from './NotificationBell'
import AdminPanel from './AdminPanel'


function App() {
  const [session, setSession] = useState(null)

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
      {session && <Listings session={session} />}
      {session && <Purchases session={session} />}
      {session && <AdminPanel session={session} />}
    </div>
  )
}

export default App