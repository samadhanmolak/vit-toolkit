import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Avatar from './Avatar'
import Chat from './Chat'

export default function Purchases({ session }) {
  const [purchases, setPurchases] = useState([])
  const [openChat, setOpenChat] = useState(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, listings(id, title, price, image_urls, seller_id)')
      .eq('buyer_id', session.user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) return console.error(error)

    const sellerIds = [...new Set(data.map(o => o.listings.seller_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', sellerIds.length ? sellerIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.id] = p.full_name })

    setPurchases(data.map(o => ({ ...o, sellerName: profileMap[o.listings.seller_id] || 'Unknown' })))
  }

  return (
    <div>
      <h3>My Purchases</h3>
      {purchases.length === 0 && <p style={{ color: '#888' }}>No completed purchases yet</p>}
      {purchases.map(p => (
        <div key={p.id} style={{ border: '2px solid #4ade80', margin: '10px', padding: '10px' }}>
          {p.listings.image_urls?.[0] && (
            <img src={p.listings.image_urls[0]} alt={p.listings.title} style={{ width: '150px', display: 'block' }} />
          )}
          <h4>{p.listings.title} — Bought for ₹{p.offered_price}</h4>
          <button onClick={() => setOpenChat(p.id)}>Continue Chat</button>
          {openChat === p.id && (
            <Chat session={session} listingId={p.listings.id} otherUserId={p.listings.seller_id} onClose={() => setOpenChat(null)} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <Avatar name={p.sellerName} size={28} />
            <span>{p.sellerName}</span>
          </div>
        </div>
      ))}
    </div>
  )
}