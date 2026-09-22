import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header({ user, isAuthPage, search, onSearchChange, onSearchSubmit, onUpload, onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showProfileMenu])

  function goHome(event) {
    if (isAuthPage) event.preventDefault()
    navigate('/')
  }

  return (
    <header className="topbar">
      <Link className="logo" to="/" onClick={goHome}><span>◒</span> streamly</Link>

      {!isAuthPage && (
        <form className="search" onSubmit={(event) => { event.preventDefault(); onSearchSubmit() }}>
          <input value={search} placeholder="Search the library" onChange={(event) => onSearchChange(event.target.value)} />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
      )}

      <div className="top-actions">
        {user ? (
          <>
            <button className="ghost" onClick={onUpload}>＋ Publish</button>
            <div className="profile-menu" ref={profileMenuRef}>
              <button className="avatar" onClick={() => setShowProfileMenu((current) => !current)} aria-haspopup="true" aria-expanded={showProfileMenu}>
                {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : (user.fullName?.[0] || 'U')}
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <div className="dropdown-avatar-fallback">{user.fullName?.[0] || 'U'}</div>}
                    <div><strong>{user.fullName}</strong><span>@{user.username}</span></div>
                  </div>
                  <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); onUpload() }}>＋ Publish a video</button>
                  <button className="dropdown-item dropdown-item--danger" onClick={() => { setShowProfileMenu(false); onLogout() }}>⇥ Sign out</button>
                </div>
              )}
            </div>
          </>
        ) : (!isAuthPage && <button className="dark-button" onClick={() => navigate('/login')}>Sign in</button>)}
      </div>
    </header>
  )
}
