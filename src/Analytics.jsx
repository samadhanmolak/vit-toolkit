import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { count: totalListings } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })

    const { count: activeListings } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { data: soldListings } = await supabase
      .from('listings')
      .select('price')
      .eq('status', 'sold')

    const totalValue = soldListings?.reduce((sum, l) => sum + Number(l.price), 0) || 0

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalOffers } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalListings: totalListings || 0,
      activeListings: activeListings || 0,
      itemsSold: soldListings?.length || 0,
      totalValue,
      totalUsers: totalUsers || 0,
      totalOffers: totalOffers || 0,
    })
  }

  if (!stats) return null

  return (
    <div style={{ border: '2px solid #333', margin: '10px', padding: '10px' }}>
      <h3>📊 Platform Stats</h3>
      <p>Total Listings: {stats.totalListings}</p>
      <p>Active Listings: {stats.activeListings}</p>
      <p>Items Sold: {stats.itemsSold}</p>
      <p>Total Value Exchanged: ₹{stats.totalValue}</p>
      <p>Registered Students: {stats.totalUsers}</p>
      <p>Total Offers Made: {stats.totalOffers}</p>
    </div>
  )
}