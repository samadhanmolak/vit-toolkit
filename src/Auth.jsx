import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleAuth = async () => {
    if (isSignUp && !email.trim().toLowerCase().endsWith('@vit.edu')) {
      alert('Only VIT college emails (@vit.edu) can sign up.')
      return
    }

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return alert(error.message)

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
        })
      }
      alert('Check your email to confirm signup!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else alert('Logged in!')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (session) {
    return (
      <div>
        <p>Logged in as: {session.user.email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>
    )
  }

  return (
    <div>
      <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>
      {isSignUp && (
        <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
      )}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleAuth}>{isSignUp ? 'Sign Up' : 'Log In'}</button>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{cursor: 'pointer', color: 'blue'}}>
        {isSignUp ? 'Already have an account? Log in' : "Need an account? Sign up"}
      </p>
    </div>
  )
}