import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Avatar from './Avatar'
import Chat from './Chat'
import PresenceStatus from './PresenceStatus'


export default function Listings({ session, onlineUsers }) {  const [listings, setListings] = useState([])
  const [offerAmount, setOfferAmount] = useState({})
  const [openChat, setOpenChat] = useState(null)
const [filterCategory, setFilterCategory] = useState('')
const [maxPrice, setMaxPrice] = useState('')
const [categories, setCategories] = useState([])

useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (!error) setCategories(data)
  }

  useEffect(() => {
    fetchListings()
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

  return (
    <div>
      <h3>Listings</h3>
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
<select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
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
  />
</div>
{listings
  .filter(item => !filterCategory || item.category === filterCategory)
  .filter(item => !maxPrice || item.price <= parseFloat(maxPrice))
  .map(item => {        const isOwner = item.seller_id === session.user.id
        const myOffers = !isOwner ? item.offers.filter(o => o.buyer_id === session.user.id) : []
        const myOffer = myOffers.find(o => o.status === 'pending' || o.status === 'accepted')
        return (
          <div key={item.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
           <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
  {item.image_urls?.map((url, i) => (
    <img
      key={i}
      src={url}
      alt={item.title}
      style={{ width: '150px', display: 'block', cursor: 'pointer' }}
      onClick={() => window.open(url, '_blank')}
    />
  ))}
</div>
                {item.video_url && (
                 <video src={item.video_url} controls style={{ width: '250px', marginTop: '8px' }} />
              )}
            <h4>{item.title} — ₹{item.price} ({item.status})</h4>
            <p>{item.description}</p>
            <p>Category: {item.category} | Condition: {item.condition} | Used: {item.years_used} yrs</p>

            {isOwner ? (
              <div>
                <h5>Offers on this listing:</h5>
                {item.offers.length === 0 && <p style={{ color: '#888' }}>No offers yet</p>}
                {item.offers.map(offer => (
                  <div key={offer.id} style={{ border: '1px solid #ddd', margin: '6px 0', padding: '6px' }}>
                    <p>Offer: ₹{offer.offered_price} — Status: {offer.status}</p>
                    {offer.status === 'pending' && (
                      <div>
                        <button onClick={() => respondToOffer(offer.id, 'accepted', item.id)}>Accept</button>
                        <button onClick={() => respondToOffer(offer.id, 'rejected')}>Reject</button>
                      </div>
                    )}
                    <button onClick={() => setOpenChat(offer.id)}>Message Buyer</button>
                    {openChat === offer.id && (
                      <Chat session={session} listingId={item.id} otherUserId={offer.buyer_id} onClose={() => setOpenChat(null)} />
                    )}
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
  <div style={{ position: 'relative' }}>
    <Avatar name={offer.buyerName} size={28} />
    {onlineUsers?.has(offer.buyer_id) && (
      <span style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#22c55e', border: '2px solid white',
      }} />
    )}
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
              <div>
               {myOffers.length > 0 && myOffers.map(o => (
  <div key={o.id} style={{ border: '1px solid #ddd', margin: '6px 0', padding: '6px' }}>
    <p>Your offer: ₹{o.offered_price} — Status: {o.status}</p>
    {o.status !== 'rejected' && (
      <div>
        <button onClick={() => setOpenChat(o.id)}>Message Seller</button>
        {openChat === o.id && (
          <Chat session={session} listingId={item.id} otherUserId={item.seller_id} onClose={() => setOpenChat(null)} />
        )}
      </div>
    )}
  </div>
))}

{!myOffer && item.status === 'active' && (
  <div>
    <input
      type="number"
      placeholder="Your offer (₹)"
      onChange={e => setOfferAmount({ ...offerAmount, [item.id]: e.target.value })}
    />
    <button onClick={() => makeOffer(item.id)}>Send Offer</button>
  </div>
)}
              </div>
            )}

<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
  <div style={{ position: 'relative' }}>
    <Avatar name={item.sellerName} />
    {onlineUsers?.has(item.seller_id) && (
      <span style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#22c55e', border: '2px solid white',
      }} />
    )}
  </div>
  <div>
    <div>{item.sellerName}</div>
    <PresenceStatus userId={item.seller_id} isOnline={onlineUsers?.has(item.seller_id)} />
  </div>
</div>
            {!isOwner && (
            <button onClick={() => reportListing(item.id)} style={{ marginTop: '6px', fontSize: '12px', color: '#999' }}>
              🚩 Report
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}