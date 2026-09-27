import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Avatar from './Avatar'
import Chat from './Chat'
import PresenceStatus from './PresenceStatus'

export default function Listings({ session, onlineUsers, searchQuery, filterCategory, maxPrice }) {
  const [listings, setListings] = useState([])
  const [offerAmount, setOfferAmount] = useState({})
  const [openChat, setOpenChat] = useState(null)

  useEffect(() => {
    fetchListings()

    const channel = supabase
      .channel('listings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchListings()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, offers(*)')
      .or(`status.eq.active,and(seller_id.eq.${session.user.id},status.neq.removed)`)
      .order('created_at', { ascending: false })

    if (error) return console.error(error)

    const userIds = new Set()
    data.forEach(item => {
      userIds.add(item.seller_id)
      item.offers.forEach(o => userIds.add(o.buyer_id))
    })

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', [...userIds])

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.id] = p.full_name })

    const merged = data.map(item => ({
      ...item,
      sellerName: profileMap[item.seller_id] || 'Unknown',
      offers: item.offers.map(o => ({ ...o, buyerName: profileMap[o.buyer_id] || 'Unknown' })),
    }))

    setListings(merged)
  }

  const makeOffer = async (listingId) => {
    const amount = offerAmount[listingId]
    if (!amount) return alert('Enter an offer amount first')

    const { error } = await supabase.from('offers').insert({
      listing_id: listingId,
      buyer_id: session.user.id,
      offered_price: parseFloat(amount),
    })

    if (error) alert(error.message)
    else {
      alert('Offer sent!')
      fetchListings()
    }
  }

  const reportListing = async (listingId) => {
    const reason = prompt('Why are you reporting this listing? (spam, scam, fake, inappropriate, etc.)')
    if (!reason) return

    const { error } = await supabase.from('reports').insert({
      listing_id: listingId,
      reporter_id: session.user.id,
      reason,
    })

    if (error) alert(error.message)
    else alert('Reported. Our team will review it.')
  }

  const respondToOffer = async (offerId, status, listingId) => {
    const { error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)

    if (error) return alert(error.message)

    if (status === 'accepted') {
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listingId)
      if (listingError) alert(listingError.message)
    }

    alert(`Offer ${status}`)
    fetchListings()
  }

  const filteredListings = listings
    .filter(item => !filterCategory || item.category === filterCategory)
    .filter(item => !maxPrice || item.price <= parseFloat(maxPrice))
    .filter(item => {
      if (!searchQuery?.trim()) return true
      const q = searchQuery.toLowerCase()
      return item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    })

 return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {filteredListings.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '30px' }}>No listings match your search/filters</p>
      )}
      {filteredListings.map(item => {
        const isOwner = item.seller_id === session.user.id
        const myOffers = !isOwner ? item.offers.filter(o => o.buyer_id === session.user.id) : []
        const myOffer = myOffers.find(o => o.status === 'pending' || o.status === 'accepted')
        return (
          <div key={item.id} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxWidth: '312px' }}>
              {item.image_urls?.map((url, i) => (
               <img
                  key={i}
                  src={url}
                  alt={item.title}
                  style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', display: 'block', cursor: 'pointer' }}
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
            {item.video_url && (
              <video src={item.video_url} controls style={{ width: '250px', marginTop: '8px', borderRadius: '8px' }} />
            )}
            <h4 style={{ margin: '10px 0 4px' }}>{item.title} — ₹{item.price} <span style={{ fontSize: '12px', color: '#888' }}>({item.status})</span></h4>
            <p style={{ margin: '0 0 4px', color: '#444' }}>{item.description}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Category: {item.category} | Condition: {item.condition} | Used: {item.years_used} yrs</p>

            {isOwner ? (
              <div style={subSectionStyle}>
                <h5 style={{ margin: '0 0 8px' }}>Offers on this listing:</h5>
                {item.offers.length === 0 && <p style={{ color: '#888', margin: 0 }}>No offers yet</p>}
                {item.offers.map(offer => (
                  <div key={offer.id} style={offerBlockStyle}>
                    <p style={{ margin: '0 0 6px' }}>Offer: ₹{offer.offered_price} — Status: {offer.status}</p>
                    {offer.status === 'pending' && (
                      <div>
                        <button onClick={() => respondToOffer(offer.id, 'accepted', item.id)} style={acceptBtnStyle}>Accept</button>
                        <button onClick={() => respondToOffer(offer.id, 'rejected')} style={rejectBtnStyle}>Reject</button>
                      </div>
                    )}
                    <button onClick={() => setOpenChat(offer.id)} style={chatBtnStyle}>Message Buyer</button>
                    {openChat === offer.id && (
                      <Chat session={session} listingId={item.id} otherUserId={offer.buyer_id} onClose={() => setOpenChat(null)} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar name={offer.buyerName} size={28} />
                        {onlineUsers?.has(offer.buyer_id) && <OnlineDot size={8} />}
                      </div>
                      <div>
                        <div>{offer.buyerName}</div>
                        <PresenceStatus userId={offer.buyer_id} isOnline={onlineUsers?.has(offer.buyer_id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={subSectionStyle}>
                {myOffers.length > 0 && myOffers.map(o => (
                  <div key={o.id} style={offerBlockStyle}>
                    <p style={{ margin: '0 0 6px' }}>Your offer: ₹{o.offered_price} — Status: {o.status}</p>
                    {o.status !== 'rejected' && (
                      <div>
                        <button onClick={() => setOpenChat(o.id)} style={chatBtnStyle}>Message Seller</button>
                        {openChat === o.id && (
                          <Chat session={session} listingId={item.id} otherUserId={item.seller_id} onClose={() => setOpenChat(null)} />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {!myOffer && item.status === 'active' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Your offer (₹)"
                      onChange={e => setOfferAmount({ ...offerAmount, [item.id]: e.target.value })}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                    <button onClick={() => makeOffer(item.id)} style={acceptBtnStyle}>Send Offer</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={item.sellerName} />
                {onlineUsers?.has(item.seller_id) && <OnlineDot size={10} />}
              </div>
              <div>
                <div>{item.sellerName}</div>
                <PresenceStatus userId={item.seller_id} isOnline={onlineUsers?.has(item.seller_id)} />
              </div>
            </div>
            {!isOwner && (
              <button onClick={() => reportListing(item.id)} style={{ marginTop: '8px', fontSize: '12px', color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
                🚩 Report
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OnlineDot({ size }) {
  return (
    <span style={{
      position: 'absolute', bottom: 0, right: 0,
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: '#22c55e', border: '2px solid white',
    }} />
  )
}

/*
Color options to try:
1. Sage-beige: background: '#eef3ea', border: '1px solid #dde6d3'
2. Warm sand: background: '#f3ece1', border: '1px solid #e6d9c6'
3. Soft mint: background: '#a8eec8', border: '1px solid #d3e8dc'
4. Muted olive-tan: background: '#e8d150', border: '1px solid #ded9c2'
5. Dusty blue-green: background: '#e6efec', border: '1px solid #cfe0da'
*/
const cardStyle = {
  background: '#707275',
  border: '1px solid #dbeafe',
  borderRadius: '12px',
  padding: '16px',
}

const subSectionStyle = {
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '10px',
  marginTop: '10px',
  maxHeight: '280px',
  overflowY: 'auto',
}

const offerBlockStyle = {
  background: 'white',
  border: '1px solid #0e53ae',
  borderRadius: '6px',
  padding: '10px',
  margin: '0 0 8px',
}

const acceptBtnStyle = {
  background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px',
  padding: '7px 12px', marginRight: '6px', cursor: 'pointer', fontSize: '13px',
}

const rejectBtnStyle = {
  background: '#d4e1f3', color: '#444', border: '1px solid #d1d5db', borderRadius: '6px',
  padding: '7px 12px', cursor: 'pointer', fontSize: '13px',
}

const chatBtnStyle = {
  background: 'none', border: '1px solid #0f56ee', color: '#2563eb', borderRadius: '6px',
  padding: '6px 10px', marginTop: '6px', cursor: 'pointer', fontSize: '13px',
}
