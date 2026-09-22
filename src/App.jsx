import { useEffect, useRef, useState } from 'react'
import './App.css'

async function api(path, options = {}) {
  
  const requestOptions = { credentials: 'include', ...options }

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && typeof requestOptions.body !== 'string') {
    requestOptions.body = JSON.stringify(requestOptions.body)
  }

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !requestOptions.headers?.['Content-Type'] && !requestOptions.headers?.['content-type']) {
    requestOptions.headers = {
      ...(requestOptions.headers || {}),
      'Content-Type': 'application/json',
    }
  }

  const response = await fetch(`/api/v1${path}`, requestOptions)
  const text = await response.text()
  let result = {}

  try {
    result = text ? JSON.parse(text) : {}
  } catch (error) {
    result = {}
  }

  if (!response.ok) {
    const message = result?.message || result?.error || 'Request failed'
    console.error(`API error for ${path}`, { status: response.status, result })
    throw new Error(message)
  }

  return result?.data ?? result
}

function App() {
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [authMode, setAuthMode] = useState('')
  const [authForm, setAuthForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [authAvatar, setAuthAvatar] = useState(null)
  const [authError, setAuthError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ duration: 'all', sort: 'newest' })
  const [comment, setComment] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toasts, setToasts] = useState([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  const showToast = (message, type = 'success') => {
    const toast = { id: Date.now() + Math.random(), message, type }
    setToasts((current) => [...current, toast])
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id))
    }, 3200)
  }

  async function loadVideos(query = search, nextFilters = filters) {
    const term = String(query || '').trim()

    try {
      const params = new URLSearchParams({ limit: '30' })
      if (term) params.set('search', term)
      if (nextFilters.duration !== 'all') params.set('duration', nextFilters.duration)
      params.set('sortBy', nextFilters.sort === 'title' ? 'title' : nextFilters.sort === 'views' ? 'views' : 'createdAt')
      params.set('sortType', nextFilters.sort === 'oldest' || nextFilters.sort === 'title' ? 'asc' : 'desc')

      const requestUrl = `/videos?${params.toString()}`
      const data = await api(requestUrl)
      setVideos(data?.videos || [])
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  useEffect(() => {
    loadVideos()

    api('/users/current-user')
      .then((currentUser) => {
        setUser(currentUser?.user || currentUser || null)
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  // Close the profile dropdown when clicking anywhere outside of it
  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showProfileMenu])

  function updateFilter(name, value) {
    const nextFilters = { ...filters, [name]: value }
    setFilters(nextFilters)
    loadVideos(search, nextFilters)
  }

  function clearFilters() {
    const nextFilters = { duration: 'all', sort: 'newest' }
    setFilters(nextFilters)
    setSearch('')
    loadVideos('', nextFilters)
  }

  async function openVideo(video) {
    setSelectedVideo(video)

    try {
      const [details, data] = await Promise.all([
        api(`/videos/${video._id}`),
        api(`/comments/${video._id}`),
      ])

      setSelectedVideo(details)
      setComments(data?.comments || [])
    } catch (error) {
      showToast(error.message, 'error')
      setSelectedVideo(video)
    }
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthError('')

    try {
      if (authMode === 'register') {
        if (!authAvatar) {
          throw new Error('Choose an avatar to create your account.')
        }

        const body = new FormData()
        body.append('fullName', authForm.fullName)
        body.append('username', authForm.username)
        body.append('email', authForm.email)
        body.append('password', authForm.password)
        body.append('avatar', authAvatar)

        await api('/users/register', { method: 'POST', body })
        showToast('Account created successfully. Please sign in.', 'success')
        setAuthForm({ fullName: '', username: '', email: '', password: '' })
        setAuthAvatar(null)
        setAuthMode('login')
        return
      }

      const loginIdentifier = authForm.email || authForm.username
      if (!loginIdentifier) {
        throw new Error('Enter your email or username.')
      }

      const payload = {
        password: authForm.password,
      }

      if (loginIdentifier.includes('@')) {
        payload.email = loginIdentifier
      } else {
        payload.username = loginIdentifier
      }

      const data = await api('/users/login', {
        method: 'POST',
        body: payload,
      })

      const loggedUser = data?.user || data
      setUser(loggedUser)
      setAuthMode('')
      setAuthForm({ fullName: '', username: '', email: '', password: '' })
      setAuthAvatar(null)
      showToast('Signed in successfully.', 'success')
    } catch (error) {
      const message = error.message || 'Authentication failed'
      setAuthError(message)
      showToast(message, 'error')
    }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim() || !selectedVideo) return

    try {
      const created = await api(`/comments/${selectedVideo._id}`, {
        method: 'POST',
        body: { content: comment },
      })
      setComments((current) => [created, ...current])
      setComment('')
      showToast('Comment posted successfully.', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function toggleLike() {
    if (!selectedVideo?._id) return

    try {
      const result = await api(`/likes/toggle/v/${selectedVideo._id}`, { method: 'POST' })
      const liked = Boolean(result?.liked)
      showToast(liked ? 'Video liked.' : 'Video removed from likes.', liked ? 'success' : 'info')
    } catch (error) {
      console.error('Like toggle failed:', error)
      showToast(error.message, 'error')
    }
  }

  async function subscribe() {
    if (!selectedVideo?.owner?._id) {
      showToast('Creator profile is not available.', 'error')
      return
    }

    try {
      const result = await api(`/subscriptions/c/${selectedVideo.owner._id}`, { method: 'POST' })
      const subscribed = Boolean(result?.subscribed)
      showToast(subscribed ? 'You are now following this creator.' : 'Subscription removed.', subscribed ? 'success' : 'info')
    } catch (error) {
      console.error('Subscription failed:', error)
      showToast(error.message, 'error')
    }
  }

  async function logout() {
    try {
      await api('/users/logout', { method: 'POST' })
      setUser(null)
      setAuthMode('login')
      showToast('Signed out successfully.', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  function resetAuth() {
    setAuthMode('')
    setAuthError('')
    setAuthAvatar(null)
    setAuthForm({ fullName: '', username: '', email: '', password: '' })
  }

  const onAuthPage = !user && Boolean(authMode)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="logo" href="#top" onClick={(event) => { if (onAuthPage) { event.preventDefault(); resetAuth() } }}><span>◒</span> streamly</a>

        {!onAuthPage && (
          <form className="search" onSubmit={(event) => { event.preventDefault(); loadVideos(search.trim()) }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the library" />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
        )}

        <div className="top-actions">
          {user ? (
            <>
              <button className="ghost" onClick={() => setShowUpload(true)}>＋ Publish</button>
              <div className="profile-menu" ref={profileMenuRef}>
                <button
                  className="avatar"
                  onClick={() => setShowProfileMenu((current) => !current)}
                  aria-haspopup="true"
                  aria-expanded={showProfileMenu}
                >
                  {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : (user.fullName?.[0] || 'U')}
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} />
                      ) : (
                        <div className="dropdown-avatar-fallback">{user.fullName?.[0] || 'U'}</div>
                      )}
                      <div>
                        <strong>{user.fullName}</strong>
                        <span>@{user.username}</span>
                      </div>
                    </div>
                    <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); setShowUpload(true) }}>＋ Publish a video</button>
                    <button className="dropdown-item dropdown-item--danger" onClick={() => { setShowProfileMenu(false); logout() }}>⇥ Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            !onAuthPage && <button className="dark-button" onClick={() => setAuthMode('login')}>Sign in</button>
          )}
        </div>
      </header>

      {onAuthPage ? (
        <main className="auth-page" id="top">
          <section className="auth-card auth-card--page">
            <p className="kicker">{authMode === 'register' ? 'Begin here' : 'Welcome back'}</p>
            <h2>{authMode === 'register' ? 'Create your account.' : 'Sign in to streamly.'}</h2>

            <form onSubmit={submitAuth}>
              {authMode === 'register' && (
                <input
                  placeholder="Full name"
                  value={authForm.fullName}
                  onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })}
                  required
                />
              )}

              <input
                placeholder={authMode === 'register' ? 'Username' : 'Email or username'}
                value={authMode === 'register' ? authForm.username : authForm.email || authForm.username}
                onChange={(event) => {
                  const value = event.target.value
                  if (authMode === 'register') {
                    setAuthForm({ ...authForm, username: value })
                  } else {
                    setAuthForm({ ...authForm, email: value, username: value })
                  }
                }}
                required
              />

              {authMode === 'register' && (
                <input
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  required
                />
              )}

              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
              />

              {authMode === 'register' && (
                <label className="file-field">
                  Avatar
                  <input type="file" accept="image/*" required onChange={(event) => setAuthAvatar(event.target.files[0])} />
                </label>
              )}

              <button className="dark-button wide">
                {authMode === 'register' ? 'Create account' : 'Sign in'} <span>→</span>
              </button>
              <p className="form-error">{authError}</p>
            </form>

            <button className="text-button" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>
              {authMode === 'register' ? 'Already have an account?' : 'New to streamly? Create one'}
            </button>

            <button className="text-button auth-back" onClick={resetAuth}>← Back to browsing</button>
          </section>
        </main>
      ) : (
        <main id="top">
          <section className="hero">
            <div>
              <p className="kicker">A considered place for moving images</p>
              <h1>Watch something<br /><em>worth keeping.</em></h1>
              <p className="hero-copy">Discover thoughtful videos, follow the people who make them, and build a library that feels like yours.</p>
              <div className="hero-actions">
                {user ? (
                  <button className="dark-button" onClick={() => setShowUpload(true)}>Publish a video <span>↗</span></button>
                ) : (
                  <>
                    <button className="dark-button" onClick={() => setAuthMode('register')}>Create account <span>↗</span></button>
                    <button className="text-button" onClick={() => setAuthMode('login')}>I already have an account</button>
                  </>
                )}
              </div>
            </div>
            <div className="hero-art"><span>PLAY<br />/ 2026</span><strong>01</strong></div>
          </section>

          <div className="toast-stack">
            {toasts.map((toast) => (
              <div key={toast.id} className={`toast toast--${toast.type}`}>
                {toast.message}
              </div>
            ))}
          </div>

          <section className="content-grid">
            <div className="feed">
              <div className="section-heading">
                <div>
                  <p className="kicker">Fresh from the community</p>
                  <h2>For your next hour</h2>
                </div>
                <span>{videos.length} stories</span>
              </div>

              <div className="feed-controls" aria-label="Video filters">
                <label>
                  Length
                  <select value={filters.duration} onChange={(event) => updateFilter('duration', event.target.value)}>
                    <option value="all">Any length</option>
                    <option value="short">Under 5 minutes</option>
                    <option value="medium">5 to 20 minutes</option>
                    <option value="long">Over 20 minutes</option>
                  </select>
                </label>
                <label>
                  Sort by
                  <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="views">Most viewed</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </label>
                {(search || filters.duration !== 'all' || filters.sort !== 'newest') && (
                  <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button>
                )}
              </div>

              <div className="video-grid">
                {videos.map((video) => (
                  <article className="video-card" key={video._id} onClick={() => openVideo(video)}>
                    <div className="thumbnail">
                      <img src={video.thumbnail} alt="" />
                      <span>{Math.round((video.duration || 0) / 60)} min</span>
                    </div>
                    <div className="video-info">
                      <h3>{video.title}</h3>
                      <p>{video.owner?.fullName || 'Streamly creator'} · {video.views || 0} views</p>
                    </div>
                  </article>
                ))}
              </div>

              {videos.length === 0 && <div className="empty">No videos yet. Publish the first story.</div>}
            </div>
          </section>
        </main>
      )}

      {selectedVideo && (
        <div className="modal-backdrop" onClick={() => setSelectedVideo(null)}>
          <section className="watch-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setSelectedVideo(null)}>×</button>
            <video className="watch-video" controls playsInline poster={selectedVideo.thumbnail} src={selectedVideo.videoFile}>Your browser does not support video playback.</video>
            <p className="kicker">Now watching</p>
            <h2>{selectedVideo.title}</h2>
            <p className="muted">{selectedVideo.description}</p>
            <div className="watch-actions">
              <button className="dark-button" onClick={toggleLike}>♡ Like</button>
              <button className="outline-button" onClick={subscribe}>Follow creator</button>
            </div>
            <form className="comment-form" onSubmit={submitComment}>
              <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Leave a thought" />
              <button>Post</button>
            </form>
            <div className="comments">
              {comments.map((item) => (
                <div className="comment" key={item._id}>
                  <strong>{item.owner?.fullName || 'Viewer'}</strong>
                  <span>{item.content}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false)
            loadVideos()
            showToast('Video published successfully.', 'success')
          }}
        />
      )}
    </div>
  )
}

function UploadModal({ onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', videoFile: null, thumbnail: null })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()

    try {
      const body = new FormData()
      body.append('title', form.title)
      body.append('description', form.description)
      body.append('videoFile', form.videoFile)
      body.append('thumbnail', form.thumbnail)

      await api('/videos', { method: 'POST', body })
      onDone()
    } catch (err) {
      setError(err.message)
      console.error('Video upload failed:', err)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="upload-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <p className="kicker">Creator studio</p>
        <h2>Publish a new story.</h2>
        <form onSubmit={submit}>
          <input placeholder="Title" required onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea placeholder="What is this video about?" required onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="file-field">Video file<input type="file" accept="video/*" required onChange={(event) => setForm({ ...form, videoFile: event.target.files[0] })} /></label>
          <label className="file-field">Thumbnail<input type="file" accept="image/*" required onChange={(event) => setForm({ ...form, thumbnail: event.target.files[0] })} /></label>
          <button className="dark-button wide">Publish <span>↗</span></button>
          <p className="form-error">{error}</p>
        </form>
      </section>
    </div>
  )
}

export default App