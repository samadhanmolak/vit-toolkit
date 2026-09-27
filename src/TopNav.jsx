import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import NotificationBell from './NotificationBell'

const ADMIN_ID = 'b074885c-4a54-4dbc-b19f-11e6d068c04a'

export default function TopNav({
  session, activeTab, setActiveTab,
  searchQuery, setSearchQuery,
  filterCategory, setFilterCategory,
  maxPrice, setMaxPrice,
  categories,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [totalDeals, setTotalDeals] = useState(0)

  useEffect(() => {
    fetchTotalDeals()
  }, [])

  const fetchTotalDeals = async () => {
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sold')
    setTotalDeals(count || 0)
  }

  const isAdmin = session?.user.id === ADMIN_ID

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'lightblue', borderBottom: '1px solid #e5e7eb' }}>

      {/* Row 1: logo + bell + profile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px',background: '' }}>
<img src="/logo.png" alt="VIT Toolkit" style={{ height: '200px', width: '1000px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          {session && <NotificationBell session={session} />}
          {session && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ fontSize: '72px', background: 'none', border: 'none', cursor: 'pointer' }}>
                👤
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '92px', background: 'white',
                  border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  minWidth: '160px', zIndex: 200,
                }}>
                  <button onClick={() => { setActiveTab('purchases'); setMenuOpen(false) }} style={menuItemStyle}>
                    My Purchases
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setActiveTab('reports'); setMenuOpen(false) }} style={menuItemStyle}>
                        Pending Reports
                      </button>
                      <button onClick={() => { setActiveTab('categories'); setMenuOpen(false) }} style={menuItemStyle}>
                        Manage Categories
                      </button>
                      <button onClick={() => { setActiveTab('analytics'); setMenuOpen(false) }} style={menuItemStyle}>
                        Analytics
                      </button>
                    </>
                  )}
                  <button onClick={async () => { await supabase.auth.signOut(); setMenuOpen(false) }} style={{ ...menuItemStyle, color: '#dc2626' }}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Browse / Sell + search */}
      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px 10px' }}>
          <button
            onClick={() => setActiveTab('browse')}
            style={{ ...pillButtonStyle, ...(activeTab === 'browse' ? browseActiveStyle : browseRestStyle) }}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            style={{ ...pillButtonStyle, ...(activeTab === 'sell' ? sellActiveStyle : sellRestStyle) }}
          >
            + Sell
          </button>
          <input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
          />
        </div>
      )}

      {/* Row 3: category + price filters (browse only) */}
      {session && activeTab === 'browse' && (
        <div style={{ display: 'flex', gap: '10px', padding: '0 16px 10px' }}>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Max price (₹)"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '140px' }}
          />
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', padding: '4px 0', background: '#f0f9ff' }}>
        🤝 {totalDeals} items exchanged on campus — verified VIT students only
      </div>
    </div>
  )
}

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
  color: '#1a1a1a',
}

const pillButtonStyle = {
  padding: '9px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap',
}

const browseRestStyle = { background: '#dbeafe', color: '#1e3a8a' }
const browseActiveStyle = { background: '#2563eb', color: 'white' }
const sellRestStyle = { background: '#dcfce7', color: '#166534' }
const sellActiveStyle = { background: '#16a34a', color: 'white' }