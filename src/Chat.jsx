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
    <div style={{ border: '2px solid #333', padding: '10px', margin: '10px 0' }}>
      <button onClick={onClose}>Close Chat</button>
      <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '10px 0' }}>
        {messages.map(msg => {
  const isMine = msg.sender_id === session.user.id
  return (
    <p key={msg.id} style={{ textAlign: isMine ? 'right' : 'left' }}>
      <strong>{isMine ? 'You' : 'Them'}:</strong> {msg.content}
      {isMine && (
        <span style={{ color: msg.read ? '#25D366' : '#999', marginLeft: '6px' }}>
          {msg.read ? '✓✓' : '✓'}
        </span>
      )}
    </p>
  )
})}
      </div>
      <input
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  )
}