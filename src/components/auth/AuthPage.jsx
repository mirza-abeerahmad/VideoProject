import { useState } from 'react'
import { Link } from 'react-router-dom'

const emptyForm = { fullName: '', username: '', email: '', password: '' }

export default function AuthPage({ mode, error, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [avatar, setAvatar] = useState(null)
  const isRegister = mode === 'register'

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(form, avatar)
  }

  return (
    <main className="auth-page" id="top">
      <section className="auth-card auth-card--page">
        <p className="kicker">{isRegister ? 'Begin here' : 'Welcome back'}</p>
        <h2>{isRegister ? 'Create your account.' : 'Sign in to streamly.'}</h2>
        <form onSubmit={handleSubmit}>
          {isRegister && <input placeholder="Full name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />}
          <input
            placeholder={isRegister ? 'Username' : 'Email or username'}
            value={isRegister ? form.username : (form.email || form.username)}
            onChange={(event) => update(isRegister ? 'username' : 'email', event.target.value)}
            required
          />
          {isRegister && <input type="email" placeholder="Email" value={form.email} onChange={(event) => update('email', event.target.value)} required />}
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => update('password', event.target.value)} required />
          {isRegister && <label className="file-field">Avatar<input type="file" accept="image/*" required onChange={(event) => setAvatar(event.target.files[0])} /></label>}
          <button className="dark-button wide">{isRegister ? 'Create account' : 'Sign in'} <span>→</span></button>
          <p className="form-error">{error}</p>
        </form>
        <Link className="text-button" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Already have an account?' : 'New to streamly? Create one'}</Link>
        <Link className="text-button auth-back" to="/">← Back to browsing</Link>
      </section>
    </main>
  )
}
