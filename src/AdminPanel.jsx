import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const ADMIN_ID = 'b074885c-4a54-4dbc-b19f-11e6d068c04a'

export default function AdminPanel({ session }) {
  const [reports, setReports] = useState([])
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    if (session.user.id === ADMIN_ID) {
      fetchReports()
      fetchCategories()
    }
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) console.error(error)
    else setCategories(data)
  }

  const addCategory = async () => {
    if (!newCategory.trim()) return
    const { error } = await supabase.from('categories').insert({ name: newCategory.trim() })
    if (error) alert(error.message)
    else {
      setNewCategory('')
      fetchCategories()
    }
  }

  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchCategories()
  }

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, listings(title, description, price, seller_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setReports(data)
  }

  const removeListing = async (listingId, reportId) => {
    const { error: e1 } = await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId)
    const { error: e2 } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)

    if (e1 || e2) alert((e1 || e2).message)
    else {
      alert('Listing removed')
      fetchReports()
    }
  }

  const dismissReport = async (reportId) => {
    const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    if (error) alert(error.message)
    else fetchReports()
  }

  if (session.user.id !== ADMIN_ID) return null

  return (
    <div style={{ border: '2px solid red', margin: '10px', padding: '10px' }}>
      <h3>🛡️ Admin: Pending Reports</h3>
      {reports.length === 0 && <p style={{ color: '#888' }}>No pending reports</p>}
           {reports.map(r => (
        <div key={r.id} style={{ border: '1px solid #ccc', margin: '8px 0', padding: '8px' }}>
          <p><strong>{r.listings.title}</strong> — ₹{r.listings.price}</p>
          <p>Reason: {r.reason}</p>
          <button onClick={() => removeListing(r.listing_id, r.id)}>Remove Listing</button>
          <button onClick={() => dismissReport(r.id)}>Dismiss Report</button>
        </div>
      ))}

      <h3>🗂️ Manage Categories</h3>
      <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
        <input
          placeholder="New category name"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />
        <button onClick={addCategory}>Add</button>
      </div>
      {categories.map(cat => (
        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #ddd', margin: '4px 0', padding: '4px 8px' }}>
          <span>{cat.name}</span>
          <button onClick={() => deleteCategory(cat.id)} style={{ color: 'red' }}>Delete</button>
        </div>
      ))}
    </div>
  )
}