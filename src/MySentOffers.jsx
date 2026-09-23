import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Chat from './Chat'

export default function MySentOffers({ session }) {
  const [offers, setOffers] = useState([])
  const [openChat, setOpenChat] = useState(null)

  useEffect(() => {
    fetchMyOffers()
  }, [])

  const fetchMyOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, listings(title, price, seller_id)')
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setOffers(data)
  }

  return (
    <div>
      <h3>My Sent Offers</h3>
      {offers.map(offer => (
        <div key={offer.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <p>{offer.listings.title} — Asking ₹{offer.listings.price}</p>
          <p>Your offer: ₹{offer.offered_price} — Status: <strong>{offer.status}</strong></p>
          <button onClick={() => setOpenChat(offer.id)}>Message Seller</button>
          {openChat === offer.id && (
            <Chat
              session={session}
              listingId={offer.listing_id}
              otherUserId={offer.listings.seller_id}
              onClose={() => setOpenChat(null)}
            />
          )}
        </div>
      ))}
    </div>
  )
}