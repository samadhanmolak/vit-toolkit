import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import CreateListing from './CreateListing'
import Listings from './Listings'
import Purchases from './Purchases'
import AdminPanel from './AdminPanel'
import Analytics from './Analytics'
import TopNav from './TopNav'
import { usePresence } from './usePresence'
import { useOfferNotifications } from './useOfferNotifications'

const ADMIN_ID = 'b074885c-4a54-4dbc-b19f-11e6d068c04a'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categories, setCategories] = useState([])
  const onlineUsers = usePresence(session)
  useOfferNotifications(session)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (!error) setCategories(data)
  }

  useEffect(() => {
    if (session && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [session])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  if (!session) {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <img src="/logo.png" alt="VIT Toolkit" style={{ height: '60px' }} />
        </div>
        <Auth />
      </div>
    )
  }

  const isAdmin = session.user.id === ADMIN_ID

  return (
    <div>
      <TopNav
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        categories={categories}
      />
      <div style={{ padding: '10px' }}>
        {activeTab === 'browse' && (
          <Listings
            session={session}
            onlineUsers={onlineUsers}
            searchQuery={searchQuery}
            filterCategory={filterCategory}
            maxPrice={maxPrice}
          />
        )}
        {activeTab === 'sell' && <CreateListing session={session} />}
        {activeTab === 'purchases' && <Purchases session={session} />}
        {activeTab === 'reports' && isAdmin && <AdminPanel session={session} />}
        {activeTab === 'categories' && isAdmin && <AdminPanel session={session} />}
        {activeTab === 'analytics' && isAdmin && <Analytics />}
      </div>
    </div>
  )
}

export default App