import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api } from './api/client'
import AuthPage from './components/auth/AuthPage'
import Header from './components/layout/Header'
import ToastStack from './components/ToastStack'
import UploadModal from './components/video/UploadModal'
import WatchModal from './components/video/WatchModal'
import HomePage from './pages/HomePage'

export default function AppRoutes() {
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [authError, setAuthError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ duration: 'all', sort: 'newest' })
  const [comment, setComment] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toasts, setToasts] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  function showToast(message, type = 'success') {
    const toast = { id: Date.now() + Math.random(), message, type }
    setToasts((current) => [...current, toast])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 3200)
  }

  async function loadVideos(query = search, nextFilters = filters) {
    const term = String(query || '').trim()
    try {
      const params = new URLSearchParams({ limit: '30' })
      if (term) params.set('search', term)
      if (nextFilters.duration !== 'all') params.set('duration', nextFilters.duration)
      params.set('sortBy', nextFilters.sort === 'title' ? 'title' : nextFilters.sort === 'views' ? 'views' : 'createdAt')
      params.set('sortType', nextFilters.sort === 'oldest' || nextFilters.sort === 'title' ? 'asc' : 'desc')
      const data = await api(`/videos?${params.toString()}`)
      setVideos(data?.videos || [])
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  useEffect(() => {
    loadVideos()
    api('/users/current-user').then((currentUser) => setUser(currentUser?.user || currentUser || null)).catch(() => setUser(null))
  }, [])

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
      const [details, data] = await Promise.all([api(`/videos/${video._id}`), api(`/comments/${video._id}`)])
      setSelectedVideo(details)
      setComments(data?.comments || [])
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function submitAuth(form, avatar) {
    setAuthError('')
    try {
      if (location.pathname === '/register') {
        if (!avatar) throw new Error('Choose an avatar to create your account.')
        const body = new FormData()
        body.append('fullName', form.fullName)
        body.append('username', form.username)
        body.append('email', form.email)
        body.append('password', form.password)
        body.append('avatar', avatar)
        await api('/users/register', { method: 'POST', body })
        showToast('Account created successfully. Please sign in.', 'success')
        navigate('/login')
        return
      }

      const loginIdentifier = form.email || form.username
      if (!loginIdentifier) throw new Error('Enter your email or username.')
      const payload = { password: form.password }
      if (loginIdentifier.includes('@')) payload.email = loginIdentifier
      else payload.username = loginIdentifier
      const data = await api('/users/login', { method: 'POST', body: payload })
      setUser(data?.user || data)
      showToast('Signed in successfully.', 'success')
      navigate('/')
    } catch (error) {
      setAuthError(error.message || 'Authentication failed')
      showToast(error.message || 'Authentication failed', 'error')
    }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim() || !selectedVideo) return
    try {
      const created = await api(`/comments/${selectedVideo._id}`, { method: 'POST', body: { content: comment } })
      setComments((current) => [created, ...current])
      setComment('')
      showToast('Comment posted successfully.', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function toggleLike() {
    try {
      const result = await api(`/likes/toggle/v/${selectedVideo._id}`, { method: 'POST' })
      showToast(result?.liked ? 'Video liked.' : 'Video removed from likes.', result?.liked ? 'success' : 'info')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function subscribe() {
    if (!selectedVideo?.owner?._id) return showToast('Creator profile is not available.', 'error')
    try {
      const result = await api(`/subscriptions/c/${selectedVideo.owner._id}`, { method: 'POST' })
      showToast(result?.subscribed ? 'You are now following this creator.' : 'Subscription removed.', result?.subscribed ? 'success' : 'info')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function logout() {
    try {
      await api('/users/logout', { method: 'POST' })
      setUser(null)
      showToast('Signed out successfully.', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  return (
    <div className="app-shell">
      <Header user={user} isAuthPage={isAuthPage} search={search} onSearchChange={setSearch} onSearchSubmit={() => loadVideos(search, filters)} onUpload={() => setShowUpload(true)} onLogout={logout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} videos={videos} search={search} filters={filters} onFilter={updateFilter} onClearFilters={clearFilters} onOpenVideo={openVideo} onUpload={() => setShowUpload(true)} onAuth={navigate} />} />
        <Route path="/login" element={<AuthPage mode="login" error={authError} onSubmit={submitAuth} />} />
        <Route path="/register" element={<AuthPage mode="register" error={authError} onSubmit={submitAuth} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastStack toasts={toasts} />
      {selectedVideo && <WatchModal video={selectedVideo} comments={comments} comment={comment} onCommentChange={setComment} onCommentSubmit={submitComment} onLike={toggleLike} onSubscribe={subscribe} onClose={() => setSelectedVideo(null)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadVideos(); showToast('Video published successfully.', 'success') }} />}
    </div>
  )
}
