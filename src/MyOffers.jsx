import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Chat from './Chat'
import Avatar from './Avatar'

export default function MyOffers({ session }) {
  const [listings, setListings] = useState([])
  const [openChat, setOpenChat] = useState(null)

  useEffect(() => {
    fetchMyListingsWithOffers()
  }, [])

  const fetchMyListingsWithOffers = async () => {
    const { data: myListings, error } = await supabase
      .from('listings')
      .select('*, offers(*)')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) return console.error(error)

    const buyerIds = [...new Set(myListings.flatMap(l => l.offers.map(o => o.buyer_id)))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', buyerIds.length ? buyerIds : ['00000000-0000-0000-0000-000000000000'])

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.id] = p.full_name })

    const merged = myListings.map(listing => ({
      ...listing,
      offers: listing.offers.map(o => ({ ...o, buyerName: profileMap[o.buyer_id] || 'Unknown' })),
    }))

    setListings(merged)
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
    fetchMyListingsWithOffers()
  }

  return (
    <div>
      <h3>My Listings & Offers</h3>
      {listings.map(listing => (
        <div key={listing.id} style={{ border: '2px solid #333', margin: '10px', padding: '10px' }}>
          <h4>{listing.title} — ₹{listing.price} ({listing.status})</h4>

          {listing.offers.length === 0 && <p style={{ color: '#888' }}>No offers yet</p>}

          {listing.offers.map(offer => (
            <div key={offer.id} style={{ border: '1px solid #ccc', margin: '8px 0', padding: '8px' }}>
              <p>Offer: ₹{offer.offered_price} — Status: {offer.status}</p>

              {offer.status === 'pending' && (
                <div>
                  <button onClick={() => respondToOffer(offer.id, 'accepted', listing.id)}>Accept</button>
                  <button onClick={() => respondToOffer(offer.id, 'rejected')}>Reject</button>
                </div>
              )}
              <button onClick={() => setOpenChat(offer.id)}>Message Buyer</button>
              {openChat === offer.id && (
                <Chat
                  session={session}
                  listingId={listing.id}
                  otherUserId={offer.buyer_id}
                  onClose={() => setOpenChat(null)}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <Avatar name={offer.buyerName} />
                <span>{offer.buyerName}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}