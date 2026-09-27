import { useEffect } from 'react'
import { supabase } from './supabaseClient'

export function useOfferNotifications(session) {
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('offer-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offers' }, async (payload) => {
        const offer = payload.new

        const { data: listing } = await supabase
          .from('listings')
          .select('title, seller_id')
          .eq('id', offer.listing_id)
          .single()

        if (listing && listing.seller_id === session.user.id && Notification.permission === 'granted') {
          new Notification('New offer received!', {
            body: `Someone offered ₹${offer.offered_price} for "${listing.title}"`,
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'offers' }, async (payload) => {
        const offer = payload.new

        if (offer.buyer_id === session.user.id && Notification.permission === 'granted') {
          const { data: listing } = await supabase
            .from('listings')
            .select('title')
            .eq('id', offer.listing_id)
            .single()

          if (offer.status === 'accepted') {
            new Notification('Offer accepted! 🎉', {
              body: `Your offer for "${listing?.title}" was accepted`,
            })
          } else if (offer.status === 'rejected') {
            new Notification('Offer update', {
              body: `Your offer for "${listing?.title}" was rejected`,
            })
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session])
}