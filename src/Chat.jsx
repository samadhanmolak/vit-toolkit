import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Chat({ session, listingId, otherUserId, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchMessages()
    markAsRead()

    const channel = supabase
      .channel(`chat-${listingId}-${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (msg.listing_id === listingId &&
           ((msg.sender_id === session.user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === session.user.id))) {
          setMessages(prev => [...prev, msg])
          if (msg.receiver_id === session.user.id) markAsRead()
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (msg.listing_id === listingId) {
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listingId, otherUserId])

  const markAsRead = async () => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('listing_id', listingId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', session.user.id)
      .eq('read', false)
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true })

    if (error) console.error(error)
    else setMessages(data)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      listing_id: listingId,
      sender_id: session.user.id,
      receiver_id: otherUserId,
      content: newMessage,
    })
    if (error) alert(error.message)
    else setNewMessage('')
  }

  return (
    <div style={{ background: '#e5ded8', borderRadius: '10px', padding: '10px', margin: '10px 0', maxWidth: '320px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#333' }}>✕ Close</button>
      </div>
      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.map(msg => {
          const isMine = msg.sender_id === session.user.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: isMine ? '#1e293b' : 'white',
                color: isMine ? 'white' : '#1a1a1a',
                padding: '8px 12px',
                borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                maxWidth: '75%',
                fontSize: '14px',
              }}>
                {msg.content}
                {isMine && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: msg.read ? '#4ade80' : '#94a3b8' }}>
                    {msg.read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, padding: '8px 10px', borderRadius: '20px', border: '1px solid #ccc' }}
        />
        <button onClick={sendMessage} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>➤</button>
      </div>
    </div>
  )
}